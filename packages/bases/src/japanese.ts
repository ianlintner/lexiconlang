import { basePack, cultureFor } from "./registry.js";
import { defineBase, literal, pick } from "./define.js";
import type { BaseData } from "@lexiconlang/packs";

/**
 * Modern Japanese-inspired base (romanized Hepburn-like, macron-free).
 * Family-first name order is encoded in the name structure. Fictional,
 * simplified; not a linguistic reference.
 */
export const japanese: BaseData = defineBase({
  slug: "japanese",
  inspiredBy: "Modern Japanese (romanized, macron-free)",
  scope: "CV-heavy mora-friendly phonotactics and family-first naming inspired by Japanese; simplified and fictionalised.",
  glyphs: {
    classes: {
      C: ["k", "g", "s", "z", "t", "d", "n", "h", "b", "m", "y", "r", "w", "sh", "ch", "ts"],
      V: ["a", "i", "u", "e", "o", "ya", "yu", "yo", "ai", "au", "ei", "ou"],
    },
    syllables: [["C V", 5], ["V", 2], ["C V C", 1], ["C V V", 1]],
    wordShapes: [["2", 3], ["3", 2], ["1", 1], ["2-2", 2]],
    constraints: [{ pattern: ["C", "C", "C"], rule: "forbid" }],
    joiner: "",
  },
  orthography: {
    id: "japanese-roman",
    mappings: [
      { from: "sh", to: "š" },
      { from: "ch", to: "č" },
    ],
    unknown: "preserve",
  },
  romanization: {
    id: "japanese-hepburn",
    mappings: [
      { from: "š", to: "sh" },
      { from: "č", to: "ch" },
    ],
    unknown: "preserve",
  },
  templates: {
    given: [
      literal("Haru", "fictional given-name placeholder"),
      literal("Yuki", "fictional given-name placeholder"),
      {
        value: {
          kind: "compose",
          parts: [pick("noun", { tag: "nature", capitalize: true }), pick("noun", { tag: "virtue" })],
          sep: "",
        },
        weight: 2,
      },
    ],
    family: [
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
    "japanese.family-first": {
      id: "family-first",
      slots: [
        { key: "family", role: "family", source: { type: "kind", kind: "family" } },
        { key: "given", role: "given", source: { type: "kind", kind: "given" }, prefix: " " },
      ],
      separator: " ",
    },
  },
});

export const culture = cultureFor(japanese);
export const pack = basePack(japanese);
export const rawData = japanese;
export default japanese;
