/** Typed view over modern.pack.json — the JSON is the single source of truth. */
import bundle from "./modern.pack.json" with { type: "json" };

export type RuleValue =
  | Record<string, number>
  | readonly string[]
  | { source: "surnames"; slice: readonly [number, number]; lowercase: true };

export interface GrammarData {
  id: string;
  rules: Record<string, RuleValue>;
}

export interface ModernPackData {
  $schema: string;
  formatVersion: 1;
  id: string;
  version: string;
  license: string;
  description: string;
  provenance: readonly {
    id: string; source: string; title: string; creator: string;
    license: string; attribution: string; modifications: string; files: readonly string[];
  }[];
  givenMale: readonly string[];
  givenFemale: readonly string[];
  surnames: readonly string[];
  occupations: readonly string[];
  grammars: {
    city: GrammarData; street: GrammarData; company: GrammarData; domain: GrammarData;
    band: GrammarData; song: GrammarData; book: GrammarData;
  };
}

export const data = bundle as unknown as ModernPackData;
export const provenance = data.provenance;
