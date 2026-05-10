import { describe, expect, it } from "vitest";
import { createContext } from "@lexicon/core";
import { fantasy, npc, settlement, fullName } from "./index.js";

describe("fantasy pack", () => {
  it("withSeed produces deterministic output for matching call sequences", () => {
    const a = fantasy.withSeed("world-1");
    const b = fantasy.withSeed("world-1");
    const aFull = a.name.full();
    const bFull = b.name.full();
    expect(aFull.form).toBe(bFull.form);
    expect(aFull.translation).toBe(bFull.translation);
    expect(a.place.tavern()).toBe(b.place.tavern());
  });

  it("npc has all required fields", () => {
    const n = npc.generate(createContext({ seed: "x" }));
    expect(n.name.full.toString()).toMatch(/^\S.+\S$/);
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
    expect(s.leader.name.full.toString()).toMatch(/^\S.+\S$/);
  });

  it("hierarchical seed reproduces same world tree", () => {
    const root1 = createContext({ seed: "campaign" });
    const root2 = createContext({ seed: "campaign" });
    const n1 = npc.generate(root1.child("region:1").child("settlement:5").child("npc:7"));
    const n2 = npc.generate(root2.child("region:1").child("settlement:5").child("npc:7"));
    expect(n1.name.full.form).toBe(n2.name.full.form);
    expect(n1.age).toBe(n2.age);
    expect(n1.occupation).toBe(n2.occupation);
  });

  it("fullName produces a plausible name", () => {
    const fn = fullName.generate(createContext({ seed: "name" }));
    expect(fn.given.form.length).toBeGreaterThan(1);
    expect(fn.surname.form.length).toBeGreaterThan(1);
    expect(fn.full.form).toBe(`${fn.given.form} ${fn.surname.form}`);
    expect(fn.full.toString()).toBe(`${fn.given.form} ${fn.surname.form}`);
    expect(["human", "elf", "dwarf", "halfling", "orc", "dragonborn"]).toContain(fn.race);
  });

  it("exports >= 30 generators", () => {
    const { generators } = fantasy;
    expect(Object.keys(generators).length).toBeGreaterThanOrEqual(30);
  });
});
