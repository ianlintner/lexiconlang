import type { GlyphSystem } from "./types.js";

export const archetypes = {
  flowing: {
    classes: {
      C: ["l", "r", "n", "m", "w", "y"],
      V: ["a", "e", "i", "o", "u"],
    },
    syllables: [
      ["V", 1],
      ["C V", 3],
      ["V C", 2],
    ],
    wordShapes: [["1", 1], ["2", 3]],
  } as Partial<GlyphSystem>,
} satisfies Record<string, Partial<GlyphSystem>>;
