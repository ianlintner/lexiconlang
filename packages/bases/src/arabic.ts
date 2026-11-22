import { basePack, cultureFor } from "./registry.js";
import { defineBase, literal, pick } from "./define.js";
import type { BaseData } from "@lexiconlang/packs";

/**
 * Modern Standard Arabic-inspired base (romanized). Root-and-pattern flavor
 * in templates, nasab/kunya-style structure. Fictional, simplified; not a
 * linguistic reference. No sacred names shipped.
 */
export const arabic: BaseData = defineBase({
  slug: "arabic",
  inspiredBy: "Modern Standard Arabic (romanized)",
  scope: "Emphatic-consonant and long-vowel flavor with patronymic/metonymic naming inspired by Arabic; simplified and fictionalised.",
  glyphs: {
    classes: {
      C: ["b", "t", "th", "j", "h", "kh", "d", "dh", "r", "z", "s", "sh", "sw", "d", "t", "z", "ayn", "gh", "f", "q", "k", "l", "m", "n", "h", "w", "y"],
      V: ["a", "i", "u", "aa", "ii", "uu", "ai", "au"],
    },
    syllables: [["C V", 4], ["C V C", 2], ["C V V C", 2], ["V C", 1]],
    wordShapes: [["1", 1], ["2", 3], ["3", 3], ["2-2", 1]],
    constraints: [{ pattern: ["C", "C", "C", "C"], rule: "forbid" }],
    joiner: "",
  },
  orthography: {
    id: "arabic-roman",
    mappings: [
      { from: "kh", to: "ḵ" },
      { from: "sh", to: "š" },
      { from: "th", to: "ṯ" },
      { from: "dh", to: "ḏ" },
      { from: "ayn", to: "ʿ" },
      { from: "aa", to: "ā" },
      { from: "ii", to: "ī" },
      { from: "uu", to: "ū" },
    ],
    unknown: "preserve",
  },
  romanization: {
    id: "arabic-ascii",
    mappings: [
      { from: "ḵ", to: "kh" },
      { from: "š", to: "sh" },
      { from: "ṯ", to: "th" },
      { from: "ḏ", to: "dh" },
      { from: "ʿ", to: "ayn" },
      { from: "ā", to: "aa" },
      { from: "ī", to: "ii" },
      { from: "ū", to: "uu" },
    ],
    unknown: "preserve",
  },
  templates: {
    given: [
      literal("Karim", "fictional given-name placeholder"),
      literal("Layla", "fictional given-name placeholder"),
      {
        value: {
          kind: "compose",
          parts: [pick("noun", { tag: "virtue", capitalize: true }), pick("noun", { tag: "nature" })],
          sep: "",
        },
        weight: 2,
      },
    ],
    nasab: [
      {
        value: {
          kind: "compose",
          parts: [
            { literal: "ibn ", translation: "son of" },
            pick("noun", { tag: "family", capitalize: true }),
          ],
          sep: "",
        },
        weight: 1,
      },
    ],
    kunya: [
      {
        value: {
          kind: "compose",
          parts: [
            { literal: "Abu ", translation: "father of" },
            pick("noun", { tag: "nature", capitalize: true }),
          ],
          sep: "",
        },
        weight: 1,
      },
    ],
  },
  nameStructures: {
    "arabic.nasab": {
      id: "nasab",
      slots: [
        { key: "given", role: "given", source: { type: "kind", kind: "given" } },
        { key: "nasab", role: "patronymic", source: { type: "kind", kind: "nasab" }, prefix: " " },
      ],
      separator: " ",
    },
  },
});

export const culture = cultureFor(arabic);
export const pack = basePack(arabic);
export const rawData = arabic;
export default arabic;
