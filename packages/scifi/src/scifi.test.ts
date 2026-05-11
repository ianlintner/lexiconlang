import { describe, expect, it } from "vitest";
import { createContext } from "@lexiconlang/core";
import { scifi, crewMember, starSystem } from "./index.js";
import { humanoid, insectoid } from "./language/cultures.js";

describe("scifi pack", () => {
  it("withSeed is deterministic for matching call sequences", () => {
    const a = scifi.withSeed("colony-7");
    const b = scifi.withSeed("colony-7");
    expect(a.ship()).toBe(b.ship());
    expect(a.star()).toBe(b.star());
  });

  it("crewMember has all required fields", () => {
    const c = crewMember.generate(createContext({ seed: "x" }));
    expect(c.name).toBeTypeOf("string");
    expect(c.name.length).toBeGreaterThan(0);
    expect(["human", "humanoid", "insectoid", "aquatic", "synth"]).toContain(c.species);
    expect(c.role).toBeTypeOf("string");
    expect(c.callsign).toBeTypeOf("string");
    expect(c.homeworld).toBeTypeOf("string");
  });

  it("starSystem has 2-8 planets", () => {
    const s = starSystem.generate(createContext({ seed: "y" }));
    expect(s.planets.length).toBeGreaterThanOrEqual(2);
    expect(s.planets.length).toBeLessThanOrEqual(8);
    for (const p of s.planets) {
      expect(p.name).toBeTypeOf("string");
      expect(p.type).toBeTypeOf("string");
    }
  });

  it("exports >= 15 generators", () => {
    expect(Object.keys(scifi.generators).length).toBeGreaterThanOrEqual(15);
  });
});

describe("scifi culture visualGlyphSystems", () => {
  it("humanoid culture has visualGlyphSystems.holistic defined", () => {
    expect(humanoid.visualGlyphSystems).toBeDefined();
    expect(humanoid.visualGlyphSystems?.holistic).toBeDefined();
  });

  it("humanoid.holistic has correct system properties", () => {
    const holistic = humanoid.visualGlyphSystems?.holistic;
    expect(holistic?.id).toBe("humanoid.geometric");
    expect(holistic?.type).toBe("conceptual");
    expect(holistic?.renderFormat).toBe("canvas");
    expect(holistic?.mappingStrategy).toBe("holistic");
  });

  it("humanoid.holistic has generator with correct baseShapes", () => {
    const generator = humanoid.visualGlyphSystems?.holistic?.generator;
    expect(generator?.baseShapes).toContain("rect");
    expect(generator?.baseShapes).toContain("circle");
    expect(generator?.baseShapes).toContain("polygon");
    expect(generator?.complexity).toBe("medium");
    expect(generator?.symmetry).toBe(true);
  });

  it("humanoid.holistic has correct renderParams", () => {
    const renderParams = humanoid.visualGlyphSystems?.holistic?.renderParams;
    expect(renderParams?.size).toBe(48);
    expect(renderParams?.strokeWidth).toBe(3);
  });

  it("insectoid culture has visualGlyphSystems.phonetic defined", () => {
    expect(insectoid.visualGlyphSystems).toBeDefined();
    expect(insectoid.visualGlyphSystems?.phonetic).toBeDefined();
  });

  it("insectoid.phonetic has correct system properties", () => {
    const phonetic = insectoid.visualGlyphSystems?.phonetic;
    expect(phonetic?.id).toBe("insectoid.chitin");
    expect(phonetic?.type).toBe("alphabet");
    expect(phonetic?.renderFormat).toBe("svg");
    expect(phonetic?.mappingStrategy).toBe("phoneme");
  });

  it("insectoid.phonetic has generator with correct baseShapes", () => {
    const generator = insectoid.visualGlyphSystems?.phonetic?.generator;
    expect(generator?.baseShapes).toContain("line");
    expect(generator?.baseShapes).toContain("arc");
    expect(generator?.baseShapes).toContain("polygon");
    expect(generator?.complexity).toBe("complex");
    expect(generator?.symmetry).toBe(false);
  });

  it("insectoid.phonetic has correct renderParams", () => {
    const renderParams = insectoid.visualGlyphSystems?.phonetic?.renderParams;
    expect(renderParams?.size).toBe(32);
    expect(renderParams?.strokeWidth).toBe(1.5);
  });
});
