import type { Generator, Context } from "@lexiconlang/core";

// Visual glyph types (avoids circular dependency)
export type RenderFormat = "svg" | "unicode" | "canvas";
export type MappingStrategy = "phoneme" | "morpheme" | "holistic";

export interface Glyph {
  id: string;
  meaning?: string;
  svg?: string;
  canvasInstructions?: Array<{ type: string; params: Array<number | string> }>;
  unicode?: string;
}

export interface GlyphSet {
  phonetic?: Glyph[];
  conceptual?: Glyph[];
  holistic?: Glyph;
}

export interface VisualGlyphSystem {
  id: string;
  type: "alphabet" | "conceptual";
  renderFormat: RenderFormat;
  mappingStrategy: MappingStrategy;
  generator?: {
    baseShapes: Array<"rect" | "circle" | "line" | "arc" | "polygon">;
    complexity: "simple" | "medium" | "complex";
    symmetry: boolean;
    palette?: string[];
  };
  templates?: Array<{
    id: string;
    baseShape: "rect" | "circle" | "line";
    variants: number;
    modifiers: Array<"rotate" | "scale" | "stroke">;
  }>;
  unicodeMappings?: Record<string, string>;
  renderParams?: {
    size?: number;
    strokeWidth?: number;
    fallback?: string;
  };
}

/** Atomic glyph classes and their phonotactic rules. */
export interface GlyphSystem {
  /** Named classes of glyphs (e.g., C, V, sigil, mark). */
  classes: Record<string, readonly string[]>;
  /** Syllable templates: space-separated class names. e.g. "C V", "C V C", "sigil mark". */
  syllables: Array<[template: string, weight: number]>;
  /** Word shapes: syllable counts. e.g. "1", "2", "1-2" (range). */
  wordShapes: Array<[shape: string, weight: number]>;
  /** Optional phonotactic constraints. */
  constraints?: readonly Constraint[];
  /** Joiner between syllables. Default "". */
  joiner?: string;
}

/** Phonotactic constraint. */
export interface Constraint {
  /** Pattern of class names; "*" matches any. */
  pattern: readonly string[];
  /** "forbid" or { maxOccurrences }. */
  rule: "forbid" | { maxOccurrences: number };
}

/** A semantic unit with stable identity. */
export interface Meaning {
  /** Stable identifier (never rename after release). */
  id: string;
  /** Grammatical class. */
  class: WordClass;
  /** Semantic tags for template filtering. */
  tags: readonly string[];
  /** Human-readable label (legacy English fallback). Never an RNG key. */
  label?: string;
  /**
   * Localized glosses keyed by BCP 47 locale tag (e.g. `es`, `de`, `ja`).
   * Opt-in: absent locale keeps the legacy `label` translation exactly.
   */
  glosses?: Readonly<Record<string, string>>;
}

/** Word classes shipped by @lexiconlang/language itself. */
export const builtinWordClasses = ["noun", "adjective", "verb", "particle"] as const;

/** The four core word classes. */
export type BuiltinWordClass = (typeof builtinWordClasses)[number];

/**
 * Extensible word class.
 *
 * The four built-ins (`noun`, `adjective`, `verb`, `particle`) keep their
 * literal types, but a culture or pack may declare additional classes
 * (`classifier`, `honorific`, `measure`, ...) and reference them from
 * templates, meanings and {@link Lexicon.byClass}.
 */
export type WordClass = BuiltinWordClass | (string & {});

/** True when `c` is one of the four built-in word classes. */
export function isBuiltinWordClass(c: WordClass): c is BuiltinWordClass {
  return (builtinWordClasses as readonly string[]).includes(c);
}

/** A word class declared by a culture/pack, with optional documentation. */
export interface WordClassDefinition {
  id: WordClass;
  label?: string;
  description?: string;
}

/** Named collection of meanings. */
export interface MeaningPack {
  id: string;                    // "core", "fantasy.industrial"
  version: string;               // semver
  meanings: readonly Meaning[];
}

/** Lazy + eager lexicon for a culture. */
export interface Lexicon {
  readonly cultureId: string;
  formOf(meaningId: string): string;
  byClass(c: WordClass, tag?: string): readonly Meaning[];
  materialize(): ReadonlyMap<string, string>;
}

/**
 * Culture: glyph system + meanings + templates.
 *
 * `K` is the set of name kinds the culture declares. Custom kinds
 * (`ship`, `tavern`, `deity`, `guild`, `epithet`, `title`, ...) are first-class
 * members of the open `templates` record — the built-in kinds keep their
 * optional-property types, everything else is a pack-declared kind.
 */
