import { describe, expect, it } from "vitest";
import { createWorld, definePack, validatePack } from "./index.js";

const manifest = {
  formatVersion: 1,
  id: "acme.gloss",
  version: "1.0.0",
  license: "CC0-1.0",
  description: "Original meaning pack with locale glosses",
  provenance: [{
    id: "original",
    source: "original:acme",
    title: "Gloss demo",
    creator: "Acme",
    license: "CC0-1.0",
    attribution: "Original example authored for this test",
    modifications: "None",
    files: ["gloss.pack.json"],
  }],
  depends: [],
  extends: [],
  requires: ["language-v1"],
  cultures: [{
    id: "acme.gloss/culture/town",
    glyphs: { classes: { C: ["m", "n"], V: ["a", "i"] }, syllables: [["C V", 1]], wordShapes: [["2", 1]] },
    meaningPacks: [],
    templates: {
      given: [{ value: { kind: "literal", form: "Mira", translation: "admired" }, weight: 1 }],
    },
  }],
  meaningPacks: [{
    id: "acme.gloss/meaning/town",
    version: "1.0.0",
    meanings: [{
      id: "acme.gloss/meaning/stone",
      class: "noun",
      tags: ["earth"],
      label: "stone",
      glosses: { es: "piedra", de: "Stein", "es-MX": "piedra mexicana", ja: "石" },
    }],
  }],
  grammars: [],
  tables: [],
  corpora: [],
  markovModels: [],
  generators: [],
} as const;

describe("B4 locale glosses in pack JSON", () => {
  it("validates a meaning pack carrying a glosses map", () => {
    expect(validatePack(manifest)).toEqual([]);
  });

  it("rejects non-string gloss values", () => {
    const bad = structuredClone(manifest) as Record<string, unknown>;
    const packs = bad["meaningPacks"] as Array<{ meanings: Array<{ glosses: Record<string, unknown> }> }>;
    packs[0]!.meanings[0]!.glosses.es = 42;
    expect(validatePack(bad).some((d) => d.code === "SCHEMA")).toBe(true);
  });

  it("loads a pack whose meaning pack declares glosses", () => {
    const world = createWorld({ seed: "s" });
    expect(() => world.use(definePack(manifest))).not.toThrow();
  });
});
