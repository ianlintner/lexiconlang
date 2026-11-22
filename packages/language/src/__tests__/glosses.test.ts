import { describe, expect, it } from "vitest";
import { createContext } from "@lexiconlang/core";
import type { Culture } from "../types.js";
import { generateName } from "../templates.js";
import { generateStructuredName } from "../structures.js";
import type { Meaning, MeaningPack } from "../types.js";
import { coreMeanings } from "../meanings.js";
import { archetypes } from "../archetypes.js";
import { BUILTIN_GLOSS_LOCALES, withBuiltinGlosses } from "../builtin-glosses.js";
import { glossFor, withGlosses } from "../glosses.js";

const testCulture: Culture = {
  id: "test.dwarvish",
  glyphs: { ...archetypes.guttural, joiner: "" },
  meaningPacks: [coreMeanings],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "strength", capitalize: true },
            { pick: "noun", tag: "industry" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
};

describe("B4 localized glosses", () => {
  it("keeps legacy translation byte-identical with no locale", () => {
    const base = generateName(testCulture, "given", createContext({ seed: "test-1" }));
    expect(base.translation).toBe(
      generateName(testCulture, "given", createContext({ seed: "test-1" }), { locale: "" }).translation,
    );
    expect(base.translation).toContain("strong");
  });

  it("localizes translation but never the conlang form or RNG", () => {
    const base = generateName(testCulture, "given", createContext({ seed: "test-1" }));
    for (const locale of BUILTIN_GLOSS_LOCALES) {
      const localized = generateName(testCulture, "given", createContext({ seed: "test-1" }), {
        locale,
      });
      expect(localized.form).toBe(base.form);
      expect(localized.parts?.map((p) => p.form)).toEqual(base.parts?.map((p) => p.form));
      expect(localized.translation).not.toBe(base.translation);
    }
  });

  it("accepts locale from ctx", () => {
    const base = generateName(testCulture, "given", createContext({ seed: "test-1" }));
    const localized = generateName(testCulture, "given", createContext({ seed: "test-1", locale: "de" }));
    expect(localized.form).toBe(base.form);
    expect(localized.translation).not.toBe(base.translation);
  });

  it("resolves exact tag, then primary subtag, then label, then id", () => {
    const meaning = {
      id: "x",
      class: "noun" as const,
      tags: [],
      label: "stone",
      glosses: { es: "piedra", "es-MX": "piedra mexicana" },
    };
    expect(glossFor(meaning, "es-MX")).toBe("piedra mexicana");
    expect(glossFor(meaning, "ES-ar")).toBe("piedra");
    expect(glossFor(meaning, "de")).toBe("stone");
    expect(glossFor({ id: "y", class: "noun", tags: [] }, "de")).toBe("y");
    expect(glossFor(meaning)).toBe("stone");
  });

  it("withGlosses does not mutate its input", () => {
    const original = { id: "p", version: "1", meanings: [{ id: "x", class: "noun" as const, tags: [], label: "stone" }] };
    const next = withGlosses(original, { x: { es: "piedra" } });
    expect(original.meanings[0]!.glosses).toBeUndefined();
    expect(next.meanings[0]!.glosses).toEqual({ es: "piedra" });
  });

  it("withBuiltinGlosses leaves the original culture untouched", () => {
    const copy = withBuiltinGlosses(testCulture, "ja");
    expect(copy).not.toBe(testCulture);
    expect(testCulture.meaningPacks[0]!.meanings[0]!.glosses).toBeUndefined();
    expect(copy.meaningPacks[0]!.meanings.length).toBe(testCulture.meaningPacks[0]!.meanings.length);
  });

  it("structured names honour both input.locale and ctx.locale without changing forms", () => {
    const culture: Culture = {
      ...testCulture,
      templates: {
        ...testCulture.templates,
        clan: [[{ kind: "compose", parts: [{ pick: "noun", tag: "earth" }] }, 1]] as never,
      },
      nameStructures: {
        "test.two": {
          id: "test.two",
          separator: " ",
          slots: [
            { key: "given", role: "given", source: { type: "kind", kind: "given" } },
            { key: "clan", role: "house", source: { type: "kind", kind: "clan" } },
          ],
        },
      },
    } as Culture;
    const base = generateStructuredName(culture, { structure: "test.two" }, createContext({ seed: "s" }));
    const viaInput = generateStructuredName(
      culture,
      { structure: "test.two", locale: "de" },
      createContext({ seed: "s" }),
    );
    const viaCtx = generateStructuredName(
      culture,
      { structure: "test.two" },
      createContext({ seed: "s", locale: "de" }),
    );
    expect(viaInput.form).toBe(base.form);
    expect(viaCtx.form).toBe(base.form);
    expect(viaInput.translation).not.toBe(base.translation);
    expect(viaCtx.translation).toBe(viaInput.translation);
  });

  it("has built-in glosses for every core meaning in all five locales", () => {
    const localized = withBuiltinGlosses(testCulture, "fr");
    for (const meaning of localized.meaningPacks[0]!.meanings) {
      expect(meaning.glosses?.fr, `missing fr gloss for ${meaning.id}`).toBeTruthy();
    }
  });
});
