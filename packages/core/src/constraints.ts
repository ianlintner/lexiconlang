/**
 * Constraint and uniqueness combinators (F4).
 *
 * Every new sub-roll is key-addressed through `ctx.child(...)` so sibling
 * generation order cannot perturb a result. Nothing here changes an existing
 * generator's RNG path: these are new, opt-in generators with new IDs.
 */
import type { Context } from "./context.js";
import { createContext } from "./context.js";
import type { Seed } from "./rng.js";
import { asGenerator, type Generator, type GeneratorLike } from "./generator.js";

/** Default number of attempts for `where`/`unique`. Matches spec §12. */
export const DEFAULT_MAX_ATTEMPTS = 32;
/** Hard upper bound; larger values are rejected instead of silently clamped. */
export const MAX_MAX_ATTEMPTS = 1000;

/** Raised when a constrained generator exhausts its attempts. */
export class ConstraintExhaustedError extends Error {
  readonly attempts: number;
  readonly generatorId: string;

  constructor(generatorId: string, attempts: number) {
    super(
      `Constraint exhausted after ${attempts} attempt(s) for generator ${generatorId}`,
    );
    this.name = "ConstraintExhaustedError";
    this.generatorId = generatorId;
    this.attempts = attempts;
  }
}

export interface WhereOptions {
  /** Stable ID for the new generator (defaults to `where:<inner.id>`). */
  id?: string;
  /** Attempt count including the first try. 1–1000, default 32. */
  maxAttempts?: number;
}

function checkMaxAttempts(maxAttempts: number): void {
  if (
    !Number.isInteger(maxAttempts) ||
    maxAttempts < 1 ||
    maxAttempts > MAX_MAX_ATTEMPTS
  ) {
    throw new RangeError(
      `maxAttempts must be an integer in 1..${MAX_MAX_ATTEMPTS}, got ${String(maxAttempts)}`,
    );
  }
}

/**
 * Keep sampling `gen` under `ctx.child("attempt:<i>")` until `predicate` accepts
 * a value. On exhaustion throws {@link ConstraintExhaustedError}: there is no
 * partial success and the caller RNG is never advanced directly.
 */
export function where<T, C = unknown>(
  gen: GeneratorLike<T, C>,
  predicate: (value: T, ctx: Context<C>) => boolean,
  options: WhereOptions = {},
): Generator<T, C> {
  const inner = asGenerator(gen, "where:inner");
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  checkMaxAttempts(maxAttempts);
  const id = options.id ?? `where:${inner.id}`;
  return {
    id,
    generate(ctx: Context<C>): T {
      for (let i = 0; i < maxAttempts; i++) {
        const value = inner.generate(ctx.child(`attempt:${i}`));
        if (predicate(value, ctx)) return value;
      }
      throw new ConstraintExhaustedError(id, maxAttempts);
    },
  };
}

/**
 * Caller-owned set of seen values for uniqueness. Sessions never live on a
 * generator or globally, so two callers cannot leak state into each other.
 */
export class UniquenessSession<K = unknown> {
  readonly #seen = new Set<K>();
  get size(): number {
    return this.#seen.size;
  }
  has(key: K): boolean {
    return this.#seen.has(key);
  }
  add(key: K): void {
    this.#seen.add(key);
  }
  clear(): void {
    this.#seen.clear();
  }
}

export interface UniqueOptions<T, C, K = T> extends WhereOptions {
  /** Caller-owned session; a fresh one is created if omitted. */
  session?: UniquenessSession<K>;
  /** Comparison key. Default: exact value identity (`SameValueZero` via Set). */
  key?: (value: T, ctx: Context<C>) => K;
}

/**
 * Generate values without replacement within a caller-owned session.
 * The comparison key defaults to exact value equality; pass `key` for objects
 * (e.g. `(v) => v.form`) or a normalized string if needed.
 */
export function unique<T, C = unknown, K = T>(
  gen: GeneratorLike<T, C>,
  options: UniqueOptions<T, C, K> = {},
): Generator<T, C> {
  const session = options.session ?? new UniquenessSession<K>();
  const key = options.key ?? ((value: T) => value as unknown as K);
  return where(
    gen,
    (value, ctx) => {
      const k = key(value, ctx);
      if (session.has(k)) return false;
      session.add(k);
      return true;
    },
    options,
  );
}

export interface SampleUniqueOptions<T, C, K = T> extends UniqueOptions<T, C, K> {
  /** Root seed. No hidden counter: the same seed/key/count always replays. */
  seed: Seed;
  /** Stable batch key label. Default `batch`. */
  keyLabel?: string;
}

/**
 * Sample `n` unique values. Item contexts (`item:<i>`) are derived from the
 * root BEFORE any retries, so a retry for item 2 cannot perturb item 3.
 */
export function sampleUnique<T, C = unknown, K = T>(
  gen: GeneratorLike<T, C>,
  n: number,
  options: SampleUniqueOptions<T, C, K>,
): T[] {
  if (!Number.isInteger(n) || n < 1 || n > MAX_MAX_ATTEMPTS) {
    throw new RangeError(`n must be an integer in 1..${MAX_MAX_ATTEMPTS}, got ${String(n)}`);
  }
  const root = createContext<C>({ seed: options.seed });
  const batch = root.child(options.keyLabel ?? "batch");
  const itemContexts = Array.from({ length: n }, (_, i) => batch.child(`item:${i}`));
  const session = options.session ?? new UniquenessSession<K>();
  const { key: keyFn, seed: _seed, keyLabel: _keyLabel, ...whereOpts } = options;
  const valueGenerator = unique(gen, { ...whereOpts, session, key: keyFn });
  return itemContexts.map((ctx) => valueGenerator.generate(ctx));
}

// ─── string shape helpers ─────────────────────────────────────────────────

/** Constrain a generator to values starting with `prefix`. */
export function startsWith<T extends string, C = unknown>(
  gen: GeneratorLike<T, C>,
  prefix: string,
  options: WhereOptions = {},
): Generator<T, C> {
  return where(gen, (value) => value.startsWith(prefix), options);
}

/** Number of whitespace-separated words in a string. */
export function wordLength(value: string): number {
  const trimmed = value.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/u).length;
}

/**
 * Approximate syllable count: runs of vowels (including `y`) in the input.
 * Intended for cheap constraints on conlang forms; it is not a phonological
 * analyzer. Latin letters and apostrophes are handled directly; pronounceable
 * glyph strings work best.
 */
export function syllableCount(value: string): number {
  const matches = value.toLowerCase().match(/[aeiouy]+/gu);
  return matches === null ? 0 : matches.length;
}
