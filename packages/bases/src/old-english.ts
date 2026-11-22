import { basePack, cultureFor } from "./registry.js";
import { defineBase, literal, pick } from "./define.js";
import type { BaseData } from "@lexiconlang/packs";

/**
 * Old English-inspired base: Anglo-Saxon sound palette. Fictional, simplified; not a linguistic reference. No saint or deity names ship.
 */
export const oldEnglish: BaseData = defineBase({
  slug: "old-english",
  inspiredBy: "Old English (Anglo-Saxon, romanized)",
  scope: "Phonotactics and name shapes inspired by Old English; Germanic consonant clusters, strong vowels; deliberate simplifications.",
  glyphs: {
    classes: { C: ["b", "c", "d", "f", "g", "h", "l", "m", "n", "p", "r", "s", "t", "w", "y", "th", "st", "sc", "cg"], V: ["a", "e", "i", "o", "u", "y", "ae", "ea", "eo", "ie"] },
    syllables: [["C V", 4], ["C V C", 3], ["C C V", 2], ["V C", 1]],
    wordShapes: [["1", 2], ["2", 3], ["1-2", 1]],
    constraints: [{"pattern":["C","C","C","C"],"rule":"forbid"}],
  },
  orthography: {
    id: "old-english-latin",
    mappings: [{ from: "th", to: "þ" }, { from: "ae", to: "æ" }],
    unknown: "preserve",
  },
  romanization: {
    id: "old-english-roman",
    mappings: [{ from: "þ", to: "th" }, { from: "æ", to: "ae" }],
    unknown: "preserve",
  },
  templates: {
    given: [
      literal("Eadwulf", "fictional given-name placeholder"),
      literal("Eadwenna", "fictional given-name placeholder"),
      {
        value: {
          kind: "compose",
          parts: [pick("noun", { tag: "virtue", capitalize: true }), pick("noun", { tag: "nature" })],
          sep: "",
        },
        weight: 2,
      },
    ],
    patronymic: [{ value: { kind: "compose", parts: [pick("noun", { tag: "family", capitalize: true }), { literal: "son", translation: "son" }], sep: "" }, weight: 1 }],
  },
  nameStructures: {
    "old-english.patronymic": {
      id: "patronymic",
      slots: [{"key":"given","role":"given","source":{"type":"kind","kind":"given"}},{"key":"patronymic","role":"patronymic","source":{"type":"kind","kind":"patronymic"},"prefix":" "}],
      separator: " ",
    },
  },
});

export const culture = cultureFor(oldEnglish);
export const pack = basePack(oldEnglish);
export const rawData = oldEnglish;
export default oldEnglish;
