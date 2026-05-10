# content-gen

**Seedable, composable, multi-strategy game content generation for TypeScript.**

Generate names, NPCs, places, factions, items, and entire worlds — deterministically from a seed, mixing weighted lists, Tracery-style grammars, and Markov chains under one typed API.

```ts
import { fantasy } from "@content-gen/fantasy";

const game = fantasy.withSeed("hello-world");

game.npc;            // { name: { full: "Aelyn Stormvale", race: "elf", ... }, age: 47, ... }
game.place.tavern(); // "The Gilded Anchor"
game.quest();        // "Locals whisper that the silent bell of the church, before the next full moon."
```

[![CI](https://github.com/ianlintner/content-gen/actions/workflows/ci.yml/badge.svg)](https://github.com/ianlintner/content-gen/actions/workflows/ci.yml)

---

## Why

Most procedural-content libraries pick one strategy: faker.js does big lookup tables, Tracery does grammars, markov-namegen does n-grams, and rot.js does roguelike RNG. None of them compose with each other, and only some of them are deterministic.

**`content-gen` puts every strategy behind one `Generator<T>` interface.** A grammar can call a Markov chain. A Markov chain can be a child of a `compose()`d NPC. A whole `world → region → settlement → npc` tree derives from one string seed and is byte-identical across machines, runs, and library versions.

| | faker | Tracery | rot.js | **content-gen** |
|---|---|---|---|---|
| Weighted lists | ✓ | partial | partial | ✓ |
| Context-free grammars | ✗ | ✓ | ✗ | ✓ (Tracery-compatible) |
| Markov chains | ✗ | ✗ | ✗ | ✓ |
| Hierarchical seeds | ✗ | ✗ | partial | ✓ |
| Sibling-order independence | ✗ | ✗ | ✗ | ✓ |
| Strategies inter-operate | n/a | ✗ | ✗ | ✓ |
| Typed | partial | ✗ | partial | ✓ |
| Tree-shakeable genre packs | ✗ | n/a | ✗ | ✓ |

Coming in v0.2: phoneme/language system (Dwarf-Fortress-style culture-specific languages — names you can *translate*).
Coming in v0.3: LLM bake-out CLI + live runtime with deterministic content-addressed cache.

---

## Install

```bash
pnpm add @content-gen/core @content-gen/fantasy
# add what you need:
pnpm add @content-gen/grammar @content-gen/markov \
         @content-gen/scifi @content-gen/modern
```

Requires Node ≥ 20 or any modern browser. ESM-only. No native deps.

---

## Five-minute tour

### 1. Pin a seed, get content

```ts
import { fantasy } from "@content-gen/fantasy";

const game = fantasy.withSeed("campaign-of-iron");
console.log(game.npc.name.full);    // "Aelyn Stormvale"
console.log(game.place.settlement().name); // "Blackvale"
console.log(game.faction.order()); // "The Order of the Verdant Hawk"
```

### 2. Batch generation

```ts
import { createContext, repeat } from "@content-gen/core";
import { npc } from "@content-gen/fantasy";

const tavern = createContext({ seed: "the-gilded-anchor" });
const patrons = repeat(npc, { min: 5, max: 12 }).generate(tavern);
// 5–12 NPCs; same seed → same patrons, every time
```

### 3. Hierarchical worlds

```ts
const world  = createContext({ seed: "campaign-7" });
const region = world.child("region:23");
const town   = region.child("settlement:5");
const elder  = npc.generate(town.child("npc:elder"));
// `world → region:23 → settlement:5 → npc:elder` is a stable address.
// Re-deriving the elder from the same path on any machine, any day, any
// build, returns the same NPC. You don't have to persist them.
```

### 4. Compose your own

```ts
import { compose, oneOf, intRange } from "@content-gen/core";
import { fullName } from "@content-gen/fantasy";

const knight = compose<{ name: string; rank: string; years: number }>({
  id: "app.knight",
  parts: {
    name: (ctx) => fullName.generate(ctx).full,
    rank: oneOf("Squire", "Knight", "Knight-Captain", "Lord-Marshal"),
    years: intRange(1, 40),
  },
});

const gerald = knight.generate(world.child("knight:gerald"));
// → { name: "Gerald Ironhold", rank: "Knight-Captain", years: 23 }
```

### 5. Write your own grammar

```ts
import { grammar, t } from "@content-gen/grammar";

const spell = grammar({
  start: t`${"prefix.cap"} ${"element.cap"} ${"form.cap"}`,
  prefix: ["lesser", "greater", "true", "binding"],
  element: ["fire", "frost", "shadow", "iron"],
  form: ["bolt", "ward", "veil", "lash"],
});
spell.generate(ctx); // "Greater Frost Ward"
```

JSON form is equivalent — both compile to the same AST. Modifiers (`cap`, `s`, `a/an`, `upper`, …) chain with dots; symbols can call other symbols, weighted lists, and **other generators** (e.g. `#markov:elven#` resolves through the registry).

### 6. Train a Markov on your own corpus

```ts
import { markov, train } from "@content-gen/markov";

const model = train(["aberffraw", "betws", "caernarfon", /* ... */], {
  order: 3,
  rejectSubstringsOfLength: 6,  // refuse verbatim training entries
});
const townName = markov(model);
townName.generate(ctx); // "Llanrwst" — never seen in training, but feels right
```

For production: train offline via the CLI and ship the precomputed JSON model.

```bash
content-gen build-markov ./corpora/welsh-towns.json --out ./models/welsh.json --order 3
```

---

## The seeding model

Determinism is the whole point. Three rules:

1. **Every generator pulls its randomness from `ctx.rng`.** They never close over RNGs themselves.
2. **`ctx.child(label)` derives a new context whose RNG is hashed from the parent's *origin seed* and the label** — not from the parent's stream. This is the key trick: forking sibling A then sibling B gives you the same children regardless of how many times you fork, in what order, or whether you skip some.
3. **`compose` uses field names as labels.** Reordering or adding fields to your generator type doesn't invalidate any existing field's seed.

```ts
const root1 = createContext({ seed: "world" });
const root2 = createContext({ seed: "world" });

// Walk many siblings before reaching the target.
for (let i = 0; i < 100; i++) root1.child(`region:${i}`);

// Both contexts produce the same NPC for the same path:
const a = npc.generate(root1.child("region:5").child("settlement:11").child("npc:3"));
const b = npc.generate(root2.child("region:5").child("settlement:11").child("npc:3"));
// a equals b, byte for byte.
```

The PRNG is **sfc32** (128-bit state, passes BigCrush, ~2 ns/call in V8). Forking uses **SplitMix64-on-strings** (FNV-1a → SplitMix64). State is serializable as 4 × u32.

**Save = seed.** A whole world tree reconstructs from one string. To support player-driven rerolls without disturbing the rest of the world, encode "version" as part of the path:

```ts
const ctx = root.child(`region:0/settlement:5`).child(`v:${rerolls[path] ?? 0}`);
```

Bumping `v:0` → `v:1` rerolls just that one settlement.

---

## Packages

| Package | Purpose |
|---|---|
| [`@content-gen/core`](packages/core) | sfc32 RNG with deterministic string-fork, `Context` tree, `Generator`, composition primitives (`compose`, `oneOf`, `pickOf`, `repeat`, `weightedList`, `map`, `chain`), alias-method sampling, `Registry` |
| [`@content-gen/grammar`](packages/grammar) | Tracery-compatible JSON grammars + TS tagged-template DSL (`t\`...\``); 16 builtin modifiers; plugin-namespace symbol refs (e.g. `#markov:elven#`) |
| [`@content-gen/markov`](packages/markov) | Character-level Markov n-gram trainer + sampler; backoff smoothing; `rejectSubstringsOfLength` for verbatim-rejection; JSON model format |
| [`@content-gen/fantasy`](packages/fantasy) | Genre pack: 9 race-aware Markov name generators, NPCs, settlements, taverns, factions, cults, weapons, armor, dragons, quest hooks (~35 generators) |
| [`@content-gen/scifi`](packages/scifi) | Genre pack: alien species (humanoid/insectoid/aquatic/synth/human), star systems with planets, ships, megacorps, factions (~15 generators) |
| [`@content-gen/modern`](packages/modern) | Genre pack: people with full email/phone/address, cities, streets, companies, bands, songs, books (~16 generators) |
| [`@content-gen/cli`](packages/cli) | `content-gen` command-line tool — `build-markov`, `scaffold-pack` |

All packages ESM-only, `sideEffects: false`, no native deps.

---

## Examples

Self-contained, runnable demos in [examples/](examples/) covering common consumer tasks:

| | |
|---|---|
| [01-quickstart](examples/01-quickstart.ts)            | pin a seed, get content |
| [02-batch-patrons](examples/02-batch-patrons.ts)      | `repeat()` for batch generation |
| [03-world-tree](examples/03-world-tree.ts)            | hierarchical, lazily-generated worlds |
| [04-custom-generator](examples/04-custom-generator.ts) | composing your own `Generator<T>` |
| [05-custom-grammar](examples/05-custom-grammar.ts)    | Tracery grammars in JSON or TS template + custom modifiers |
| [06-custom-markov](examples/06-custom-markov.ts)      | training a Markov on your own corpus |
| [07-seed-and-reroll](examples/07-seed-and-reroll.ts)  | save/load by seed; partial rerolls |
| [08-cross-genre](examples/08-cross-genre.ts)          | mixing fantasy + sci-fi + modern packs |

```bash
pnpm install
pnpm --filter examples quickstart
pnpm --filter examples all
```

---

## CLI

The `@content-gen/cli` package installs a `content-gen` binary:

```bash
# Train a Markov model from a corpus and save the precomputed table.
content-gen build-markov ./corpus.json --out ./model.json \
  --order 3 --min-length 4 --max-length 12 \
  --reject-substrings-of-length 5

# Scaffold a new genre pack package.
content-gen scaffold-pack noir --dir ./packages
```

The corpus is either a JSON `string[]`, an array of `{ word, weight }`, or a newline-delimited text file (lines starting with `#` are ignored).

---

## Development

```bash
pnpm install
pnpm typecheck         # tsc -b across all packages
pnpm build             # build every package
pnpm test              # 65+ tests across all packages, plus a determinism golden suite
pnpm samples           # regenerate tests/__artifacts__/samples.txt for human review
```

The repo is a pnpm workspace. Each package is independent and publishable.

CI runs typecheck + build + test on Node 20 and 22, plus a CLI smoke test, and uploads the `samples.txt` artifact on every run for visual review of generator output.

---

## Roadmap

- **v0.1** *(current)* — deterministic core, grammar, Markov, fantasy/scifi/modern packs, CLI.
- **v0.2** — `@content-gen/phonology`: phoneme/syllable language system. Per-culture phonotactics; a fictional language has consistent words for "iron" and "mountain", so `placeName(["iron","mountain.gen"])` yields `"Khorum-tha"` and the player can be told what it means. Translation as a free byproduct.
- **v0.3** — `@content-gen/llm`: bake-out CLI (recipe + Zod schema → validated weighted-list JSON) + live `AsyncGenerator` with content-addressed cache (`hash(prompt, scope, seed, model)`). Cache is shippable — play through your game once, commit the cache, ship a fully deterministic offline build.
- **v0.4+** — modern pack expansion, web playground/authoring tools, additional packs (cyberpunk, post-apoc, historical).

---

## Prior art and credit

- [Tracery](https://tracery.io/) (Kate Compton) — `content-gen` adopts its `#symbol#` grammar conventions and modifier model. JSON grammars from Tracery are mostly source-compatible.
- [markov-namegen](https://github.com/Tw1ddle/markov-namegen-lib) (Tw1ddle) — Markov-process-based name generation; the verbatim-rejection idea is borrowed from this lineage.
- [Dwarf Fortress](https://dwarffortresswiki.org/index.php/Language) (Bay 12) — the "every culture has a language with words for things; names are compositions of meanings" model that v0.2's phonology system is built around.
- [Faker.js](https://fakerjs.dev/), [Chance.js](https://chancejs.com/), [rot.js](https://ondras.github.io/rot.js/), [Improv](https://github.com/sequitur/improv), [Bracery](https://github.com/ihh/bracery) — each tackles one slice of this problem; this library aims to absorb the best of each behind one composable interface.

---

## License

[MIT](LICENSE)
