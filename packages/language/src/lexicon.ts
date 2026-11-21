import type { Context } from "@lexiconlang/core";
import type { Culture, Lexicon, WordClass } from "./types.js";
import { generateWord, generateWordTokens } from "./phonotactics.js";
import { deriveDialect, type DerivedLanguage, type DialectData, type OrthographyData, type TokenLexicon } from "./dialects.js";

/** Default capacity of a {@link LexiconCache}. */
export const DEFAULT_LEXICON_CACHE_CAPACITY = 128;

/** Monotonic format tag: bump it if the cache key layout ever changes. */
const LEXICON_CACHE_FORMAT = "lexicon-cache-v1";

export interface LexiconCacheStats {
  readonly hits: number;
  readonly misses: number;
  readonly evictions: number;
}

/**
 * A bounded, key-addressed lexicon memo.
 *
 * A lexicon is a pure function of (culture snapshot, seed path), so caching it
 * is output-preserving: the same key always yields byte-identical forms. The
 * cache only removes work — it never changes a result.
 */
export interface LexiconCache {
  readonly maxEntries: number;
  readonly size: number;
  readonly stats: LexiconCacheStats;
  /** Return the memoized lexicon for `key`, building it with `create` on a miss. */
  getOrCreate(key: string, create: () => Lexicon): Lexicon;
  clear(): void;
}

/**
 * Create a bounded lexicon cache.
 *
 * `maxEntries: 0` disables memoization while still counting misses — handy for
 * benchmarking an uncached baseline.
 */
export function createLexiconCache(
  options: { maxEntries?: number } = {},
): LexiconCache {
  const maxEntries = options.maxEntries ?? DEFAULT_LEXICON_CACHE_CAPACITY;
  if (!Number.isInteger(maxEntries) || maxEntries < 0) {
    throw new Error(
      `createLexiconCache: maxEntries must be a non-negative integer, got ${String(maxEntries)}`,
    );
  }

  const entries = new Map<string, Lexicon>();
  let hits = 0;
  let misses = 0;
  let evictions = 0;

  return {
    maxEntries,

    get size(): number {
      return entries.size;
    },

    get stats(): LexiconCacheStats {
      return { hits, misses, evictions };
    },

    getOrCreate(key: string, create: () => Lexicon): Lexicon {
      const existing = entries.get(key);
      if (existing !== undefined) {
        hits++;
        if (maxEntries > 0) {
          // Refresh recency: Map preserves insertion order.
          entries.delete(key);
          entries.set(key, existing);
        }
        return existing;
      }

      misses++;
      const built = create();

      if (maxEntries > 0) {
        entries.set(key, built);
        while (entries.size > maxEntries) {
          const oldest = entries.keys().next();
          if (oldest.done === true) break;
          entries.delete(oldest.value);
          evictions++;
        }
      }

      return built;
    },

    clear(): void {
      entries.clear();
    },
  };
}

/**
 * Build a deterministic, key-addressed lexicon for a culture.
 * Each meaning's conlang form is derived from a fork keyed on the meaning ID,
 * ensuring order-independence and patch stability.
 *
 * Pass a {@link LexiconCache} to memoize the lexicon across calls (per culture
 * identity and seed path). Without a cache the behaviour is unchanged.
 */
export function buildLexicon(
  culture: Culture,
  ctx: Context,
  cache?: LexiconCache,
): Lexicon {
  const cultureCtx = ctx.child(`lang:${culture.id}`);

  if (cache === undefined) {
    return createLexicon(culture, cultureCtx);
  }

  const key = lexiconCacheKey(culture, cultureCtx);
  return cache.getOrCreate(key, () => createLexicon(culture, cultureCtx));
}

/**
 * Stable identity for a culture object. Deliberately *identity*, not `id`:
 * two distinct culture objects that share an `id` may carry different glyphs
 * or meaning packs, and must not share a lexicon entry.
 */
const cultureIdentity = new WeakMap<object, number>();
let nextCultureIdentity = 0;

function identityOf(culture: Culture): number {
  let id = cultureIdentity.get(culture);
  if (id === undefined) {
    id = nextCultureIdentity++;
    cultureIdentity.set(culture, id);
  }
  return id;
}

/**
 * Cache key = culture identity + the full fingerprint of the freshly derived
 * child RNG fork (algo, state, origin) + the ctx scope path. Structured tuple
 * serialization, so no field can be confused with a delimiter.
 */
function lexiconCacheKey(culture: Culture, cultureCtx: Context): string {
  const state = cultureCtx.rng.state();
  const [a, b, c, d] = state.state;
  return JSON.stringify([
    LEXICON_CACHE_FORMAT,
    identityOf(culture),
    state.algo,
    a,
    b,
    c,
    d,
    state.origin,
    [...cultureCtx.scope].join("\u0000"),
  ]);
}

