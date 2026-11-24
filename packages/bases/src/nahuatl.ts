import { basePack, cultureFor } from "./registry.js";
import { defineBase, literal, pick } from "./define.js";
import type { BaseData } from "@lexiconlang/packs";

/**
 * Classical Nahuatl-inspired base: romanized sound palette. Fictional, simplified; not a linguistic reference. No deity or historical-person names ship.
 */
export const nahuatl: BaseData = defineBase({
  slug: "nahuatl",
  inspiredBy: "Classical Nahuatl (romanized)",
  scope: "Phonotactics and name shapes inspired by Classical Nahuatl; agglutinative shapes and tl/stl clusters; deliberate simplifications. No historical-person or deity names ship.",
  glyphs: {
    classes: { C: ["b", "ch", "h", "k", "l", "m", "n", "p", "s", "t", "tl", "ts", "w", "x", "y", "z"], V: ["a", "e", "i", "o", "u", "aa", "ee", "ii", "oo", "uu"] },
    syllables: [["C V", 4], ["C V C", 2], ["V", 2], ["C C V", 1]],
    wordShapes: [["1", 2], ["2", 3], ["1-2", 1]],
    constraints: [{"pattern":["C","C","C"],"rule":"forbid"}],
  },
  orthography: {
    id: "nahuatl-latin",
    mappings: [{ from: "tl", to: "ƛ" }, { from: "kw", to: "kʷ" }],
    unknown: "preserve",
  },
  romanization: {
    id: "nahuatl-roman",
    mappings: [{ from: "ƛ", to: "tl" }, { from: "kʷ", to: "kw" }],
    unknown: "preserve",
  },
  templates: {
    given: [
      literal("Xochimil", "fictional given-name placeholder"),
      literal("Temal", "fictional given-name placeholder"),
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
    "nahuatl.given-only": {
      id: "given-only",
      slots: [{"key":"given","role":"given","source":{"type":"kind","kind":"given"}}],
      separator: " ",
    },
  },
});

export const culture = cultureFor(nahuatl);
export const pack = basePack(nahuatl);
export const rawData = nahuatl;
export default nahuatl;
