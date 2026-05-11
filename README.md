# Lexicon · v0.3.0

[![npm](https://img.shields.io/npm/v/lexiconlang)](https://www.npmjs.com/package/lexiconlang)
[![CI](https://github.com/ianlintner/lexiconlang/actions/workflows/ci.yml/badge.svg)](https://github.com/ianlintner/lexiconlang/actions/workflows/ci.yml)

**Procedural constructed-language generation: deterministic, seeded conlangs with phonotactics, lexicons, and culture-specific naming.**

Generate culture-specific names with meaningful translations. Names are morpheme-rich, phonotactically coherent, and derived from a culture's phonetic system and semantic meanings. Same seed → identical results across machines, runs, and library versions.

```ts
import { fantasy } from "@lexiconlang/fantasy";

const game = fantasy.withSeed("campaign-1");

const name = game.npc.name.full;
// → { form: "Drakaztum Ironforge", translation: "Strong-anvil Iron-forge", language: "fantasy.dwarvish" }

name.form;            // "Drakaztum Ironforge" (conlang string)
name.translation;     // "Strong-anvil Iron-forge" (English morpheme meanings)
name.toString();      // "Drakaztum Ironforge" (template-string compatible)
```

---

## Why

Most naming libraries treat names as opaque strings. **Lexicon generates names as *meaningful utterances* — each morpheme carries semantic weight.**

Each culture has:
- A **glyph system** (phonotactics): which sounds cluster together, syllable patterns, phonotactic constraints
- A **lexicon**: meaning ↔ conlang form mappings, derived deterministically from a culture's seed
- **Templates**: morpheme recipes for personal names, place names, etc.

**Result:** Names like `Drakaztum` (Strong-anvil), `Aelthelan` (Silver-stream), `Krazzivek` (Swarm-signal) — each name is both aesthetically coherent AND semantically meaningful.

| | faker | Tracery | rot.js | **lexiconlang** |
|---|---|---|---|---|
| Weighted lists | ✓ | partial | partial | ✓ |
| Context-free grammars | ✗ | ✓ | ✗ | ✓ (Tracery-compatible) |
| Markov chains | ✗ | ✗ | ✗ | ✓ |
| Hierarchical seeds | ✗ | ✗ | partial | ✓ |
| Sibling-order independence | ✗ | ✗ | ✗ | ✓ |
| Strategies inter-operate | n/a | ✗ | ✗ | ✓ |
| Typed | partial | ✗ | partial | ✓ |
| Tree-shakeable genre packs | ✗ | n/a | ✗ | ✓ |

## ✨ What's New in v0.3

- **Visual glyph systems**: cultures can declare a `visualGlyphSystem` that renders names as glyphs — SVG runes, Unicode ideograms, or Canvas drawing instructions — derived from the same seed as the name itself.
- **Three renderers**: SVG (compact inline vectors, ~2–5 ms/glyph), Unicode (instant character lookup), Canvas (replayable drawing-instruction sequences).
- **Three mapping strategies**: phoneme (one glyph per phonetic unit), morpheme (one glyph per meaning component), holistic (one glyph for the whole name).
- **Fantasy & sci-fi presets** ship with glyph systems: dwarvish runes (SVG), elvish ideograms (Unicode), humanoid geometry (Canvas), insectoid chitin (SVG).
- **No breaking changes**: glyphs are opt-in. `TranslatedName.glyphs` and `Culture.visualGlyphSystems` are both optional.
- **Minor template fix**: `NameTemplate` now supports an optional `transSep` so a culture can set `sep: ""` for the conlang form while keeping `-` as the translation separator (needed for morpheme-based glyph mapping).

## ✨ What's New in v0.2

- **Full language system**: Glyph systems, phonotactics, deterministic lexicon generation
- **9 culture presets**: 5 fantasy (dwarvish, elvish, orcish, halfling, draconic) + 4 sci-fi (humanoid, insectoid, aquatic, synth) + extensible to custom cultures
- **Morpheme-rich names**: Each name breaks down into semantic components with English translations
- **Phonotactic archetypes**: Reusable templates for different language aesthetics (flowing, guttural, sibilant, clipped, resonant)
- **Breaking change**: Name generators now return `TranslatedName` objects with `form`, `translation`, and `language` properties
- **Determinism guarantees**: Seeded, order-independent, patch-stable lexicon generation

---

## Install

```bash
pnpm add @lexiconlang/language @lexiconlang/fantasy
# or sci-fi:
pnpm add @lexiconlang/scifi
# add visual glyphs:
pnpm add @lexiconlang/glyphs
# add generators for other content types:
pnpm add @lexiconlang/grammar @lexiconlang/markov @lexiconlang/core
```

Requires Node ≥ 20 or any modern browser. ESM-only. No native deps.

---

## Usage

### Generate a dwarvish name

```ts
import { dwarvish, buildLexicon } from "@lexiconlang/fantasy/language";
import { createContext } from "@lexiconlang/core";

const ctx = createContext({ seed: "my-world" });
const lexicon = buildLexicon(dwarvish, ctx);

// Generate a given name:
const name = generateName(dwarvish, "given", ctx.child("hero:1"));
console.log(name.form);        // "Drakaztum"
console.log(name.translation); // "Strong-anvil"
console.log(name.language);    // "fantasy.dwarvish"
```

### Full NPC with fantasy integration

```ts
import { fantasy } from "@lexiconlang/fantasy";

const game = fantasy.withSeed("campaign-7");
const npc = game.npc;

console.log(npc.name.full.form);        // "Aelyn Stormvale"
console.log(npc.name.full.translation); // "Silver-stream Storm-vale"
console.log(npc.name.full.language);    // "fantasy.elvish"
```

### Generate glyphs alongside the name

```ts
import { createContext } from "@lexiconlang/core";
import { generateName } from "@lexiconlang/language";
import { glyphsFor } from "@lexiconlang/glyphs";
import { elvish } from "@lexiconlang/fantasy";

const ctx = createContext({ seed: "campaign-1" });
const name = generateName(elvish, "given", ctx.child("hero"));
// → { form: "WaeYia", translation: "wild-vine", language: "fantasy.elvish" }

const glyphs = glyphsFor(name, elvish.visualGlyphSystems!.conceptual!, ctx.child("hero"));
// → { conceptual: [{ id: "g0", meaning: "wild", unicode: "🌿" },
//                  { id: "g1", meaning: "vine", unicode: "🌿" }] }

glyphs.conceptual?.map(g => g.unicode).join(""); // "🌿🌿"
```

Same seed → byte-identical glyphs. Swap `elvish` for `dwarvish` to get SVG runes; for `humanoid` (sci-fi) to get Canvas drawing instructions. See [examples/09-glyphs.ts](examples/09-glyphs.ts).

### Sci-fi alien names

```ts
import { humanoidName, mycoidName, plantoidName } from "@lexiconlang/scifi";
import { createContext } from "@lexiconlang/core";

const ctx = createContext({ seed: "crew-manifest" });

console.log(humanoidName.generate(ctx.child("humanoid:1")).form);
console.log(mycoidName.generate(ctx.child("mycoid:1")).form);
console.log(plantoidName.generate(ctx.child("plantoid:1")).form);
```

### 4. Compose your own

```ts
import { compose, oneOf, intRange } from "@lexiconlang/core";
import { fullName } from "@lexiconlang/fantasy";

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
import { grammar, t } from "@lexiconlang/grammar";

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
import { markov, train } from "@lexiconlang/markov";

const model = train(["aberffraw", "betws", "caernarfon", /* ... */], {
  order: 3,
  rejectSubstringsOfLength: 6,  // refuse verbatim training entries
});
const townName = markov(model);
townName.generate(ctx); // "Llanrwst" — never seen in training, but feels right
```

For production: train offline via the CLI and ship the precomputed JSON model.

```bash
lexiconlang build-markov ./corpora/welsh-towns.json --out ./models/welsh.json --order 3
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
| [`@lexiconlang/core`](packages/core) | sfc32 RNG with deterministic string-fork, `Context` tree, `Generator`, composition primitives (`compose`, `oneOf`, `pickOf`, `repeat`, `weightedList`, `map`, `chain`), alias-method sampling, `Registry` |
| [`@lexiconlang/grammar`](packages/grammar) | Tracery-compatible JSON grammars + TS tagged-template DSL (`t\`...\``); 16 builtin modifiers; plugin-namespace symbol refs (e.g. `#markov:elven#`) |
| [`@lexiconlang/markov`](packages/markov) | Character-level Markov n-gram trainer + sampler; backoff smoothing; `rejectSubstringsOfLength` for verbatim-rejection; JSON model format |
| [`@lexiconlang/fantasy`](packages/fantasy) | Genre pack: 9 race-aware Markov name generators, NPCs, settlements, taverns, factions, cults, weapons, armor, dragons, quest hooks (~35 generators) |
| [`@lexiconlang/scifi`](packages/scifi) | Genre pack: alien species (humanoid/insectoid/aquatic/synth/human), star systems with planets, ships, megacorps, factions (~15 generators) |
| [`@lexiconlang/glyphs`](packages/glyphs) | Visual writing systems: deterministic SVG / Unicode / Canvas glyph rendering per culture, with phoneme / morpheme / holistic mapping strategies |
| [`@lexiconlang/modern`](packages/modern) | Genre pack: people with full email/phone/address, cities, streets, companies, bands, songs, books (~16 generators) |
| [`@lexiconlang/cli`](packages/cli) | `lexiconlang` command-line tool — `build-markov`, `scaffold-pack` |

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
| [09-glyphs](examples/09-glyphs.ts)                    | visual writing systems: SVG runes, Unicode ideograms, Canvas glyphs |

```bash
pnpm install
pnpm --filter examples quickstart
pnpm --filter examples all
```

---

## CLI

The `@lexiconlang/cli` package installs a `lexiconlang` binary:

```bash
# Train a Markov model from a corpus and save the precomputed table.
lexiconlang build-markov ./corpus.json --out ./model.json \
  --order 3 --min-length 4 --max-length 12 \
  --reject-substrings-of-length 5

# Scaffold a new genre pack package.
lexiconlang scaffold-pack noir --dir ./packages
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

- **v0.1** — deterministic core, grammar, Markov, fantasy/scifi/modern packs, CLI.
- **v0.2** — `@lexiconlang/language`: phoneme/syllable system, per-culture phonotactics, morpheme-rich names with English translations.
- **v0.3** *(current)* — `@lexiconlang/glyphs`: visual writing systems (SVG / Unicode / Canvas) with per-culture glyph registries and three mapping strategies.
- **v0.4** — `@lexiconlang/llm`: bake-out CLI (recipe + Zod schema → validated weighted-list JSON) + live `AsyncGenerator` with content-addressed cache (`hash(prompt, scope, seed, model)`). Cache is shippable — play through your game once, commit the cache, ship a fully deterministic offline build.
- **v0.5+** — browser playground for visualizing glyph systems, additional culture glyphs (orcish, halfling, draconic), CLI glyph rendering, additional packs (cyberpunk, post-apoc, historical).

---

## Prior art and credit

- [Tracery](https://tracery.io/) (Kate Compton) — `lexiconlang` adopts its `#symbol#` grammar conventions and modifier model. JSON grammars from Tracery are mostly source-compatible.
- [markov-namegen](https://github.com/Tw1ddle/markov-namegen-lib) (Tw1ddle) — Markov-process-based name generation; the verbatim-rejection idea is borrowed from this lineage.
- [Dwarf Fortress](https://dwarffortresswiki.org/index.php/Language) (Bay 12) — the "every culture has a language with words for things; names are compositions of meanings" model that v0.2's phonology system is built around.
- [Faker.js](https://fakerjs.dev/), [Chance.js](https://chancejs.com/), [rot.js](https://ondras.github.io/rot.js/), [Improv](https://github.com/sequitur/improv), [Bracery](https://github.com/ihh/bracery) — each tackles one slice of this problem; this library aims to absorb the best of each behind one composable interface.

---

## License

[MIT](LICENSE)
