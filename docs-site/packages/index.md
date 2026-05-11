# Packages

Lexiconlang is a pnpm workspace of independent, publishable packages. Pull in
what you need; tree-shaking takes care of the rest.

## Core primitives

| Package                                  | What it provides                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------- |
| [`@lexiconlang/core`](/packages/core)         | sfc32 RNG, `Context` tree, `Generator<T>` interface, composition primitives, alias-method sampling |
| [`@lexiconlang/grammar`](/packages/grammar)   | Tracery-compatible JSON grammars + TS tagged-template DSL with 16 built-in modifiers   |
| [`@lexiconlang/markov`](/packages/markov)     | Character n-gram trainer + sampler with backoff smoothing and verbatim-rejection       |

## Language system

| Package                                  | What it provides                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------- |
| [`@lexiconlang/language`](/packages/language) | Phonotactics, lexicon generation, morpheme packs, name templates, `TranslatedName` API |
| [`@lexiconlang/glyphs`](/packages/glyphs)     | Visual writing systems: SVG / Unicode / Canvas glyphs with per-culture registries      |

## Genre packs

Each pack is a curated set of cultures, name generators, and worldbuilding
content for a setting.

| Package                                | Cultures & content                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| [`@lexiconlang/fantasy`](/packages/fantasy) | 5 races (dwarvish/elvish/orcish/halfling/draconic), NPCs, settlements, taverns, factions, dragons, ~35 generators total |
| [`@lexiconlang/scifi`](/packages/scifi)     | 9 alien species, star systems, ships, megacorps, ~15 generators                          |
| [`@lexiconlang/modern`](/packages/modern)   | People with email/phone/address, cities, streets, companies, bands, books, ~16 generators |

## Tooling

| Package                          | What it provides                                                            |
| -------------------------------- | --------------------------------------------------------------------------- |
| [`@lexiconlang/cli`](/packages/cli) | `lexiconlang` binary — `build-markov`, `scaffold-pack`                      |

## Common properties

All packages are:

- **ESM-only** (no CJS)
- **`sideEffects: false`** (tree-shakeable)
- **Zero native deps**
- **TypeScript-first** with full type definitions
- **Node ≥ 20** or any modern browser
