# Examples

Runnable, self-contained programs covering the things consumers most often need to do.

| File | Demonstrates |
|---|---|
| [01-quickstart.ts](01-quickstart.ts) | Smallest possible program — pin a seed, get an NPC, a tavern, a quest. |
| [02-batch-patrons.ts](02-batch-patrons.ts) | `repeat(generator, count)` for batch generation. Fixed and ranged counts. |
| [03-world-tree.ts](03-world-tree.ts) | Hierarchical worlds via `ctx.child(label)`. Lazily generate a settlement on demand. |
| [04-custom-generator.ts](04-custom-generator.ts) | Compose your own `Generator<T>` from primitives + pack pieces. |
| [05-custom-grammar.ts](05-custom-grammar.ts) | Author Tracery-style grammars in JSON or with the TS tagged template. Custom modifiers. |
| [06-custom-markov.ts](06-custom-markov.ts) | Train a Markov chain on your own corpus. Verbatim-rejection. |
| [07-seed-and-reroll.ts](07-seed-and-reroll.ts) | Save = seed. Partial rerolls without disturbing the rest of the world. |
| [08-cross-genre.ts](08-cross-genre.ts) | Mixing fantasy + sci-fi + modern packs in one game. |

## Run

```bash
# from the repo root
pnpm install                    # installs tsx into examples/

pnpm --filter examples quickstart
pnpm --filter examples tavern
pnpm --filter examples world
pnpm --filter examples custom-generator
pnpm --filter examples custom-grammar
pnpm --filter examples custom-markov
pnpm --filter examples reroll
pnpm --filter examples cross-genre

pnpm --filter examples all      # run everything in sequence
```

## Reading order

If you're new to the library, read them in numeric order. Each builds on the previous:

1. **01** — vocabulary: `withSeed`, the `.npc` / `.place.tavern()` shape.
2. **02** — `repeat` and the determinism guarantee.
3. **03** — the seed *tree*: how labels become reproducible identity.
4. **04** — making your own generator.
5. **05** — making your own grammar.
6. **06** — making your own Markov model.
7. **07** — using all of the above to build a save system.
8. **08** — crossing the streams.

## Patterns at a glance

```ts
// One-off
fantasy.withSeed("seed").npc

// Batch
repeat(npc, 12).generate(ctx)
repeat(npc, { min: 3, max: 8 }).generate(ctx)

// Hierarchy
ctx.child("region:0").child("settlement:5").child("npc:elder")

// Compose
compose({ id: "myThing", parts: { name: nameGen, age: intRange(20, 70) } })

// Grammar
grammar({ start: "The #adj.cap# #noun#", adj: [...], noun: [...] })
grammar({ start: t`The ${"adj.cap"} ${"noun"}`, ... })

// Markov
markov(train(["myCorpus", ...], { order: 3 }))
```
