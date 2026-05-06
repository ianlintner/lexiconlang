import type { Context } from "./context.js";
import { asGenerator, type Generator, type GeneratorLike, nextAnonId } from "./generator.js";
import { buildAliasTable, normalizeWeights, sampleAlias, type WeightInput } from "./sample.js";

// ─── weightedList ─────────────────────────────────────────────────────────

export interface WeightedListOptions {
  id?: string;
}

export function weightedList<T>(input: WeightInput<T>, opts: WeightedListOptions = {}): Generator<T> {
  const table = buildAliasTable(input);
  return {
    id: opts.id ?? nextAnonId("weightedList"),
    generate(ctx) {
      return sampleAlias(table, ctx.rng);
    },
  };
}

// ─── oneOf ────────────────────────────────────────────────────────────────

export function oneOf<T>(...values: readonly T[]): Generator<T>;
export function oneOf<T>(values: WeightInput<T>): Generator<T>;
export function oneOf<T>(...args: unknown[]): Generator<T> {
  const input = args.length === 1 && typeof args[0] === "object" && args[0] !== null
    ? (args[0] as WeightInput<T>)
    : (args as readonly T[]);
  return weightedList(input);
}

// ─── pickOf — choose among generators (with weights) ──────────────────────

export type GeneratorChoice<T, C> = GeneratorLike<T, C> | { gen: GeneratorLike<T, C>; weight: number };

export function pickOf<T, C = unknown>(
  ...choices: readonly GeneratorChoice<T, C>[]
): Generator<T, C> {
  const normalized: { value: Generator<T, C>; weight: number }[] = choices.map((c, i) => {
    if (typeof c === "object" && c !== null && "gen" in c && "weight" in c) {
      return { value: asGenerator(c.gen, `pickOf:${i}`), weight: c.weight };
    }
    return { value: asGenerator(c as GeneratorLike<T, C>, `pickOf:${i}`), weight: 1 };
  });
  const table = buildAliasTable<Generator<T, C>>(normalized);
  return {
    id: nextAnonId("pickOf"),
    generate(ctx: Context<C>) {
      const chosen = sampleAlias(table, ctx.rng);
      return chosen.generate(ctx.child(`choice:${chosen.id}`));
    },
  };
}

// ─── repeat ───────────────────────────────────────────────────────────────

export type CountSpec = number | { min: number; max: number };

export function repeat<T, C = unknown>(
  gen: GeneratorLike<T, C>,
  count: CountSpec,
): Generator<T[], C> {
  const inner = asGenerator(gen, "repeat:inner");
  return {
    id: nextAnonId("repeat"),
    generate(ctx: Context<C>) {
      const n =
        typeof count === "number"
          ? count
          : ctx.rng.fork("count").nextInt(count.min, count.max + 1);
      const out: T[] = [];
      for (let i = 0; i < n; i++) {
        out.push(inner.generate(ctx.child(`i:${i}`)));
      }
      return out;
    },
  };
}

// ─── compose — assemble an object from named child generators ─────────────

export type Parts<T, C> = {
  readonly [K in keyof T]: GeneratorLike<T[K], C>;
};

export interface ComposeOptions<T, C> {
  id: string;
  parts: Parts<T, C> | ((ctx: Context<C>) => Parts<T, C>);
  assemble?: (parts: T, ctx: Context<C>) => T;
}

export function compose<T extends object, C = unknown>(opts: ComposeOptions<T, C>): Generator<T, C> {
  return {
    id: opts.id,
    generate(ctx: Context<C>) {
      const parts = typeof opts.parts === "function" ? opts.parts(ctx) : opts.parts;
      const out = {} as T;
      for (const key of Object.keys(parts) as (keyof T)[]) {
        const child = asGenerator(parts[key], `${opts.id}:${String(key)}`);
        out[key] = child.generate(ctx.child(String(key)));
      }
      return opts.assemble ? opts.assemble(out, ctx) : out;
    },
  };
}

// ─── map / chain ──────────────────────────────────────────────────────────

export function map<A, B, C = unknown>(
  gen: GeneratorLike<A, C>,
  fn: (value: A, ctx: Context<C>) => B,
): Generator<B, C> {
  const inner = asGenerator(gen, "map:inner");
  return {
    id: nextAnonId("map"),
    generate(ctx) {
      return fn(inner.generate(ctx), ctx);
    },
  };
}

export function chain<A, B, C = unknown>(
  gen: GeneratorLike<A, C>,
  fn: (value: A, ctx: Context<C>) => GeneratorLike<B, C>,
): Generator<B, C> {
  const inner = asGenerator(gen, "chain:inner");
  return {
    id: nextAnonId("chain"),
    generate(ctx) {
      const a = inner.generate(ctx.child("a"));
      const next = asGenerator(fn(a, ctx), "chain:b");
      return next.generate(ctx.child("b"));
    },
  };
}

// ─── constant ─────────────────────────────────────────────────────────────

export function constant<T>(value: T): Generator<T> {
  return { id: nextAnonId("constant"), generate: () => value };
}

// ─── intRange / floatRange ────────────────────────────────────────────────

export function intRange(min: number, maxInclusive: number): Generator<number> {
  return {
    id: nextAnonId("intRange"),
    generate: (ctx) => ctx.rng.nextInt(min, maxInclusive + 1),
  };
}

export function floatRange(min: number, max: number): Generator<number> {
  return {
    id: nextAnonId("floatRange"),
    generate: (ctx) => ctx.rng.nextRange(min, max),
  };
}
