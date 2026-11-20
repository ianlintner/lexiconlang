import { describe, it, expect } from "vitest";
import { createContext } from "@lexiconlang/core";
import {
  archetypes,
  buildLexicon,
  coreMeanings,
  createLexiconCache,
  DEFAULT_LEXICON_CACHE_CAPACITY,
  defineCulture,
  freezeCulture,
  generateName,
  isFrozenCulture,
  type Culture,
  type GlyphSystem,
} from "../index.js";

const culture = defineCulture({
  id: "test.memo",
  glyphs: { ...archetypes.guttural, joiner: "" } as GlyphSystem,
  meaningPacks: [coreMeanings],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "strength", capitalize: true },
            { pick: "noun", tag: "earth" },
            { pick: "noun", tag: "industry" },
            { pick: "noun", tag: "nature" },
            { pick: "adjective", tag: "old" },
          ],
          sep: "",
          transSep: "-",
        },
        1,
      ],
    ],
    surname: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "nature" },
            { pick: "noun", tag: "nature" },
          ],
          sep: "",
          transSep: "-",
        },
        1,
      ],
    ],
  },
});

describe("createLexiconCache", () => {
  it("defaults to 128 entries", () => {
    expect(createLexiconCache().maxEntries).toBe(DEFAULT_LEXICON_CACHE_CAPACITY);
    expect(DEFAULT_LEXICON_CACHE_CAPACITY).toBe(128);
  });

  it("rejects a nonsense capacity", () => {
    expect(() => createLexiconCache({ maxEntries: -1 })).toThrow(/non-negative integer/);
    expect(() => createLexiconCache({ maxEntries: 1.5 })).toThrow(/non-negative integer/);
  });

  it("returns the same lexicon instance for a repeated key", () => {
    const cache = createLexiconCache();
    const ctx = createContext({ seed: "memo-1" });

    const first = buildLexicon(culture, ctx, cache);
    const second = buildLexicon(culture, ctx, cache);

    expect(second).toBe(first);
    expect(cache.stats).toEqual({ hits: 1, misses: 1, evictions: 0 });
    expect(cache.size).toBe(1);
  });

  it("produces byte-identical names through the cache", () => {
    const cache = createLexiconCache();
    const uncached = generateName(culture, "given", createContext({ seed: "memo-2" }));
    const cached = generateName(
      culture,
      "given",
      createContext({ seed: "memo-2" }),
      { gender: undefined },
    );
    expect(cached.form).toBe(uncached.form);
    expect(cached.translation).toBe(uncached.translation);

    const lexicon = buildLexicon(culture, createContext({ seed: "memo-2" }), cache);
    expect(lexicon.formOf("stone")).toBe(
      buildLexicon(culture, createContext({ seed: "memo-2" })).formOf("stone"),
    );
  });

  it("keys on seed path as well as culture identity", () => {
    const cache = createLexiconCache();

    buildLexicon(culture, createContext({ seed: "memo-a" }), cache);
    buildLexicon(culture, createContext({ seed: "memo-a" }), cache);
    buildLexicon(culture, createContext({ seed: "memo-b" }), cache);

    expect(cache.stats).toEqual({ hits: 1, misses: 2, evictions: 0 });
    expect(cache.size).toBe(2);
  });

  it("keys on culture identity, not on the culture id", () => {
    const cache = createLexiconCache();
    const clone: Culture = { ...culture };
    const ctx = createContext({ seed: "memo-c" });

    expect(clone.id).toBe(culture.id);
    buildLexicon(culture, ctx, cache);
    buildLexicon(clone, ctx, cache);

    expect(cache.stats.misses).toBe(2);
    expect(cache.size).toBe(2);
  });

  it("evicts the least recently used entry past capacity", () => {
    const cache = createLexiconCache({ maxEntries: 2 });

    const a = buildLexicon(culture, createContext({ seed: "evict-a" }), cache);
    buildLexicon(culture, createContext({ seed: "evict-b" }), cache);
    // Touch "a" so "b" becomes the eviction candidate.
    expect(buildLexicon(culture, createContext({ seed: "evict-a" }), cache)).toBe(a);
    buildLexicon(culture, createContext({ seed: "evict-c" }), cache);

    expect(cache.size).toBe(2);
    expect(cache.stats.evictions).toBe(1);

    // "a" survived, so re-requesting it is still a hit.
    const before = cache.stats.hits;
    buildLexicon(culture, createContext({ seed: "evict-a" }), cache);
    expect(cache.stats.hits).toBe(before + 1);
  });

  it("can be disabled with maxEntries: 0", () => {
    const cache = createLexiconCache({ maxEntries: 0 });
    const ctx = createContext({ seed: "off-1" });

    const first = buildLexicon(culture, ctx, cache);
    const second = buildLexicon(culture, ctx, cache);

    expect(second).not.toBe(first);
    expect(cache.size).toBe(0);
    expect(cache.stats).toEqual({ hits: 0, misses: 2, evictions: 0 });
  });

  it("can be cleared", () => {
    const cache = createLexiconCache();
    buildLexicon(culture, createContext({ seed: "clear-1" }), cache);
    cache.clear();
    expect(cache.size).toBe(0);
  });
});

