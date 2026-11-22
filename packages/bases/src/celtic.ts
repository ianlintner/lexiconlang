import { basePack, cultureFor } from "./registry.js";
import { defineBase, literal, pick } from "./define.js";
import type { BaseData } from "@lexiconlang/packs";

/**
 * Old Irish / Gaelic-inspired base. Narrow scope: early medieval Gaelic sound
 * palette; not a pan-Celtic claim. Fictional, simplified.
 */
export const celtic: BaseData = defineBase({
  slug: "celtic",
  inspiredBy: "Old Irish (early medieval Gaelic)",
  scope: "Sonorant-rich phonotactics and lenition-flavoured orthography inspired by Old Irish; simplified and fictionalised.",
  glyphs: {
    classes: {
      C: ["b", "c", "d", "f", "g", "l", "m", "n", "p", "r", "s", "t", "bh", "ch", "dh", "gh", "mh"],
      V: ["a", "e", "i", "o", "u", "ae", "ai", "ea", "ei", "ia", "ua"],
    },
    syllables: [["C V", 4], ["V", 1], ["C V C", 2], ["C V V", 2], ["V C", 2]],
    wordShapes: [["1", 1], ["2", 3], ["3", 2], ["1-2", 1]],
    constraints: [{ pattern: ["C", "C", "C"], rule: "forbid" }],
    joiner: "",
  },
  orthography: {
    id: "celtic-latin",
    mappings: [
      { from: "mh", to: "ṁ" },
      { from: "bh", to: "ḃ" },
      { from: "ch", to: "ċ" },
    ],
    unknown: "preserve",
  },
  templates: {
    given: [
      literal("Aedan", "fictional given-name placeholder"),
      literal("Mairin", "fictional given-name placeholder"),
      {
        value: {
          kind: "compose",
          parts: [pick("adjective", { tag: "nature", capitalize: true }), pick("noun", { tag: "nature" })],
          sep: "",
        },
        weight: 2,
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
    "celtic.given-only": {
      id: "given-only",
      slots: [{ key: "given", role: "given", source: { type: "kind", kind: "given" } }],
      separator: " ",
    },
  },
});

export const culture = cultureFor(celtic);
export const pack = basePack(celtic);
export const rawData = celtic;
export default celtic;
