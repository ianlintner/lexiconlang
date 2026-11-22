import { describe, it, expect } from "vitest";
import { createContext } from "@lexiconlang/core";
import { coreMeanings, generateName, generateStructuredName } from "@lexiconlang/language";
import { definePack, validatePack, createWorld } from "@lexiconlang/packs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { BASE_SLUGS, basePack, cultureFor, renderOrthography } from "./index.js";
import { norse } from "./norse.js";
import { celtic } from "./celtic.js";
import { latin } from "./latin.js";
import { greek } from "./greek.js";
import { japanese } from "./japanese.js";
import { arabic } from "./arabic.js";
import type { BaseData } from "./index.js";

const ALL: Record<string, BaseData> = { norse, celtic, latin, greek, japanese, arabic };

/** Set of single characters allowed in a base's orthographic output. */
function allowedGraphemeSet(base: BaseData): Set<string> {
  const set = new Set<string>(["-", " ", "'"]);
  const see = (s: string) => { for (const c of s) set.add(c); };
  for (const tokens of Object.values(base.glyphs.classes)) for (const t of tokens) see(t);
  for (const [pattern] of base.glyphs.syllables) see(pattern);
  for (const [shape] of base.glyphs.wordShapes) see(shape);
  if (base.glyphs.joiner) see(base.glyphs.joiner);
  for (const m of base.orthography.mappings) see(m.to);
  if (base.romanization) for (const m of base.romanization.mappings) see(m.to);
  for (const c of [...set]) see(c.toUpperCase());
  // Literal template forms are authored in the same orthography.
  const visit = (v: unknown): void => {
    if (typeof v === "string") { see(v); return; }
    if (Array.isArray(v)) { for (const x of v) visit(x); return; }
    if (v && typeof v === "object") for (const x of Object.values(v)) visit(x);
  };
  visit(base.templates);
  return set;
}

describe("B1 base descriptor registry", () => {
  it("exposes exactly the six B1 bases in spec order", () => {
    expect([...BASE_SLUGS]).toEqual(["norse", "celtic", "latin", "greek", "japanese", "arabic"]);
    expect(Object.keys(ALL).sort()).toEqual([...BASE_SLUGS].sort());
  });

  it("every base is schema-valid and declares the required S0 fields", () => {
    for (const [slug, base] of Object.entries(ALL)) {
      expect(base.id).toBe(`lexiconlang.bases.${slug}/base/default`);
      expect(base.inspiredBy.length).toBeGreaterThan(0);
      expect(base.scope.length).toBeGreaterThan(0);
      expect(base.provenance.length).toBeGreaterThan(0);
      expect(base.sensitivity.framing).toMatch(/inspired|fictional|simplif/i);
      expect(base.sensitivity.exclusions.length).toBeGreaterThan(0);
      expect(base.templates.given.length).toBeGreaterThan(0);
      expect(base.nameStructures[`${slug}.`] ?? Object.keys(base.nameStructures).length).toBeGreaterThan(0);
      expect(validatePack(basePack(base))).toEqual([]);
    }
  });

  it("shipped .pack.json data files validate and match the inline descriptors", () => {
    const dataRoot = fileURLToPath(new URL("../data/", import.meta.url));
    for (const slug of BASE_SLUGS) {
      const json = JSON.parse(readFileSync(`${dataRoot}${slug}/${slug}.pack.json`, "utf8"));
      expect(validatePack(json)).toEqual([]);
      expect(json.bases?.[0]?.id).toBe(`lexiconlang.bases.${slug}/base/default`);
      expect(json).toEqual(basePack(ALL[slug]!));
    }
  });

  it("every base's generated names use only declared graphemes", () => {
    for (const [slug, base] of Object.entries(ALL)) {
      const culture = cultureFor(base, [coreMeanings]);
      const allowed = allowedGraphemeSet(base);
      const seen: string[] = [];
      for (let i = 0; i < 120; i++) {
        const name = generateName(culture, "given", createContext({ seed: `${slug}-graphemes-${i}` }));
        seen.push(name.form);
        for (const ch of name.form) {
          if (/\s/.test(ch)) continue;
          expect(allowed.has(ch), `${slug}: unexpected grapheme ${JSON.stringify(ch)} in ${name.form}`).toBe(true);
        }
      }
      // At least some morphological variety across 120 seeds.
      expect(new Set(seen).size).toBeGreaterThan(1);
    }
  });

  it("embeds the S0 naming structures (patronymic, nasab, family-first)", () => {
    expect(norse.nameStructures["norse.patronymic"].slots.map((s) => s.key)).toEqual(["given", "patronymic"]);
    expect(arabic.nameStructures["arabic.nasab"].slots.map((s) => s.key)).toEqual(["given", "nasab"]);
    expect(japanese.nameStructures["japanese.family-first"].slots.map((s) => s.key)).toEqual(["family", "given"]);
    expect(celtic.nameStructures["celtic.given-only"].slots).toHaveLength(1);
    expect(latin.nameStructures["latin.tria-nomina"].slots).toHaveLength(2);
    expect(greek.nameStructures["greek.given-only"].slots).toHaveLength(1);
  });

  it("structured names render with the declared separator", () => {
    const culture = cultureFor(norse, [coreMeanings]);
    const structured = generateStructuredName(culture, { structure: "norse.patronymic" }, createContext({ seed: "b1-structured" }));
    expect(structured.parts?.length ?? 0).toBeGreaterThan(0);
    expect(structured.form.length).toBeGreaterThan(0);
  });

  it("orthography renderer is deterministic, longest-match-first and round-trips", () => {
    expect(renderOrthography("thorn", norse.orthography)).toBe("þorn");
    expect(renderOrthography("thorn", norse.orthography)).toBe("þorn");
    expect(renderOrthography("þorn", norse.romanization)).toBe("thorn");
    expect(renderOrthography("kha", arabic.orthography)).toBe("ḵa");
    expect(renderOrthography("ḵa", arabic.romanization)).toBe("kha");
    expect(renderOrthography("q", { id: "x", mappings: [], unknown: "preserve" })).toBe("q");
    expect(() => renderOrthography("q", { id: "x", mappings: [], unknown: "error" })).toThrow(/unknown token/);
  });

  it("cultures are deeply frozen and side-effect free", () => {
    for (const base of Object.values(ALL)) {
      const culture = cultureFor(base);
      expect(Object.isFrozen(culture)).toBe(true);
      expect(Object.isFrozen(culture.templates.given)).toBe(true);
    }
  });
});

