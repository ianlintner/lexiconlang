import { basePack, cultureFor } from "./registry.js";
import { defineBase, literal, pick } from "./define.js";
import type { BaseData } from "@lexiconlang/packs";

/**
 * Old Norse-inspired base: Viking Age / medieval Scandinavian sound palette.
 * Fictional, simplified; not a linguistic reference. No deity names shipped.
 */
export const norse: BaseData = defineBase({
  slug: "norse",
  inspiredBy: "Old Norse (Viking Age / medieval Scandinavian)",
  scope: "Phonotactics and name shapes inspired by Old Norse; clipped consonants, strong vowels; deliberate simplifications.",
  glyphs: {
    classes: {
      C: ["b", "d", "f", "g", "h", "k", "l", "m", "n", "r", "s", "t", "v", "th", "kv", "sk"],
      V: ["a", "e", "i", "o", "u", "y", "ae", "au", "ei", "o"],
    },
    syllables: [["C V", 4], ["C V C", 3], ["C C V", 1], ["V C", 2]],
    wordShapes: [["1", 2], ["2", 3], ["1-2", 1]],
    constraints: [{ pattern: ["C", "C", "C"], rule: "forbid" }],
    joiner: "",
  },
  orthography: {
    id: "norse-latin",
    mappings: [
      { from: "th", to: "þ" },
      { from: "ae", to: "æ" },
      { from: "oo", to: "ǫ" },
    ],
    unknown: "preserve",
  },
  romanization: {
    id: "norse-roman",
    mappings: [
      { from: "þ", to: "th" },
      { from: "æ", to: "ae" },
      { from: "ǫ", to: "oo" },
    ],
    unknown: "preserve",
  },
  templates: {
    given: [
      literal("Sven", "fictional given-name placeholder"),
      literal("Bjorn", "fictional given-name placeholder"),
      {
        value: {
          kind: "compose",
          parts: [pick("adjective", { tag: "strength", capitalize: true }), pick("noun", { tag: "nature" })],
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
            { literal: "son of ", translation: "son of" },
            pick("noun", { tag: "family", capitalize: true }),
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
    "norse.patronymic": {
      id: "patronymic",
      slots: [
        { key: "given", role: "given", source: { type: "kind", kind: "given" } },
        { key: "patronymic", role: "patronymic", source: { type: "kind", kind: "patronymic" }, prefix: " " },
      ],
      separator: " ",
    },
  },
});

export const culture = cultureFor(norse);
export const pack = basePack(norse);
export const rawData = norse;
export default norse;
