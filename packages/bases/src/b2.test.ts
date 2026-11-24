import { describe, it, expect } from "vitest";
import { createContext } from "@lexiconlang/core";
import { coreMeanings, generateName, generateStructuredName } from "@lexiconlang/language";
import { validatePack } from "@lexiconlang/packs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { BASE_SLUGS, basePack, cultureFor, renderOrthography } from "./index.js";
import { slavic } from "./slavic.js";
import { oldEnglish } from "./old-english.js";
import { persian } from "./persian.js";
import { sanskrit } from "./sanskrit.js";
import { mandarin } from "./mandarin.js";
import { nahuatl } from "./nahuatl.js";
import { yoruba } from "./yoruba.js";
import { polynesian } from "./polynesian.js";
import { ancientEgyptian } from "./ancient-egyptian.js";
import { finnish } from "./finnish.js";
import type { BaseData } from "./index.js";

const B2_SLUGS = [
  "slavic", "old-english", "persian", "sanskrit", "mandarin",
  "nahuatl", "yoruba", "polynesian", "ancient-egyptian", "finnish",
] as const;

const ALL: Record<string, BaseData> = {
  slavic, "old-english": oldEnglish, persian, sanskrit, mandarin,
  nahuatl, yoruba, polynesian, "ancient-egyptian": ancientEgyptian, finnish,
};

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
  const visit = (v: unknown): void => {
    if (typeof v === "string") { see(v); return; }
    if (Array.isArray(v)) { for (const x of v) visit(x); return; }
    if (v && typeof v === "object") for (const x of Object.values(v)) visit(x);
  };
  visit(base.templates);
  return set;
}

describe("B2 base descriptor registry", () => {
  it("exposes the B1 slugs followed by exactly the ten B2 slugs", () => {
    expect([...BASE_SLUGS]).toEqual([
      "norse", "celtic", "latin", "greek", "japanese", "arabic",
      ...B2_SLUGS,
    ]);
    expect(Object.keys(ALL).sort()).toEqual([...B2_SLUGS].sort());
  });

  it("every B2 base is schema-valid and declares the required S0 fields", () => {
    for (const [slug, base] of Object.entries(ALL)) {
      expect(base.id).toBe(`lexiconlang.bases.${slug}/base/default`);
      expect(base.inspiredBy.length).toBeGreaterThan(0);
      expect(base.scope.length).toBeGreaterThan(0);
      expect(base.provenance.length).toBeGreaterThan(0);
      expect(base.sensitivity.framing).toMatch(/inspired|fictional|simplif/i);
      expect(base.sensitivity.exclusions.length).toBeGreaterThan(0);
      expect(base.templates.given.length).toBeGreaterThan(0);
      expect(Object.keys(base.nameStructures).length).toBeGreaterThan(0);
      expect(validatePack(basePack(base))).toEqual([]);
    }
  });

  it("shipped B2 .pack.json data files validate and match the inline descriptors", () => {
    const dataRoot = fileURLToPath(new URL("../data/", import.meta.url));
    for (const slug of B2_SLUGS) {
      const json = JSON.parse(readFileSync(`${dataRoot}${slug}/${slug}.pack.json`, "utf8"));
      expect(validatePack(json)).toEqual([]);
      expect(json.bases?.[0]?.id).toBe(`lexiconlang.bases.${slug}/base/default`);
      expect(json).toEqual(basePack(ALL[slug]!));
    }
  });

  it("every B2 base's generated names use only declared graphemes", () => {
    for (const [slug, base] of Object.entries(ALL)) {
      const culture = cultureFor(base, [coreMeanings]);
      const allowed = allowedGraphemeSet(base);
      const seen: string[] = [];
      for (let i = 0; i < 120; i++) {
        const name = generateName(culture, "given", createContext({ seed: `${slug}-b2-graphemes-${i}` }));
        seen.push(name.form);
        for (const ch of name.form) {
          if (/\s/.test(ch)) continue;
          expect(allowed.has(ch), `${slug}: unexpected grapheme ${JSON.stringify(ch)} in ${name.form}`).toBe(true);
        }
      }
      expect(new Set(seen).size).toBeGreaterThan(1);
    }
  });

  it("embeds the B2 naming structures", () => {
    expect(slavic.nameStructures["slavic.patronymic"].slots.map((s) => s.key)).toEqual(["given", "patronymic"]);
    expect(oldEnglish.nameStructures["old-english.patronymic"].slots.map((s) => s.key)).toEqual(["given", "patronymic"]);
    expect(persian.nameStructures["persian.nasab"].slots.map((s) => s.key)).toEqual(["given", "nasab"]);
    expect(mandarin.nameStructures["mandarin.family-first"].slots.map((s) => s.key)).toEqual(["family", "given"]);
    expect(polynesian.nameStructures["polynesian.given-only"].slots).toHaveLength(1);
    expect(ancientEgyptian.nameStructures["ancient-egyptian.given-only"].slots).toHaveLength(1);
    expect(finnish.nameStructures["finnish.given-family"].slots.map((s) => s.key)).toEqual(["given", "family"]);
  });

  it("structured B2 names render with the declared separator and every slot has a template pool", () => {
    for (const [slug, base] of Object.entries(ALL)) {
      const culture = cultureFor(base, [coreMeanings]);
      for (const structure of Object.keys(base.nameStructures)) {
        for (const seed of ["b2-structured-a", "b2-structured-b"]) {
          const structured = generateStructuredName(
            culture,
            { structure },
            createContext({ seed: `${slug}-${structure}-${seed}` }),
          );
          expect(structured.form.length, `${slug}/${structure}`).toBeGreaterThan(0);
          expect(structured.parts?.length ?? 0, `${slug}/${structure}`).toBeGreaterThan(0);
          expect(structured.form.trim().split(/\s+/).length).toBe(
            base.nameStructures[structure]!.slots.length,
          );
        }
      }
    }
  });

  it("tone-marked bases round-trip to ASCII and back", () => {
    expect(renderOrthography("ma", mandarin.orthography)).toBe("mā");
    expect(renderOrthography("mā", mandarin.romanization)).toBe("ma");
    expect(renderOrthography("to", yoruba.orthography)).toBe("tó");
    expect(renderOrthography("tó", yoruba.romanization)).toBe("to");
    expect(renderOrthography("nga", polynesian.orthography)).toBe("ŋa");
    expect(renderOrthography("ŋa", polynesian.romanization)).toBe("nga");
  });

  it("Polynesian is CV-only: no consonant cluster patterns", () => {
    for (const [pattern] of polynesian.glyphs.syllables) {
      expect(pattern).not.toMatch(/C\s+C/);
    }
    expect(polynesian.glyphs.constraints?.some((c) => c.pattern.join("") === "CC")).toBe(true);
  });

  it("cultures are deeply frozen and side-effect free", () => {
    for (const base of Object.values(ALL)) {
      const culture = cultureFor(base);
      expect(Object.isFrozen(culture)).toBe(true);
      expect(Object.isFrozen(culture.templates.given)).toBe(true);
    }
  });
});
