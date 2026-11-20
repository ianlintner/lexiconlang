import { describe, it, expect } from "vitest";
import { createContext } from "@lexiconlang/core";
import {
  archetypes,
  builtinWordClasses,
  buildLexicon,
  coreMeanings,
  defineCulture,
  generateName,
  generateStructuredName,
  isBuiltinWordClass,
  type Culture,
  type GlyphSystem,
  type MeaningPack,
} from "../index.js";

// ─── Fixtures ────────────────────────────────────────────────────────────

/** A culture that declares custom (non-built-in) name kinds. */
const harbor = defineCulture({
  id: "test.harbor",
  glyphs: { ...archetypes.flowing, joiner: "" } as GlyphSystem,
  meaningPacks: [coreMeanings],
  templates: {
    given: [[{ kind: "literal", form: "Mina", translation: "mina" }, 1]],
    ship: [[{ kind: "literal", form: "Quiet Wake", translation: "quiet wake" }, 1]],
    tavern: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "society", capitalize: true },
            { pick: "noun", tag: "earth" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    deity: [[{ kind: "literal", form: "Ulmara", translation: "ulmara" }, 1]],
    guild: [[{ kind: "literal", form: "Saltbinders", translation: "salt binders" }, 1]],
    title: [[{ kind: "literal", form: "Harbourmaster", translation: "harbour master" }, 1]],
    epithet: [[{ kind: "literal", form: "the Bold", translation: "the bold" }, 1]],
  },
});

const classifierPack: MeaningPack = {
  id: "test.classifiers",
  version: "1.0.0",
  meanings: [
    { id: "vessel", class: "classifier", tags: ["water"], label: "vessel" },
    { id: "cargo", class: "classifier", tags: ["trade"], label: "cargo" },
  ],
};

describe("open name kinds", () => {
  it("generates a name for every declared kind, built-in or custom", () => {
    const ctx = createContext({ seed: "harbor-1" });
    const kinds = ["given", "ship", "tavern", "deity", "guild", "title", "epithet"] as const;
    for (const kind of kinds) {
      const name = generateName(harbor, kind, ctx);
      expect(name.form.length).toBeGreaterThan(0);
      expect(name.translation.length).toBeGreaterThan(0);
      expect(name.language).toBe("test.harbor");
    }
  });

  it("renders a custom kind through the normal template pipeline", () => {
    const name = generateName(harbor, "ship", createContext({ seed: "harbor-1" }));
    expect(name.form).toBe("Quiet Wake");
    expect(name.translation).toBe("quiet wake");
  });

  it("throws a clear error for an undeclared kind", () => {
    const ctx = createContext({ seed: "harbor-1" });
    // @ts-expect-error "airship" is not declared by this culture
    expect(() => generateName(harbor, "airship", ctx)).toThrow(
      /No templates for airship in culture test\.harbor/,
    );
  });

  it("still accepts a plain `Culture` annotation with custom kinds", () => {
    const annotated: Culture = {
      id: "test.annotated",
      glyphs: { ...archetypes.clipped, joiner: "" } as GlyphSystem,
      meaningPacks: [coreMeanings],
      templates: {
        given: [[{ kind: "literal", form: "Zed", translation: "zed" }, 1]],
        spaceStation: [[{ kind: "literal", form: "Kappa Deck", translation: "kappa deck" }, 1]],
      },
    };
    expect(generateName(annotated, "spaceStation", createContext({ seed: "s" })).form).toBe(
      "Kappa Deck",
    );
  });
});

describe("extensible word classes", () => {
  const classifierCulture = defineCulture({
    id: "test.classifiers",
    glyphs: { ...archetypes.flowing, joiner: "" } as GlyphSystem,
    meaningPacks: [coreMeanings, classifierPack],
    wordClasses: [
      { id: "classifier", label: "Classifier", description: "Measure word for vessels and cargo" },
    ],
    templates: {
      given: [
        [
          {
            kind: "compose",
            parts: [
              { pick: "classifier", tag: "water" },
              { pick: "noun", tag: "water" },
            ],
            sep: "-",
            transSep: "-",
          },
          1,
        ],
      ],
    },
  });

  it("keeps the four built-in classes", () => {
    expect(builtinWordClasses).toEqual(["noun", "adjective", "verb", "particle"]);
    expect(isBuiltinWordClass("noun")).toBe(true);
    expect(isBuiltinWordClass("classifier")).toBe(false);
  });

  it("picks meanings of a pack-declared class in templates", () => {
    const name = generateName(classifierCulture, "given", createContext({ seed: "c-1" }));
    expect(name.translation.startsWith("vessel-") || name.translation.startsWith("cargo-")).toBe(
      true,
    );
  });

  it("exposes pack-declared classes through byClass", () => {
    const lexicon = buildLexicon(classifierCulture, createContext({ seed: "c-1" }));
    expect(lexicon.byClass("classifier").map((m) => m.id).sort()).toEqual(["cargo", "vessel"]);
    expect(lexicon.byClass("classifier", "water").map((m) => m.id)).toEqual(["vessel"]);
    expect(lexicon.byClass("noun", "water").length).toBeGreaterThan(0);
  });
});

