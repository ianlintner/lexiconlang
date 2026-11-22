import { basePack, cultureFor } from "./registry.js";
import { defineBase, literal, pick } from "./define.js";
import type { BaseData } from "@lexiconlang/packs";

/**
 * Classical Latin-inspired base: open vowels, clear CV shapes, formal
 * family-name flavor. Fictional, simplified; not a linguistic reference.
 */
export const latin: BaseData = defineBase({
  slug: "latin",
  inspiredBy: "Classical Latin (epigraphic, informal register)",
  scope: "Open syllable structure and nominative-ending flavor inspired by Latin; simplified and fictionalised.",
  glyphs: {
    classes: {
      C: ["b", "c", "d", "f", "g", "h", "l", "m", "n", "p", "q", "r", "s", "t", "v", "x"],
      V: ["a", "e", "i", "o", "u", "ae", "au", "oe"],
    },
    syllables: [["C V", 4], ["C V C", 2], ["C V V", 2], ["V C", 1]],
    wordShapes: [["2", 3], ["3", 3], ["1", 1], ["2-3", 1]],
    constraints: [{ pattern: ["C", "C", "C"], rule: "forbid" }],
    joiner: "",
  },
  orthography: {
    id: "latin-latin",
    mappings: [
      { from: "ae", to: "æ" },
      { from: "oe", to: "œ" },
    ],
    unknown: "preserve",
  },
  templates: {
    given: [
      literal("Lucius", "fictional given-name placeholder"),
      literal("Marcus", "fictional given-name placeholder"),
      {
        value: {
          kind: "compose",
          parts: [pick("noun", { tag: "virtue", capitalize: true }), pick("noun", { tag: "nature" })],
          sep: "",
        },
        weight: 2,
      },
    ],
    family: [
      {
        value: {
          kind: "compose",
          parts: [pick("noun", { tag: "family", capitalize: true })],
          sep: "",
        },
        weight: 1,
      },
    ],
  },
  nameStructures: {
    "latin.tria-nomina": {
      id: "tria-nomina",
      slots: [
        { key: "given", role: "given", source: { type: "kind", kind: "given" } },
        { key: "family", role: "family", source: { type: "kind", kind: "family" }, prefix: " " },
      ],
      separator: " ",
    },
  },
});

export const culture = cultureFor(latin);
export const pack = basePack(latin);
export const rawData = latin;
export default latin;