export interface Culture<K extends string = string> {
  id: string;
  glyphs: GlyphSystem;
  meaningPacks: readonly MeaningPack[];
  templates: NameTemplates & Partial<Record<K, TemplateChoices>>;
  capitalize?: "first" | "all" | "none";
  visualGlyphSystems?: Record<string, VisualGlyphSystem>;
  /** Additional word classes declared alongside the culture's packs. */
  wordClasses?: readonly WordClassDefinition[];
  /**
   * Opt-in gendered template pools. Only consulted when a caller asks for an
   * explicit {@link Gender}; omitting the option leaves `templates` untouched
   * (same RNG path, same output).
   */
  genderTemplates?: Partial<Record<Gender, Partial<Record<K, TemplateChoices>>>>;
  /** Opt-in structured name recipes (family-first, patronymic, epithet, ...). */
  nameStructures?: Readonly<Record<string, NameStructure>>;
}

/**
 * Identity helper for culture literals. `const` inference keeps template kinds
 * as literal keys, so `defineCulture({...}).templates.ship` is known to exist.
 */
export function defineCulture<const T extends Culture>(culture: T): T {
  return culture;
}

/** One weighted list of name templates. */
export type TemplateChoices = Array<[template: NameTemplate, weight: number]>;

export interface NameTemplates {
  given: TemplateChoices;
  surname?: TemplateChoices;
  settlement?: TemplateChoices;
  mountain?: TemplateChoices;
  river?: TemplateChoices;
  forest?: TemplateChoices;
  /**
   * Open kind registry. Packs may declare any additional kind: `ship`,
   * `tavern`, `deity`, `guild`, `epithet`, `title`, ...
   */
  [kind: string]: TemplateChoices | undefined;
}

/** Gender axis for opt-in gendered naming. */
export type Gender = "masculine" | "feminine" | "neutral" | "any";

/** Options for {@link generateName}. */
export interface NameOptions {
  /** Opt-in gendered template pool. Absent → `templates` is used unchanged. */
  gender?: Gender;
  /** Locale passthrough for downstream (locale-aware) rendering. */
  locale?: string;
}

/** Structural role of a slot inside a {@link NameStructure}. */
export type NameRole =
  | "given"
  | "family"
  | "patronymic"
  | "matronymic"
  | "clan"
  | "house"
  | "honorific"
  | "epithet"
  | (string & {});

/** Where a slot's value comes from. */
export type NameSlotSource =
  | { type: "kind"; kind: string }
  | { type: "input"; field: string };

/** A single component of a structured name. */
export interface NameSlot {
  /** Stable slot key — also the RNG child label (`slot:<key>`). */
  key: string;
  /** Structural role of this slot. */
  role: NameRole;
  /** Generated from a name kind, or supplied by the caller. */
  source: NameSlotSource;
  /** Input slots only: an absent optional input disappears with its affixes. */
  optional?: boolean;
  /** Literal prefix rendered (and translated) as part of the component. */
  prefix?: string;
  /** Literal suffix rendered (and translated) as part of the component. */
  suffix?: string;
}

/**
 * A structured name recipe. Opt-in per culture via `Culture.nameStructures`.
 */
export interface NameStructure {
  id: string;
  /** Display order (a permutation of the declared slot keys). Defaults to declaration order. */
  order?: readonly string[];
  /** Joiner for forms. Default `" "`. */
  separator?: string;
  /** Joiner for translations. Defaults to `separator`. */
  translationSeparator?: string;
  slots: readonly NameSlot[];
}

export interface StructuredNameInput {
  /** Key into `culture.nameStructures`. */
  structure: string;
  gender?: Gender;
  locale?: string;
  /** Input slot values, keyed by `NameSlot.source.field`. */
  values?: Readonly<Record<string, TranslatedName>>;
}

export interface StructuredNameComponent {
  key: string;
  role: NameRole;
  /** The rendered component, affixes included. */
  value: TranslatedName;
}

/** Output of `generateStructuredName`. */
export interface StructuredName extends TranslatedName {
  structure: string;
  components: readonly StructuredNameComponent[];
}

export type NameTemplate =
  | { kind: "compose"; parts: readonly TemplatePart[]; sep?: string; transSep?: string }
  | { kind: "literal"; form: string; translation: string };

export type TemplatePart =
  | { pick: WordClass; tag?: string; capitalize?: boolean }
  | { literal: string; translation?: string };

/** Output: conlang form + English translation. */
export interface TranslatedName {
  form: string;
  translation: string;
  language: string;
  parts?: readonly { form: string; meaning: string }[];
  glyphs?: GlyphSet;
  toString(): string;
}