describe("opt-in gender", () => {
  const gendered = defineCulture({
    id: "test.gendered",
    glyphs: { ...archetypes.flowing, joiner: "" } as GlyphSystem,
    meaningPacks: [coreMeanings],
    templates: {
      given: [[{ kind: "literal", form: "Base", translation: "base" }, 1]],
    },
    genderTemplates: {
      masculine: {
        given: [[{ kind: "literal", form: "Marc", translation: "marc" }, 1]],
      },
      feminine: {
        given: [[{ kind: "literal", form: "Fara", translation: "fara" }, 1]],
      },
      any: {
        given: [[{ kind: "literal", form: "Anon", translation: "anon" }, 1]],
      },
    },
  });

  it("leaves the default path untouched when no gender is requested", () => {
    expect(generateName(gendered, "given", createContext({ seed: "g-1" })).form).toBe("Base");
    expect(
      generateName(gendered, "given", createContext({ seed: "g-1" }), {}).form,
    ).toBe("Base");
    expect(
      generateName(gendered, "given", createContext({ seed: "g-1" }), { gender: undefined }).form,
    ).toBe("Base");
  });

  it("uses the gendered pool when one is declared", () => {
    expect(
      generateName(gendered, "given", createContext({ seed: "g-1" }), { gender: "masculine" }).form,
    ).toBe("Marc");
    expect(
      generateName(gendered, "given", createContext({ seed: "g-1" }), { gender: "feminine" }).form,
    ).toBe("Fara");
  });

  it("falls back to the base pool when the gender declares no pool", () => {
    expect(
      generateName(gendered, "given", createContext({ seed: "g-1" }), { gender: "neutral" }).form,
    ).toBe("Base");
  });

  it("uses `any`'s own pool verbatim, never a concatenation", () => {
    expect(
      generateName(gendered, "given", createContext({ seed: "g-1" }), { gender: "any" }).form,
    ).toBe("Anon");
  });

  it("is stable for the same seed and gender, and independent of call order", () => {
    const first = generateName(gendered, "given", createContext({ seed: "g-1" }), {
      gender: "feminine",
    });
    const second = generateName(gendered, "given", createContext({ seed: "g-1" }), {
      gender: "feminine",
    });
    expect(first.form).toBe(second.form);
    expect(first.translation).toBe(second.translation);
  });

  it("keeps the existing male/female generator IDs untouched", () => {
    // The legacy APIs never pass a gender, so they still resolve the base pool.
    const ctx = createContext({ seed: "g-1" });
    const name = generateName(gendered, "given", ctx);
    expect(name.form).toBe("Base");
  });
});