function createLexicon(culture: Culture, cultureCtx: Context): Lexicon {
  const cache = new Map<string, string>();

  // Build a flat map of all meanings from all packs
  const allMeanings = new Map<string, { class: WordClass; tags: readonly string[]; label?: string }>();
  for (const pack of culture.meaningPacks) {
    for (const meaning of pack.meanings) {
      allMeanings.set(meaning.id, { class: meaning.class, tags: meaning.tags, label: meaning.label });
    }
  }

  return {
    cultureId: culture.id,

    formOf(meaningId: string): string {
      let form = cache.get(meaningId);
      if (form !== undefined) return form;

      // Key-addressed fork: order-independent
      const wordCtx = cultureCtx.child(`word:${meaningId}`);
      form = generateWord(culture.glyphs, wordCtx);
      cache.set(meaningId, form);
      return form;
    },

    byClass(c: WordClass, tag?: string) {
      const result = [];
      for (const pack of culture.meaningPacks) {
        for (const meaning of pack.meanings) {
          if (meaning.class !== c) continue;
          if (tag && !meaning.tags.includes(tag)) continue;
          result.push(meaning);
        }
      }
      return result;
    },

    materialize() {
      const result = new Map<string, string>();
      for (const meaningId of allMeanings.keys()) {
        result.set(meaningId, this.formOf(meaningId));
      }
      return result;
    },
  };
}

/**
 * Opt-in token-retaining lexicon for B3 dialect derivation.
 *
 * Conforms to the same deterministic contract as {@link buildLexicon}: the
 * `lang:<culture.id>` and `word:<meaningId>` forks stay exactly where they
 * were, and `formOf` returns the same bytes. The only extension is that each
 * meaning's atomic glyph tokens are retained for sound changes. Both passes
 * start from the same immutable child context, so no extra RNG state leaks.
 *
 * `cultureIdOverride` is reserved for future world-resolved cultures; callers
 * normally leave it unset.
 */
export function buildTokenLexicon(
  culture: Culture,
  ctx: Context,
  cultureIdOverride?: string,
  cache?: LexiconCache,
): TokenLexicon {
  const cultureCtx = ctx.child(`lang:${culture.id}`);
  const orthography: OrthographyData = {
    id: `lexicon:${culture.id}/orthography`,
    mappings: [],
    unknown: "preserve",
  };

  const build = (): TokenLexicon => {
    const forms = new Map<string, string>();
    const tokens = new Map<string, string[]>();
    const allMeaningIds: string[] = [];
    const seen = new Set<string>();
    for (const pack of culture.meaningPacks) {
      for (const meaning of pack.meanings) {
        if (seen.has(meaning.id)) continue;
        seen.add(meaning.id);
        allMeaningIds.push(meaning.id);
      }
    }

    return {
      cultureId: cultureIdOverride ?? culture.id,
      orthography,

      formOf(meaningId: string): string {
        const cached = forms.get(meaningId);
        if (cached !== undefined) return cached;
        const wordCtx = cultureCtx.child(`word:${meaningId}`);
        const form = generateWord(culture.glyphs, wordCtx);
        forms.set(meaningId, form);
        return form;
      },

      tokensOf(meaningId: string): readonly string[] {
        const cached = tokens.get(meaningId);
        if (cached !== undefined) return [...cached];
        const wordCtx = cultureCtx.child(`word:${meaningId}`);
        const picked = generateWordTokens(culture.glyphs, wordCtx);
        tokens.set(meaningId, picked);
        return [...picked];
      },

      byClass(c, tag) {
        const result = [];
        for (const pack of culture.meaningPacks) {
          for (const meaning of pack.meanings) {
            if (meaning.class !== c) continue;
            if (tag && !meaning.tags.includes(tag)) continue;
            result.push(meaning);
          }
        }
        return result;
      },

      materialize() {
        const result = new Map<string, string>();
        for (const meaningId of allMeaningIds) result.set(meaningId, this.formOf(meaningId));
        return result;
      },
    };
  };

  if (cache === undefined) return build();
  return cache.getOrCreate(`token:${lexiconCacheKey(culture, cultureCtx)}`, () => build()) as TokenLexicon;
}

/**
 * Build a token-aware proto lexicon from a Culture and immediately derive a
 * daughter language. This is the direct form of the card's shorthand
 * `deriveDialect(culture, rules)`; further daughters can be derived by
 * passing the result to {@link deriveDialect} again.
 */
export function deriveDialectFromCulture(
  culture: Culture,
  data: DialectData,
  ctx: Context,
): DerivedLanguage {
  const proto = buildTokenLexicon(culture, ctx, culture.id);
  return deriveDialect(proto, data, ctx.child(`culture-dialect:${data.id}`));
}
