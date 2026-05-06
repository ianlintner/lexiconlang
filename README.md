# content-gen

Seedable, composable, multi-strategy game content generation for TypeScript.

Generate names, NPCs, place names, factions, landmarks, and more — deterministically from a seed, mixing weighted lists, context-free grammars, and Markov chains under one typed API.

## Status

v0.1 — deterministic core, grammar (Tracery-compatible), Markov, and fantasy / sci-fi / modern starter packs.

Planned:
- v0.2 — phoneme/language system (Dwarf-Fortress-style culture-specific languages)
- v0.3 — LLM bake-out CLI + live runtime with deterministic cache

## Packages

- `@content-gen/core` — RNG, Context, Generator, composition primitives
- `@content-gen/grammar` — Tracery-compatible grammars + TS tagged-template DSL
- `@content-gen/markov` — Markov-chain name generator with offline trainer
- `@content-gen/fantasy` — fantasy genre pack
- `@content-gen/scifi` — sci-fi genre pack
- `@content-gen/modern` — modern-day genre pack
- `@content-gen/cli` — `content-gen` command-line tool

## Quick start

```ts
import { fantasy } from "@content-gen/fantasy";

const gen = fantasy.withSeed("my-world-42");
gen.npc.name();      // 'Aelthir Stormvale'
gen.place.tavern();  // 'The Gilded Anchor'
```

## Hierarchical seeding

```ts
import { createContext, repeat } from "@content-gen/core";
import { noble } from "@content-gen/fantasy";

const world  = createContext({ seed: "campaign-7" });
const region = world.child("region:23");
const town   = region.child("settlement:5");
const npcs   = repeat(noble, 12).generate(town); // same 12 NPCs every time
```

## License

MIT
