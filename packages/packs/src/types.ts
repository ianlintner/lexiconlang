export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export type PackId = string;
export type ResourceId = string;

export interface PackDependency {
  id: PackId;
  version: string;
}

export interface OrthographyData {
  id: string;
  mappings: readonly { from: string; to: string }[];
  unknown: "preserve" | "error";
}

export interface SensitivityData {
  framing: string;
  exclusions: readonly string[];
  review: string;
}

/** B1 base language descriptor (data boundary from the S0 spec). */
export interface BaseData {
  id: ResourceId;
  inspiredBy: string;
  scope: string;
  glyphs: {
    classes: Readonly<Record<string, readonly string[]>>;
    syllables: readonly (readonly [string, number])[];
    wordShapes: readonly (readonly [string, number])[];
    constraints?: readonly { pattern: readonly string[]; rule: "forbid" | { maxOccurrences: number } }[];
    joiner?: string;
  };
  orthography: OrthographyData;
  romanization?: OrthographyData;
  templates: Readonly<Record<string, readonly WeightedData<NameTemplate>[]>>;
  nameStructures: Readonly<Record<string, NameStructure>>;
  corpus?: ResourceId;
  provenance: readonly string[];
  sensitivity: SensitivityData;
}

export interface Provenance {
  id: string;
  source: string;
  title: string;
  creator: string;
  license: string;
  attribution: string;
  modifications: string;
  retrieved?: string;
  files: readonly string[];
}

export interface WeightedData<T> {
  value: T;
  weight: number;
}

export interface NameTemplate {
  kind: "literal" | "compose";
  form?: string;
  translation?: string;
  parts?: readonly { pick?: string; literal?: string; tag?: string; capitalize?: boolean; translation?: string }[];
  sep?: string;
  transSep?: string;
}

export interface NameStructure {
  slots: readonly { key: string; role: string; source: { type: "kind"; kind: string } | { type: "input"; field: string }; prefix?: string; suffix?: string; optional?: boolean }[];
  id?: string;
  order?: readonly string[];
  separator?: string;
  translationSeparator?: string;
}

export interface CultureData {
  id: ResourceId;
  extends?: ResourceId;
  glyphs?: {
    classes: Readonly<Record<string, readonly string[]>>;
    syllables: readonly (readonly [string, number])[];
    wordShapes: readonly (readonly [string, number])[];
    constraints?: readonly { pattern: readonly string[]; rule: "forbid" | { maxOccurrences: number } }[];
    joiner?: string;
  };
  meaningPacks?: readonly ResourceId[];
  templates?: Readonly<Record<string, readonly WeightedData<NameTemplate>[]>>;
  wordClasses?: readonly { id: string; label?: string; description?: string }[];
  genderTemplates?: Readonly<Record<string, Readonly<Record<string, readonly WeightedData<NameTemplate>[]>>>>;
  nameStructures?: Readonly<Record<string, NameStructure>>;
  capitalize?: "first" | "all" | "none";
  visualGlyphSystems?: Readonly<Record<string, Json>>;
  base?: ResourceId;
}

export interface MeaningPackData {
  id: ResourceId;
  version: string;
  meanings: readonly { id: ResourceId; class: string; tags: readonly string[]; label?: string }[];
}

export interface GrammarData {
  id: ResourceId;
  start: string;
  rules: readonly { key: string; choices: readonly WeightedData<string>[] }[];
  maxDepth?: number;
}

export interface TableData {
  id: ResourceId;
  mode: "weighted" | "dice";
  entries: readonly { key: string; weight?: number; range?: readonly [number, number]; result: TableResult }[];
  dice?: { count: number; sides: number; modifier: number };
  maxDepth?: number;
  maxAttempts?: number;
}

export type TableResult =
  | { type: "text"; text: string }
  | { type: "table"; table: ResourceId }
  | { type: "generator"; generator: ResourceId; field?: "form" | "translation" }
  | { type: "grammar"; grammar: ResourceId; template: string }
  | { type: "sequence"; separator: string; parts: readonly { key: string; result: TableResult }[] }
  | { type: "roll"; table: ResourceId; count: number; duplicates: "allow" | "reroll" };

