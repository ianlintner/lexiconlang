# @lexiconlang/scifi

Sci-fi genre pack: 9 alien species, star systems with planets, ships,
megacorps, factions — ~15 generators total.

```bash
pnpm add @lexiconlang/scifi
```

## Quick start

```ts
import { humanoidName, insectoidName, aquaticName } from "@lexiconlang/scifi";
import { createContext } from "@lexiconlang/core";

const ctx = createContext({ seed: "crew-manifest" });

humanoidName.generate(ctx.child("captain")); // → TranslatedName
insectoidName.generate(ctx.child("engineer"));
aquaticName.generate(ctx.child("medic"));
```

## Cultures

| Culture      | Archetype | Visual glyph system         |
| ------------ | --------- | --------------------------- |
| `humanoid`   | flowing   | Canvas geometric (holistic) |
| `insectoid`  | sibilant  | SVG chitin (phonemic)       |
| `aquatic`    | flowing   | —                           |
| `synth`      | clipped   | —                           |
| `birdpeople` | flowing   | —                           |
| `rockpeople` | guttural  | —                           |
| `mycoids`    | resonant  | —                           |
| `mammalian`  | flowing   | —                           |
| `plantoid`   | flowing   | —                           |

All cultures are exported from the package root.

## Worldbuilding generators

```ts
import {
  starSystem,
  ship,
  megacorp,
  faction,
  species,
  speciesName, // generates a name for a given species
} from "@lexiconlang/scifi";
```

See the [package source](https://github.com/ianlintner/lexiconlang/tree/main/packages/scifi) for the full list.
