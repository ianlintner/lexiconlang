import { cloneJson, contentHash, sha256, utf8Bytes } from "./hash.js";
import { semanticDiagnostics } from "./semantic.js";
import { PackValidationError, type AssetData, type LoadedPack, type LoadPackOptions, type PackDiagnostic, type PackManifestV1 } from "./types.js";
import { ASSETS_MAX_BYTES, DEPENDENCY_MAX_DEPTH, MANIFEST_MAX_BYTES, dedupe, duplicateKeyDiagnostics, schemaDiagnostics } from "./validate.js";

export function validatePack(input: unknown): readonly PackDiagnostic[] {
  const schema = schemaDiagnostics(input);
  if (schema.length > 0) return schema;
  return dedupe(semanticDiagnostics(input as PackManifestV1));
}

function assertValid(input: unknown): PackManifestV1 {
  const diagnostics = validatePack(input);
  if (diagnostics.length > 0) throw new PackValidationError(diagnostics);
  return cloneJson(input) as PackManifestV1;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function hasAssets(manifest: PackManifestV1): boolean {
  return manifest.corpora.some((c) => c.asset) || manifest.markovModels.some((m) => m.asset);
}

/** Validate and freeze an inline, asset-free manifest. Dependencies resolve at world.use time. */
export function definePack(manifest: PackManifestV1): LoadedPack {
  const clone = assertValid(manifest);
  if (hasAssets(clone)) {
    throw new PackValidationError([{ code: "CAPABILITY", pointer: "", message: "asset-backed packs require loadPack with a resolver" }]);
  }
  const assets = new Map<string, AssetData>();
  const hash = contentHash(clone, assets);
  return { manifest: deepFreeze(clone), hash, dependencies: [], assets };
}

/** Parse/validate a JSON pack and resolve its dependency + asset closure. */
export async function loadPack(input: unknown, options: LoadPackOptions = {}): Promise<LoadedPack> {
  let text: string | undefined;
  if (typeof input === "string") {
    text = input;
    const dup = duplicateKeyDiagnostics(text);
    if (dup.length > 0) throw new PackValidationError(dup);
  }
  const bytes = text === undefined ? 0 : utf8Bytes(text).byteLength;
  if (bytes > (options.maxBytes ?? MANIFEST_MAX_BYTES)) {
    throw new PackValidationError([{ code: "LIMIT", pointer: "", message: `manifest exceeds ${options.maxBytes ?? MANIFEST_MAX_BYTES} bytes` }]);
  }
  let parsed: unknown;
  if (text !== undefined) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch (error) {
      throw new PackValidationError([{ code: "SCHEMA", pointer: "", message: `invalid JSON: ${(error as Error).message}` }]);
    }
  } else {
    try {
      parsed = cloneJson(input);
    } catch {
      parsed = input;
    }
  }
  const manifest = assertValid(parsed);
  const assets = new Map<string, AssetData>();
  const resolver = options.resolver;
  for (const [field, descriptors] of [
    ["corpora", manifest.corpora.map((c) => c.asset)],
    ["markovModels", manifest.markovModels.map((m) => m.asset)],
  ] as const) {
    for (const [i, asset] of descriptors.entries()) {
      if (!asset) continue;
      if (!resolver) {
        throw new PackValidationError([{ code: "CAPABILITY", pointer: `/${field}/${i}/asset`, message: "asset requires a PackResolver" }]);
      }
      const data = await resolver.readAsset(manifest.id, asset.path);
      const digest = sha256(data);
      if (digest !== asset.sha256) {
        throw new PackValidationError([{ code: "INTEGRITY", pointer: `/${field}/${i}/asset/sha256`, message: `asset ${asset.path} digest mismatch: expected ${asset.sha256}, got ${digest}` }]);
      }
      assets.set(asset.path, { path: asset.path, sha256: asset.sha256, bytes: data, digest });
    }
  }
  let total = [...assets.values()].reduce((sum, a) => sum + a.bytes.byteLength, 0);
  if (total > ASSETS_MAX_BYTES) {
    throw new PackValidationError([{ code: "LIMIT", pointer: "", message: `asset bytes exceed ${ASSETS_MAX_BYTES}` }]);
  }
  const dependencies = await resolveDependencies(manifest, resolver, [], total);
  const hash = contentHash(manifest, assets);
  return { manifest: deepFreeze(manifest), hash, dependencies, assets };
}

