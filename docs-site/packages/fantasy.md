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
