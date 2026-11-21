import { describe, expect, it } from "vitest";
import { createContext } from "@lexiconlang/core";
import {
  applySoundChanges,
  applyOrthography,
  createRomanizationProfile,
  deriveDialect,
  languageFamily,
  parseSoundChange,
  parseSoundChangeRule,
  plural,
  genitive,
  demonym,
  adjectiveFromPlace,
  inflect,
  type DialectData,
  type GlyphSystem,
  type OrthographyData,
  type SoundChangeRule,
  type TokenLexicon,
} from "../dialects.js";
import { buildLexicon, buildTokenLexicon, deriveDialectFromCulture } from "../lexicon.js";
import { defineCulture } from "../types.js";
import { archetypes } from "../archetypes.js";

const identity: OrthographyData = {
  id: "test.identity",
  mappings: [
    { from: "a", to: "a" },
    { from: "b", to: "b" },
    { from: "d", to: "d" },
    { from: "e", to: "e" },
    { from: "i", to: "i" },
    { from: "k", to: "k" },
    { from: "l", to: "l" },
    { from: "m", to: "m" },
    { from: "n", to: "n" },
    { from: "o", to: "o" },
    { from: "p", to: "p" },
    { from: "r", to: "r" },
    { from: "s", to: "s" },
    { from: "t", to: "t" },
    { from: "u", to: "u" },
    { from: "v", to: "v" },
    { from: "z", to: "z" },
  ],
  unknown: "preserve",
};

function syntheticLexicon(): TokenLexicon {
  const tokens: Record<string, string[]> = {
    "m:star": ["t", "a", "l", "a"],
    "m:stone": ["k", "a", "t", "a"],
    "m:river": ["s", "e", "l", "u"],
    "m:night": ["n", "o", "k", "t", "i"],
    "m:fire": ["p", "i", "r", "a"],
  };
  const ctx = createContext({ seed: "synthetic-lexicon" });
  return {
    cultureId: "test.proto",
    orthography: identity,
    tokensOf(id) {
      if (!(id in tokens)) throw new Error(`unknown meaning ${id}`);
      return [...tokens[id]!];
    },
    byClass() {
      return [];
    },
    materialize() {
      return new Map(Object.keys(tokens).map((id) => [id, this.formOf(id)]));
    },
    formOf(id) {
      return applyOrthography(this.tokensOf(id), identity);
    },
  };
}

function language(tokens: Record<string, string[]>): TokenLexicon {
  return {
    cultureId: "test.fixture",
    orthography: identity,
    tokensOf(id) {
      if (!(id in tokens)) throw new Error(`unknown meaning ${id}`);
      return [...tokens[id]!];
    },
    byClass: () => [],
    materialize() {
      return new Map(Object.keys(tokens).map((id) => [id, this.formOf(id)]));
    },
    formOf(id) {
      return applyOrthography(this.tokensOf(id), identity);
    },
  };
}

const ctx = () => createContext({ seed: "b3-tests" });

