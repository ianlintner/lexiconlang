# @lexiconlang/grimdark

A deterministic grimdark genre pack: warbands and banners, heresies and
inquisitions, plagues and mutations, grim titles, siege engines, ratfolk
vermin clans with warlords, and doom-laden battle names.

The content is a declarative F2 pack (`data/grimdark.pack.json`) with a thin
typed TypeScript facade. It uses original synthetic data only; no real people,
trademarks, or setting-specific IP (no Warhammer or Skaven names).

```bash
pnpm add @lexiconlang/grimdark
```

## Quick start

```ts
import { grimdark } from "@lexiconlang/grimdark";

const gen = grimdark.withSeed("black-standard");
console.log(gen.person());        // { form: "Aldrek Ashgrave", translation: "old ruler, ash tomb", ... }
console.log(gen.warband());       // "Grim Banner of the Fallen"
console.log(gen.heresy());        // "The Hollow Litany of the Worm"
console.log(gen.clan());          // "The Greywhisker Clan"
console.log(gen.warlord());       // "Warlord Cinderfang the Ashen"
console.log(gen.battle());        // "The Massacre at Dreadmoor of Ash"
console.log(gen.omen().text);     // "Ashen crows gather on the war banner and refuse to fly."
```

Each call advances a call counter, so the same seed and the same call sequence
always produce identical output. For direct generator use, import the
individual `Generator` values and address sub-rolls with `ctx.child(key)`:

```ts
import { createContext } from "@lexiconlang/core";
import { warbandName, clanName } from "@lexiconlang/grimdark";

const ctx = createContext({ seed: "warhost-1" });
warbandName.generate(ctx.child("warband"));
clanName.generate(ctx.child("clan"));
```

## Public API

- `grimdark.withSeed(seed)` — facade with `person`, `place`, `warband`,
  `banner`, `heresy`, `inquisition`, `plague`, `mutation`, `title`,
  `warMachine`, `clan`, `warlord`, `verminWarlord`, `battle`, `omen` and
  `plagueOutcome`.
- `generators` — the same generators as `Generator` values.
- `pack` — the validated manifest object; the raw JSON is also published at
  `@lexiconlang/grimdark/pack.json`.
- `GlossedName`, `PersonName`, `GrimdarkAPI`, `GrimdarkEntry` — public types.

## Determinism and sibling ordering

Every sub-roll derives from `ctx.child("<stable-key>")`; adding a new sibling
generator or changing call order does not alter existing sequences. Existing
generator IDs from other packages are untouched. The two naming styles
(Ashbound human warbands and Vermin ratfolk clans) each supply original given,
lineage and settlement pools with literal glosses.

## Portability

Grammars, tables and culture templates are declarative JSON and can be consumed
by other ports. The TypeScript person/place composite (which composes two
cultures and glosses) is a TS-only composite and is not yet portable via a
generator descriptor. The included tables use weighted/dice entries and plain
text results only.

## License and provenance

All data is original synthetic fiction released as CC0-1.0. No Warhammer,
Skaven or other setting-specific names are reproduced. See
[PROVENANCE.md](./PROVENANCE.md) for the inventory.
