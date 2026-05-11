import { describe, it, expect } from "vitest";
import { createContext } from "@lexiconlang/core";
import type { GlyphSystem } from "../types.js";
import { generateWord } from "../phonotactics.js";

describe("generateWord", () => {
  const simpleSystem: GlyphSystem = {
    classes: { C: ["k", "t", "p"], V: ["a", "i", "u"] },
    syllables: [["C V", 3], ["C V C", 1]],
    wordShapes: [["1", 2], ["2", 1]],
  };

  it("generates a word matching the glyph system", () => {
    const ctx = createContext({ seed: "test-1" });
    const word = generateWord(simpleSystem, ctx);
    expect(word).toMatch(/^[KTP][aiu]([ktp])?([ktp][aiu]([ktp])?)?$/);
  });

  it("is deterministic", () => {
    const ctx1 = createContext({ seed: "test-1" });
    const ctx2 = createContext({ seed: "test-1" });
    expect(generateWord(simpleSystem, ctx1)).toBe(generateWord(simpleSystem, ctx2));
  });

  it("changes with different seeds", () => {
    const ctx1 = createContext({ seed: "seed-1" });
    const ctx2 = createContext({ seed: "seed-2" });
    // High probability they differ (not 100% guaranteed, but ~99%)
    const words = new Set([generateWord(simpleSystem, ctx1), generateWord(simpleSystem, ctx2)]);
    expect(words.size).toBe(2);
  });

  it("respects joiner", () => {
    const system: GlyphSystem = {
      classes: { C: ["k"], V: ["a"] },
      syllables: [["C V", 1]],
      wordShapes: [["2", 1]],
      joiner: "-",
    };
    const ctx = createContext({ seed: "test-1" });
    const word = generateWord(system, ctx);
    expect(word).toContain("-");
  });

  it("respects constraints", () => {
    const system: GlyphSystem = {
      classes: { C: ["k", "t"], V: ["a"] },
      syllables: [["C V C", 1]],
      wordShapes: [["1", 1]],
      constraints: [{ pattern: ["C", "C"], rule: "forbid" }],
    };
    const ctx = createContext({ seed: "test-1" });
    const word = generateWord(system, ctx);
    // Should not have two C's in a row
    expect(word).not.toMatch(/[kt]{2}/);
  });
});
