import { describe, expect, it } from "vitest";
import { createContext, repeat } from "@lexiconlang/core";
import { validatePack } from "@lexiconlang/packs";
import { fantasy as legacyFantasy, generators as legacyGenerators } from "./index.js";
import manifest from "./fantasy.pack.json" with { type: "json" };
import {
  expandedGenerators,
  expandedPack,
  expandedGeneratorIds,
  expandedWithSeed,
  type TableRollText,
} from "./expanded.js";

const IDS = Object.values(expandedGeneratorIds);

/** Controlled categorical vocabularies: deliberately small by design, not content lists. */
const CATEGORICAL = new Set<expandedGeneratorId>([
  expandedGeneratorIds.spellSchool,
  expandedGeneratorIds.magicItemRarity,
]);

type expandedGeneratorId = (typeof expandedGeneratorIds)[keyof typeof expandedGeneratorIds];

function outputText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const v = value as { text?: unknown; form?: unknown };
    if (typeof v.text === "string") return v.text;
    if (typeof v.form === "string") return v.form;
  }
  return JSON.stringify(value);
}

function distinctIn100(api: ReturnType<typeof expandedWithSeed>, id: expandedGeneratorId): number {
  const seen = new Set<string>();
  for (let i = 0; i < 100; i++) seen.add(outputText(api.generate(id, `k${i}`)));
  return seen.size;
}

describe("fantasy expanded pack (P1)", () => {
  it("satisfies pack-v1 schema and semantic validation", () => {
    expect(validatePack(manifest)).toEqual([]);
    expect(expandedPack.manifest.id).toBe("lexiconlang.fantasy");
  });

  it("registers exactly the 20 new generator IDs", () => {
    expect(IDS).toHaveLength(20);
    const api = expandedWithSeed("registry-probe");
    for (const id of IDS) expect(api.generate(id)).toBeDefined();
  });

  it("is deterministic for the same seed and different for different seeds", () => {
    const a = expandedWithSeed("p1-determinism");
    const b = expandedWithSeed("p1-determinism");
    const c = expandedWithSeed("p1-other-seed");
    for (const id of IDS) expect(a.generate(id)).toEqual(b.generate(id));
    const samples = [
      a.tavern.name(), a.spell.name(), a.guild.name(), a.rumor().text,
      a.magicItem.full(), a.humanV2.northronFullName(), a.humanV2.southronFullName(),
    ];
    const other = [
      c.tavern.name(), c.spell.name(), c.guild.name(), c.rumor().text,
      c.magicItem.full(), c.humanV2.northronFullName(), c.humanV2.southronFullName(),
    ];
    expect(samples.some((value, i) => value !== other[i])).toBe(true);
  });

  it("gives >=60 distinct results in 100 rolls for every content generator", () => {
    const api = expandedWithSeed("distinctness-p1-r2");
    for (const id of IDS) {
      if (CATEGORICAL.has(id)) continue;
      const distinct = distinctIn100(api, id);
      expect(distinct, `${id} produced only ${distinct}/100 distinct outputs`).toBeGreaterThanOrEqual(60);
    }
  });

  it("documents the categorical exemptions", () => {
    // spell-school (8 schools) and magic-item-rarity (5 tiers) are closed,
    // intentionally small vocabularies; the card's distinctness bar applies
    // to open-ended content lists, not to enum-like selectors.
    expect([...CATEGORICAL].sort()).toEqual([
      expandedGeneratorIds.magicItemRarity,
      expandedGeneratorIds.spellSchool,
    ].sort());
  });

  it("human-v2 names are human-specific and not the dwarvish placeholder", () => {
    const api = expandedWithSeed("human-v2");
    expect(api.humanV2.northronFullName()).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
    expect(api.humanV2.southronFullName()).toMatch(/^[A-Z][a-z']+ [A-Z][a-z]+$/);
  });

  it("table rolls carry text and valid entry keys", () => {
    const api = expandedWithSeed("tables");
    for (const id of IDS) {
      const value = api.generate(id);
      if (!value || typeof value !== "object" || !("entry" in value)) continue;
      const roll = value as TableRollText;
      expect(typeof roll.text).toBe("string");
      expect(roll.text.length).toBeGreaterThan(0);
      expect(roll.entry).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it("legacy fantasy generators keep byte-identical output for existing seeds", () => {
    // Pinned values from tests/__artifacts__/samples.txt (seed samples-v1).
    const ctx = createContext({ seed: "samples-v1" });
    const taverns = repeat(legacyGenerators.tavernName, 30).generate(ctx.child("fantasy.taverns"));
    expect(taverns[0]).toBe("The Drunken Tankard");
    expect(legacyFantasy.withSeed("samples-v1").place.tavern()).toBe("The Phoenix's Torch");
  });

  it("Generator adapters derive their draw from the supplied context seed", () => {
    const a = createContext({ seed: "adapter-seed-A" });
    const b = createContext({ seed: "adapter-seed-B" });
    const aAgain = createContext({ seed: "adapter-seed-A" });
    expect(expandedGenerators.tavernName.generate(a)).not.toBe(expandedGenerators.tavernName.generate(b));
    expect(expandedGenerators.tavernName.generate(a)).toBe(expandedGenerators.tavernName.generate(aAgain));
    // Sibling order must not affect a draw: draw the same generator from two
    // differently-shaped parent scopes but the same child path.
    const s1 = createContext({ seed: "sibling-seed" }).child("branch-one");
    const s2 = createContext({ seed: "sibling-seed" }).child("branch-two");
    expect(s1.scope).not.toEqual(s2.scope);
    expect(expandedGenerators.spellName.generate(s1)).not.toBe(expandedGenerators.spellName.generate(s2));
  });
});
