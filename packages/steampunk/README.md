# @lexiconlang/steampunk

A deterministic steampunk and gaslamp genre pack: inventors, airships,
contraptions, guilds and societies, Victorian-style names, patent titles,
newspaper headlines, districts, automatons and street oracles.

The content is a declarative F2 pack (`data/steampunk.pack.json`) with a thin
typed TypeScript facade. It uses original synthetic data only; no real people,
trademarks, or setting-specific IP.

```bash
pnpm add @lexiconlang/steampunk
```

## Quick start

```ts
import { steampunk } from "@lexiconlang/steampunk";

const gen = steampunk.withSeed("brass-clock");
console.log(gen.person());   // { form: "Edwin Ironstone", translation: "blessed friend, iron stone", ... }
console.log(gen.airship());  // "Galvanic Kestrel Express"
console.log(gen.guild());    // "The Worshipful Airship Guild"
console.log(gen.headline()); // "ASHCORD: BOILER BURSTS"
```

Each call advances a call counter, so the same seed and the same call sequence
always produce identical output. For direct generator use, import the
individual `Generator` values and address sub-rolls with `ctx.child(key)`:

```ts
import { createContext } from "@lexiconlang/core";
import { airshipName, patentTitle } from "@lexiconlang/steampunk";

const ctx = createContext({ seed: "inventor-1" });
airshipName.generate(ctx.child("ship"));
patentTitle.generate(ctx.child("patent"));
```

## Public API

- `steampunk.withSeed(seed)` — facade with `person`, `place`, `airship`,
  `contraption`, `guild`, `society`, `headline`, `district`, `automaton`,
  `patent`, `street`, `title`, `malfunction` and `omen`.
- `generators` — the same 14 generators as `Generator` values.
- `pack` — the validated manifest object; the raw JSON is also published at
  `@lexiconlang/steampunk/pack.json`.
- `GlossedName`, `PersonName`, `SteampunkAPI`, `SteampunkEntry` — public types.

## Determinism and sibling ordering

Every sub-roll derives from `ctx.child("<stable-key>")`; adding a new sibling
generator or changing call order does not alter existing sequences. Existing
generator IDs from other packages are untouched.

## Portability

Grammars, tables and culture templates are declarative JSON and can be consumed
by other ports. The TypeScript person/place facade (which composes two
cultures and glosses) is a TS-only composite and is not yet portable via a
generator descriptor. The included tables use weighted/dice entries and plain
text results only.

## License and provenance

All data is original synthetic fiction released as CC0-1.0. See
[PROVENANCE.md](./PROVENANCE.md) for the inventory.