async function resolveDependencies(
  manifest: PackManifestV1,
  resolver: LoadPackOptions["resolver"],
  chain: readonly string[],
  assetBytes: number,
): Promise<readonly LoadedPack[]> {
  const all = [...manifest.depends, ...manifest.extends];
  if (all.length === 0) return [];
  if (chain.length >= DEPENDENCY_MAX_DEPTH) {
    throw new PackValidationError([{ code: "CYCLE", pointer: "/depends", message: `dependency depth exceeds ${DEPENDENCY_MAX_DEPTH}` }]);
  }
  const out: LoadedPack[] = [];
  for (const dep of all) {
    if (chain.includes(dep.id)) {
      throw new PackValidationError([{ code: "CYCLE", pointer: "/depends", message: `dependency cycle: ${[...chain, dep.id].join(" -> ")}` }]);
    }
    if (!resolver) {
      throw new PackValidationError([{ code: "DEPENDENCY", pointer: "/depends", message: `pack ${dep.id}@${dep.version} requires a resolver` }]);
    }
    const resolved = await resolver.resolve(dep.id, dep.version);
    if (resolved.manifest.id !== dep.id) {
      throw new PackValidationError([{ code: "INTEGRITY", pointer: "/depends", message: `resolver returned pack ${resolved.manifest.id}, expected ${dep.id}` }]);
    }
    if (!satisfies(resolved.manifest.version, dep.version)) {
      throw new PackValidationError([{ code: "DEPENDENCY", pointer: "/depends", message: `${dep.id}@${resolved.manifest.version} does not satisfy ${dep.version}` }]);
    }
    const nextBytes = assetBytes + [...resolved.assets.values()].reduce((sum, a) => sum + a.bytes.byteLength, 0);
    if (nextBytes > ASSETS_MAX_BYTES) {
      throw new PackValidationError([{ code: "LIMIT", pointer: "/depends", message: `asset bytes exceed ${ASSETS_MAX_BYTES}` }]);
    }
    out.push(resolved, ...resolved.dependencies);
    await resolveDependencies(resolved.manifest, resolver, [...chain, dep.id], nextBytes);
  }
  return dedupePacks(out);
}

function dedupePacks(packs: readonly LoadedPack[]): readonly LoadedPack[] {
  const map = new Map<string, LoadedPack>();
  for (const p of packs) {
    const prior = map.get(p.manifest.id);
    if (prior && prior.hash !== p.hash) {
      throw new PackValidationError([{ code: "INTEGRITY", pointer: "/depends", message: `conflicting versions of pack ${p.manifest.id}` }]);
    }
    map.set(p.manifest.id, p);
  }
  return [...map.values()].sort((a, b) => a.manifest.id.localeCompare(b.manifest.id));
}

/** v1 ranges: exact x.y.z or caret ^x.y.z (SemVer rules). */
export function satisfies(version: string, range: string): boolean {
  const parse = (v: string) => v.split(".").map(Number);
  if (!range.startsWith("^")) return version === range;
  const [major, minor, patch] = parse(range.slice(1));
  const [a, b, c] = parse(version);
  if (a !== major) return false;
  if (major === 0) {
    if (b !== minor) return false;
    return minor === 0 ? c === patch : (c as number) >= (patch as number);
  }
  return (b as number) > (minor as number) || (b === minor && (c as number) >= (patch as number));
}
