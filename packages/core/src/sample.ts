import type { RNG } from "./rng.js";

export type Weighted<T> = { value: T; weight: number };
export type WeightInput<T> = readonly T[] | readonly Weighted<T>[] | Record<string, number>;

export interface AliasTable<T> {
  values: readonly T[];
  prob: Float64Array;
  alias: Int32Array;
}

function isWeighted<T>(x: unknown): x is Weighted<T> {
  return typeof x === "object" && x !== null && "value" in x && "weight" in x;
}

export function normalizeWeights<T>(input: WeightInput<T>): Weighted<T>[] {
  if (Array.isArray(input)) {
    return input.map((entry): Weighted<T> => {
      if (isWeighted<T>(entry)) return entry;
      return { value: entry as T, weight: 1 };
    });
  }
  // Record<string, number>
  const out: Weighted<T>[] = [];
  for (const [k, v] of Object.entries(input as Record<string, number>)) {
    if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) continue;
    out.push({ value: k as unknown as T, weight: v });
  }
  return out;
}

// Vose's alias method — O(1) sampling after O(n) build.
export function buildAliasTable<T>(input: WeightInput<T>): AliasTable<T> {
  const weighted = normalizeWeights(input);
  if (weighted.length === 0) throw new Error("buildAliasTable: empty input");

  const n = weighted.length;
  const values = weighted.map((w) => w.value);
  const sum = weighted.reduce((s, w) => s + w.weight, 0);
  if (sum <= 0) throw new Error("buildAliasTable: total weight must be > 0");

  const prob = new Float64Array(n);
  const alias = new Int32Array(n);
  const scaled = weighted.map((w) => (w.weight * n) / sum);

  const small: number[] = [];
  const large: number[] = [];
  for (let i = 0; i < n; i++) {
    if ((scaled[i] ?? 0) < 1) small.push(i);
    else large.push(i);
  }

  while (small.length > 0 && large.length > 0) {
    const s = small.pop() as number;
    const l = large.pop() as number;
    prob[s] = scaled[s] ?? 0;
    alias[s] = l;
    scaled[l] = (scaled[l] ?? 0) + (scaled[s] ?? 0) - 1;
    if ((scaled[l] ?? 0) < 1) small.push(l);
    else large.push(l);
  }
  while (large.length > 0) {
    const l = large.pop() as number;
    prob[l] = 1;
    alias[l] = l;
  }
  while (small.length > 0) {
    const s = small.pop() as number;
    prob[s] = 1;
    alias[s] = s;
  }

  return { values, prob, alias };
}

export function sampleAlias<T>(table: AliasTable<T>, rng: RNG): T {
  const n = table.values.length;
  const i = rng.nextInt(0, n);
  const r = rng.next();
  const idx = r < (table.prob[i] ?? 0) ? i : (table.alias[i] ?? i);
  return table.values[idx] as T;
}
