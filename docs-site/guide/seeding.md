# The seeding model

Determinism is the whole point. Three rules govern every generator in the
library:

## The three rules

**1. Every generator pulls randomness from `ctx.rng`.**
Generators never close over their own RNG. They are pure functions of
`(Context) → T`.

**2. `ctx.child(label)` derives a new context whose RNG is hashed from the
parent's *origin seed* and the label** — *not* from the parent's stream.

This is the key trick. Forking sibling A then sibling B gives you the same
children regardless of how many times you fork, in what order, or whether you
skip some entirely. The seed graph is content-addressable.

**3. `compose` uses field names as labels.**
Reordering or adding fields to your generator type doesn't invalidate any
existing field's seed. New fields get new seeds; existing fields keep theirs.

## What this buys you

```ts
import { createContext } from "@lexiconlang/core";
import { npc } from "@lexiconlang/fantasy";

const root1 = createContext({ seed: "world" });
const root2 = createContext({ seed: "world" });

// Walk many siblings before reaching the target on one tree.
for (let i = 0; i < 100; i++) root1.child(`region:${i}`);

// Both contexts produce the same NPC for the same path:
const a = npc.generate(
  root1.child("region:5").child("settlement:11").child("npc:3")
);
const b = npc.generate(
  root2.child("region:5").child("settlement:11").child("npc:3")
);

a.name.full === b.name.full; // true, byte for byte
```

## Save = seed

A whole world tree reconstructs from one string. You don't need to serialize
the world — you serialize the seed and the player's local mutations.

To support player-driven rerolls without disturbing the rest of the world,
encode "version" as part of the path:

```ts
const settlement = root
  .child("region:0")
  .child("settlement:5")
  .child(`v:${rerolls[path] ?? 0}`);
```

Bumping `v:0` → `v:1` rerolls just that one settlement. Everyone else is
untouched.

## Under the hood

- **PRNG:** [sfc32](https://pracrand.sourceforge.net/RNG_engines.txt) — 128-bit state, passes BigCrush, ~2 ns/call in V8.
- **Forking:** SplitMix64-on-strings (FNV-1a → SplitMix64). Deterministic, ASCII-safe.
- **State:** Serializable as 4 × u32.
- **Tested:** Golden snapshot tests verify that the same seed produces the same output across library versions.
