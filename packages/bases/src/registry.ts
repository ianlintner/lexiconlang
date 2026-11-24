import { defineCulture, freezeCulture, type Culture, type GlyphSystem, type NameStructure, type NameTemplate } from "@lexiconlang/language";
import type { BaseData, NameTemplate as PackNameTemplate, NameStructure as PackNameStructure } from "@lexiconlang/packs";

export type { BaseData, OrthographyData, SensitivityData } from "@lexiconlang/packs";

export type BaseSlug =
  | "norse"
  | "celtic"
  | "latin"
  | "greek"
  | "japanese"
  | "arabic"
  | "slavic"
  | "old-english"
  | "persian"
  | "sanskrit"
  | "mandarin"
  | "nahuatl"
  | "yoruba"
  | "polynesian"
  | "ancient-egyptian"
  | "finnish";

/** All B1 and B2 slugs, in spec order. */
export const BASE_SLUGS = [
  "norse", "celtic", "latin", "greek", "japanese", "arabic",
  "slavic", "old-english", "persian", "sanskrit", "mandarin",
  "nahuatl", "yoruba", "polynesian", "ancient-egyptian", "finnish",
] as const satisfies readonly BaseSlug[];

/**
 * Apply an orthography mapping to a token string.
 *
 * Mappings are matched longest-first; ties resolve by authored array order
 * (stable sort preserves input order). No random component, no Unicode
 * normalization of the generated form — this is a pure renderer.
 */
export function renderOrthography(
  form: string,
  orthography: BaseData["orthography"] | undefined,
): string {
  if (!orthography) return form;
  const sorted = [...orthography.mappings].sort((a, b) => b.from.length - a.from.length);
  let out = "";
  let i = 0;
  outer: while (i < form.length) {
    for (const { from, to } of sorted) {
      if (form.startsWith(from, i)) {
        out += to;
        i += from.length;
        continue outer;
      }
    }
    if (orthography.unknown === "error") {
      throw new Error(`orthography ${orthography.id}: unknown token at offset ${i} in ${JSON.stringify(form)}`);
    }
    out += form[i];
    i += 1;
  }
  return out;
}

function toLanguageTemplate(t: PackNameTemplate): NameTemplate {
  if (t.kind === "literal") {
    return { kind: "literal", form: t.form ?? "", translation: t.translation ?? "" };
  }
  return {
    kind: "compose",
    parts: (t.parts ?? []).map((p) => {
      if (typeof p.literal === "string") {
        return { literal: p.literal, translation: p.translation };
      }
      return { pick: (p.pick ?? "") as never, tag: p.tag, capitalize: p.capitalize === true };
    }),
    sep: t.sep,
    transSep: t.transSep,
  };
}

function toGlyphSystem(g: BaseData["glyphs"]): GlyphSystem {
  return {
    classes: { ...g.classes },
    syllables: g.syllables.map(([pattern, weight]) => [pattern, weight]),
    wordShapes: g.wordShapes.map(([shape, weight]) => [shape, weight]),
    ...(g.constraints ? { constraints: g.constraints } : {}),
    ...(g.joiner ? { joiner: g.joiner } : {}),
  };
}

function toNameStructures(
  structures: Readonly<Record<string, PackNameStructure>>,
): Record<string, NameStructure> {
  return Object.fromEntries(
    Object.entries(structures).map(([key, s]) => [key, { ...s } as NameStructure]),
  );
}

/**
 * Build a directly usable, deep-frozen {@link Culture} from a base descriptor.
 *
 * The base supplies glyphs, name templates and name structures. Meaning packs
 * are intentionally empty: "base defaults do not inject genre meanings" (S0
 * §13). Callers that want semantic names should `extends` this culture in a
 * pack and list their own meaning packs.
 */
export function cultureFor(base: BaseData, meaningPacks: Culture["meaningPacks"] = []): Culture {
  const templates = Object.fromEntries(
    Object.entries(base.templates).map(([kind, choices]) => [
      kind,
      choices.map((c) => [toLanguageTemplate(c.value), c.weight] as const),
    ]),
  );
  return freezeCulture(defineCulture({
    id: `${base.id}/culture/default`,
    glyphs: toGlyphSystem(base.glyphs),
    meaningPacks,
    templates: templates as Culture["templates"],
    nameStructures: toNameStructures(base.nameStructures),
    capitalize: "first",
  }));
}

/**
 * Wrap a base descriptor in a minimal inline F2 pack that declares and
 * exposes it, with the culture as an `extends` target.
 *
 * The pack owns the base at `<packId>/base/default` and a root culture at
 * `<packId>/culture/default` that references the base. A genre pack can then
 * `extends: [{ id: "<packId>", version: "^0.1.0" }]` and set
 * `culture.extends = "<packId>/culture/default"` to inherit the base's
 * phonotactics and naming conventions while supplying its own meaning packs.
 */
export function basePack(base: BaseData): import("@lexiconlang/packs").PackManifestV1 {
  const packId = base.id.split("/")[0] as string;
  const baseId = `${packId}/base/default`;
  const cultureId = `${packId}/culture/default`;
  const descriptor: BaseData = { ...base, id: baseId };
  return {
    formatVersion: 1,
    id: packId,
    version: "0.1.0",
    license: "CC0-1.0",
    description: `${base.scope} — ${base.inspiredBy}. Fictional, simplified; not a linguistic reference.`,
    provenance: [{
      id: `${base.id.split("/")[0]!.replaceAll(".", "-")}-prov`,
      source: `original:${packId}`,
      title: base.inspiredBy,
      creator: "LexiconLang contributors",
      license: "CC0-1.0",
      attribution: "Original data authored for LexiconLang",
      modifications: "None",
      files: [`data/${base.id.split("/").pop() as string}/${base.id.split("/").pop() as string}.pack.json`],
    }],
    depends: [],
    extends: [],
    requires: ["language-v1", "bases-v1"],
    bases: [descriptor],
    cultures: [{
      id: cultureId,
      base: baseId,
    }],
    meaningPacks: [],
    grammars: [],
    tables: [],
    corpora: [],
    markovModels: [],
    generators: [],
  };
}