export interface CorpusData {
  id: ResourceId;
  provenance: readonly string[];
  entries?: readonly { word: string; weight: number }[];
  asset?: { path: string; sha256: string };
}

export interface MarkovModelData {
  id: ResourceId;
  corpus: ResourceId;
  asset: { path: string; sha256: string };
  profile: "markov-json-v1";
}

export type GeneratorData = {
  id: ResourceId;
  description: string;
  tags: readonly string[];
  output: "string" | "translated-name-v1" | "structured-name-v1" | "table-roll-v1";
} & (
  | { engine: "name-v1"; culture: ResourceId; kind: string; gender?: "masculine" | "feminine" | "neutral" | "any" }
  | { engine: "structured-name-v1"; culture: ResourceId; structure: string }
  | { engine: "grammar-v1"; grammar: ResourceId }
  | { engine: "table-v1"; table: ResourceId }
  | { engine: "markov-v1"; model: ResourceId }
);

export interface PackManifestV1 {
  $schema?: string;
  formatVersion: 1;
  id: PackId;
  version: string;
  license: string;
  description: string;
  provenance: readonly Provenance[];
  depends: readonly PackDependency[];
  extends: readonly PackDependency[];
  requires: readonly string[];
  cultures: readonly CultureData[];
  meaningPacks: readonly MeaningPackData[];
  grammars: readonly GrammarData[];
  tables: readonly TableData[];
  corpora: readonly CorpusData[];
  markovModels: readonly MarkovModelData[];
  generators: readonly GeneratorData[];
  bases?: readonly BaseData[];
  dialects?: readonly Json[];
  extensions?: Readonly<Record<string, Json>>;
}

export interface PackDiagnostic {
  code: "SCHEMA" | "CAPABILITY" | "DEPENDENCY" | "CYCLE" | "COLLISION" | "INTEGRITY" | "REFERENCE" | "LIMIT" | "LICENSE";
  pointer: string;
  message: string;
}

export interface AssetData {
  path: string;
  sha256: string;
  bytes: Uint8Array;
  digest: string;
}

export interface LoadedPack {
  readonly manifest: Readonly<PackManifestV1>;
  readonly hash: string;
  readonly dependencies: readonly LoadedPack[];
  /** Verified asset bytes keyed by declared asset path. Internal to loaders/hosts. */
  readonly assets: ReadonlyMap<string, AssetData>;
}

export interface PackResolver {
  resolve(id: PackId, version: string): Promise<LoadedPack>;
  readAsset(pack: PackId, path: string): Promise<Uint8Array>;
}

export interface LoadPackOptions {
  resolver?: PackResolver;
  maxBytes?: number;
  /** Trusted root for asset reads; enforced by the node adapter. */
  root?: string;
}

export interface GeneratorDescriptor {
  id: string;
  pack: PackId;
  version: string;
  engine: string;
  profile: string;
  tags: readonly string[];
  input: string;
  output: string;
  portable: boolean;
  description: string;
}

export interface GenerateOptions {
  gender?: "masculine" | "feminine" | "neutral" | "any";
  values?: Readonly<Record<string, unknown>>;
  locale?: string;
}

export interface World {
  use(pack: LoadedPack): this;
  readonly registry: import("@lexiconlang/core").Registry;
  context(): import("@lexiconlang/core").Context;
  generate<T = Json>(id: string, key: string, options?: GenerateOptions): T;
  generateItem<T = Json>(id: string, key: string, index: number, options?: GenerateOptions): T;
  list(): readonly GeneratorDescriptor[];
  describe(id: string): GeneratorDescriptor;
  clearCaches(): void;
}

export class PackValidationError extends Error {
  readonly diagnostics: readonly PackDiagnostic[];
  constructor(diagnostics: readonly PackDiagnostic[]) {
    super(`pack validation failed: ${diagnostics.map((d) => `${d.pointer}: ${d.message}`).join("; ")}`);
    this.name = "PackValidationError";
    this.diagnostics = diagnostics;
  }
}
