import { describe, expect, it } from "vitest";
import { createContext } from "@lexiconlang/core";
import { validatePack } from "@lexiconlang/packs";
import packJson from "../data/steampunk.pack.json" with { type: "json" };
import {
  generators,
  pack,
  personName,
  placeName,
  steampunk,
  type GeneratorKey,
} from "./index.js";

describe("steampunk declarative pack", () => {
  it("validates against pack-v1 schema and semantic checks", () => {
    expect(validatePack(packJson)).toEqual([]);
    expect(pack.id).toBe("lexiconlang.steampunk");
    expect(pack.version).toBe("0.1.0");
  });

  it("ships two naming styles with translated person and place names", () => {
    expect(pack.cultures.length).toBeGreaterThanOrEqual(2);
    for (const culture of pack.cultures) {
      expect(culture.templates?.given?.length).toBeGreaterThanOrEqual(20);
      expect(culture.templates?.surname?.length).toBeGreaterThanOrEqual(20);
      expect(culture.templates?.settlement?.length).toBeGreaterThanOrEqual(20);
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
    for (let i = 0; i < 100; i++) {
      const ctx = createContext({ seed: `steam-translate-${i}` });
      const person = personName.generate(ctx.child("person"));
      const place = placeName.generate(ctx.child("place"));
      expect(person.form).toContain(" ");
      expect(person.translation).toContain(",");
      expect(place.translation.length).toBeGreaterThan(0);
      names.add(person.form);
      places.add(`${place.form}|${place.translation}`);
    }
    expect(names.size).toBeGreaterThanOrEqual(60);
    expect(places.size).toBeGreaterThanOrEqual(60);
  });

  it("exposes 6+ useful generator families", () => {
    expect(Object.keys(generators).length).toBeGreaterThanOrEqual(6);
    expect(pack.generators.length).toBeGreaterThanOrEqual(6);
  });

  it("withSeed is deterministic for matching call sequences over fixed vectors", () => {
    for (const seed of ["brass-clock", "gaslamp-17", "aether-omega"]) {
      const a = steampunk.withSeed(seed);
      const b = steampunk.withSeed(seed);
      expect(a.person()).toEqual(b.person());
    expect(a.place()).toEqual(b.place());
    expect(a.airship()).toBe(b.airship());
    expect(a.contraption()).toBe(b.contraption());
    expect(a.guild()).toBe(b.guild());
    expect(a.society()).toBe(b.society());
    expect(a.headline()).toBe(b.headline());
    expect(a.district()).toBe(b.district());
    expect(a.automaton()).toBe(b.automaton());
    expect(a.patent()).toBe(b.patent());
    expect(a.street()).toBe(b.street());
    expect(a.title()).toBe(b.title());
    expect(a.malfunction()).toEqual(b.malfunction());
    expect(a.omen()).toEqual(b.omen());
    }
  });

  const stringGenerators: readonly GeneratorKey[] = [
    "airshipName",
    "contraptionName",
    "guildName",
    "societyName",
    "headline",
    "districtName",
    "automatonName",
    "patentTitle",
    "streetName",
    "officialTitle",
  ];

  for (const key of stringGenerators) {
    it(`100 rolls of ${key} are >=60% distinct and nonempty`, () => {
      const gen = generators[key];
      const results = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const value = gen.generate(createContext({ seed: `steam-distinct-${i}` }).child("roll")) as string;
        expect(typeof value).toBe("string");
        expect(value.trim().length).toBeGreaterThan(0);
        results.add(value);
      }
      expect(results.size / 100).toBeGreaterThanOrEqual(0.6);
    });
  }

  it("oracles return meaningful text", () => {
    for (const key of ["malfunctionOracle", "gaslampOmenOracle"] as const) {
      const roll = generators[key].generate(createContext({ seed: "oracle-seed" }).child("roll"));
      expect(roll.text.length).toBeGreaterThan(5);
      expect(roll.entry.length).toBeGreaterThan(0);
    }
  });
});
