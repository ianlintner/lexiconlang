import { describe, expect, it } from "vitest";
import { createContext } from "@lexiconlang/core";
import { validatePack } from "@lexiconlang/packs";
import pirates, {
  data,
  shipName,
  shipClass,
  captainName,
  captainEpithet,
  crewName,
  portCove,
  factionName,
  treasure,
  mapName,
  shantyTitle,
  navalRank,
  seaEncounter,
  weatherPortent,
  cargoHaul,
} from "./index.js";

const STRING_GENERATORS = [
  ["shipName", shipName],
  ["shipClass", shipClass],
  ["captainEpithet", captainEpithet],
  ["crewName", crewName],
  ["portCove", portCove],
  ["factionName", factionName],
  ["treasure", treasure],
  ["mapName", mapName],
  ["shantyTitle", shantyTitle],
  ["navalRank", navalRank],
] as const;

const TABLE_GENERATORS = [seaEncounter, weatherPortent, cargoHaul] as const;

describe("pirates pack", () => {
  it("validates against the declarative pack v1 schema", () => {
    expect(validatePack(data)).toEqual([]);
  });

  it("has two cultures and at least six content generators", () => {
    expect(data.cultures.length).toBeGreaterThanOrEqual(2);
    expect(data.generators.length).toBeGreaterThanOrEqual(6);
    expect(data.grammars.length).toBeGreaterThanOrEqual(6);
    expect(data.tables.length).toBeGreaterThanOrEqual(3);
  });

  it("is CC0 and carries a provenance note", () => {
    expect(data.license).toBe("CC0-1.0");
    expect(data.provenance.length).toBeGreaterThan(0);
    expect(data.provenance[0]?.attribution).toMatch(/original/i);
  });

  it("exposes a withSeed facade", () => {
    const api = pirates.withSeed("facade-test");
    expect(typeof api.ship).toBe("function");
    expect(api.ship()).toBeTypeOf("string");
    expect(api.captain().full).toBeTruthy();
  });
});

describe("determinism", () => {
  it("string generators produce identical output for the same seed", () => {
    for (const [, generator] of STRING_GENERATORS) {
      const a = createContext({ seed: "determinism" });
      const b = createContext({ seed: "determinism" });
      expect(generator.generate(a)).toBe(generator.generate(b));
    }
  });

  it("the withSeed facade is stable across calls", () => {
    const a = pirates.withSeed("stable");
    const b = pirates.withSeed("stable");
    for (const key of ["ship", "shipClass", "crew", "port", "faction", "treasure", "map", "shanty", "rank"] as const) {
      expect(a[key]()).toBe(b[key]());
    }
  });

  it("captain and oracle generators are deterministic", () => {
    const a = createContext({ seed: "stable-2" });
    const b = createContext({ seed: "stable-2" });
    expect(captainName.generate(a)).toEqual(captainName.generate(b));
    for (const table of TABLE_GENERATORS) {
      expect(table.generate(createContext({ seed: "oracle" }))).toEqual(
        table.generate(createContext({ seed: "oracle" })),
      );
    }
  });

  it("sibling order does not affect a generator's output", () => {
    const isolated = shipName.generate(createContext({ seed: "sibling" }).child("shipName"));
    const root = createContext({ seed: "sibling" });
    root.child("unrelated").rng.next();
    root.child("another").rng.next();
    expect(shipName.generate(root.child("shipName"))).toBe(isolated);
  });

  it("captain names include a translation", () => {
    const name = captainName.generate(createContext({ seed: "translate" }));
    expect(name.full.length).toBeGreaterThan(0);
    expect(name.translation.length).toBeGreaterThan(0);
    expect(name.given.length).toBeGreaterThan(0);
    expect(name.epithet.length).toBeGreaterThan(0);
    expect(data.cultures.map((c) => c.id)).toContain(name.culture);
  });
});

describe("distinctness", () => {
  for (const [name, generator] of STRING_GENERATORS) {
    it(`${name}: 100 rolls on one seed family yield >= 60% distinct results`, () => {
      const ctx = createContext({ seed: `distinct-${name}` });
      const seen = new Set<string>();
      for (let i = 0; i < 100; i++) seen.add(generator.generate(ctx.child(`roll:${i}`)));
      expect(seen.size / 100).toBeGreaterThanOrEqual(0.6);
    });
  }

  it("captain names: 100 rolls yield >= 60% distinct results", () => {
    const ctx = createContext({ seed: "distinct-captain" });
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) seen.add(captainName.generate(ctx.child(`roll:${i}`)).full);
    expect(seen.size / 100).toBeGreaterThanOrEqual(0.6);
  });

  it("oracles exercise their bounded entry sets", () => {
    for (const [i, table] of TABLE_GENERATORS.entries()) {
      const descriptor = data.tables[i]!;
      const ctx = createContext({ seed: `distinct-${table.id}` });
      const seen = new Set<string>();
      for (let roll = 0; roll < 100; roll++) seen.add(table.generate(ctx.child(`roll:${roll}`)).entry);
      // Oracle tables are bounded-cardinality oracles (e.g. a d6 weather table).
      // Require broad coverage of the authored entries rather than 60 distinct
      // results from a six-sided die.
      expect(seen.size).toBeGreaterThanOrEqual(Math.ceil(descriptor.entries.length * 0.6));
    }
  });
});
