import { describe, expect, it } from "vitest";
import { validatePack } from "@lexiconlang/packs";

import { data, horror, IDS, provenance } from "./index.js";

const SEED_VECTORS = ["dunwich-1927", "the-silver-cord", 1928, "arkham-ledger"] as const;

/** The set of key-based content families the pack advertises. */
const families = [
  "investigator",
  "eldritchEntity",
  "forbiddenTome",
  "cult",
  "hauntedLocation",
  "town",
  "omen",
  "secret",
  "monsterTrait",
  "monsterForm",
  "investigatorRole",
] as const;

type Family = (typeof families)[number];

const generatorIds = Object.values(IDS).filter((id) => id !== IDS.pack);

function call(api: ReturnType<typeof horror.withSeed>, family: Family, key: string): string {
  const value = api[family](key);
  return typeof value === "string" ? value : value.form;
}

function tableById(id: string) {
  const table = data.tables.find((t) => t.id === id);
  if (!table) throw new Error(`missing table ${id}`);
  return table;
}

describe("@lexiconlang/horror — F2 declarative pack", () => {
  it("validates the pack manifest against pack-v1 with zero diagnostics", () => {
    expect(data.formatVersion).toBe(1);
    expect(data.id).toBe("lexiconlang.horror");
    expect(data.version).toBe("0.1.0");
    expect(validatePack(data)).toEqual([]);
  });

  it("declares original CC0 provenance, no dependencies and no base packs", () => {
    expect(data.depends).toEqual([]);
    expect(data.extends).toEqual([]);
    expect(data.bases).toBeUndefined();
    expect(data.license).toBe("CC0-1.0");
    expect(provenance[0]?.source).toBe("original:lexiconlang.horror");
    expect(data.cultures.length).toBeGreaterThanOrEqual(2);
  });

  it("advertises 6+ generators covering all promised families", () => {
    expect(data.generators.length).toBeGreaterThanOrEqual(6);
    for (const id of generatorIds) {
      expect(data.generators.some((g) => g.id === id)).toBe(true);
    }
    // Two oracles (omen, secret) plus three F3 weighted tables.
    expect(data.tables.length).toBeGreaterThanOrEqual(2);
  });

  it("advertises only generator IDs in the public generators map", () => {
    expect(Object.keys(horror.generators)).toHaveLength(11);
    expect(Object.keys(horror.generators)).not.toContain(IDS.pack);
    for (const id of Object.values(horror.generators)) {
      expect(id.startsWith(`${data.id}/generator/`)).toBe(true);
    }
  });

  it("every oracle-table entry is reachable from its generator", () => {
    const tables = [
      ["omen", `${data.id}/table/omen`],
      ["secret", `${data.id}/table/secret`],
      ["monsterTrait", `${data.id}/table/monster-trait`],
      ["monsterForm", `${data.id}/table/monster-form`],
      ["investigatorRole", `${data.id}/table/investigator-role`],
    ] as const;
    for (const [family, id] of tables) {
      const entries = tableById(id).entries;
      const api = horror.withSeed("reachability");
      const seen = new Set(
        Array.from({ length: 500 }, (_, i) => call(api, family, `reach:${i}`)),
      );
      for (const entry of entries) {
        const text = (entry as { result: { text?: string } }).result.text;
        if (text) expect(seen.has(text), `${family}: ${text}`).toBe(true);
      }
    }
  });

  it("gives every large list/table enough entries to clear 60% distinct", () => {
    // The quality bar applies to pools with 60+ authored alternatives. Tiny
    // intentional vocabularies (titles, affixes, dice ranges) are excluded,
    // per S0 spec §15 ("don't impose a universal uniqueness target on tiny
    // intentional vocabularies").
    const pools: readonly (readonly unknown[])[] = [
      data.cultures[0]!.templates!.given!,
      data.cultures[0]!.templates!.town!,
      data.cultures[1]!.templates!.given!,
    ];
    for (const pool of pools) {
      expect(pool.length).toBeGreaterThanOrEqual(60);
      expect(new Set(pool.map((entry) => JSON.stringify(entry))).size).toBeGreaterThanOrEqual(60);
    }
  });
});