describe("structured names", () => {
  const structured = defineCulture({
    id: "test.structured",
    glyphs: { ...archetypes.flowing, joiner: "" } as GlyphSystem,
    meaningPacks: [coreMeanings],
    templates: {
      given: [[{ kind: "literal", form: "Rurik", translation: "rurik" }, 1]],
      clan: [[{ kind: "literal", form: "Stonedeep", translation: "stone deep" }, 1]],
      epithet: [[{ kind: "literal", form: "the Bold", translation: "the bold" }, 1]],
      title: [[{ kind: "literal", form: "Thane", translation: "thane" }, 1]],
    },
    nameStructures: {
      "test.family-first": {
        id: "test.family-first",
        separator: " ",
        slots: [
          { key: "clan", role: "house", source: { type: "kind", kind: "clan" } },
          { key: "given", role: "given", source: { type: "kind", kind: "given" } },
          {
            key: "patronymic",
            role: "patronymic",
            source: { type: "input", field: "patronymic" },
            optional: true,
            prefix: "son of ",
          },
          {
            key: "epithet",
            role: "epithet",
            source: { type: "kind", kind: "epithet" },
          },
        ],
      },
      // Same slots, reversed declaration order — the child-keyed sub-rolls must
      // make every shared component identical.
      "test.given-first": {
        id: "test.given-first",
        separator: " ",
        slots: [
          { key: "epithet", role: "epithet", source: { type: "kind", kind: "epithet" } },
          { key: "given", role: "given", source: { type: "kind", kind: "given" } },
          { key: "clan", role: "house", source: { type: "kind", kind: "clan" } },
        ],
      },
      "test.no-slots": { id: "test.no-slots", slots: [] },
      "test.dupe": {
        id: "test.dupe",
        slots: [
          { key: "given", role: "given", source: { type: "kind", kind: "given" } },
          { key: "given", role: "given", source: { type: "kind", kind: "given" } },
        ],
      },
      "test.bad-order": {
        id: "test.bad-order",
        order: ["given", "missing"],
        slots: [
          { key: "given", role: "given", source: { type: "kind", kind: "given" } },
          { key: "clan", role: "house", source: { type: "kind", kind: "clan" } },
        ],
      },
      "test.reordered": {
        id: "test.reordered",
        order: ["given", "clan"],
        slots: [
          { key: "clan", role: "house", source: { type: "kind", kind: "clan" } },
          { key: "given", role: "given", source: { type: "kind", kind: "given" } },
        ],
      },
      "test.required-input": {
        id: "test.required-input",
        slots: [
          {
            key: "patronymic",
            role: "patronymic",
            source: { type: "input", field: "patronymic" },
            prefix: "son of ",
          },
        ],
      },
      "test.bad-source": {
        id: "test.bad-source",
        slots: [
          { key: "given", role: "given", source: { type: "kind", kind: "given" } },
          {
            key: "typo",
            role: "patronymic",
            // Deliberate typo: not a valid source type.
            source: { type: "inptu", field: "patronymic" } as never,
            optional: true,
          },
        ],
      },
      "test.proto-input": {
        id: "test.proto-input",
        slots: [
          { key: "given", role: "given", source: { type: "kind", kind: "given" } },
          {
            key: "proto",
            role: "patronymic",
            source: { type: "input", field: "constructor" },
            optional: true,
            prefix: "of ",
          },
        ],
      },
    },
  });

  it("renders a family-first name with an optional patronymic", () => {
    const withPatronymic = generateStructuredName(
      structured,
      {
        structure: "test.family-first",
        values: {
          patronymic: { form: "Durin", translation: "durin", language: "test.structured" },
        },
      },
      createContext({ seed: "s-1" }),
    );

    expect(withPatronymic.form).toBe("Stonedeep Rurik son of Durin the Bold");
    expect(withPatronymic.translation).toBe("stone deep rurik son of durin the bold");
    expect(withPatronymic.structure).toBe("test.family-first");
    expect(withPatronymic.components.map((c) => c.key)).toEqual([
      "clan",
      "given",
      "patronymic",
      "epithet",
    ]);
    expect(withPatronymic.components.map((c) => c.role)).toEqual([
      "house",
      "given",
      "patronymic",
      "epithet",
    ]);
  });

  it("drops an absent optional input along with its affixes", () => {
    const name = generateStructuredName(
      structured,
      { structure: "test.family-first" },
      createContext({ seed: "s-1" }),
    );

    expect(name.form).toBe("Stonedeep Rurik the Bold");
    expect(name.form).not.toContain("son of");
    expect(name.components.map((c) => c.key)).toEqual(["clan", "given", "epithet"]);
    expect(name.parts?.length).toBe(3);
  });

  it("keeps component values and the full name consistent", () => {
    const name = generateStructuredName(
      structured,
      { structure: "test.family-first" },
      createContext({ seed: "s-2" }),
    );
    expect(name.components.map((c) => c.value.form).join(" ")).toBe(name.form);
    expect(name.components.map((c) => c.value.translation).join(" ")).toBe(name.translation);
  });

  it("assigns each component a kind-addressed sub-roll independent of siblings", () => {
    const first = generateStructuredName(
      structured,
      { structure: "test.family-first" },
      createContext({ seed: "s-3" }),
    );
    const reversed = generateStructuredName(
      structured,
      { structure: "test.given-first" },
      createContext({ seed: "s-3" }),
    );

    const valueOf = (name: typeof first, key: string): string =>
      name.components.find((c) => c.key === key)!.value.form;

    expect(valueOf(reversed, "given")).toBe(valueOf(first, "given"));
    expect(valueOf(reversed, "clan")).toBe(valueOf(first, "clan"));
    expect(valueOf(reversed, "epithet")).toBe(valueOf(first, "epithet"));
  });

  it("is deterministic for a given seed", () => {
    const a = generateStructuredName(
      structured,
      { structure: "test.family-first" },
      createContext({ seed: "s-4" }),
    );
    const b = generateStructuredName(
      structured,
      { structure: "test.family-first" },
      createContext({ seed: "s-4" }),
    );
    expect(a.form).toBe(b.form);
    expect(String(a)).toBe(a.form);
  });

  it("honours an explicit order", () => {
    const name = generateStructuredName(
      structured,
      { structure: "test.reordered" },
      createContext({ seed: "s-5" }),
    );
    expect(name.components.map((c) => c.key)).toEqual(["given", "clan"]);
  });

  it("threads gender into kind slots", () => {
    const name = generateStructuredName(
      structured,
      { structure: "test.given-first", gender: "feminine" },
      createContext({ seed: "s-6" }),
    );
    // No feminine pool is declared, so the base pool is used.
    expect(name.form).toContain("Rurik");
  });

  it("rejects an unknown structure", () => {
    expect(() =>
      generateStructuredName(structured, { structure: "nope" }, createContext({ seed: "s" })),
    ).toThrow(/No name structure "nope"/);
  });

  it("rejects a malformed structure before consuming RNG", () => {
    expect(() =>
      generateStructuredName(structured, { structure: "test.no-slots" }, createContext({ seed: "s" })),
    ).toThrow(/declares no slots/);
    expect(() =>
      generateStructuredName(structured, { structure: "test.dupe" }, createContext({ seed: "s" })),
    ).toThrow(/Duplicate name slot key/);
    expect(() =>
      generateStructuredName(
        structured,
        { structure: "test.bad-order" },
        createContext({ seed: "s" }),
      ),
    ).toThrow(/orders unknown slot/);
  });

  it("rejects an unknown slot source type instead of dropping the component", () => {
    expect(() =>
      generateStructuredName(
        structured,
        { structure: "test.bad-source" },
        createContext({ seed: "s" }),
      ),
    ).toThrow(/unknown source type "inptu"/);
  });

  it("uses own-property lookups for structures, kinds and input fields", () => {
    const ctx = () => createContext({ seed: "s" });

    // Inherited Object.prototype keys are not structures.
    expect(() => generateStructuredName(structured, { structure: "constructor" }, ctx())).toThrow(
      /No name structure "constructor"/,
    );
    expect(() => generateName(structured, "constructor" as never, ctx())).toThrow(
      /No templates for constructor/,
    );
    expect(() =>
      generateName(structured, "toString" as never, ctx(), { gender: "masculine" }),
    ).toThrow(/No templates for toString/);

    // An absent optional input named "constructor" is simply omitted.
    const omitted = generateStructuredName(structured, { structure: "test.proto-input", values: {} }, ctx());
    expect(omitted.form).toBe("Rurik");
    expect(omitted.components.map((c) => c.key)).toEqual(["given"]);

    // An explicitly declared prototype-named key is honoured.
    const declared = generateStructuredName(
      structured,
      {
        structure: "test.proto-input",
        values: {
          ["constructor"]: { form: "Anna", translation: "anna", language: "l" },
        },
      },
      ctx(),
    );
    expect(declared.form).toBe("Rurik of Anna");
  });

  it("rejects a missing required input and a malformed input value", () => {
    expect(() =>
      generateStructuredName(
        structured,
        { structure: "test.required-input" },
        createContext({ seed: "s" }),
      ),
    ).toThrow(/Missing required input "patronymic"/);

    expect(() =>
      generateStructuredName(
        structured,
        {
          structure: "test.required-input",
          values: { patronymic: { form: 1 as unknown as string, translation: "x", language: "l" } },
        },
        createContext({ seed: "s" }),
      ),
    ).toThrow(/must be a TranslatedName/);
  });
});
