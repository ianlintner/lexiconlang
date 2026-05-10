import { describe, expect, it } from "vitest";
import { createContext } from "@lexicon/core";
import { scifi, crewMember, starSystem } from "./index.js";

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
