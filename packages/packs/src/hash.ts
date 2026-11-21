import type { Json } from "./types.js";

/** Sort keys by ordinal UTF-16 code units (JS default string sort). */
export function canonicalJson(value: unknown): string {
  return serialize(value, new Set());
}

function serialize(value: unknown, seen: Set<object>): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new TypeError("canonical hash requires finite safe integers");
    return JSON.stringify(value);
  }
  if (typeof value !== "object") throw new TypeError(`unsupported canonical value: ${typeof value}`);
  if (seen.has(value)) throw new TypeError("canonical hash requires an acyclic value");
  seen.add(value);
  try {
    if (Array.isArray(value)) return `[${value.map((v) => serialize(v, seen)).join(",")}]`;
    const keys = Object.keys(value as object).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${serialize((value as Record<string, unknown>)[k], seen)}`).join(",")}}`;
  } finally {
    seen.delete(value);
  }
}

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const rot = (x: number, n: number): number => (x >>> n) | (x << (32 - n));

/** Dependency-free synchronous SHA-256 (integrity only, never randomness). */
export function sha256(bytes: Uint8Array): string {
  const paddedLength = (Math.floor((bytes.length + 9) / 64) + 1) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const bits = BigInt(bytes.length) * 8n;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Number((bits >> 32n) & 0xffffffffn), false);
  view.setUint32(paddedLength - 4, Number(bits & 0xffffffffn), false);

  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const w = new Uint32Array(64);
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15] as number;
      const y = w[i - 2] as number;
      const s0 = rot(x, 7) ^ rot(x, 18) ^ (x >>> 3);
      const s1 = rot(y, 17) ^ rot(y, 19) ^ (y >>> 10);
      w[i] = (((w[i - 16] as number) + s0 + (w[i - 7] as number) + s1) >>> 0);
    }
    let [a, b, c, d, e, f, g, hh] = h as unknown as number[];
    for (let i = 0; i < 64; i++) {
      const S1 = rot(e as number, 6) ^ rot(e as number, 11) ^ rot(e as number, 25);
      const ch = ((e as number) & (f as number)) ^ (~(e as number) & (g as number));
      const t1 = (((hh as number) + S1 + ch + (K[i] as number) + (w[i] as number)) >>> 0);
      const S0 = rot(a as number, 2) ^ rot(a as number, 13) ^ rot(a as number, 22);
      const maj = ((a as number) & (b as number)) ^ ((a as number) & (c as number)) ^ ((b as number) & (c as number));
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = ((d as number) + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    const next = [a, b, c, d, e, f, g, hh] as const;
    for (let i = 0; i < 8; i++) h[i] = ((h[i] as number) + (next[i] as number)) >>> 0;
  }
  return Array.from(h, (v) => v.toString(16).padStart(8, "0")).join("");
}

export function utf8Bytes(text: string): Uint8Array {
  const out: number[] = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0) as number;
    if (cp <= 0x7f) out.push(cp);
    else if (cp <= 0x7ff) out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    else if (cp <= 0xffff) out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    else out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
  }
  return Uint8Array.from(out);
}

export function contentHash(manifest: unknown, assets: ReadonlyMap<string, { digest: string }> = new Map()): string {
  const paths = [...assets.keys()].sort();
  const assetHashes: Record<string, string> = {};
  for (const p of paths) assetHashes[p] = (assets.get(p) as { digest: string }).digest;
  return sha256(utf8Bytes(canonicalJson({ manifest, assetHashes })));
}

export function decodeUtf8(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] as number;
    if (b < 0x80) { out += String.fromCharCode(b); continue; }
    const count = b < 0xe0 ? 2 : b < 0xf0 ? 3 : 4;
    let cp = b & (0x7f >> count);
    for (let j = 1; j < count; j++) cp = (cp << 6) | ((bytes[i + j] as number) & 0x3f);
    i += count - 1;
    out += String.fromCodePoint(cp);
  }
  return out;
}

export function cloneJson<T>(value: T): T {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((v) => cloneJson(v)) as T;
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = cloneJson(v);
    return out as T;
  }
  throw new TypeError(`cannot clone non-JSON value: ${typeof value}`);
}

export function isJson(value: unknown): value is Json {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isSafeInteger(value);
  if (Array.isArray(value)) return value.every(isJson);
  if (typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).every(isJson);
}
