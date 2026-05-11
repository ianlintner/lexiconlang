import { describe, it, expect } from "vitest";
import { createContext } from "@lexiconlang/core";
import type { Culture } from "../types.js";
import { buildLexicon } from "../lexicon.js";
import { coreMeanings } from "../meanings.js";
import { archetypes } from "../archetypes.js";

describe("buildLexicon", () => {
  const testCulture: Culture = {
    id: "test.culture",
    glyphs: { ...archetypes.flowing } as any,
    meaningPacks: [coreMeanings],
    templates: {
      given: [
        [{ kind: "compose", parts: [{ pick: "adjective" }, { pick: "noun" }], sep: " " }, 1],
      ],
    },
  };

  it("builds a lexicon for a culture", () => {
    const ctx = createContext({ seed: "test-1" });
    const lex = buildLexicon(testCulture, ctx);
    expect(lex.cultureId).toBe("test.culture");
  });

  it("generates conlang forms for all core meanings", () => {
    const ctx = createContext({ seed: "test-1" });
    const lex = buildLexicon(testCulture, ctx);
    const forms = lex.materialize();
    expect(forms.size).toBe(coreMeanings.meanings.length);
  });

  it("is deterministic (same seed → same forms)", () => {
    const ctx1 = createContext({ seed: "test-1" });
    const lex1 = buildLexicon(testCulture, ctx1);
    const forms1 = lex1.materialize();

    const ctx2 = createContext({ seed: "test-1" });
    const lex2 = buildLexicon(testCulture, ctx2);
    const forms2 = lex2.materialize();

    expect(forms1).toEqual(forms2);
  });

  it("is order-independent (reorder meaning packs, same forms)", () => {
    const ctx = createContext({ seed: "test-1" });
    const lex1 = buildLexicon(testCulture, ctx);

    const reorderedCulture: Culture = {
      ...testCulture,
      meaningPacks: [...testCulture.meaningPacks].reverse(),
    };
    const ctx2 = createContext({ seed: "test-1" });
    const lex2 = buildLexicon(reorderedCulture, ctx2);

    // "stone" should have the same form in both
    expect(lex1.formOf("stone")).toBe(lex2.formOf("stone"));
  });

  it("caches forms", () => {
    const ctx = createContext({ seed: "test-1" });
    const lex = buildLexicon(testCulture, ctx);
    const form1 = lex.formOf("stone");
    const form2 = lex.formOf("stone");
    expect(form1).toBe(form2); // Same reference
  });

  it("byClass filters by word class", () => {
    const ctx = createContext({ seed: "test-1" });
    const lex = buildLexicon(testCulture, ctx);
    const nouns = lex.byClass("noun");
    expect(nouns.length).toBeGreaterThan(0);
    for (const n of nouns) {
      expect(n.class).toBe("noun");
    }
  });

  it("byClass with tag filters by word class and tag", () => {
    const ctx = createContext({ seed: "test-1" });
    const lex = buildLexicon(testCulture, ctx);
    const animals = lex.byClass("noun", "animal");
    expect(animals.length).toBeGreaterThan(0);
    for (const a of animals) {
      expect(a.class).toBe("noun");
      expect(a.tags).toContain("animal");
    }
  });
});
