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
| [`@lexiconlang/bases`](/packages/bases)       | Six real-language-inspired base descriptors (Norse, Celtic, Latin, Greek, Japanese, Arabic) via selective subpaths |
| [`@lexiconlang/packs`](/packages/packs)       | Declarative F2 pack format, loader, validator and `bases-v1` / `language-v1` capabilities |

## Genre packs

Each pack is a curated set of cultures, name generators, and worldbuilding
content for a setting.

| Package                                | Cultures & content                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| [`@lexiconlang/fantasy`](/packages/fantasy) | 5 races (dwarvish/elvish/orcish/halfling/draconic), NPCs, settlements, taverns, factions, dragons, ~35 generators total |
| [`@lexiconlang/scifi`](/packages/scifi)     | 9 alien species, star systems, ships, megacorps, ~15 generators                          |
| [`@lexiconlang/modern`](/packages/modern)   | People with email/phone/address, cities, streets, companies, bands, books, ~16 generators |
| [`@lexiconlang/horror`](/packages/horror)   | 1920s investigators, eldritch entities, forbidden tomes, cults, haunts, omens, 11 generators |
| [`@lexiconlang/steampunk`](/packages/steampunk) | Steampunk/gaslamp: inventors, airships, guilds, districts, automatons, patents, headlines, omens (14 generators) |
| [`@lexiconlang/grimdark`](/packages/grimdark) | Grimdark: warbands, heresies, inquisitions, plagues, mutations, war machines, ratfolk clans and warlords, doom-laden battles (16 generators) |
| [`@lexiconlang/espionage`](/packages/espionage) | Espionage & military: operation codenames, callsigns, agencies, units, safehouses, dead-drops, cover identities, briefings, ranks, mottos (18 generators) |
| [`@lexiconlang/pirates`](/packages/pirates) | Pirates & age of sail: ships, captains, crews, ports, treasure, shanties, ranks, oracles (14 generators) |
| [`@lexiconlang/postapoc`](/packages/postapoc) | Survivors, tech-cults, settlements, mutations, gear, vehicles, trade goods, encounters oracle, 14 generators |

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
- **Node ≥ 22.13** or any modern browser
