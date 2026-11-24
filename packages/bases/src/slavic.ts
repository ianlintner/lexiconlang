import { basePack, cultureFor } from "./registry.js";
import { defineBase, literal, pick } from "./define.js";
import type { BaseData } from "@lexiconlang/packs";

/**
 * Old East Slavic-inspired base: medieval East Slavic sound palette.
 * Fictional, simplified; not a linguistic reference. No saint or deity names ship.
 */
export const slavic: BaseData = defineBase({
  slug: "slavic",
  inspiredBy: "Old East Slavic (medieval East Slavic, romanized)",
  scope: "Phonotactics and name shapes inspired by Old East Slavic; soft/hard consonant pairs, rich vowels; deliberate simplifications.",
  glyphs: {
    classes: {
      C: ["b", "v", "g", "d", "z", "zh", "k", "l", "m", "n", "p", "r", "s", "t", "f", "kh", "ts", "ch", "sh", "shch"],
      V: ["a", "e", "i", "o", "u", "y", "ia", "ie", "ai", "ei"],
    },
    syllables: [["C V", 4], ["C V C", 3], ["V C", 2], ["C C V", 1]],
    wordShapes: [["1", 2], ["2", 3], ["1-2", 1]],
    constraints: [{ pattern: ["C", "C", "C"], rule: "forbid" }],
    joiner: "",
  },
  orthography: {
    id: "slavic-latin",
    mappings: [
      { from: "kh", to: "х" },
      { from: "zh", to: "ж" },
      { from: "shch", to: "щ" },
      { from: "sh", to: "ш" },
      { from: "ch", to: "ч" },
      { from: "ts", to: "ц" },
    ],
    unknown: "preserve",
  },
  romanization: {
    id: "slavic-roman",
    mappings: [
      { from: "щ", to: "shch" },
      { from: "ж", to: "zh" },
      { from: "ш", to: "sh" },
      { from: "ч", to: "ch" },
      { from: "ц", to: "ts" },
      { from: "х", to: "kh" },
    ],
    unknown: "preserve",
  },
  templates: {
    given: [
      literal("Veselimir", "fictional given-name placeholder"),
      literal("Dobroslava", "fictional given-name placeholder"),
      {
        value: {
          kind: "compose",
          parts: [pick("adjective", { tag: "virtue", capitalize: true }), pick("noun", { tag: "nature" })],
          sep: "",
        },
        weight: 2,
      },
    ],
    patronymic: [
      {
        value: {
          kind: "compose",
          parts: [
            pick("noun", { tag: "family", capitalize: true }),
            { literal: "ovich", translation: "son of" },
          ],
          sep: "",
        },
        weight: 1,
      },
    ],
    settlement: [
      {
        value: {
          kind: "compose",
          parts: [pick("noun", { tag: "nature", capitalize: true }), pick("noun", { tag: "place" })],
          sep: "",
        },
        weight: 1,
      },
    ],
  },
  nameStructures: {
    "slavic.patronymic": {
      id: "patronymic",
      slots: [
        { key: "given", role: "given", source: { type: "kind", kind: "given" } },
        { key: "patronymic", role: "patronymic", source: { type: "kind", kind: "patronymic" }, prefix: " " },
      ],
      separator: " ",
    },
  },
});

export const culture = cultureFor(slavic);
export const pack = basePack(slavic);
export const rawData = slavic;
export default slavic;