describe("joiner-preserving derivation", () => {
  // Regression: a zero-change daughter must reproduce its parent byte-for-byte,
  // including a culture joiner and the parent's capitalization behaviour.
  it("reproduces a joiner-using parent exactly when no rules apply", () => {
    const parent: TokenLexicon = {
      cultureId: "test.synth",
      orthography: identity,
      tokensOf(id) {
        return id === "m:compound" ? ["t", "i", "s", "p", "a", "p"] : ["p", "i"];
      },
      segmentsOf(id) {
        return id === "m:compound" ? [["t", "i", "s"], ["p", "a", "p"]] : [["p", "i"]];
      },
      renderHint: { joiner: "-", capitalize: false },
      byClass: () => [],
      formOf(id) {
        return this.segmentsOf!(id).map((seg) => applyOrthography(seg, identity)).join("-");
      },
      materialize: () => new Map(),
    };
    const daughter = deriveDialect(
      parent,
      { id: "test.synth-daughter", parent: "test.synth", soundChanges: [] },
      ctx(),
    );
    expect(daughter.formOf("m:compound")).toBe(parent.formOf("m:compound")); // "tis-pap"
    expect(daughter.formOf("m:other")).toBe("pi");
  });

  it("reproduces a generated joiner culture exactly when no rules apply", () => {
    const culture = defineCulture({
      id: "test.joined",
      glyphs: {
        ...archetypes.flowing,
        classes: { C: ["t", "p"], V: ["i", "a"] },
        syllables: [["C V", 1]],
        wordShapes: [["2", 1]],
        joiner: "-",
      } as GlyphSystem,
      meaningPacks: [],
      templates: { given: [[{ kind: "literal", form: "A", translation: "a" }, 1]] },
    });
    const parent = buildTokenLexicon(culture, ctx());
    const form = parent.formOf("m:any");
    expect(form).toContain("-"); // joiner survives
    const daughter = deriveDialect(
      parent,
      { id: "test.joined-daughter", parent: "test.joined", soundChanges: [] },
      ctx(),
    );
    expect(daughter.formOf("m:any")).toBe(form);
  });

  it("applies sound changes inside syllable segments and keeps the joiner", () => {
    const parent: TokenLexicon = {
      cultureId: "test.synth",
      orthography: identity,
      tokensOf: () => ["t", "i", "s", "p", "a", "p"],
      segmentsOf: () => [["t", "i", "s"], ["p", "a", "p"]],
      renderHint: { joiner: "-", capitalize: false },
      byClass: () => [],
      formOf: () => "tis-pap",
      materialize: () => new Map(),
    };
    const daughter = deriveDialect(
      parent,
      {
        id: "test.synth-daughter",
        parent: "test.synth",
        soundChanges: [{ key: "p>b", from: ["p"], to: ["b"] }],
      },
      ctx(),
    );
    expect(daughter.tokensOf("m:any")).toEqual(["t", "i", "s", "b", "a", "b"]);
    expect(daughter.formOf("m:any")).toBe("tis-bab");
  });

  // Regression (round-2 review): rules must see the whole word, not one
  // syllable at a time. '#' is the word edge and contexts may cross syllables.
  it("treats # as the word edge and matches across syllable boundaries", () => {
    const parent: TokenLexicon = {
      cultureId: "test.no-joiner",
      orthography: identity,
      tokensOf: () => ["a", "r", "u", "y", "o"],
      segmentsOf: () => [["a", "r"], ["u"], ["y", "o"]],
      renderHint: { joiner: "", capitalize: false },
      byClass: () => [],
      formOf: () => "aruyo",
      materialize: () => new Map(),
    };
    const wordFinal = deriveDialect(
      parent,
      {
        id: "test.final",
        parent: "test.no-joiner",
        soundChanges: [parseSoundChange("r > Q / _ #")],
      },
      ctx(),
    );
    expect(wordFinal.formOf("m:any")).toBe("aruyo"); // r is not word-final
    const finalO = deriveDialect(
      parent,
      {
        id: "test.final-o",
        parent: "test.no-joiner",
        soundChanges: [parseSoundChange("o > Q / _ #")],
      },
      ctx(),
    );
    expect(finalO.formOf("m:any")).toBe("aruyQ");

    const crossSyllable = deriveDialect(
      parent,
      {
        id: "test.cross",
        parent: "test.no-joiner",
        soundChanges: [parseSoundChange("u > Z / r _")],
      },
      ctx(),
    );
    expect(crossSyllable.formOf("m:any")).toBe("arZyo");

    const atStart = deriveDialect(
      parent,
      {
        id: "test.start",
        parent: "test.no-joiner",
        soundChanges: [parseSoundChange("a > A / # _")],
      },
      ctx(),
    );
    expect(atStart.formOf("m:any")).toBe("Aruyo");
  });
});

