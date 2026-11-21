import { describe, expect, it } from "vitest";
import { END, toJSON, type MarkovModel } from "@lexiconlang/markov";
import { createWorld, definePack, loadPack, satisfies, validatePack, PackValidationError } from "./index.js";
import type { LoadedPack, PackManifestV1 } from "./types.js";

function base(overrides: Partial<PackManifestV1> = {}): PackManifestV1 {
  return {
    $schema: "https://lexiconlang.dev/schemas/pack-v1.schema.json",
    formatVersion: 1,
    id: "test.base",
    version: "1.0.0",
    license: "CC0-1.0",
    description: "Original fictional test data",
    provenance: [{
      id: "original", source: "original:test.base", title: "Test data", creator: "Tester",
      license: "CC0-1.0", attribution: "Original", modifications: "None", files: ["test.pack.json"],
    }],
    depends: [], extends: [], requires: ["language-v1"],
    cultures: [{
      id: "test.base/culture/town",
      glyphs: { classes: { C: ["m", "n"], V: ["a", "e"] }, syllables: [["C V", 1]], wordShapes: [["2", 1]] },
      meaningPacks: [],
      templates: { given: [{ value: { kind: "literal", form: "Mira", translation: "admired" }, weight: 1 }] },
    }],
    meaningPacks: [], grammars: [], tables: [], corpora: [], markovModels: [],
    generators: [{
      id: "test.base/generator/name", engine: "name-v1", culture: "test.base/culture/town",
      kind: "given", description: "Town names", tags: ["name"], output: "translated-name-v1",
    }],
    ...overrides,
  };
}

describe("F2 dependency and resolution fixes", () => {
  it("accepts caret ranges in validatePack and resolves them at use time", () => {
    const basePack = definePack(base());
    const child = definePack(base({
      id: "test.child",
      depends: [{ id: "test.base", version: "^1.0.0" }],
      cultures: [], generators: [], requires: [],
    }));
    expect(validatePack(child.manifest)).toEqual([]);
    const world = createWorld({ seed: "s" }).use(basePack).use(child);
    expect(world.list()).toHaveLength(1);
  });

  it("supports extends with culture inheritance and deterministic generation", () => {
    const basePack = definePack(base());
    const child = definePack(base({
      id: "test.night",
      extends: [{ id: "test.base", version: "^1.0.0" }],
      cultures: [{
        id: "test.night/culture/town",
        extends: "test.base/culture/town",
        templates: { given: [{ value: { kind: "literal", form: "Nyx", translation: "night" }, weight: 1 }] },
      }],
      generators: [{
        id: "test.night/generator/name", engine: "name-v1", culture: "test.night/culture/town",
        kind: "given", description: "Night names", tags: [], output: "translated-name-v1",
      }],
    }));
    const world = createWorld({ seed: "s" }).use(basePack).use(child);
    const value = world.generate<{ form: string }>("test.night/generator/name", "k");
    expect(typeof value.form).toBe("string");
    // Child template overrides the parent's pool.
    expect(JSON.stringify(value)).toContain("Nyx");
    // Parent still works independently.
    expect(typeof world.generate("test.base/generator/name", "k")).toBe("object");
  });

  it("rejects a child whose declared dependency was not installed first", () => {
    const child = definePack(base({ id: "test.orphan", depends: [{ id: "test.base", version: "1.0.0" }], cultures: [], generators: [], requires: [] }));
    expect(() => createWorld({ seed: "s" }).use(child)).toThrow(PackValidationError);
  });

  it("rejects an installed version that does not satisfy the declared range", () => {
    const installed = definePack(base({ version: "2.0.0" }));
    const child = definePack(base({ id: "test.child", depends: [{ id: "test.base", version: "^1.0.0" }], cultures: [], generators: [], requires: [] }));
    expect(() => createWorld({ seed: "s" }).use(installed).use(child)).toThrow(/does not satisfy/);
  });

  it("reports correct JSON Pointers for depends and extends diagnostics", () => {
    // Schema-valid self-dependency + duplicate declaration; semantic layer must report both.
    const m = base({
      id: "test.pointers",
      depends: [{ id: "test.pointers", version: "^1.0.0" }],
      extends: [{ id: "test.pointers", version: "^1.0.0" }],
      cultures: [], generators: [], requires: [],
    });
    const d = validatePack(m);
    expect(d.some((x) => x.pointer === "/depends/0/id")).toBe(true);
    expect(d.some((x) => x.pointer === "/extends/0/id")).toBe(true);
  });

  it("satisfies() implements exact and caret ranges", () => {
    expect(satisfies("1.0.0", "1.0.0")).toBe(true);
    expect(satisfies("1.0.1", "1.0.0")).toBe(false);
    expect(satisfies("1.2.3", "^1.0.0")).toBe(true);
    expect(satisfies("2.0.0", "^1.0.0")).toBe(false);
    expect(satisfies("0.2.1", "^0.2.0")).toBe(true);
    expect(satisfies("0.3.0", "^0.2.0")).toBe(false);
  });
});

