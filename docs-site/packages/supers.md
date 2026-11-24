# @lexiconlang/supers

A declarative genre pack for masked-hero fiction: hero and villain codenames,
power sets with limits, origins, teams and organizations, modern secret
identities, lairs, headlines and incident oracles. All content lives in a
versioned JSON pack with a thin typed TypeScript facade.

```sh
pnpm add @lexiconlang/supers
```

## Quick start

```ts
import { supers } from "@lexiconlang/supers";

const nightwatch = supers.withSeed("nightwatch-17");

nightwatch.hero();        // "Open Finch"
nightwatch.villain();     // "Razor I"
nightwatch.power();       // "Chalk lines at a distance"
nightwatch.incident().text; // "A city bus hovers politely at an intersection..."
nightwatch.dossier();     // complete costumed identity (see below)
```

`withSeed` is deterministic: the same seed and the same call sequence always
produce the same output. Each sub-roll uses a stable `ctx.child("<key>")`, so
adding or reordering a field never shifts another field's RNG lane.

## API

| Method | Result |
| --- | --- |
| `person()` | `PersonName` — modern given + surname with glosses and culture id |
| `place()` | `GlossedName` — modern settlement name with gloss |
| `hero()` / `villain()` | codename string |
| `power()` / `origin()` / `team()` / `lair()` / `motto()` | string |
| `headline()` | tabloid headline string |
| `limit()` / `incident()` / `omen()` | `TableRoll` (2d6 power limit, weighted incident, weighted omen) |
| `powerSet()` | `PowerSet` — ability, limit and origin |
| `dossier()` | `HeroDossier` — codename, alignment, secret identity, hometown, powers, team, lair, motto, headline |

The raw generator map is exported as `generators`, and the validated manifest
as `pack`. The pack JSON is also available as `@lexiconlang/supers/pack.json`.

## Sample output (seed `nightwatch-17`)

```text
person:   Kira Kane — "light-bringer, little battle" (nightshift style)
place:    Orchard Vale — "orchard valley"
hero:     Open Finch
villain:  Razor I
power:    Chalk lines at a distance
origin:   A strange transfusion changed everything
team:     A Silver Posse
lair:     Loft beneath the library
headline: Allegedly disarms a collapsing bridge as the Verdant Circle watches
motto:    The bridge after dark
limit:    Usable for only a heartbeat; the effort leaves a ringing headache.
incident: A city bus hovers politely at an intersection until a masked figure waves it down.
omen:     Tomorrow's paper is already on the stand, with today's date.
```

A complete dossier:

```json
{
  "codename": "Rust",
  "alignment": "villain",
  "secretIdentity": { "form": "Cassian Hayashi", "translation": "brass, forest" },
  "hometown": { "form": "Fairhaven", "translation": "fair harbor" },
  "powers": {
    "ability": "Web of radiation",
    "limit": "Requires direct touch and a clear line of sight to the target.",
    "origin": "Unlocked a hidden aptitude at a flooded archive"
  },
  "team": "Lantern Workshop",
  "lair": "Hatch beneath the library",
  "motto": "Watch the dark",
  "headline": "BREAKING: the Verdant Circle sabotages a strange comet"
}
```

## Cross-genre use

`examples/08-cross-genre.ts` composes the supers pack with fantasy, sci-fi,
modern and steampunk generators in one runnable example.

## Content and licensing

Two modern naming styles (`civic` and `nightshift`) supply person and place
names with literal English glosses. Eight grammars and three tables (power
limits, incidents, omens) provide 13 pack generators plus the typed composites.
All strings are original synthetic fiction: no real living people, trademarks
or setting-specific IP. The data is CC0-1.0; see `data/PROVENANCE.md`.