describe("environment parsing and matching", () => {
  it("supports category alternatives in environments", () => {
    const rule = parseSoundChange("{k,p} > {b,d} / {a,e} _");
    expect(rule.before).toEqual([["a", "e"]]);
    expect(applySoundChanges(["a", "k"], [rule])).toEqual(["a", "b"]);
    expect(applySoundChanges(["e", "p"], [rule])).toEqual(["e", "d"]);
    expect(applySoundChanges(["a", "p"], [rule])).toEqual(["a", "d"]);
  });

  it("supports multi-token literal environments and # inside a sequence", () => {
    const multi = parseSoundChange("t > s / a i _");
    expect(multi.before).toEqual([["a"], ["i"]]);
    expect(applySoundChanges(["a", "i", "t"], [multi])).toEqual(["a", "i", "s"]);
    expect(applySoundChanges(["a", "t"], [multi])).toEqual(["a", "t"]);

    const boundary = parseSoundChange("t > s / # a _");
    expect(boundary.before).toEqual([["#"], ["a"]]);
    expect(applySoundChanges(["a", "t"], [boundary])).toEqual(["a", "s"]);
    expect(applySoundChanges(["i", "a", "t"], [boundary])).toEqual(["i", "a", "t"]);
  });

  it("rejects a single from with multiple to outputs and invalid JSON rules", () => {
    expect(() => parseSoundChange("a > {b,c}")).toThrow(/single from/);
    expect(() => parseSoundChangeRule({ key: "x", from: [1 as unknown as string], to: ["a"] })).toThrow(
      /string/,
    );
    // Round-2 review: duplicate target markers and multi-token bare LHS.
    expect(() => parseSoundChange("t > s / _ _")).toThrow(/exactly one/);
    expect(() => parseSoundChange("a b > c")).toThrow(/single token/);
    expect(() => parseSoundChange("{a,b} > {c,d,e}")).toThrow(/arity/);
    expect(() => parseSoundChangeRule({ key: "empty", from: ["a"], to: ["b"], before: [[]] })).toThrow(
      /empty.*slot/i,
    );
    expect(() =>
      parseSoundChangeRule({ key: "mixed", from: ["a"], to: ["b"], after: [["#", "a"]] }),
    ).toThrow(/cannot be mixed/);
    expect(() =>
      parseSoundChangeRule({ key: "json-multi", from: ["a"], to: ["b", "c"] }),
    ).toThrow(/multiple to/);
  });
});

describe("cycle detection", () => {
  it("rejects a mismatch between parent data and the actual parent identity", () => {
    const parent = syntheticLexicon();
    expect(() =>
      deriveDialect(
        parent,
        { id: "test.other", parent: "not.the.parent", soundChanges: [] },
        ctx(),
      ),
    ).toThrow(/parent/i);
  });

  it("rejects reusing an ancestor ID at any depth", () => {
    const root = syntheticLexicon();
    const a = deriveDialect(
      root,
      { id: "test.a", parent: root.cultureId, soundChanges: [] },
      ctx(),
    );
    const b = deriveDialect(a, { id: "test.b", parent: a.id, soundChanges: [] }, ctx());
    expect(() =>
      deriveDialect(b, { id: root.cultureId, parent: b.id, soundChanges: [] }, ctx()),
    ).toThrow(/cycle or ID reuse/);
    expect(() =>
      deriveDialect(b, { id: "test.a", parent: b.id, soundChanges: [] }, ctx()),
    ).toThrow(/cycle or ID reuse/);
  });
});

describe("rule DSL", () => {
  it("parses a basic change with category and environment", () => {
    expect(parseSoundChange("t > s / _ #")).toEqual({
      key: "t > s / _ #",
      from: ["t"],
      to: ["s"],
      after: [["#"]],
    });
  });

  it("parses categories, multi-token outputs, deletion and before-context", () => {
    expect(parseSoundChange("{k,p} > {b,d} / # _")).toEqual({
      key: "{k,p} > {b,d} / # _",
      from: ["k", "p"],
      to: ["b", "d"],
      before: [["#"]],
    });
    expect(parseSoundChange("e > 0 / _ #")).toEqual({
      key: "e > 0 / _ #",
      from: ["e"],
      to: [],
      after: [["#"]],
    });
  });

  it("accepts JSON form and validates empty from / unequal category arity", () => {
    const rule: SoundChangeRule = { key: "voicing", from: ["k"], to: ["g"] };
    expect(parseSoundChangeRule(rule)).toBe(rule);
    expect(() => parseSoundChangeRule({ key: "bad", from: [], to: ["x"] })).toThrow(/empty from/);
    expect(() => parseSoundChange("a > b / _ # / extra")).toThrow(/environment/);
    expect(() => parseSoundChangeRule({ key: "arity", from: ["a", "b"], to: ["x", "y", "z"] })).toThrow(
      /arity/i,
    );
  });
});

