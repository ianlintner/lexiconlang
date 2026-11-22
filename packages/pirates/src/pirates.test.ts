import { describe, expect, it } from "vitest";
import { createContext } from "@lexiconlang/core";
import { createWorld, definePack, rollTable, validatePack } from "@lexiconlang/packs";
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

const TABLE_PACK_IDS = [
  "lexiconlang.pirates/table/sea-encounter",
  "lexiconlang.pirates/table/weather-portent",
  "lexiconlang.pirates/table/cargo-haul",
] as const;
const TABLE_GENERATOR_BY_PACK_ID: Record<string, (typeof TABLE_GENERATORS)[number]> = {
  "lexiconlang.pirates/table/sea-encounter": seaEncounter,
  "lexiconlang.pirates/table/weather-portent": weatherPortent,
  "lexiconlang.pirates/table/cargo-haul": cargoHaul,
};

  it("oracles exercise their bounded entry sets", () => {
    // Look the descriptor up by the generator's own pack ID, never by array
    // position: adding or reordering tables in the JSON must not silently
    // change what this test measures.
    for (const packId of TABLE_PACK_IDS) {
      const table = TABLE_GENERATOR_BY_PACK_ID[packId]!;
      const descriptor = data.tables.find((t) => t.id === packId);
      expect(descriptor, `missing table descriptor for ${packId}`).toBeDefined();
      const ctx = createContext({ seed: `distinct-${table.id}` });
      const seen = new Set<string>();
      for (let roll = 0; roll < 100; roll++) seen.add(table.generate(ctx.child(`roll:${roll}`)).entry);
      // Oracle tables are bounded-cardinality oracles (e.g. a d6 weather table).
      // Require broad coverage of the authored entries rather than 60 distinct
      // results from a six-sided die.
      expect(seen.size).toBeGreaterThanOrEqual(Math.ceil(descriptor!.entries.length * 0.6));
    }
  });
});

// ─── JSON is the single source of truth ───────────────────────────────────
//
// The facade must roll through the same primitives createWorld() uses for
// this pack. Deriving the context exactly as generateAt() does lets us assert
// byte-for-byte parity for every grammar and table generator.

const PACK_GENERATORS = [
  ["shipName", "ship-name", "ship", shipName],
  ["shipClass", "ship-class", "ship-class", shipClass],
  ["captainEpithet", "captain-epithet", "epithet", captainEpithet],
  ["crewName", "crew-name", "crew", crewName],
  ["portCove", "port-cove", "port", portCove],
  ["factionName", "faction-name", "faction", factionName],
  ["treasure", "treasure", "treasure", treasure],
  ["mapName", "map-name", "map", mapName],
  ["shantyTitle", "shanty-title", "shanty", shantyTitle],
  ["navalRank", "naval-rank", "rank", navalRank],
  ["seaEncounter", "sea-encounter", "encounter", seaEncounter],
  ["weatherPortent", "weather-portent", "weather", weatherPortent],
  ["cargoHaul", "cargo-haul", "cargo", cargoHaul],
] as const;

function worldContext(seed: string, packId: string, key: string) {
  return createContext({ seed }).child(`generator:${packId}`).child(`key:${key}`);
}

function surface(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "text" in value) return String((value as { text: unknown }).text);
  return JSON.stringify(value);
}

describe("pack-runtime parity", () => {
  it("every grammar and oracle matches createWorld().use(definePack(data))", () => {
    const pack = definePack(data as never);
    for (const seed of ["parity-a", "parity-b", "parity-c"]) {
      const world = createWorld({ seed }).use(pack);
      for (const [, suffix, key, generator] of PACK_GENERATORS) {
        const id = `lexiconlang.pirates/generator/${suffix}`;
        const fromWorld = surface(world.generate(id, key));
        const fromFacade = surface(generator.generate(worldContext(seed, id, key)));
        expect(fromFacade, `${suffix} @ ${seed}`).toBe(fromWorld);
      }
    }
  });

  it("delegates oracle rolls to the exported rollTable primitive", () => {
    const table = data.tables.find((t) => t.id.endsWith("/table/weather-portent"))!;
    const id = table.id.replace("/table/", "/generator/");
    const ctx = worldContext("direct-roll", id, "weather");
    const host = {
      table: (tableId: string) => data.tables.find((t) => t.id === tableId) as never,
      generator: () => { throw new Error("unused"); },
      expandGrammar: () => { throw new Error("unused"); },
    };
    expect(surface(weatherPortent.generate(ctx))).toBe(surface(rollTable(table as never, ctx, host)));
  });

  it("both cultures' captain structures are reachable through the pack runtime", () => {
    const world = createWorld({ seed: "captains" }).use(definePack(data as never));
    for (const suffix of ["captain-name", "captain-name-buccaneer"]) {
      const name = surface(world.generate(`lexiconlang.pirates/generator/${suffix}`, "captain"));
      expect(name).not.toMatch(/  /);
      expect(name.length).toBeGreaterThan(3);
    }
  });
});

describe("content artifacts", () => {
  const REPEATED_WORD = /\b(\w+)[\s—-]+\1\b/i;

  it("never emits doubled articles in treasure or ship names", () => {
    for (let i = 0; i < 200; i++) {
      const seed = `artifact-${i}`;
      const ctx = createContext({ seed });
      expect(treasure.generate(ctx.child("treasure"))).not.toMatch(/\bthe\s+the\b/i);
      expect(shipName.generate(ctx.child("ship"))).not.toMatch(/\bthe\s+the\b/i);
    }
  });

  it("never emits double spaces in captain names", () => {
    for (let i = 0; i < 200; i++) {
      const name = captainName.generate(createContext({ seed: `captain-space-${i}` }).child("captain"));
      expect(name.full).not.toMatch(/  /);
      expect(name.translation).not.toMatch(/  /);
    }
  });

  it("emits no immediately repeated word in any pack generator", () => {
    const pack = definePack(data as never);
    for (let i = 0; i < 200; i++) {
      const world = createWorld({ seed: `artifact-all-${i}` }).use(pack);
      for (const generator of data.generators) {
        const text = surface(world.generate(generator.id, "artifact"));
        expect(text, `${generator.id} @ artifact-all-${i}`).not.toMatch(REPEATED_WORD);
        expect(text, `${generator.id} @ artifact-all-${i}`).not.toMatch(/——|--/);
      }
    }
  });

  it("capitalises every port and cove name", () => {
    const pack = definePack(data as never);
    for (let i = 0; i < 200; i++) {
      const world = createWorld({ seed: `port-case-${i}` }).use(pack);
      const name = surface(world.generate("lexiconlang.pirates/generator/port-cove", "port"));
      expect(name, `port-cove @ port-case-${i}`).toMatch(/^[A-Z]/);
    }
  });
});
