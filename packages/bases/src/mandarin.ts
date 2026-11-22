import { basePack, cultureFor } from "./registry.js";
import { defineBase, literal, pick } from "./define.js";
import type { BaseData } from "@lexiconlang/packs";

/**
 * Mandarin pinyin-inspired base: tone marks with ASCII pinyin fallback. Fictional, simplified; not a linguistic reference or transcription system.
 */
export const mandarin: BaseData = defineBase({
  slug: "mandarin",
  inspiredBy: "Mandarin Chinese (Hanyu Pinyin, romanized)",
  scope: "Phonotactics and name shapes inspired by Mandarin pinyin; initials/finals and four tone marks with ASCII fallback; deliberate simplifications.",
  glyphs: {
    classes: { C: ["b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "zh", "ch", "sh", "r", "z", "c", "s"], V: ["a", "e", "i", "o", "u", "ai", "ei", "ao", "ou", "an", "en", "ang", "eng", "ing", "ong", "ia", "ie", "iao", "iu", "ian", "in", "iang", "iong", "ua", "uo", "uai", "ui", "uan", "un", "uang", "ueng", "ü", "üe", "üan", "ün"] },
    syllables: [["C V", 5], ["V", 2], ["C V C", 1]],
    wordShapes: [["1", 3], ["2", 1]],
    joiner: "",
  },
  orthography: {
    id: "mandarin-pinyin-tone",
    mappings: [{ from: "a", to: "ā" }, { from: "e", to: "ē" }, { from: "i", to: "ī" }, { from: "o", to: "ō" }, { from: "u", to: "ū" }, { from: "ü", to: "ǖ" }],
    unknown: "preserve",
  },
  romanization: {
    id: "mandarin-pinyin-ascii",
    mappings: [{ from: "ā", to: "a" }, { from: "ē", to: "e" }, { from: "ī", to: "i" }, { from: "ō", to: "o" }, { from: "ū", to: "u" }, { from: "ǖ", to: "ü" }],
    unknown: "preserve",
  },
  templates: {
    given: [
      literal("Lianhua", "fictional given-name placeholder"),
      literal("Mingde", "fictional given-name placeholder"),
      {
        value: {
          kind: "compose",
          parts: [pick("noun", { tag: "virtue", capitalize: true }), pick("noun", { tag: "nature" })],
          sep: "",
        },
        weight: 2,
      },
    ],
    family: [{ value: { kind: "literal", form: "Zhanliu", translation: "fictional family-name placeholder" }, weight: 1 }, { value: { kind: "literal", form: "Wenlan", translation: "fictional family-name placeholder" }, weight: 1 }],
  },
  nameStructures: {
    "mandarin.family-first": {
      id: "family-first",
      slots: [{"key":"family","role":"family","source":{"type":"kind","kind":"family"}},{"key":"given","role":"given","source":{"type":"kind","kind":"given"},"prefix":" "}],
      separator: " ",
    },
  },
});

export const culture = cultureFor(mandarin);
export const pack = basePack(mandarin);
export const rawData = mandarin;
export default mandarin;
