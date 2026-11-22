# @lexiconlang/fantasy

Fantasy genre pack: 5 races, NPCs, settlements, taverns, factions, dragons,
weapons, quest hooks — ~35 generators total.

```bash
pnpm add @lexiconlang/fantasy
```

## Quick start

```ts
import { fantasy } from "@lexiconlang/fantasy";

const game = fantasy.withSeed("campaign-1");

game.npc; // full NPC: name, race, age, occupation, personality
game.place.tavern(); // "The Gilded Anchor"
game.place.city(); // "Stormvale"
game.place.landmark();
game.faction.order(); // "The Vigil of the Iron Crown"
game.quest(); // narrative hook
```

## Cultures

| Culture    | Archetype | Visual glyph system           |
| ---------- | --------- | ----------------------------- |
| `dwarvish` | guttural  | SVG runes (phonemic)          |
| `elvish`   | flowing   | Unicode ideograms (morphemic) |
| `orcish`   | guttural  | —                             |
| `halfling` | clipped   | —                             |
| `draconic` | sibilant  | —                             |

All cultures are exported from the package root:

```ts
import {
  dwarvish,
  elvish,
  orcish,
  halfling,
  draconic,
} from "@lexiconlang/fantasy";
```

## Expanded pack (P1, opt-in)

A versioned JSON pack (`src/fantasy.pack.json`) adds two original human naming
cultures and oracle tables for taverns, spells, magic items, deities, guilds,
rumors and shops. All legacy generators keep their IDs and byte-identical output.

```ts
import { expandedWithSeed } from "@lexiconlang/fantasy";

const world = expandedWithSeed("campaign-1");
world.humanV2.northronFullName(); // "Draeggils Sandstone" — no dwarvish placeholder
world.tavern.name();              // "The Boot & Cauldron"
world.spell.name();               // "The Necromancy Sigil"
world.magicItem.full();           // "very rare staff scored by old battles that repels small vermin, at the cost of a memory"
world.rumor().text;               // "All the cats in town have begun following the same direction. The scholars disagree."
```

The pack passes `validatePack`, is registered via `definePack`, and every new
generator has a new `lexiconlang.fantasy/generator/...` ID.

**Content depth.** Every open-ended list/table reaches at least 60 distinct
results in 100 rolls on one seed family; `expanded.test.ts` asserts this for
all 20 generators. The only exemptions are two deliberately closed
categorical selectors — `spell-school` (8 schools) and `magic-item-rarity`
(5 tiers) — documented in that test. Tables achieve depth compositionally:
each core entry is a `sequence` of the original phrase plus an independently
rolled detail phrase from a dedicated table, so the Cartesian product yields
far more than the base list size. Names use original morpheme-composed pools.

**Relation to B1 bases (`@lexiconlang/bases`).** The two human-v2 cultures use
original, self-contained phonotactics and translations rather than extending
B1's Norse/Latin base languages. B1 landed after this card was scoped; its
bases cover historical language families, while human-v2 is intentionally a
setting-agnostic fantasy naming style. This deviation is explicit: no B1
dependency is introduced, so the pack stays asset-free and portable.

## Markov-trained name generators

Race-aware Markov samplers, trained on small curated corpora with
verbatim-rejection:

```ts
import {
  elvenMaleName,
  elvenFemaleName,
  dwarvenMaleName,
  dwarvenFemaleName,
  humanMaleName,
  humanFemaleName,
  orcishName,
  halflingName,
  draconicName,
} from "@lexiconlang/fantasy";
```

## Worldbuilding generators

```ts
import {
  npc,
  fullName,
  settlementName,
  mountainName,
  forestName,
  riverName,
  cityName,
  villageName,
} from "@lexiconlang/fantasy";
```

See the [package source](https://github.com/ianlintner/lexiconlang/tree/main/packages/fantasy) for the full list.
