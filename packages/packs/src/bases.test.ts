import { describe, it, expect } from "vitest";
import { definePack, validatePack, createWorld } from "./index.js";
import { SUPPORTED_CAPABILITIES } from "./semantic.js";
import type { PackManifestV1 } from "./types.js";

const baseManifest = (): PackManifestV1 => ({
  formatVersion: 1,
  id: "test.basesv1",
  version: "0.1.0",
  license: "CC0-1.0",
  description: "F2 bases-v1 fixture",
  provenance: [],
  depends: [],
  extends: [],
  requires: ["language-v1", "bases-v1"],
  bases: [{
    id: "test.basesv1/base/default",
    inspiredBy: "fixture",
    scope: "fixture base",
    glyphs: { classes: { C: ["b"], V: ["a"] }, syllables: [["C V", 1]], wordShapes: [["1", 1]] },
    orthography: { id: "fixture-orth", mappings: [], unknown: "preserve" },
    templates: { given: [{ value: { kind: "literal", form: "Ba", translation: "ba" }, weight: 1 }] },
    nameStructures: {},
    provenance: ["fixture-prov"],
    sensitivity: { framing: "fictional", exclusions: [], review: "fixture" },
  }],
  cultures: [{ id: "test.basesv1/culture/default", base: "test.basesv1/base/default" }],
  meaningPacks: [],
  grammars: [],
  tables: [],
  corpora: [],
  markovModels: [],
  generators: [],
});

describe("F2 bases-v1 capability", () => {
  it("advertises bases-v1 as a supported capability", () => {
    expect(SUPPORTED_CAPABILITIES.has("bases-v1")).toBe(true);
  });

  it("validates and installs a pack with base resources", () => {
    expect(validatePack(baseManifest())).toEqual([]);
    const world = createWorld({ seed: "bases-v1" });
    expect(() => world.use(definePack(baseManifest()))).not.toThrow();
  });

  it("requires the capability declaration when bases are present", () => {
    const bad = { ...baseManifest(), requires: ["language-v1"] };
    expect(validatePack(bad).some((d) => d.code === "CAPABILITY" && d.pointer === "/requires")).toBe(true);
  });
});
