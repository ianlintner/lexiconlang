/** Typed view over pirates.pack.json — the JSON is the single source of truth. */
import bundle from "../data/pirates.pack.json" with { type: "json" };

export interface WeightedString { value: string; weight: number }
export interface GrammarRule { key: string; choices: readonly WeightedString[] }
export interface GrammarDescriptor { id: string; start: string; rules: readonly GrammarRule[] }
export interface WeightedNameTemplate { value: unknown; weight: number }
export interface NameStructure {
  separator: string;
  translationSeparator?: string;
  slots: readonly {
    key: string;
    role: string;
    source: { type: string; kind?: string; field?: string };
    prefix?: string;
    suffix?: string;
    optional?: boolean;
  }[];
}
export interface CultureData {
  id: string;
  capitalize?: "first" | "all" | "none";
  glyphs?: {
    classes: Readonly<Record<string, readonly string[]>>;
    syllables: readonly (readonly [string, number])[];
    wordShapes: readonly (readonly [string, number])[];
    constraints?: unknown;
    joiner?: string;
  };
  meaningPacks?: readonly unknown[];
  templates: Record<string, readonly WeightedNameTemplate[]>;
  nameStructures: Record<string, NameStructure>;
}
export interface TableEntry { key: string; weight?: number; range?: readonly [number, number]; result: { type: string; text?: string } }
export interface TableDescriptor {
  id: string;
  mode: "weighted" | "dice";
  entries: readonly TableEntry[];
  dice?: { count: number; sides: number; modifier: number };
  maxDepth?: number;
}
export interface GeneratorDescriptor {
  id: string;
  engine: string;
  description: string;
  tags: readonly string[];
  culture?: string;
  structure?: string;
  grammar?: string;
  table?: string;
  output?: string;
}

export interface PiratesPackData {
  $schema: string;
  formatVersion: 1;
  id: string;
  version: string;
  license: string;
  description: string;
  provenance: readonly {
    id: string;
    source: string;
    title: string;
    creator: string;
    license: string;
    attribution: string;
    modifications: string;
    files: readonly string[];
  }[];
  depends: readonly unknown[];
  extends: readonly unknown[];
  requires: readonly string[];
  cultures: readonly CultureData[];
  meaningPacks: readonly unknown[];
  grammars: readonly GrammarDescriptor[];
  tables: readonly TableDescriptor[];
  corpora: readonly unknown[];
  markovModels: readonly unknown[];
  generators: readonly GeneratorDescriptor[];
}

export const data = bundle as unknown as PiratesPackData;
export const provenance = data.provenance;
