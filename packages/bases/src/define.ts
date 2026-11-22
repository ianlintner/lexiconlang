import type { BaseData, OrthographyData, NameTemplate as PackNameTemplate, NameStructure as PackNameStructure } from "@lexiconlang/packs";

/** Inputs to define one B1 base descriptor. Strict fields are required; the rest have safe defaults. */
export interface DefineBaseInput {
  slug: string;
  inspiredBy: string;
  scope: string;
  glyphs: BaseData["glyphs"];
  templates: Readonly<Record<string, readonly { value: PackNameTemplate; weight: number }[]>>;
  nameStructures: Readonly<Record<string, PackNameStructure>>;
  orthography?: OrthographyData;
  romanization?: OrthographyData;
  corpus?: string;
  sensitivity?: Partial<BaseData["sensitivity"]>;
}

/**
 * Construct a B1 base descriptor with the S0 sensitivity framing applied by
 * default. All B1 data is original and CC0-1.0.
 */
export function defineBase(input: DefineBaseInput): BaseData {
  const packId = `lexiconlang.bases.${input.slug}`;
  const id = `${packId}/base/default`;
  return {
    id,
    inspiredBy: input.inspiredBy,
    scope: input.scope,
    glyphs: input.glyphs,
    orthography: input.orthography ?? {
      id: `${input.slug}-roman`,
      mappings: [],
      unknown: "preserve",
    },
    ...(input.romanization ? { romanization: input.romanization } : {}),
    templates: input.templates,
    nameStructures: input.nameStructures,
    ...(input.corpus ? { corpus: input.corpus } : {}),
    provenance: [`${input.slug}-prov`],
    sensitivity: {
      framing: "Inspired by documented phonology and naming patterns; fictional, simplified; not a linguistic reference.",
      exclusions: ["sacred or restricted names", "ceremonial material", "ethnic slurs", "living people's names"],
      review: "Original data reviewed for broad, non-stereotyped inspiration; no community endorsement claimed.",
      ...input.sensitivity,
    },
  };
}

/** A single weighted literal template, the simplest base `given` default. */
export function literal(form: string, translation: string, weight = 1): { value: PackNameTemplate; weight: number } {
  return { value: { kind: "literal", form, translation }, weight };
}

/** A single weighted `pick` template part. */
export function pick(
  cls: string,
  opts: { tag?: string; capitalize?: boolean } = {},
): { pick: string; tag?: string; capitalize?: boolean } {
  return { pick: cls, ...opts };
}
