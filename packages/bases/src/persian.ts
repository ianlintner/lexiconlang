import { basePack, cultureFor } from "./registry.js";
import { defineBase, literal, pick } from "./define.js";
import type { BaseData } from "@lexiconlang/packs";

/**
 * New Persian-inspired base: romanized sound palette. Fictional, simplified; not a linguistic reference. No historical-person names ship.
 */
export const persian: BaseData = defineBase({
  slug: "persian",
  inspiredBy: "New Persian (romanized)",
  scope: "Phonotactics and name shapes inspired by New Persian; long vowels, elegant consonant frames; deliberate simplifications.",
  glyphs: {
    classes: { C: ["b", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "z", "sh", "ch", "gh", "kh"], V: ["a", "e", "i", "o", "u", "aa", "ee", "oo", "ai", "au"] },
    syllables: [["C V", 4], ["C V C", 3], ["C V V", 2], ["V C", 1]],
    wordShapes: [["1", 2], ["2", 3], ["1-2", 1]],
    constraints: [{"pattern":["C","C","C"],"rule":"forbid"}],
  },
  orthography: {
    id: "persian-latin",
    mappings: [{ from: "sh", to: "š" }, { from: "gh", to: "ġ" }, { from: "aa", to: "ā" }, { from: "oo", to: "ō" }],
    unknown: "preserve",
  },
  romanization: {
    id: "persian-roman",
    mappings: [{ from: "š", to: "sh" }, { from: "ġ", to: "gh" }, { from: "ā", to: "aa" }, { from: "ō", to: "oo" }],
    unknown: "preserve",
  },
  templates: {
    given: [
      literal("Ardestan", "fictional given-name placeholder"),
      literal("Shiravar", "fictional given-name placeholder"),
      {
        value: {
          kind: "compose",
          parts: [pick("noun", { tag: "virtue", capitalize: true }), pick("noun", { tag: "nature" })],
          sep: "",
        },
        weight: 2,
      },
    ],
    nasab: [{ value: { kind: "compose", parts: [pick("noun", { tag: "family", capitalize: true }), { literal: "i", translation: "of" }], sep: "" }, weight: 1 }],
  },
  nameStructures: {
    "persian.nasab": {
      id: "nasab",
      slots: [{"key":"given","role":"given","source":{"type":"kind","kind":"given"}},{"key":"nasab","role":"nasab","source":{"type":"kind","kind":"nasab"},"prefix":" "}],
      separator: " ",
    },
  },
});

export const culture = cultureFor(persian);
export const pack = basePack(persian);
export const rawData = persian;
export default persian;