describe("sound-change application", () => {
  it("applies ordered rules left-to-right; a later rule sees earlier output", () => {
    const rules = [
      { key: "t>s", from: ["t"], to: ["s"] },
      { key: "s>sh", from: ["s"], to: ["sh"] },
    ];
    expect(applySoundChanges(["t", "a", "t"], rules)).toEqual(["sh", "a", "sh"]);
    // Within a single rule, output is not re-scanned (nonrecursive per pass).
    // A digraph is one output token ("ts"), not two tokens.
    expect(applySoundChanges(["t", "a"], [{ key: "t>ts", from: ["t"], to: ["ts"] }])).toEqual([
      "ts", "a",
    ]);
  });

  it("deletes with empty to and respects _ / # boundaries", () => {
    expect(applySoundChanges(["n", "o", "k", "t", "i"], [
      { key: "delete-final-i", from: ["i"], to: [], after: ["#"] },
    ])).toEqual(["n", "o", "k", "t"]);
    expect(applySoundChanges(["k", "a", "t", "a"], [
      { key: "initial-k", from: ["k"], to: ["t"], before: ["#"] },
    ])).toEqual(["t", "a", "t", "a"]);
  });

  it("matches literal category members and longest from-token first", () => {
    expect(applySoundChanges(["ts", "a"], [
      { key: "affricate", from: ["ts"], to: ["c"] },
      { key: "t-to-d", from: ["t"], to: ["d"] },
    ])).toEqual(["c", "a"]);
  });

  it("does not mutate the input token array", () => {
    const input = ["t", "a"];
    applySoundChanges(input, [{ key: "t>s", from: ["t"], to: ["s"] }]);
    expect(input).toEqual(["t", "a"]);
  });
});

describe("orthography + romanization", () => {
  it("uses longest-match-first, authored order for ties", () => {
    const ortho: OrthographyData = {
      id: "test.tie",
      mappings: [
        { from: "sh", to: "š" },
        { from: "s", to: "ș" },
        { from: "h", to: "h" },
        { from: "a", to: "a" },
      ],
      unknown: "preserve",
    };
    expect(applyOrthography(["sh", "a"], ortho)).toBe("ša");
    expect(applyOrthography(["s", "h", "a"], ortho)).toBe("șha");
  });

  it("preserves by default and errors when the profile opts in", () => {
    const ortho: OrthographyData = { id: "test.strict", mappings: [{ from: "a", to: "a" }], unknown: "preserve" };
    expect(applyOrthography(["a", "?"], ortho)).toBe("a?");
    expect(() =>
      applyOrthography(["a", "?"], ortho, { onUnknown: (t: string): string => { throw new Error(`unknown token: ${t}`); } }),
    ).toThrow(/unknown token/);
  });

  it("romanization profile: diacritics off, ASCII fold, digraph choice", () => {
    const ortho: OrthographyData = {
      id: "test.accent",
      mappings: [
        { from: "š", to: "š" },
        { from: "ā", to: "ā" },
        { from: "a", to: "a" },
      ],
      unknown: "preserve",
    };
    const ascii = createRomanizationProfile({ diacritics: false, asciiFold: true });
    expect(applyOrthography(["š", "ā", "a"], ortho, ascii)).toBe("saa");
    const digraph = createRomanizationProfile({ diacritics: false, digraphs: { š: "sh" } });
    expect(applyOrthography(["š", "a"], ortho, digraph)).toBe("sha");
  });
});

describe("deriveDialect", () => {
  it("derives daughter forms from shared meanings, chainable and non-resampling", () => {
    const proto = syntheticLexicon();
    const north = deriveDialect(
      proto,
      {
        id: "test.north",
        parent: "test.proto",
        soundChanges: [{ key: "t>s", from: ["t"], to: ["s"] }],
      },
      ctx(),
    );
    expect(north.cultureId).toBe("test.north");
    expect(north.parent).toBe("test.proto");
    expect(north.formOf("m:star")).toBe("Sala");
    expect(north.formOf("m:stone")).toBe("Kasa");
    expect(north.tokensOf("m:star")).toEqual(["s", "a", "l", "a"]);
    expect(north.byClass("noun")).toEqual(proto.byClass("noun"));
    expect([...north.materialize().keys()]).toEqual([...proto.materialize().keys()]);

    const hills = deriveDialect(
      north,
      {
        id: "test.hills",
        parent: "test.north",
        soundChanges: [{ key: "s>š", from: ["s"], to: ["š"] }],
      },
      ctx(),
    );
    expect(hills.tokensOf("m:star")).toEqual(["š", "a", "l", "a"]);
    expect(proto.tokensOf("m:star")).toEqual(["t", "a", "l", "a"]);
  });

  it("inherits or overrides orthography and applies morphology only locally", () => {
    const proto = syntheticLexicon();
    const rule = { key: "plural", operation: "suffix" as const, tokens: ["i"] };
    const dialect = deriveDialect(
      proto,
      {
        id: "test.plural",
        parent: "test.proto",
        soundChanges: [],
        morphology: [rule],
        orthography: {
          id: "test.plain",
          mappings: [...identity.mappings, { from: "š", to: "s" }],
          unknown: "preserve",
        },
      },
      ctx(),
    );
    expect(dialect.inflect(dialect.formOf("m:star"), "plural")).toBe("Talai");
    expect(() => dialect.inflect("X", "unknown")).toThrow(/unknown morphology/);
    const child = deriveDialect(
      dialect,
      { id: "test.child", parent: "test.plural", soundChanges: [] },
      ctx(),
    );
    expect(() => child.inflect("X", "plural")).toThrow(/unknown morphology/);
  });

  it("rejects using a plain Lexicon or a cycle as parent", () => {
    const plain = {
      cultureId: "x",
      formOf: () => "x",
      byClass: () => [],
      materialize: () => new Map(),
    };
    expect(() =>
      deriveDialect(
        plain as unknown as TokenLexicon,
        { id: "d", parent: "x", soundChanges: [] },
        ctx(),
      ),
    ).toThrow(/TokenLexicon/i);
    // Direct self-parenting is rejected.
    const cycle: DialectData = { id: "test.self", parent: "test.self", soundChanges: [] };
    expect(() => deriveDialect(syntheticLexicon(), cycle, ctx())).toThrow(/cycle/i);
    // A daughter whose id matches its parent's id is also a cycle.
    const d = deriveDialect(
      syntheticLexicon(),
      { id: "test.daughter", parent: "test.proto", soundChanges: [] },
      ctx(),
    );
    expect(() =>
      deriveDialect(d, { id: "test.proto", parent: "test.daughter", soundChanges: [] }, ctx()),
    ).toThrow(/cycle/i);
  });
});