describe("F2 engine coverage", () => {
  const enginesManifest = (): PackManifestV1 => base({
    id: "test.engines", requires: ["language-v1", "grammar-v1", "tables-v1"],
    cultures: [], generators: [],
    grammars: [{
      id: "test.engines/grammar/g", start: "S",
      rules: [{ key: "S", choices: [{ value: "hello world", weight: 1 }] }],
    }],
    tables: [{
      id: "test.engines/table/t", mode: "weighted",
      entries: [{ key: "only", weight: 1, result: { type: "text", text: "picked" } }],
    }],
    generators: [
      {
        id: "test.engines/generator/g", engine: "grammar-v1", grammar: "test.engines/grammar/g",
        description: "Grammar", tags: [], output: "string",
      },
      {
        id: "test.engines/generator/t", engine: "table-v1", table: "test.engines/table/t",
        description: "Table", tags: [], output: "table-roll-v1",
      },
    ],
  });

  it("runs grammar-v1 and table-v1 generators", () => {
    expect(validatePack(enginesManifest())).toEqual([]);
    const world = createWorld({ seed: "s" }).use(definePack(enginesManifest()));
    expect(world.generate("test.engines/generator/g", "k")).toBe("hello world");
    const roll = world.generate<{ value: { text: string } }>("test.engines/generator/t", "k");
    expect(JSON.stringify(roll)).toContain("picked");
  });
});

describe("F2 asset integrity and markov-v1", () => {
  function markovAsset(): MarkovModel {
    // END transitions use a real NUL sentinel, as emitted by @lexiconlang/markov toJSON.
    const model: MarkovModel = {
      order: 1, minLength: 1, maxLength: 3,
      transitions: {
        "": { a: 1 },
        a: { b: 1 },
        b: { [END]: 1 },
      },
    };
    return model;
  }

  it("rejects a markov asset whose SHA-256 does not match", async () => {
    const text = JSON.stringify({ bad: true });
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    const correct = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
    const manifest = base({
      id: "test.assets", requires: ["markov-v1"],
      corpora: [{ id: "test.assets/corpus/c", provenance: ["original"], asset: { path: "model.json", sha256: correct } }],
      markovModels: [], cultures: [], generators: [],
    });
    const resolver = {
      async resolve() { throw new Error("unexpected resolve"); },
      async readAsset() { return new TextEncoder().encode("{\"different\":true}"); },
    };
    await expect(loadPack(JSON.stringify(manifest), { resolver })).rejects.toMatchObject({
      diagnostics: [expect.objectContaining({ code: "INTEGRITY" })],
    });
  });

  it("samples a markov model with a real NUL END sentinel", async () => {
    const model = markovAsset();
    const bytes = new TextEncoder().encode(JSON.stringify(toJSON(model)));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const sha256 = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
    const manifest = base({
      id: "test.markov", requires: ["markov-v1"],
      corpora: [{ id: "test.markov/corpus/c", provenance: ["original"], asset: { path: "model.json", sha256 } }],
      markovModels: [{
        id: "test.markov/markov/m", corpus: "test.markov/corpus/c", profile: "markov-json-v1",
        asset: { path: "model.json", sha256 },
      }],
      cultures: [], generators: [{
        id: "test.markov/generator/g", engine: "markov-v1", model: "test.markov/markov/m",
        description: "Markov", tags: [], output: "string",
      }],
    });
    const resolver = {
      async resolve() { throw new Error("unexpected resolve"); },
      async readAsset() { return bytes; },
    };
    const pack: LoadedPack = await loadPack(JSON.stringify(manifest), { resolver });
    const world = createWorld({ seed: "s" }).use(pack);
    expect(world.generate("test.markov/generator/g", "k")).toBe("ab");
  });
});
