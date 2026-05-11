import { describe, expect, it } from "vitest";
import { dwarvish, elvish } from "./cultures.js";

describe("fantasy cultures visual glyph systems", () => {
  describe("dwarvish culture", () => {
    it("has visualGlyphSystems defined", () => {
      expect(dwarvish.visualGlyphSystems).toBeDefined();
    });

    it("has phonetic glyph system configured for SVG runes", () => {
      expect(dwarvish.visualGlyphSystems?.phonetic).toBeDefined();
      const phonetic = dwarvish.visualGlyphSystems!.phonetic;
      expect(phonetic.id).toBe("dwarvish.runes");
      expect(phonetic.type).toBe("alphabet");
      expect(phonetic.renderFormat).toBe("svg");
      expect(phonetic.mappingStrategy).toBe("phoneme");
    });

    it("has SVG generator with angular complexity", () => {
      const phonetic = dwarvish.visualGlyphSystems!.phonetic;
      expect(phonetic.generator).toBeDefined();
      expect(phonetic.generator!.baseShapes).toContain("rect");
      expect(phonetic.generator!.baseShapes).toContain("line");
      expect(phonetic.generator!.baseShapes).toContain("arc");
      expect(phonetic.generator!.complexity).toBe("medium");
      expect(phonetic.generator!.symmetry).toBe(false);
      expect(phonetic.generator!.palette).toEqual(["#8B4513", "#D2691E"]);
    });

    it("has render parameters for SVG output", () => {
      const phonetic = dwarvish.visualGlyphSystems!.phonetic;
      expect(phonetic.renderParams).toBeDefined();
      expect(phonetic.renderParams!.size).toBe(28);
      expect(phonetic.renderParams!.strokeWidth).toBe(2.5);
    });
  });

  describe("elvish culture", () => {
    it("has visualGlyphSystems defined", () => {
      expect(elvish.visualGlyphSystems).toBeDefined();
    });

    it("has conceptual glyph system configured for Unicode ideograms", () => {
      expect(elvish.visualGlyphSystems?.conceptual).toBeDefined();
      const conceptual = elvish.visualGlyphSystems!.conceptual;
      expect(conceptual.id).toBe("elvish.ideograms");
      expect(conceptual.type).toBe("conceptual");
      expect(conceptual.renderFormat).toBe("unicode");
      expect(conceptual.mappingStrategy).toBe("morpheme");
    });

    it("has Unicode mappings for elvish concepts", () => {
      const conceptual = elvish.visualGlyphSystems!.conceptual;
      expect(conceptual.unicodeMappings).toBeDefined();
      const mappings = conceptual.unicodeMappings!;
      expect(mappings.grace).toBe("✨");
      expect(mappings.moonlight).toBe("🌙");
      expect(mappings.forest).toBe("🌳");
      expect(mappings.starlight).toBe("⭐");
      expect(mappings.song).toBe("🎵");
      expect(mappings.light).toBe("✨");
      expect(mappings.ancient).toBe("📜");
      expect(mappings.silver).toBe("🪙");
      expect(mappings.wisdom).toBe("🧠");
    });

    it("has render parameters with Unicode fallback", () => {
      const conceptual = elvish.visualGlyphSystems!.conceptual;
      expect(conceptual.renderParams).toBeDefined();
      expect(conceptual.renderParams!.fallback).toBe("◆");
    });
  });
});