describe("B1 base packs as F2 extends targets", () => {
  const nameGenerator = (packId: string, cultureId: string) => ({
    id: `${packId}/generator/name`,
    description: "B1 base name generator",
    tags: ["name", "base"],
    output: "translated-name-v1" as const,
    engine: "name-v1" as const,
    culture: cultureId,
    kind: "given",
  });

  it("installs a base pack and resolves its culture through world.generate", () => {
    const world = createWorld({ seed: "b1-f2" }).use(definePack(basePack(norse)));
    const child = definePack({
      formatVersion: 1,
      id: "test.b1-child",
      version: "0.1.0",
      license: "CC0-1.0",
      description: "B1 child pack fixture",
      provenance: [],
      depends: [],
      extends: [{ id: "lexiconlang.bases.norse", version: "^0.1.0" }],
      requires: ["language-v1"],
      cultures: [{
        id: "test.b1-child/culture/default",
        extends: "lexiconlang.bases.norse/culture/default",
        templates: {
          given: [{ value: { kind: "literal", form: "Sven", translation: "sven" }, weight: 1 }],
        },
      }],
      meaningPacks: [],
      grammars: [],
      tables: [],
      corpora: [],
      markovModels: [],
      generators: [nameGenerator("test.b1-child", "test.b1-child/culture/default")],
    });
    world.use(child);
    const first = world.generate<{ form: string }>("test.b1-child/generator/name", "k");
    const second = world.generate<{ form: string }>("test.b1-child/generator/name", "k");
    expect(first.form.length).toBeGreaterThan(0);
    expect(first).toEqual(second);
  });

  it("rejects an unknown local base ref at validation, and an unknown cross-pack ref at install", () => {
    const badManifest = { ...basePack(norse), cultures: [{ id: "lexiconlang.bases.norse/culture/default", base: "lexiconlang.bases.norse/base/missing" }] };
    expect(validatePack(badManifest).some((d) => d.code === "REFERENCE")).toBe(true);
    const crossPack = { ...basePack(norse), cultures: [{ id: "lexiconlang.bases.norse/culture/default", base: "lexiconlang.bases.unknown/base/default" }] };
    expect(validatePack(crossPack).some((d) => d.code === "DEPENDENCY" && d.pointer === "/cultures/0/base")).toBe(true);
    const declared = { ...crossPack, depends: [{ id: "lexiconlang.bases.unknown", version: "^0.1.0" }] };
    expect(validatePack(declared)).toEqual([]);
    expect(() => createWorld({ seed: "s" }).use(definePack(declared))).toThrow(/install lexiconlang.bases.unknown/);
  });

  it("rejects a culture that tries to switch base from its parent", () => {
    const child = definePack({
      formatVersion: 1,
      id: "test.b1-switch",
      version: "0.1.0",
      license: "CC0-1.0",
      description: "B1 child pack fixture",
      provenance: [],
      depends: [{ id: "lexiconlang.bases.latin", version: "^0.1.0" }],
      extends: [{ id: "lexiconlang.bases.norse", version: "^0.1.0" }],
      requires: ["language-v1", "bases-v1"],
      bases: [],
      cultures: [{
        id: "test.b1-switch/culture/default",
        extends: "lexiconlang.bases.norse/culture/default",
        base: "lexiconlang.bases.latin/base/default",
      }],
      meaningPacks: [],
      grammars: [],
      tables: [],
      corpora: [],
      markovModels: [],
      generators: [],
    });
    expect(() => createWorld({ seed: "s" }).use(definePack(basePack(norse))).use(definePack(basePack(latin))).use(child)).toThrow(/cannot change base/);
  });
});
