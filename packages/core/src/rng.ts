import { mix, seedToBigInt } from "./hash.js";

export type Seed = string | number | bigint | RngState;

export interface RngState {
  readonly algo: "sfc32";
  readonly state: readonly [number, number, number, number];
  readonly origin: string;
}

export interface RNG {
  next(): number;
  nextU32(): number;
  nextInt(min: number, maxExclusive: number): number;
  nextRange(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  state(): RngState;
  fork(label: string | number): RNG;
}

const U32 = 0x100000000;

export class Sfc32 implements RNG {
  private a: number;
  private b: number;
  private c: number;
  private d: number;
  private readonly origin: bigint;
  private readonly originLabel: string;

  constructor(seed: Seed, originLabel?: string) {
    if (typeof seed === "object" && seed !== null && "algo" in seed && seed.algo === "sfc32") {
      [this.a, this.b, this.c, this.d] = seed.state;
      this.origin = seedToBigInt(seed.origin);
      this.originLabel = seed.origin;
    } else {
      const big = seedToBigInt(seed as string | number | bigint);
      this.origin = big;
      this.originLabel = typeof seed === "string" ? seed : big.toString(16);
      const lo = Number(big & 0xffffffffn) >>> 0;
      const hi = Number((big >> 32n) & 0xffffffffn) >>> 0;
      // Spread the 64 bits into 4 lanes; warm up the generator.
      this.a = lo ^ 0x9e3779b9;
      this.b = hi ^ 0x243f6a88;
      this.c = (lo + hi) >>> 0;
      this.d = (lo ^ hi ^ 0xb7e15162) >>> 0;
      for (let i = 0; i < 12; i++) this.nextU32();
    }
  }

  nextU32(): number {
    const t = (this.a + this.b + this.d) >>> 0;
    this.d = (this.d + 1) >>> 0;
    this.a = (this.b ^ (this.b >>> 9)) >>> 0;
    this.b = (this.c + (this.c << 3)) >>> 0;
    this.c = ((this.c << 21) | (this.c >>> 11)) >>> 0;
    this.c = (this.c + t) >>> 0;
    return t;
  }

  next(): number {
    return this.nextU32() / U32;
  }

  nextInt(min: number, maxExclusive: number): number {
    if (maxExclusive <= min) return min;
    const range = maxExclusive - min;
    return min + Math.floor(this.next() * range);
  }

  nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error("pick: empty array");
    const out = items[this.nextInt(0, items.length)];
    return out as T;
  }

  state(): RngState {
    return {
      algo: "sfc32",
      state: [this.a >>> 0, this.b >>> 0, this.c >>> 0, this.d >>> 0],
      origin: this.originLabel,
    };
  }

  fork(label: string | number): RNG {
    const labelStr = typeof label === "number" ? `i:${label}` : label;
    const childSeed = mix(this.origin, labelStr);
    const childLabel = `${this.originLabel}/${labelStr}`;
    return new Sfc32(childSeed, childLabel);
  }
}

export function createRng(seed: Seed): RNG {
  return new Sfc32(seed);
}
