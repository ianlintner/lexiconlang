import { describe, expect, it } from "vitest";
import { createContext } from "@lexiconlang/core";
import { validatePack } from "@lexiconlang/packs";
import packJson from "../data/grimdark.pack.json" with { type: "json" };
import {
  generators,
  grimdark,
  pack,
  personName,
  placeName,
  verminWarlordName,
  type GeneratorKey,
} from "./index.js";

describe("grimdark declarative pack", () => {
  it("validates against pack-v1 schema and semantic checks", () => {
    expect(validatePack(packJson)).toEqual([]);
    expect(pack.id).toBe("lexiconlang.grimdark");
    expect(pack.version).toBe("0.1.0");
  });

  it("avoids trademarked or setting-specific IP", () => {
    const blob = JSON.stringify(packJson).toLowerCase();
    for (const banned of ["warhammer", "skaven", "age of sigmar", "40k", "games workshop", "horus", "splinterbone", "grey seer"]) {
      expect(blob).not.toContain(banned);
    }
  });

  it("ships two naming styles with translated person, clan and place names", () => {
    expect(pack.cultures.length).toBeGreaterThanOrEqual(2);
    const ids = pack.cultures.map((c) => c.id);
    expect(ids).toContain("lexiconlang.grimdark/culture/ashbound");
    expect(ids).toContain("lexiconlang.grimdark/culture/vermin");
    for (const culture of pack.cultures) {
      expect(culture.templates?.given?.length).toBeGreaterThanOrEqual(20);
      expect(culture.templates?.settlement?.length).toBeGreaterThanOrEqual(20);
      const lineage = culture.templates?.clan ?? culture.templates?.surname;
      expect(lineage?.length).toBeGreaterThanOrEqual(20);
      for (const choices of Object.values(culture.templates ?? {})) {
        for (const choice of choices) {
          if (choice.value.kind === "literal") {
            expect((choice.value.form ?? "").length).toBeGreaterThan(0);
            expect((choice.value.translation ?? "").length).toBeGreaterThan(0);
          }
        }
      }
    }
    const names = new Set<string>();
    const places = new Set<string>();
    const warlords = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const ctx = createContext({ seed: `grim-translate-${i}` });
      const person = personName.generate(ctx.child("person"));
      const place = placeName.generate(ctx.child("place"));
      const warlord = verminWarlordName.generate(ctx.child("warlord"));
      expect(person.form).toContain(" ");
      expect(person.translation).toContain(",");
      expect(place.translation.length).toBeGreaterThan(0);
      expect(warlord.form).toContain(" ");
      names.add(person.form);
      places.add(`${place.form}|${place.translation}`);
      warlords.add(warlord.form);
    }
    expect(names.size).toBeGreaterThanOrEqual(60);
    expect(places.size).toBeGreaterThanOrEqual(60);
    expect(warlords.size).toBeGreaterThanOrEqual(60);
  });

  it("exposes 6+ useful generator families", () => {
    expect(Object.keys(generators).length).toBeGreaterThanOrEqual(6);
    expect(pack.generators.length).toBeGreaterThanOrEqual(6);
  });

  it("withSeed is deterministic for matching call sequences over fixed vectors", () => {
    for (const seed of ["black-standard", "cinder-vigil", "rat-king-omega"]) {
      const a = grimdark.withSeed(seed);
      const b = grimdark.withSeed(seed);
      expect(a.person()).toEqual(b.person());
      expect(a.place()).toEqual(b.place());
      expect(a.warband()).toBe(b.warband());
      expect(a.banner()).toBe(b.banner());
      expect(a.heresy()).toBe(b.heresy());
      expect(a.inquisition()).toBe(b.inquisition());
      expect(a.plague()).toBe(b.plague());
      expect(a.mutation()).toBe(b.mutation());
      expect(a.title()).toBe(b.title());
      expect(a.warMachine()).toBe(b.warMachine());
      expect(a.clan()).toBe(b.clan());
      expect(a.warlord()).toBe(b.warlord());
      expect(a.verminWarlord()).toEqual(b.verminWarlord());
      expect(a.battle()).toBe(b.battle());
      expect(a.omen()).toEqual(b.omen());
      expect(a.plagueOutcome()).toEqual(b.plagueOutcome());
    }
  });

  const stringGenerators: readonly GeneratorKey[] = [
    "warbandName",
    "bannerMotto",
    "heresyName",
    "inquisitionName",
    "plagueName",
    "mutationName",
    "grimTitle",
    "warMachineName",
    "clanName",
    "warlordName",
    "battleName",
  ];

  for (const key of stringGenerators) {
    it(`100 rolls of ${key} are >=60% distinct and nonempty`, () => {
      const gen = generators[key];
      const results = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const value = gen.generate(createContext({ seed: `grim-distinct-${i}` }).child("roll")) as string;
        expect(typeof value).toBe("string");
        expect(value.trim().length).toBeGreaterThan(0);
        results.add(value);
      }
      expect(results.size / 100).toBeGreaterThanOrEqual(0.6);
    });
  }

  it("vermin warlord names reach >=60% distinct results", () => {
    const results = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const value = verminWarlordName.generate(createContext({ seed: `grim-clan-${i}` }).child("warlord"));
      results.add(value.form);
    }
    expect(results.size).toBeGreaterThanOrEqual(60);
  });

  it("oracles return meaningful text", () => {
    for (const key of ["doomOmenOracle", "plagueOutcomeOracle"] as const) {
      const roll = generators[key].generate(createContext({ seed: "oracle-seed" }).child("roll"));
      expect(roll.text.length).toBeGreaterThan(5);
      expect(roll.entry.length).toBeGreaterThan(0);
    }
  });

  it("plague-outcome dice table covers all 2d6 sums", () => {
    const table = pack.tables.find((t) => t.id === "lexiconlang.grimdark/table/plague-outcome");
    expect(table?.mode).toBe("dice");
    const ranges = (table?.entries ?? []).map((entry) => {
      const range = (entry as { range?: readonly [number, number] }).range;
      if (!range) throw new Error("plague-outcome entry is missing a range");
      return range;
    });
    for (let sum = 2; sum <= 12; sum++) {
      expect(ranges.some(([min, max]) => sum >= min && sum <= max)).toBe(true);
    }
  });

  it("resolves every declared generator ID through the table host", () => {
    // Every pack generator ID that a table may reference must be reachable by
    // the facade's table host; the old ad-hoc key derivation missed several.
    const expected = [
      "warband-name", "banner-motto", "heresy-name", "inquisition-name",
      "plague-name", "mutation-name", "grim-title", "war-machine-name",
      "clan-name", "warlord-name", "battle-name", "doom-omen", "plague-outcome",
    ];
    for (const suffix of expected) {
      expect(pack.generators.some((g) => g.id === `lexiconlang.grimdark/generator/${suffix}`)).toBe(true);
    }
  });
});
