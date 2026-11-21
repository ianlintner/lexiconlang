import type { PackDiagnostic, PackManifestV1 } from "./types.js";
import { ASSETS_MAX_BYTES, DEPENDENCY_MAX_DEPTH, RESOURCE_MAX_COUNT, TEXT_MAX_LENGTH, WEIGHT_MAX_TOTAL, dedupe } from "./validate.js";

/** Capabilities this host implements. Unknown behavior fields/caps fail closed. */
export const SUPPORTED_CAPABILITIES = new Set(["language-v1", "grammar-v1", "tables-v1", "markov-v1"]);

const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const RESOURCE_KINDS = new Set(["culture", "meaning-pack", "meaning", "word-class", "grammar", "table", "corpus", "markov", "generator", "base", "dialect"]);
const ID_PART = /^[a-z][a-z0-9-]*$/;
const RESOURCE_ID = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*\/[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/;

function isOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function checkDictionaryKeys(diag: PackDiagnostic[], value: unknown, pointer: string): void {
  if (value === null || typeof value !== "object") return;
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      diag.push({ code: "SCHEMA", pointer: `${pointer}/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`, message: `unsafe key ${JSON.stringify(key)}` });
    }
  }
}

export function semanticDiagnostics(manifest: PackManifestV1): readonly PackDiagnostic[] {
  const diag: PackDiagnostic[] = [];
  const m = manifest as unknown as Record<string, unknown>;
  const packId = manifest.id;
  const prefix = `${packId}/`;
  const ids = new Map<string, string>();
  const claim = (id: string, kind: string, pointer: string) => {
    if (ids.has(id)) {
      diag.push({ code: "COLLISION", pointer, message: `duplicate resource id ${JSON.stringify(id)} (also ${ids.get(id)})` });
    } else ids.set(id, `${pointer} (${kind})`);
    if (!id.startsWith(prefix)) {
      diag.push({ code: "REFERENCE", pointer, message: `resource ${JSON.stringify(id)} must be owned by pack ${JSON.stringify(packId)}` });
    }
    const parts = id.split("/");
    if (parts.length !== 3 || !RESOURCE_KINDS.has(parts[1] as string) || !ID_PART.test(parts[2] as string)) {
      diag.push({ code: "REFERENCE", pointer, message: `invalid resource id ${JSON.stringify(id)}` });
    }
  };

  for (const [field, kind] of [["cultures", "culture"], ["meaningPacks", "meaning-pack"], ["grammars", "grammar"], ["tables", "table"], ["corpora", "corpus"], ["markovModels", "markov"], ["generators", "generator"], ["bases", "base"], ["dialects", "dialect"]] as const) {
    const items = (manifest as unknown as Record<string, unknown>)[field];
    if (!Array.isArray(items)) continue;
    if (items.length > RESOURCE_MAX_COUNT) diag.push({ code: "LIMIT", pointer: `/${field}`, message: `too many resources in graph` });
    items.forEach((item, i) => {
      if (item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string") {
        claim((item as { id: string }).id, kind, `/${field}/${i}/id`);
      }
    });
  }
  for (const [i, mp] of manifest.meaningPacks.entries()) {
    for (const [j, meaning] of mp.meanings.entries()) {
      claim(meaning.id, "meaning", `/meaningPacks/${i}/meanings/${j}/id`);
    }
  }

  // Dependency declarations: no pack may appear in both lists.
  const depends = new Set(manifest.depends.map((d) => d.id));
  manifest.extends.forEach((d, i) => {
    if (depends.has(d.id)) diag.push({ code: "DEPENDENCY", pointer: `/extends/${i}/id`, message: `${d.id} is declared in both depends and extends` });
  });
  for (const d of [...manifest.depends, ...manifest.extends]) {
    if (d.id === packId) diag.push({ code: "DEPENDENCY", pointer: `/depends/0/id`, message: `pack cannot depend on itself` });
    if (!/^v?\d+\.\d+\.\d+$/.test(d.version)) diag.push({ code: "SCHEMA", pointer: `/depends/0/version`, message: `invalid dependency version ${d.version}` });
  }

  // Capability declarations must cover behavior-bearing sections and be known.
  const required = new Set(manifest.requires);
  for (const cap of manifest.requires) {
    if (!SUPPORTED_CAPABILITIES.has(cap)) diag.push({ code: "CAPABILITY", pointer: `/requires`, message: `unsupported capability ${JSON.stringify(cap)}` });
  }
  const need = (cap: string, used: boolean) => {
    if (used && !required.has(cap)) diag.push({ code: "CAPABILITY", pointer: `/requires`, message: `${cap} is required by this manifest but not declared` });
  };
  need("language-v1", manifest.cultures.length > 0 || manifest.meaningPacks.length > 0 || manifest.generators.some((g) => g.engine === "name-v1" || g.engine === "structured-name-v1"));
  need("grammar-v1", manifest.grammars.length > 0 || manifest.generators.some((g) => g.engine === "grammar-v1"));
  need("tables-v1", manifest.tables.length > 0 || manifest.generators.some((g) => g.engine === "table-v1"));
  need("markov-v1", manifest.corpora.length > 0 || manifest.markovModels.length > 0 || manifest.generators.some((g) => g.engine === "markov-v1"));
  if ((manifest.bases?.length ?? 0) > 0) diag.push({ code: "CAPABILITY", pointer: `/bases`, message: `bases-v1 is not implemented by this host` });
  if ((manifest.dialects?.length ?? 0) > 0) diag.push({ code: "CAPABILITY", pointer: `/dialects`, message: `dialects-v1 is not implemented by this host` });

  // Provenance references and asset paths.
  const provIds = new Set(manifest.provenance.map((p) => p.id));
  manifest.corpora.forEach((c, i) => c.provenance.forEach((p, j) => {
    if (!provIds.has(p)) diag.push({ code: "LICENSE", pointer: `/corpora/${i}/provenance/${j}`, message: `unknown provenance id ${JSON.stringify(p)}` });
  }));
  const checkAsset = (asset: { path: string; sha256: string } | undefined, pointer: string) => {
    if (!asset) return;
    const p = asset.path;
    if (p.startsWith("/") || p.includes("\\") || p.includes("..") || /^[A-Za-z]+:/.test(p) || p.startsWith("~")) {
      diag.push({ code: "SCHEMA", pointer: `${pointer}/path`, message: `unsafe asset path ${JSON.stringify(p)}` });
    }
    if (!/^[0-9a-f]{64}$/.test(asset.sha256)) diag.push({ code: "SCHEMA", pointer: `${pointer}/sha256`, message: `sha256 must be lowercase hex` });
  };
  manifest.corpora.forEach((c, i) => checkAsset(c.asset, `/corpora/${i}/asset`));
  manifest.markovModels.forEach((c, i) => checkAsset(c.asset, `/markovModels/${i}/asset`));

  // Weight totals and text length; no locale collation or float weights.
  const checkWeights = (items: readonly { weight: number }[], pointer: string) => {
    let total = 0;
    items.forEach((item, i) => {
      total += item.weight;
      if (!Number.isSafeInteger(item.weight) || item.weight < 1) diag.push({ code: "LIMIT", pointer: `${pointer}/${i}/weight`, message: `weight must be a positive safe integer` });
    });
    if (total > WEIGHT_MAX_TOTAL) diag.push({ code: "LIMIT", pointer, message: `weight total ${total} exceeds 2^32` });
  };
  manifest.cultures.forEach((c, i) => Object.entries(c.templates ?? {}).forEach(([kind, choices]) => checkWeights(choices, `/cultures/${i}/templates/${kind}`)));
  manifest.grammars.forEach((g, i) => g.rules.forEach((r, j) => checkWeights(r.choices, `/grammars/${i}/rules/${j}/choices`)));
  manifest.tables.forEach((t, i) => {
    if (t.mode === "weighted") checkWeights(t.entries.map((e) => ({ weight: e.weight ?? 0 })), `/tables/${i}/entries`);
  });

  // Prototype-pollution keys in keyed dictionaries.
  manifest.cultures.forEach((c, i) => {
    checkDictionaryKeys(diag, c.templates, `/cultures/${i}/templates`);
    checkDictionaryKeys(diag, c.genderTemplates, `/cultures/${i}/genderTemplates`);
    checkDictionaryKeys(diag, c.nameStructures, `/cultures/${i}/nameStructures`);
    checkDictionaryKeys(diag, c.glyphs?.classes, `/cultures/${i}/glyphs/classes`);
  });
  checkDictionaryKeys(diag, manifest.extensions, "/extensions");
  checkDictionaryKeys(diag, m["bases"], "/bases");

  // Culture inheritance chains: single parent, acyclic, declared dependency.
  const cultureById = new Map(manifest.cultures.map((c, i) => [c.id, { c, i }]));
  const extensionSet = new Set(manifest.extends.map((d) => d.id));
  const rootPack = (id: string) => id.split("/")[0] as string;
  for (const [i, c] of manifest.cultures.entries()) {
    const seen = new Set<string>([c.id]);
    let cursor = c.extends;
    let depth = 0;
    while (cursor) {
      if (++depth > DEPENDENCY_MAX_DEPTH) {
        diag.push({ code: "CYCLE", pointer: `/cultures/${i}/extends`, message: `inheritance chain exceeds ${DEPENDENCY_MAX_DEPTH}` });
        break;
      }
      if (seen.has(cursor)) {
        diag.push({ code: "CYCLE", pointer: `/cultures/${i}/extends`, message: `culture inheritance cycle: ${[...seen, cursor].join(" -> ")}` });
        break;
      }
      seen.add(cursor);
      const parent = cultureById.get(cursor);
      if (!parent) break;
      cursor = parent.c.extends;
    }
    if (c.extends && rootPack(c.extends) !== packId && !extensionSet.has(rootPack(c.extends))) {
      diag.push({ code: "DEPENDENCY", pointer: `/cultures/${i}/extends`, message: `parent culture's pack is not declared in extends` });
    }
  }

  // Local references to pack-owned resources must exist.
  const localRef = (ref: string, pointer: string) => {
    if (!RESOURCE_ID.test(ref)) {
      if (ref !== "__action__") diag.push({ code: "REFERENCE", pointer, message: `invalid resource id ${JSON.stringify(ref)}` });
      return;
    }
    if (rootPack(ref) === packId && !ids.has(ref)) {
      diag.push({ code: "REFERENCE", pointer, message: `unknown local resource ${JSON.stringify(ref)}` });
    }
  };
  manifest.cultures.forEach((c, i) => {
    if (c.extends) localRef(c.extends, `/cultures/${i}/extends`);
    if (c.base) localRef(c.base, `/cultures/${i}/base`);
    c.meaningPacks?.forEach((r, j) => localRef(r, `/cultures/${i}/meaningPacks/${j}`));
    if (c.glyphs) {
      checkTextFields(c.glyphs.classes, `/cultures/${i}/glyphs/classes`, diag);
    }
  });
  manifest.markovModels.forEach((model, i) => localRef(model.corpus, `/markovModels/${i}/corpus`));
  manifest.generators.forEach((g, i) => {
    if ("culture" in g) localRef(g.culture, `/generators/${i}/culture`);
    if ("grammar" in g) localRef(g.grammar, `/generators/${i}/grammar`);
    if ("table" in g) localRef(g.table, `/generators/${i}/table`);
    if ("model" in g) localRef(g.model, `/generators/${i}/model`);
  });

  return dedupe(diag);
}

function checkTextFields(value: unknown, pointer: string, diag: PackDiagnostic[]): void {
  if (Array.isArray(value)) {
    value.forEach((v, i) => checkTextFields(v, `${pointer}/${i}`, diag));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) checkTextFields(v, `${pointer}/${k}`, diag);
  } else if (typeof value === "string" && value.length > TEXT_MAX_LENGTH) {
    diag.push({ code: "LIMIT", pointer, message: `text exceeds ${TEXT_MAX_LENGTH} characters` });
  }
}
