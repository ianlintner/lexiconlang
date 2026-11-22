import { describe, expect, it } from "vitest";
import { createContext } from "@lexiconlang/core";
import { validatePack } from "@lexiconlang/packs";
import packJson from "../data/supers.pack.json" with { type: "json" };
import {
  generators,
  generatorForId,
  heroDossier,
  pack,
  personName,
  placeName,
  powerSet,
  supers,
  type GeneratorKey,
} from "./index.js";

describe("supers declarative pack", () => {
  it("validates against pack-v1 schema and semantic checks", () => {
    expect(validatePack(packJson)).toEqual([]);
    expect(pack.id).toBe("lexiconlang.supers");
    expect(pack.version).toBe("0.1.0");
  });

  it("ships two modern naming styles with translated person and place names", () => {
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
      const ctx = createContext({ seed: `supers-translate-${i}` });
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

  it("covers the promised scope with 6+ generator families and 2+ oracles", () => {
    expect(Object.keys(generators).length).toBeGreaterThanOrEqual(6);
    expect(pack.generators.length).toBeGreaterThanOrEqual(6);
    for (const tag of ["hero", "villain", "power", "origin", "team", "lair", "headline", "oracle"]) {
      expect(pack.generators.some((g) => g.tags.includes(tag))).toBe(true);
    }
    expect(pack.tables.length).toBeGreaterThanOrEqual(2);
  });

  it("withSeed is deterministic for matching call sequences over fixed vectors", () => {
    for (const seed of ["night-shift", "cobalt-fox", "aegis-omega"]) {
      const a = supers.withSeed(seed);
      const b = supers.withSeed(seed);
      expect(a.person()).toEqual(b.person());
      expect(a.place()).toEqual(b.place());
      expect(a.hero()).toBe(b.hero());
      expect(a.villain()).toBe(b.villain());
      expect(a.power()).toBe(b.power());
      expect(a.origin()).toBe(b.origin());
      expect(a.team()).toBe(b.team());
      expect(a.lair()).toBe(b.lair());
      expect(a.headline()).toBe(b.headline());
      expect(a.motto()).toBe(b.motto());
      expect(a.limit()).toEqual(b.limit());
      expect(a.incident()).toEqual(b.incident());
      expect(a.omen()).toEqual(b.omen());
      expect(a.powerSet()).toEqual(b.powerSet());
      expect(a.dossier()).toEqual(b.dossier());
    }
  });

  const stringGenerators: readonly GeneratorKey[] = [
    "heroCodename",
    "villainCodename",
    "powerName",
    "originName",
    "teamName",
    "lairName",
    "headline",
    "motto",
  ];

  for (const key of stringGenerators) {
    it(`100 rolls of ${key} are >=60% distinct and nonempty`, () => {
      const gen = generators[key];
      const results = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const value = gen.generate(createContext({ seed: `supers-distinct-${i}` }).child("roll")) as string;
        expect(typeof value).toBe("string");
        expect(value.trim().length).toBeGreaterThan(0);
        results.add(value);
      }
      expect(results.size / 100).toBeGreaterThanOrEqual(0.6);
    });
  }

  it("resolves every declared generator id by its exact pack-manifest id", () => {
    for (const descriptor of pack.generators) {
      expect(generatorForId(descriptor.id)).toBeDefined();
    }
    expect(generatorForId(`${pack.id}/generator/does-not-exist`)).toBeUndefined();
  });

  it("oracles return meaningful text", () => {
    for (const key of ["powerLimitOracle", "incidentOracle", "shadowOmenOracle"] as const) {
      const roll = generators[key].generate(createContext({ seed: "oracle-seed" }).child("roll"));
      expect(roll.text.length).toBeGreaterThan(5);
      expect(roll.entry.length).toBeGreaterThan(0);
    }
  });

  it("power sets and dossiers are complete, coherent and sibling-order independent", () => {
    const seed = "dossier-sibling-test";
    const expected = heroDossier.generate(createContext({ seed }).child("dossier"));
    // Interleave unrelated sub-rolls before and after; the fixed child keys isolate them.
    createContext({ seed }).child("unrelated-a").child("roll").rng.nextInt(0, 10);
    const actual = heroDossier.generate(createContext({ seed }).child("dossier"));
    expect(actual).toEqual(expected);
    expect(expected.secretIdentity.form).toContain(" ");
    expect(expected.powers.ability.length).toBeGreaterThan(0);
    expect(expected.powers.limit.length).toBeGreaterThan(5);
    expect(expected.powers.origin.length).toBeGreaterThan(0);
    expect(expected.team.length).toBeGreaterThan(0);
    expect(expected.lair.length).toBeGreaterThan(0);
    expect(expected.motto.length).toBeGreaterThan(0);
    expect(["hero", "villain"]).toContain(expected.alignment);

    const ps = powerSet.generate(createContext({ seed }).child("powers"));
    expect(ps.ability).not.toBe(ps.origin);
    expect(ps.limit.length).toBeGreaterThan(5);
  });

  it("1000-key quality sample has no empty/garbled output or forbidden IP tokens", () => {
    const banned = /\b(batman|superman|spider-?man|justice league|avengers|x-?men|marvel|dc comics)\b/i;
    const stringKeys = [
      "heroCodename", "villainCodename", "powerName", "originName",
      "teamName", "lairName", "headline", "motto",
    ] as const;
    const seen: Record<string, Set<string>> = Object.fromEntries(stringKeys.map((k) => [k, new Set<string>()]));
    for (let i = 0; i < 1000; i++) {
      const ctx = createContext({ seed: `supers-quality-${i}` });
      for (const key of stringKeys) {
        const value = generators[key].generate(ctx.child(key)) as string;
        expect(value.trim().length).toBeGreaterThan(0);
        expect(value).not.toMatch(/\(\(|\)\)|undefined|NaN/);
        expect(banned.test(value)).toBe(false);
        seen[key].add(value);
      }
    }
    // Small authored domains still need meaningful variety across 1000 keys.
    for (const key of stringKeys) {
      expect(seen[key].size).toBeGreaterThanOrEqual(20);
    }
  });
});
