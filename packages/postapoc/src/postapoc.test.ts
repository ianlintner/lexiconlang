import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createWorld, validatePack } from "@lexiconlang/packs";
import { generatorIds, pack, postapoc, type PostapocName, type PostapocRoll } from "./index.js";

const raw = JSON.parse(readFileSync(new URL("./postapoc.pack.json", import.meta.url), "utf8"));

describe("postapoc pack", () => {
  it("pack JSON passes schema + semantic validation", () => {
    expect(validatePack(raw)).toEqual([]);
    expect(pack.manifest.version).toBe("0.1.0");
  });

  it("declares provenance and a CC0 license, with no deps outside the pack", () => {
    expect(raw.license).toBe("CC0-1.0");
    expect(raw.provenance.length).toBeGreaterThan(0);
    expect(raw.cultures.length).toBeGreaterThanOrEqual(2);
    expect(Object.keys(generatorIds).length).toBeGreaterThanOrEqual(6);
  });

  it("every declared generator id is installed", () => {
    const world = createWorld({ seed: "ids" }).use(pack);
    const ids = world.list().map((d) => d.id).sort();
    expect(ids).toEqual(Object.values(generatorIds).sort());
  });

  it("is deterministic: same seed, same call sequence => same output", () => {
    const run = (seed: string) => {
      const a = postapoc.withSeed(seed);
      return [a.person(), a.person("techcult"), a.person("vaultborn"), a.settlement(), a.settlement("techcult"), a.raiders(), a.techcult(), a.vault(), a.mutation(), a.gear(), a.vehicle(), a.tradeGoods(), a.encounter()];
    };
    expect(run("dust-1")).toEqual(run("dust-1"));
    expect(run("dust-1")).not.toEqual(run("dust-2"));
  });

  it("names carry meaningful translations", () => {
    const api = postapoc.withSeed("translate");
    for (const culture of ["scrapper", "techcult", "vaultborn"] as const) {
      const p = api.person(culture);
      expect(p.form.length).toBeGreaterThan(0);
      expect(p.translation.length).toBeGreaterThan(0);
    }
    // degraded English differs from its gloss for at least some scrapper names
    const differing = Array.from({ length: 30 }, () => api.person()).filter((p) => p.form !== p.translation);
    expect(differing.length).toBeGreaterThan(0);
  });

  it("emits >=60% distinct results over 100 rolls for every generator", () => {
    const world = createWorld({ seed: "distinct-family" }).use(pack);
    for (const id of Object.values(generatorIds)) {
      const seen = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const v = world.generateItem<PostapocName | PostapocRoll | string>(id, "batch", i);
        seen.add(typeof v === "string" ? v : "text" in v ? v.text : v.form);
      }
      expect(seen.size, `${id} distinct`).toBeGreaterThanOrEqual(60);
    }
  });

  it("encounters mix raider, hazard and ruin branches", () => {
    const world = createWorld({ seed: "enc" }).use(pack);
    const entries = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const roll = world.generateItem<{ children: { table: string }[] }>(generatorIds.encounter, "e", i);
      for (const child of roll.children) entries.add(child.table);
    }
    expect(entries.size).toBeGreaterThanOrEqual(4);
  });
});
