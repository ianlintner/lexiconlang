import { describe, expect, it } from "vitest";
import { createContext } from "@content-gen/core";
import { fantasy, npc, settlement, fullName } from "./index.js";

describe("fantasy pack", () => {
  it("withSeed produces deterministic output for matching call sequences", () => {
    const a = fantasy.withSeed("world-1");
    const b = fantasy.withSeed("world-1");
    expect(a.name.full()).toEqual(b.name.full());
    expect(a.place.tavern()).toBe(b.place.tavern());
  });

  it("npc has all required fields", () => {
    const n = npc.generate(createContext({ seed: "x" }));
    expect(n.name.full).toMatch(/^\S.+\S$/);
    expect(n.age).toBeGreaterThanOrEqual(18);
    expect(n.age).toBeLessThan(80);
    expect(n.occupation).toBeTypeOf("string");
    expect(n.personality.trait).toBeTypeOf("string");
    expect(n.personality.flaw).toBeTypeOf("string");
    expect(n.personality.quirk).toBeTypeOf("string");
  });

  it("settlement has plausible structure", () => {
    const s = settlement.generate(createContext({ seed: "set-1" }));
    expect(["village", "town", "city"]).toContain(s.kind);
    expect(s.population).toBeGreaterThan(0);
    expect(s.notableLocations.length).toBeGreaterThan(0);
    expect(s.leader.name.full).toBeTypeOf("string");
  });

  it("hierarchical seed reproduces same world tree", () => {
    const root1 = createContext({ seed: "campaign" });
    const root2 = createContext({ seed: "campaign" });
    const n1 = npc.generate(root1.child("region:1").child("settlement:5").child("npc:7"));
    const n2 = npc.generate(root2.child("region:1").child("settlement:5").child("npc:7"));
    expect(n1).toEqual(n2);
  });

  it("fullName produces a plausible name", () => {
    const fn = fullName.generate(createContext({ seed: "name" }));
    expect(fn.given.length).toBeGreaterThan(1);
    expect(fn.surname.length).toBeGreaterThan(1);
    expect(fn.full).toBe(`${fn.given} ${fn.surname}`);
    expect(["human", "elf", "dwarf", "halfling", "orc", "dragonborn"]).toContain(fn.race);
  });

  it("exports >= 30 generators", () => {
    const { generators } = fantasy;
    expect(Object.keys(generators).length).toBeGreaterThanOrEqual(30);
  });
});
