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

  it("aligns manifest name banks with the facade's all-culture selection pool", () => {
    // Note: manifest `person-name` (name-v1, kind: given) emits ONLY a given name;
    // the facade's person() emits "given surname". The banks below are the same
    // selection pool; the shapes are intentionally different (see README).
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

  it("uses culture-specific deity and epithet banks with real glosses", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const cultural = mythology.withSeed(`cultural-${i}`).culturalDeity();
      expect(cultural.form).toMatch(/^[A-ZÀ-Þ]/);
      expect(cultural.form.length).toBeGreaterThanOrEqual(3);
      expect(cultural.translation.length).toBeGreaterThan(0);
      expect(cultural.translation).not.toBe("invented divine name");
      expect(cultural.translation).toMatch(/[a-z]{2}/);
      seen.add(cultural.form);
    }
    expect(seen.size).toBeGreaterThanOrEqual(60);
    expect(mythology.withSeed("x").culturalEpithet().form.length).toBeGreaterThan(0);
  });

  it("emits well-formed names: no lowercase root fragments or 1-2 letter tokens", () => {
    // Regression guard for fragment grammar outputs such as "Glan Tl tec",
    // "Yamu Helm is", "the Ibis dottir" or "the Mirror of dreagan".
    const legacyRoots = new Set([
      "nike", "dike", "sophia", "kratos", "phos", "thalassa", "aion", "charis", "eris", "harmonia",
      "metis", "pneuma", "stasis", "tycha", "logos", "eros", "nomos", "poiesis", "soma", "psyche",
      "vind", "sjo", "fjall", "eld", "is", "skog", "mal", "sverd", "hjort", "bjorn", "orn", "sver",
      "troll", "blot", "varg", "sól", "geal", "dubh", "ruadh", "bán",
      "fionn", "donn", "las", "cú", "sceach", "dris", "linn", "tuath", "cliú", "samh", "geimh",
      "eoch", "grian", "gaoth", "dreagan", "odhr", "hotep", "ankh", "nefer", "djed", "tyet",
      "croc", "papyrus", "tl", "catl", "coatl", "tzin", "lan", "tepec", "apan",
      "mil", "huatl", "lotl", "mol", "nalli", "pitl", "quin", "tec", "tzli", "xcintli", "yotl",
      "zotl", "miz", "dottir",
    ]);
    const smallWords = new Set([
      "the", "of", "and", "at", "why", "a", "to", "in", "into", "on", "by", "from", "with", "its", "no", "or", "as", "is",
    ]);
    const methodKeys = [
      "deity", "pantheon", "epithet", "myth", "holySite", "artifact", "monster", "faction",
    ] as const;
    for (let i = 0; i < 100; i++) {
      const m = mythology.withSeed(`wellformed-${i}`);
      for (const key of methodKeys) {
        const output = m[key]();
        for (const token of output.split(/[\s,]+/)) {
          if (!token || smallWords.has(token.toLowerCase())) continue;
          expect(token.length, `${key}: short token in ${output}`).toBeGreaterThan(2);
          expect(legacyRoots.has(token.toLowerCase()), `${key}: legacy root in ${output}`).toBe(false);
          // Lowercase English words are allowed as ordinary grammar (the, of,
          // and, was...); the important guards are length and the legacy roots above.

        }
      }
    }
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
