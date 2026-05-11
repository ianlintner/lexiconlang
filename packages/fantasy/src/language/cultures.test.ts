import { describe, expect, it } from "vitest";
import { celestial, dwarvish, elvish, fey, tiefling } from "./cultures.js";
import { createContext } from "@lexiconlang/core";
import { generateName } from "@lexiconlang/language";

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

describe("celestial culture", () => {
  it("has visualGlyphSystems.conceptual defined", () => {
    expect(celestial.visualGlyphSystems?.conceptual).toBeDefined();
  });

  it("conceptual glyph system uses unicode morpheme mapping", () => {
    const g = celestial.visualGlyphSystems!.conceptual;
    expect(g.id).toBe("celestial.radiance");
    expect(g.type).toBe("conceptual");
    expect(g.renderFormat).toBe("unicode");
    expect(g.mappingStrategy).toBe("morpheme");
    expect(g.unicodeMappings!.light).toBe("✨");
    expect(g.unicodeMappings!.dawn).toBe("☀");
    expect(g.unicodeMappings!.grace).toBe("⚜");
    expect(g.unicodeMappings!.wing).toBe("🪶");
    expect(g.unicodeMappings!.sacred).toBe("✝");
    expect(g.renderParams!.fallback).toBe("◇");
  });

  it("generates a non-empty given name", () => {
    const ctx = createContext({ seed: "celestial-given" });
    const name = generateName(celestial, "given", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });

  it("generates a non-empty surname", () => {
    const ctx = createContext({ seed: "celestial-surname" });
    const name = generateName(celestial, "surname", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });
});

describe("fey culture", () => {
  it("has visualGlyphSystems.phonetic defined", () => {
    expect(fey.visualGlyphSystems?.phonetic).toBeDefined();
  });

  it("phonetic glyph system is SVG with mossy/violet palette", () => {
    const g = fey.visualGlyphSystems!.phonetic;
    expect(g.id).toBe("fey.sylvan");
    expect(g.type).toBe("alphabet");
    expect(g.renderFormat).toBe("svg");
    expect(g.generator!.baseShapes).toContain("arc");
    expect(g.generator!.palette).toEqual(["#556B2F", "#9370DB"]);
  });

  it("generates a non-empty given name", () => {
    const ctx = createContext({ seed: "fey-given" });
    const name = generateName(fey, "given", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });

  it("generates a non-empty surname", () => {
    const ctx = createContext({ seed: "fey-surname" });
    const name = generateName(fey, "surname", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });
});

describe("tiefling culture", () => {
  it("has visualGlyphSystems.phonetic defined", () => {
    expect(tiefling.visualGlyphSystems?.phonetic).toBeDefined();
  });

  it("phonetic glyph system is complex SVG with ember palette", () => {
    const g = tiefling.visualGlyphSystems!.phonetic;
    expect(g.id).toBe("tiefling.infernal");
    expect(g.type).toBe("alphabet");
    expect(g.renderFormat).toBe("svg");
    expect(g.generator!.complexity).toBe("complex");
    expect(g.generator!.palette).toEqual(["#8B0000", "#2F2F2F"]);
    expect(g.generator!.baseShapes).toContain("polygon");
  });

  it("generates a non-empty given name", () => {
    const ctx = createContext({ seed: "tiefling-given" });
    const name = generateName(tiefling, "given", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });

  it("generates a non-empty surname", () => {
    const ctx = createContext({ seed: "tiefling-surname" });
    const name = generateName(tiefling, "surname", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });
});
