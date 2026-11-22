import { basePack, cultureFor } from "./registry.js";
import { defineBase, literal, pick } from "./define.js";
import type { BaseData } from "@lexiconlang/packs";

/**
 * Māori-inspired Polynesian base: CV-only phonotactics. Fictional, simplified; not a linguistic reference. No iwi, marae or deity names ship.
 */
export const polynesian: BaseData = defineBase({
  slug: "polynesian",
  inspiredBy: "Māori (romanized, Polynesian)",
  scope: "Māori-inspired fictional CV-only sound palette; open syllables and long vowels; deliberate simplifications. No iwi, marae or deity names ship.",
  glyphs: {
    classes: { C: ["h", "k", "m", "n", "p", "r", "t", "w", "ng", "wh"], V: ["a", "e", "i", "o", "u", "aa", "ee", "ii", "oo", "uu", "ae", "ai", "au", "ei", "ou"] },
    syllables: [["C V", 5], ["V", 3]],
    wordShapes: [["1", 3], ["2", 2], ["1-2", 1]],
    constraints: [{"pattern":["C","C"],"rule":"forbid"}],
  },
  orthography: {
    id: "polynesian-latin",
    mappings: [{ from: "ng", to: "ŋ" }, { from: "aa", to: "ā" }, { from: "ee", to: "ē" }, { from: "ii", to: "ī" }, { from: "oo", to: "ō" }, { from: "uu", to: "ū" }],
    unknown: "preserve",
  },
  romanization: {
    id: "polynesian-roman",
    mappings: [{ from: "ŋ", to: "ng" }, { from: "ā", to: "aa" }, { from: "ē", to: "ee" }, { from: "ī", to: "ii" }, { from: "ō", to: "oo" }, { from: "ū", to: "uu" }],
    unknown: "preserve",
  },
  templates: {
    given: [
      literal("Rangi-moana", "fictional given-name placeholder"),
      literal("Hine-kai", "fictional given-name placeholder"),
      {
        value: {
          kind: "compose",
          parts: [pick("noun", { tag: "nature", capitalize: true }), pick("noun", { tag: "nature" })],
          sep: "",
        },
        weight: 2,
      },
    ],
  },
  nameStructures: {
    "polynesian.given-only": {
      id: "given-only",
      slots: [{"key":"given","role":"given","source":{"type":"kind","kind":"given"}}],
      separator: " ",
    },
  },
});

export const culture = cultureFor(polynesian);
export const pack = basePack(polynesian);
export const rawData = polynesian;
export default polynesian;
