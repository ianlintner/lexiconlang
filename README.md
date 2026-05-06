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
import { npc } from "@content-gen/fantasy";

const world  = createContext({ seed: "campaign-7" });
const region = world.child("region:23");
const town   = region.child("settlement:5");
const npcs   = repeat(npc, 12).generate(town); // same 12 NPCs every time
```

## Examples

Runnable examples covering common consumer tasks live in [examples/](examples/):

- [01-quickstart](examples/01-quickstart.ts) — pin a seed, get content
- [02-batch-patrons](examples/02-batch-patrons.ts) — generating N NPCs at once
- [03-world-tree](examples/03-world-tree.ts) — hierarchical, lazily-generated worlds
- [04-custom-generator](examples/04-custom-generator.ts) — composing your own generator
- [05-custom-grammar](examples/05-custom-grammar.ts) — Tracery grammars in JSON or TS template
- [06-custom-markov](examples/06-custom-markov.ts) — train a Markov on your own corpus
- [07-seed-and-reroll](examples/07-seed-and-reroll.ts) — save/load by seed; partial rerolls
- [08-cross-genre](examples/08-cross-genre.ts) — mixing fantasy + sci-fi + modern packs

```bash
pnpm install
pnpm --filter examples quickstart   # or: tavern, world, custom-generator, ...
pnpm --filter examples all          # run them all
```

## License

MIT
