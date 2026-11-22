import { describe, expect, it } from "vitest";
import { createContext, type Generator } from "@lexiconlang/core";
import { validatePack } from "@lexiconlang/packs";
import type { TableRoll } from "@lexiconlang/packs";
import packJson from "../data/mythology.pack.json" with { type: "json" };
import {
  generators,
  mythology,
  pack,
  personName,
  placeName,
  type GeneratorKey,
} from "./index.js";

describe("mythology declarative pack", () => {
  it("validates against pack-v1 schema and semantic checks", () => {
    expect(validatePack(packJson)).toEqual([]);
    expect(pack.id).toBe("lexiconlang.mythology");
    expect(pack.version).toBe("0.1.0");
  });

  it("ships five translated naming styles with person and place names", () => {
    expect(pack.cultures.length).toBeGreaterThanOrEqual(5);
    for (const culture of pack.cultures) {
      for (const kind of ["given", "surname", "settlement"] as const) {
        const choices = culture.templates?.[kind];
        expect(choices?.length ?? 0).toBeGreaterThanOrEqual(20);
        for (const choice of choices ?? []) {
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
      const ctx = createContext({ seed: `myth-translate-${i}` });
      const person = personName.generate(ctx.child("person"));
      const place = placeName.generate(ctx.child("place"));
      expect(person.form).toContain(" ");
      expect(person.translation).toContain(",");
      expect(person.cultureId).toContain("lexiconlang.mythology/culture/");
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
    for (const seed of ["old-oak", "star-fall", "moon-mask"]) {
      const a = mythology.withSeed(seed);
      const b = mythology.withSeed(seed);
      expect([a.person(), a.place(), a.deity(), a.pantheon(), a.myth(), a.mythHook()]).toEqual([
        b.person(), b.place(), b.deity(), b.pantheon(), b.myth(), b.mythHook(),
      ]);
    }
  });

  it("keeps sibling order independent via per-method child keys", () => {
    const reference = mythology.withSeed("sibling-proof");
    const baseline = reference.person();
    // Interleaving and repeating other calls must not shift person()'s stream.
    const shuffled = mythology.withSeed("sibling-proof");
    shuffled.deity();
    shuffled.mythHook();
    shuffled.person();
    shuffled.epithet();
    expect(shuffled.person()).toEqual(reference.person());
    expect(shuffled.person()).not.toEqual(baseline); // second call advances only person's counter
    const fresh = mythology.withSeed("sibling-proof");
    expect(fresh.person()).toEqual(baseline);
  });

  it("aligns manifest name generators with the facade's all-culture banks", () => {
    const pan = pack.cultures.find((c) => c.id === "lexiconlang.mythology/culture/pan-mythic");
    expect(pan).toBeDefined();
    for (const [kind, key] of [["given", "form"], ["surname", "form"], ["settlement", "form"], ["deity", "form"], ["epithet", "form"]] as const) {
      const merged = pan?.templates?.[kind] ?? [];
      const split = pack.cultures
        .filter((c) => c.id !== pan?.id)
        .flatMap((c) => c.templates?.[kind] ?? []);
      expect(merged.length).toBe(split.length);
      expect(merged.map((c) => (c.value.kind === "literal" ? c.value[key] : ""))).toEqual(
        split.map((c) => (c.value.kind === "literal" ? c.value[key] : "")),
      );
    }
    for (const id of ["person-name", "place-name", "cultural-deity-name", "cultural-epithet"]) {
      const descriptor = pack.generators.find((g) => g.id === `lexiconlang.mythology/generator/${id}`);
      expect(descriptor).toMatchObject({ engine: "name-v1", culture: pan?.id });
    }
  });

  it("uses culture-specific deity and epithet banks", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const cultural = mythology.withSeed(`cultural-${i}`).culturalDeity();
      expect(cultural.translation.length).toBeGreaterThan(0);
      seen.add(cultural.form);
    }
    expect(seen.size).toBeGreaterThanOrEqual(60);
    expect(mythology.withSeed("x").culturalEpithet().form.length).toBeGreaterThan(0);
  });

  it("gives >=60% distinct results over 100 rolls for every string generator", () => {
    const stringKeys: GeneratorKey[] = [
      "deityName",
      "pantheonName",
      "epithet",
      "mythTitle",
      "holySiteName",
      "artifactName",
      "monsterName",
      "factionName",
    ];
    for (const key of stringKeys) {
      const gen = generators[key] as Generator<string>;
      const results = new Set<string>();
      for (let i = 0; i < 100; i++) {
        results.add(gen.generate(createContext({ seed: `distinct-${key}-${i}` })));
      }
      expect(results.size, `${key} distinct outputs`).toBeGreaterThanOrEqual(60);
    }
  });

  it("gives >=60% distinct oracle entries over 100 rolls", () => {
    const oracleKeys: GeneratorKey[] = ["mythHookOracle", "sacredRiteOracle", "relicPowerOracle", "divineOmenOracle"];
    for (const key of oracleKeys) {
      const gen = generators[key] as Generator<TableRoll>;
      const entries = new Set<string>();
      for (let i = 0; i < 100; i++) {
        entries.add(gen.generate(createContext({ seed: `oracle-${key}-${i}` })).entry);
      }
      expect(entries.size, `${key} distinct entry ids`).toBeGreaterThanOrEqual(8);
    }
  });

  it("uses inspired-by framing with no living people or trademarks in content", () => {
    expect(pack.description).toContain("Inspired-by framing only");
    for (const culture of pack.cultures) {
      expect(culture.id).toMatch(/^lexiconlang\.mythology\/culture\//);
    }
    expect(pack.provenance.length).toBeGreaterThan(0);
    for (const entry of pack.provenance) expect(entry.license).toBe("CC0-1.0");
  });
});
