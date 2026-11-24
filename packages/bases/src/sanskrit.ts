import { basePack, cultureFor } from "./registry.js";
import { defineBase, literal, pick } from "./define.js";
import type { BaseData } from "@lexiconlang/packs";

/**
 * Sanskrit-inspired base: romanized sound palette. Fictional, simplified; not a linguistic reference. No Vedic deity or scripture names ship.
 */
export const sanskrit: BaseData = defineBase({
  slug: "sanskrit",
  inspiredBy: "Sanskrit (romanized transliteration)",
  scope: "Phonotactics and name shapes inspired by Sanskrit; long vowel contrasts and aspirated stops; deliberate simplifications. No Vedic deity names ship.",
  glyphs: {
    classes: { C: ["b", "bh", "c", "ch", "d", "dh", "g", "gh", "h", "j", "k", "kh", "l", "m", "n", "p", "ph", "r", "s", "sh", "t", "th", "v", "y"], V: ["a", "aa", "i", "ii", "u", "uu", "e", "ai", "o", "au"] },
    syllables: [["C V", 4], ["C V C", 2], ["C C V", 2], ["V", 1]],
    wordShapes: [["1", 2], ["2", 3], ["1-2", 1]],
    constraints: [{"pattern":["C","C","C","C"],"rule":"forbid"}],
  },
  orthography: {
    id: "sanskrit-latin",
    mappings: [{ from: "aa", to: "ā" }, { from: "ii", to: "ī" }, { from: "uu", to: "ū" }, { from: "sh", to: "ś" }],
    unknown: "preserve",
  },
  romanization: {
    id: "sanskrit-roman",
    mappings: [{ from: "ā", to: "aa" }, { from: "ī", to: "ii" }, { from: "ū", to: "uu" }, { from: "ś", to: "sh" }],
    unknown: "preserve",
  },
  templates: {
    given: [
      literal("Arjavira", "fictional given-name placeholder"),
      literal("Kausalindi", "fictional given-name placeholder"),
      {
        value: {
          kind: "compose",
          parts: [pick("noun", { tag: "virtue", capitalize: true }), pick("noun", { tag: "nature" })],
          sep: "",
        },
        weight: 2,
      },
    ],
    patronymic: [{ value: { kind: "compose", parts: [pick("noun", { tag: "family", capitalize: true }), { literal: "putra", translation: "child" }], sep: "" }, weight: 1 }],
  },
  nameStructures: {
    "sanskrit.patronymic": {
      id: "patronymic",
      slots: [{"key":"given","role":"given","source":{"type":"kind","kind":"given"}},{"key":"patronymic","role":"patronymic","source":{"type":"kind","kind":"patronymic"},"prefix":" "}],
      separator: " ",
    },
  },
});

export const culture = cultureFor(sanskrit);
export const pack = basePack(sanskrit);
export const rawData = sanskrit;
export default sanskrit;
