import type { Context } from "./context.js";

export interface GeneratorInfo {
  readonly id: string;
  readonly description?: string;
  readonly tags?: readonly string[];
}

export interface Generator<T, C = unknown> {
  readonly id: string;
  generate(ctx: Context<C>): T;
  describe?(): GeneratorInfo;
}

export type GeneratorLike<T, C = unknown> = Generator<T, C> | ((ctx: Context<C>) => T);

export function asGenerator<T, C = unknown>(g: GeneratorLike<T, C>, fallbackId = "anon"): Generator<T, C> {
  if (typeof g === "function") {
    return { id: fallbackId, generate: g };
  }
  return g;
}

let anonCounter = 0;
export function nextAnonId(prefix = "anon"): string {
  return `${prefix}:${++anonCounter}`;
}
