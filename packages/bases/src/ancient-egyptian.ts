import { basePack, cultureFor } from "./registry.js";
import { defineBase, literal, pick } from "./define.js";
import type { BaseData } from "@lexiconlang/packs";

/**
 * Ancient Egyptian-inspired base: romanized sound palette. Fictional, simplified; not a linguistic reference. No pharaoh, deity or tomb names ship.
 */
export const ancientEgyptian: BaseData = defineBase({
  slug: "ancient-egyptian",
  inspiredBy: "Ancient Egyptian (romanized transliteration)",
  scope: "Phonotactics and name shapes inspired by Ancient Egyptian romanization; consonantal frames with vowels supplied for pronounceability; deliberate simplifications. No pharaoh or deity names ship.",
  glyphs: {
    classes: { C: ["b", "d", "f", "g", "h", "k", "kh", "m", "n", "p", "q", "r", "s", "sh", "t", "th", "w", "y", "z"], V: ["a", "e", "i", "o", "u", "aa", "ii", "uu"] },
    syllables: [["C V", 4], ["C V C", 3], ["V C", 2], ["C V V", 1]],
    wordShapes: [["1", 2], ["2", 3], ["1-2", 1]],
    constraints: [{"pattern":["C","C","C"],"rule":"forbid"}],
  },
  orthography: {
    id: "ancient-egyptian-latin",
    mappings: [{ from: "kh", to: "ḵ" }, { from: "th", to: "ṯ" }, { from: "sh", to: "š" }],
    unknown: "preserve",
  },
  romanization: {
    id: "ancient-egyptian-roman",
    mappings: [{ from: "ḵ", to: "kh" }, { from: "ṯ", to: "th" }, { from: "š", to: "sh" }],
    unknown: "preserve",
  },
  templates: {
    given: [
      literal("Nefer-menu", "fictional given-name placeholder"),
      literal("Seneb-hat", "fictional given-name placeholder"),
      {
        value: {
          kind: "compose",
          parts: [pick("noun", { tag: "virtue", capitalize: true }), pick("noun", { tag: "nature" })],
          sep: "-",
        },
        weight: 2,
      },
    ],
  },
  nameStructures: {
    "ancient-egyptian.given-only": {
      id: "given-only",
      slots: [{"key":"given","role":"given","source":{"type":"kind","kind":"given"}}],
      separator: " ",
    },
  },
});

export const culture = cultureFor(ancientEgyptian);
export const pack = basePack(ancientEgyptian);
export const rawData = ancientEgyptian;
export default ancientEgyptian;
