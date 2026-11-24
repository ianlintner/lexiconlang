import { describe, expect, it } from "vitest";
import { createContext } from "@lexiconlang/core";
import { createWorld, validatePack, loadPack } from "@lexiconlang/packs";
import packJson from "../data/wuxia.pack.json" with { type: "json" };
import {
  generators,
  mountainName,
  pack,
  personName,
  placeName,
  wuxia,
  type GeneratorKey,
} from "./index.js";

describe("wuxia declarative pack", () => {
  it("validates against pack-v1 schema and semantic checks", () => {
    expect(validatePack(packJson)).toEqual([]);
    expect(pack.id).toBe("lexiconlang.wuxia");
    expect(pack.version).toBe("0.1.0");
  });

  it("ships two naming styles with translated person, place and mountain names", () => {
    expect(pack.cultures.length).toBeGreaterThanOrEqual(2);
    for (const culture of pack.cultures) {
      for (const kind of ["given", "surname", "settlement", "mountain"]) {
        const templates = culture.templates?.[kind];
        expect(templates?.length).toBeGreaterThanOrEqual(20);
      }
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
    const mountains = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const ctx = createContext({ seed: `wuxia-translate-${i}` });
      const person = personName.generate(ctx.child("person"));
      const place = placeName.generate(ctx.child("place"));
      const mountain = mountainName.generate(ctx.child("mountain"));
      expect(person.form).toContain(" ");
      expect(person.translation).toContain(",");
      expect(place.translation.length).toBeGreaterThan(0);
      expect(mountain.translation.length).toBeGreaterThan(0);
      names.add(person.form);
      places.add(`${place.form}|${place.translation}`);
      mountains.add(`${mountain.form}|${mountain.translation}`);
    }
    expect(names.size).toBeGreaterThanOrEqual(60);
    expect(places.size).toBeGreaterThanOrEqual(60);
    expect(mountains.size).toBeGreaterThanOrEqual(60);
  });

  it("exposes 6+ useful generator families", () => {
    expect(Object.keys(generators).length).toBeGreaterThanOrEqual(6);
    expect(pack.generators.length).toBeGreaterThanOrEqual(6);
  });

  it("withSeed is deterministic for matching call sequences over fixed vectors", () => {
    for (const seed of ["iron-bamboo", "nine-heavens", "silent-valley"]) {
      const a = wuxia.withSeed(seed);
      const b = wuxia.withSeed(seed);
      expect(a.person()).toEqual(b.person());
      expect(a.place()).toEqual(b.place());
      expect(a.mountain()).toEqual(b.mountain());
      expect(a.sect()).toBe(b.sect());
      expect(a.technique()).toBe(b.technique());
      expect(a.cultivationRealm()).toBe(b.cultivationRealm());
      expect(a.treasure()).toBe(b.treasure());
      expect(a.nickname()).toBe(b.nickname());
      expect(a.secretRealm()).toBe(b.secretRealm());
      expect(a.pill()).toBe(b.pill());
      expect(a.tribulation()).toEqual(b.tribulation());
      expect(a.omen()).toEqual(b.omen());
    }
  });

  const stringGenerators: readonly GeneratorKey[] = [
    "sectName",
    "techniqueName",
    "realm",
    "treasureName",
    "nickname",
    "secretRealm",
    "pillName",
  ];

  for (const key of stringGenerators) {
    it(`100 rolls of ${key} are >=60% distinct and nonempty`, () => {
      const gen = generators[key];
      const results = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const value = gen.generate(createContext({ seed: `wuxia-distinct-${i}` }).child("roll")) as string;
        expect(typeof value).toBe("string");
        expect(value.trim().length).toBeGreaterThan(0);
        results.add(value);
      }
      expect(results.size / 100).toBeGreaterThanOrEqual(0.6);
    });
  }

  it("oracles return meaningful text", () => {
    for (const key of ["tribulationOracle", "jianghuOmenOracle"] as const) {
      const roll = generators[key].generate(createContext({ seed: "oracle-seed" }).child("roll"));
      expect(roll.text.length).toBeGreaterThan(5);
      expect(roll.entry.length).toBeGreaterThan(0);
    }
  });

  it("loads standalone via loadPack and generates from the declarative descriptors", async () => {
    expect(pack.depends).toEqual([]);
    expect(pack.requires).toEqual(["language-v1", "grammar-v1", "tables-v1"]);
    const loaded = await loadPack(packJson);
    const world = createWorld({ seed: "wuxia-world" }).use(loaded);
    for (const descriptor of pack.generators) {
      expect(world.describe(descriptor.id).id).toBe(descriptor.id);
      const value = world.generate(descriptor.id, "standalone");
      expect(value).toBeDefined();
    }
  });

  it("exposes every declarative generator ID to the portable table host", () => {
    const ids = new Set(pack.generators.map((g) => g.id));
    for (const id of [
      "sect-name", "technique-name", "realm", "treasure-name", "nickname",
      "mountain-name", "secret-realm", "pill-name",
    ]) {
      expect(ids.has(`lexiconlang.wuxia/generator/${id}`)).toBe(true);
    }
  });
});