describe("freezeCulture / isFrozenCulture", () => {
  it("treats a mutable culture as unsafe to share", () => {
    expect(isFrozenCulture(culture)).toBe(false);
    expect(isFrozenCulture({ ...culture } as Culture)).toBe(false);
  });

  it("rejects a shallow-frozen culture whose nested arrays stay mutable", () => {
    const partial = Object.freeze({
      ...culture,
      glyphs: Object.freeze({ ...culture.glyphs }),
      templates: Object.freeze({ ...culture.templates }),
    }) as Culture;
    expect(Object.isFrozen(partial)).toBe(true);
    expect(Object.isFrozen(partial.glyphs)).toBe(true);
    expect(Object.isFrozen(partial.templates)).toBe(true);
    expect(isFrozenCulture(partial)).toBe(false);
  });

  it("does not serve stale forms from the shared cache for a partially frozen culture", () => {
    const classes: Record<string, string[]> = {};
    for (const [name, glyphList] of Object.entries(culture.glyphs.classes)) {
      classes[name] = [...glyphList];
    }
    const glyphs = { ...culture.glyphs, classes } as GlyphSystem;
    const partial = Object.freeze({
      ...culture,
      glyphs: Object.freeze(glyphs),
      templates: Object.freeze({ ...culture.templates }),
    }) as Culture;
    const seed = "stale-check";
    const before = generateName(partial, "given", createContext({ seed })).form;
    // Mutate nested arrays the shallow freezes do not protect.
    for (const list of Object.values(classes)) list.splice(0, list.length, "z");
    const fresh = generateName(
      {
        ...partial,
        glyphs: {
          ...glyphs,
          classes: Object.fromEntries(Object.keys(classes).map((k) => [k, ["z"]])),
        },
      } as Culture,
      "given",
      createContext({ seed }),
    ).form;
    const after = generateName(partial, "given", createContext({ seed })).form;
    expect(after).toBe(fresh);
    expect(after).not.toBe(before);
  });

  it("deep-freezes the snapshot", () => {
    const frozen = freezeCulture({ ...culture } as Culture);
    expect(isFrozenCulture(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.glyphs)).toBe(true);
    expect(Object.isFrozen(frozen.meaningPacks)).toBe(true);
    expect(Object.isFrozen(frozen.meaningPacks[0])).toBe(true);
    expect(() => {
      (frozen as { id: string }).id = "mutated";
    }).toThrow(TypeError);
  });

  it("does not change generated output", () => {
    const frozen = freezeCulture({ ...culture } as Culture);
    const names = (c: Culture) =>
      ["n-1", "n-2", "n-3"].map((seed) =>
        String(generateName(c, "given", createContext({ seed }))),
      );
    expect(names(frozen)).toEqual(names(culture));
  });

  it("reuses one lexicon across calls for a frozen snapshot", () => {
    const frozen = freezeCulture({ ...culture } as Culture);
    const first = generateName(frozen, "given", createContext({ seed: "reuse" }));
    const second = generateName(frozen, "given", createContext({ seed: "reuse" }));
    expect(second.form).toBe(first.form);
  });
});

describe("lexicon memo micro-benchmark", () => {
  const ITERATIONS = 1000;

  function time(iterations: number, run: () => void): number {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) run();
    return performance.now() - start;
  }

  /** Best of 3, to blunt scheduler noise. */
  function bestOf3(run: () => void): number {
    return Math.min(
      time(ITERATIONS, run),
      time(ITERATIONS, run),
      time(ITERATIONS, run),
    );
  }

  it("memoizes buildLexicon per (culture identity, seed path)", () => {
    const frozen = freezeCulture({ ...culture } as Culture);
    const ctx = createContext({ seed: "bench" });

    // ── Deterministic evidence: one build for repeated same-path lookups ──
    // Same frozen culture object + same seed path ⇒ exactly one build, every
    // other lookup is a hit that returns the *same* lexicon instance.
    const cache = createLexiconCache();
    const built = buildLexicon(frozen, ctx, cache);
    for (let i = 1; i < ITERATIONS; i++) {
      expect(buildLexicon(frozen, ctx, cache)).toBe(built);
    }
    expect(cache.stats).toEqual({ hits: ITERATIONS - 1, misses: 1, evictions: 0 });

    // ── Distinct culture identities are never shared: every call builds ──
    const distinctCache = createLexiconCache({ maxEntries: ITERATIONS * 4 });
    for (let i = 0; i < ITERATIONS; i++) {
      buildLexicon({ ...frozen } as Culture, ctx, distinctCache);
    }
    expect(distinctCache.stats.misses).toBe(ITERATIONS);

    // ── Timing is *reported*, not asserted: wall-clock thresholds are flaky
    //    in CI, so the guarantee above is structural (build counts / reuse).
    const warmCtx = createContext({ seed: "bench-warm" });
    generateName(frozen, "given", warmCtx); // warm the shared snapshot cache
    const warm = bestOf3(() => {
      generateName(frozen, "given", warmCtx);
    });

    const coldCtx = createContext({ seed: "bench-cold" });
    const cold = bestOf3(() => {
      // A fresh (unfrozen) culture copy per iteration is never shared, so each
      // call rebuilds the lexicon and regenerates its words.
      const mutable: Culture = { ...frozen };
      generateName(mutable, "given", coldCtx);
    });

    const speedup = cold / warm;
    // eslint-disable-next-line no-console
    console.log(
      `[bench] lexicon memo: ${ITERATIONS} names — warm ${warm.toFixed(1)}ms, cold ${cold.toFixed(1)}ms, ${speedup.toFixed(2)}x faster`,
    );
  });
});