describe("buildTokenLexicon", () => {
  const culture = defineCulture({
    id: "test.token-culture",
    glyphs: { ...archetypes.flowing, classes: { C: ["t", "k"], V: ["a", "i"] } } as GlyphSystem,
    meaningPacks: [],
    templates: { given: [[{ kind: "literal", form: "A", translation: "a" }, 1]] },
  });

  it("retains generated tokens and matches buildLexicon output exactly", async () => {
    const a = buildTokenLexicon(culture, ctx());
    const b = buildLexicon(culture, ctx());
    expect(a.formOf("anything")).toBe(b.formOf("anything"));
    expect(a.tokensOf("anything").join("")).toMatch(/^[A-Za-z]/);
  });
});

describe("language families", () => {
  it("produces daughter cultures with cognates for shared meanings", () => {
    const proto = syntheticLexicon();
    const family = languageFamily(
      proto,
      [
        { id: "test.north", soundChanges: [{ key: "t>s", from: ["t"], to: ["s"] }] },
        { id: "test.south", soundChanges: [{ key: "k>č", from: ["k"], to: ["č"] }] },
      ],
      ctx(),
    );
    expect(family.map((d) => d.cultureId)).toEqual(["test.north", "test.south"]);
    expect(family[0]!.formOf("m:star")).toBe("Sala");
    expect(family[1]!.formOf("m:stone")).toBe("Čata");
    expect(family[0]!.cognatesWith(family[1]!, "m:star")).toBe(false);
    expect(family[0]!.cognatesWith(family[1]!, "m:river")).toBe(true);
  });

  it("deriveDialectFromCulture builds a daughter culture from a culture object", () => {
    const culture = defineCulture({
      id: "test.proto-culture",
      glyphs: { ...archetypes.flowing, classes: { C: ["t", "k"], V: ["a", "i"] } } as GlyphSystem,
      meaningPacks: [],
      templates: { given: [[{ kind: "literal", form: "A", translation: "a" }, 1]] },
    });
    const daughter = deriveDialectFromCulture(
      culture,
      {
        id: "test.daughter",
        parent: "test.proto-culture",
        soundChanges: [{ key: "t>s", from: ["t"], to: ["s"] }],
      },
      ctx(),
    );
    expect(daughter.cultureId).toBe("test.daughter");
    expect(daughter.formOf("m:any")).toMatch(/^[STKAI]/);
  });
});

describe("morphology helpers", () => {
  it("plural, genitive, demonym and adjective-from-place", () => {
    expect(plural("Velmar")).toBe("Velmari");
    expect(plural("tal")).toBe("tali");
    expect(genitive("Velmar")).toBe("Velmaris");
    expect(demonym("Velmar")).toBe("Velmari");
    expect(adjectiveFromPlace("Velmar")).toBe("Velmaric");
    expect(inflect("Velmar", { key: "dative", operation: "suffix", tokens: ["u"] })).toBe("Velmaru");
    expect(inflect("Velmar", { key: "prefix", operation: "prefix", tokens: ["an"] })).toBe("anVelmar");
  });
});