describe("@lexiconlang/horror — deterministic facade", () => {
  it("is deterministic: same seed and key give byte-identical output", () => {
    for (const seed of SEED_VECTORS) {
      const a = horror.withSeed(seed);
      const b = horror.withSeed(seed);
      for (const family of families) {
        for (const key of ["alpha", "beta", "gamma"]) {
          expect(call(a, family, key)).toBe(call(b, family, key));
        }
      }
    }
  });

  it("separates sibling rolls by stable key", () => {
    const a = horror.withSeed("sibling-order");
    const b = horror.withSeed("sibling-order");
    const first = Array.from({ length: 100 }, (_, i) => call(a, "eldritchEntity", `entity:${i}`));
    const second = Array.from({ length: 100 }, (_, i) => call(b, "eldritchEntity", `entity:${i}`));
    expect(first).toEqual(second);
  });

  it("never returns empty or placeholder output", () => {
    const api = horror.withSeed("quality-sample");
    for (const family of families) {
      for (let i = 0; i < 100; i++) {
        const text = call(api, family, `sample:${family}:${i}`);
        expect(text.length).toBeGreaterThan(1);
        expect(text).not.toMatch(/undefined|NaN|\[object Object\]|#\w+#/);
      }
    }
  });

  it("reaches >= 60% distinct results over 100 keys for composite families", () => {
    const composite: readonly Family[] = [
      "investigator", "eldritchEntity", "forbiddenTome", "cult", "hauntedLocation", "town",
    ];
    for (const family of composite) {
      const results = new Set(
        Array.from({ length: 100 }, (_, i) => call(horror.withSeed("distinctness-run"), family, `d:${i}`)),
      );
      expect(results.size, family).toBeGreaterThanOrEqual(60);
    }
  });

  it("records three fixed seed vectors per public generator", () => {
    // Exact new-ID vectors, recorded here rather than in legacy goldens.
    const vectors: Record<Family, readonly [string, string, string]> = {
      investigator: ["Insp. Rosalind Silverton", "Prof. Edmund Valentine", "Priscilla Chatwick"],
      eldritchEntity: ["thul-ot", "nyxar'nykorr", "thassa'az"],
      forbiddenTome: ["Folio of the Cinder Water", "The Thornbound Register", "The Salt-Stained Notebook"],
      cult: ["The Eye at the Rented Room", "Order of the Thorn", "The Children of the Lowly Crown"],
      hauntedLocation: ["the old cellar beneath the bakery", "cliffside lighthouse near Mistbrook", "the burned general store with no sign"],
      town: ["Cindercross", "Cindergate", "Hollowwell"],
      omen: ["lamps extinguishing in sequence", "a second moon visible at noon", "the radio playing a voice that knows your name"],
      secret: ["the town's founding pact is renewed each winter", "the mayor's family never buries their dead", "the library's rarest book checks itself out"],
      monsterTrait: ["a voice made of several voices", "an outline that flickers at the edges", "limbs whose joint count changes when unobserved"],
      monsterForm: ["a shape glimpsed between travels", "a voice without a source", "something wearing a familiar voice"],
      investigatorRole: ["Country Physician", "Country Physician", "Antiquarian"],
    };
    const seeds = SEED_VECTORS.slice(0, 3);
    for (const family of families) {
      const actual = seeds.map((seed) => call(horror.withSeed(seed), family, `vector:${family}`));
      expect(actual, family).toEqual([...vectors[family]]);
    }
  });

  it("all advertised generators are portable and describable", () => {
    const descriptors = horror.withSeed("descriptors").world.list();
    for (const id of generatorIds) {
      const descriptor = descriptors.find((d) => d.id === id);
      expect(descriptor, id).toBeDefined();
      expect(descriptor!.portable).toBe(true);
    }
  });
});
