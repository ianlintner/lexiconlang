import { basePack, cultureFor } from "./registry.js";
import { defineBase, literal, pick } from "./define.js";
import type { BaseData } from "@lexiconlang/packs";

/**
 * Yoruba-inspired base: romanized sound palette with tone marks and ASCII fallback. Fictional, simplified; not a linguistic reference. No orisha names ship.
 */
export const yoruba: BaseData = defineBase({
  slug: "yoruba",
  inspiredBy: "Yoruba (romanized)",
  scope: "Phonotactics and name shapes inspired by Yoruba; open syllables and tonal vowels with ASCII fallback; deliberate simplifications. No orisha names ship.",
  glyphs: {
    classes: { C: ["b", "d", "f", "g", "gb", "h", "j", "k", "l", "m", "n", "p", "r", "s", "sh", "t", "w", "y"], V: ["a", "e", "i", "o", "u", "aa", "ee", "ii", "oo", "uu"] },
    syllables: [["C V", 5], ["V", 2], ["C V V", 2]],
    wordShapes: [["1", 3], ["2", 2], ["1-2", 1]],
  },
  orthography: {
    id: "yoruba-tone",
    mappings: [{ from: "a", to: "á" }, { from: "e", to: "é" }, { from: "i", to: "í" }, { from: "o", to: "ó" }, { from: "u", to: "ú" }],
    unknown: "preserve",
  },
  romanization: {
    id: "yoruba-ascii",
    mappings: [{ from: "á", to: "a" }, { from: "é", to: "e" }, { from: "í", to: "i" }, { from: "ó", to: "o" }, { from: "ú", to: "u" }],
    unknown: "preserve",
  },
  templates: {
    given: [
      literal("Daramola", "fictional given-name placeholder"),
      literal("Folajimi", "fictional given-name placeholder"),
      {
        value: {
          kind: "compose",
          parts: [pick("noun", { tag: "virtue", capitalize: true }), pick("noun", { tag: "nature" })],
          sep: "",
        },
        weight: 2,
      },
    ],
  },
  nameStructures: {
    "yoruba.given-only": {
      id: "given-only",
      slots: [{"key":"given","role":"given","source":{"type":"kind","kind":"given"}}],
      separator: " ",
    },
  },
});

export const culture = cultureFor(yoruba);
export const pack = basePack(yoruba);
export const rawData = yoruba;
export default yoruba;
