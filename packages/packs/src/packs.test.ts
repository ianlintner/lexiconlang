import { describe, expect, it } from "vitest";
import { createWorld, definePack, loadPack, validatePack } from "./index.js";

const manifest = {
  $schema: "https://lexiconlang.dev/schemas/pack-v1.schema.json",
  formatVersion: 1,
  id: "acme.sail",
  version: "1.0.0",
  license: "CC0-1.0",
  description: "Original fictional sailing names and weather oracle",
  provenance: [{
    id: "original",
    source: "original:acme",
    title: "Sailing demo",
    creator: "Acme",
    license: "CC0-1.0",
    attribution: "Original example authored for this specification",
    modifications: "None",
    files: ["sail.pack.json"],
  }],
  depends: [],
  extends: [],
  requires: ["language-v1"],
  cultures: [{
    id: "acme.sail/culture/harbor",
    glyphs: { classes: { C: ["m", "n", "s"], V: ["a", "i", "o"] }, syllables: [["C V", 1]], wordShapes: [["2", 1]] },
    meaningPacks: [],
    templates: {
      given: [{ value: { kind: "literal", form: "Mina", translation: "Mina" }, weight: 1 }],
      ship: [{ value: { kind: "literal", form: "Quiet Wake", translation: "Quiet Wake" }, weight: 1 }],
    },
  }],
  meaningPacks: [],
  grammars: [],
  tables: [],
  corpora: [],
  markovModels: [],
  generators: [{
    id: "acme.sail/generator/ship",
    engine: "name-v1",
    culture: "acme.sail/culture/harbor",
    kind: "ship",
    description: "A harbor ship name",
    tags: ["ship"],
    output: "translated-name-v1",
  }],
} as const;

describe("F2 pack format", () => {
  it("validates a complete v1 manifest with no diagnostics", () => {
    expect(validatePack(manifest)).toEqual([]);
  });

  it("reports schema diagnostics with a JSON Pointer", () => {
    const bad = { ...manifest, id: "Acme Sail" };
    const diagnostics = validatePack(bad);
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics[0]).toMatchObject({ code: "SCHEMA", pointer: "/id" });
    expect(diagnostics[0]?.message).toMatch(/pack id|pattern/i);
  });

  it("freezes a defined pack and produces a stable content hash", async () => {
    const pack = definePack(manifest);
    expect(pack.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(Object.isFrozen(pack.manifest)).toBe(true);
    expect((await loadPack(JSON.stringify(manifest))).hash).toBe(pack.hash);
  });

  it("rejects duplicate object keys in JSON text", async () => {
    const text = JSON.stringify(manifest).replace(
      '"description":"Original fictional sailing names and weather oracle"',
      '"description":"First", "description":"Second"',
    );
    await expect(loadPack(text)).rejects.toMatchObject({
      diagnostics: [expect.objectContaining({ code: "SCHEMA", pointer: "/description" })],
    });
  });

  it("generates names through a world with stable child paths", () => {
    const world = createWorld({ seed: "campaign-7" });
    world.use(definePack(manifest));
    const once = world.generate("acme.sail/generator/ship", "harbor-1");
    const again = createWorld({ seed: "campaign-7" });
    again.use(definePack(manifest));
    expect(again.generate("acme.sail/generator/ship", "harbor-1")).toEqual(once);
    expect(world.generate("acme.sail/generator/ship", "harbor-1")).toEqual(once);
    expect(again.generate("acme.sail/generator/ship", "other")).toEqual(world.generate("acme.sail/generator/ship", "other"));
    expect(world.generateItem("acme.sail/generator/ship", "batch", 0)).toEqual(
      createWorld({ seed: "campaign-7" }).use(definePack(manifest)).generateItem("acme.sail/generator/ship", "batch", 0),
    );
    expect(world.list().map((d) => d.id)).toEqual(["acme.sail/generator/ship"]);
    expect(world.describe("acme.sail/generator/ship").output).toBe("translated-name-v1");
  });

  it("accepts non-string seeds (spec Seed type)", () => {
    const a = createWorld({ seed: 42 });
    a.use(definePack(manifest));
    const b = createWorld({ seed: 42 });
    b.use(definePack(manifest));
    expect(a.generate("acme.sail/generator/ship", "k")).toEqual(b.generate("acme.sail/generator/ship", "k"));
  });

  it("reports an unresolved dependency when used in a world", () => {
    const needy = { ...manifest, id: "acme.needy", depends: [{ id: "acme.missing", range: "^1.0.0" }] };
    let codes: string[] = [];
    try {
      createWorld({ seed: "s" }).use(definePack(needy as never));
    } catch (e) {
      codes = (e as { diagnostics: { code: string }[] }).diagnostics.map((d) => d.code);
    }
    expect(codes.length).toBeGreaterThan(0);
  });

  it("rejects installing a conflicting second version of the same pack id", () => {
    const world = createWorld({ seed: "s" });
    world.use(definePack(manifest));
    expect(() => world.use(definePack({ ...manifest, version: "1.0.1" }) as never)).toThrow();
  });

  it("reports schema errors for unknown top-level fields", () => {
    const diagnostics = validatePack({ ...manifest, bogus: true });
    expect(diagnostics.some((d) => d.code === "SCHEMA")).toBe(true);
  });
});
