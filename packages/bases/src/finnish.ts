import { basePack, cultureFor } from "./registry.js";
import { defineBase, literal, pick } from "./define.js";
import type { BaseData } from "@lexiconlang/packs";

/**
 * Finnish-inspired base: vowel-harmony sound palette. Fictional, simplified; not a linguistic reference. No Kalevala deity names ship.
 */
export const finnish: BaseData = defineBase({
  slug: "finnish",
  inspiredBy: "Finnish",
  scope: "Phonotactics and name shapes inspired by Finnish; vowel harmony, front/back contrasts and agglutinative case endings; deliberate simplifications.",
  glyphs: {
    classes: { C: ["b", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "y", "nk", "ng"], V: ["a", "e", "i", "o", "u", "y", "ä", "ö", "aa", "ee", "ii", "oo", "uu", "yy", "ai", "ei", "oi", "ui", "au", "eu", "ou"] },
    syllables: [["C V", 4], ["C V C", 3], ["V C", 2], ["C V V", 1]],
    wordShapes: [["1", 2], ["2", 3], ["1-2", 1]],
    constraints: [{"pattern":["C","C","C"],"rule":"forbid"}],
  },
  orthography: {
    id: "finnish-latin",
    mappings: [{ from: "ae", to: "æ" }],
    unknown: "preserve",
  },
  romanization: {
    id: "finnish-roman",
    mappings: [{ from: "æ", to: "ae" }],
    unknown: "preserve",
  },
  templates: {
    given: [
      literal("Ainokainen", "fictional given-name placeholder"),
      literal("Kaarno", "fictional given-name placeholder"),
      {
        value: {
          kind: "compose",
          parts: [pick("noun", { tag: "nature", capitalize: true }), pick("noun", { tag: "nature" })],
          sep: "",
        },
        weight: 2,
      },
    ],
    settlement: [{ value: { kind: "compose", parts: [pick("noun", { tag: "nature", capitalize: true }), { literal: "lahti", translation: "bay" }], sep: "" }, weight: 1 }],
  },
  nameStructures: {
    "finnish.given-family": {
      id: "given-family",
      slots: [{"key":"given","role":"given","source":{"type":"kind","kind":"given"}},{"key":"family","role":"family","source":{"type":"kind","kind":"family"},"prefix":" "}],
      separator: " ",
    },
  },
});

export const culture = cultureFor(finnish);
export const pack = basePack(finnish);
export const rawData = finnish;
export default finnish;
