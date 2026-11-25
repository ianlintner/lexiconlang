# @lexiconlang/weird-west

Weird west genre pack (P9): frontier towns, outlaws with monikers, gangs, saloons, mines,
ranches and brands, wanted posters with a 2d6 bounty table, occult encounters, relics, rumors and
frontier anomalies. Pack id `lexiconlang.weird-west`; all data is original and CC0-1.0 (see `PROVENANCE.md`).
It is a purely fictional frontier fantasy with no real peoples or setting-specific IP.

The content is a declarative F2 pack (`data/weird-west.pack.json`, grammars + F3 tables + two
invented cultures, `dustborn` and `saltmarch`, whose names carry English translations) behind a thin
typed facade. No base-pack dependencies.

```ts
import { weirdWest } from "@lexiconlang/weird-west";

const w = weirdWest.withSeed("high-noon");
w.town();         // "Coyote Spring"
w.outlaw();       // 'Zeb "Bone Dice" Pike'
w.wantedPoster(); // "WANTED · ... · REWARD: $800"
w.encounter();    // occult encounter with an omen
w.name("dustborn", "given"); // { form: "Hobb", translation: "Short Straw", language: "..." }
```

## API

- `weirdWest.withSeed(seed)` returns `town, outlaw, gang, saloon, mine, ranch, brand, wantedPoster,
  wantedPosterRoll, bounty, encounter, relic, rumor, anomaly, name(culture, kind)` and the underlying `world`.
  Each call draws from a fresh stable key, so output is deterministic for a given seed and call order.
- `createWeirdWestWorld(seed)` plus `generatorIds` for keyed, order-independent access via `world.generate(id, key)`.
- `weirdWestPack`: the validated frozen pack, installable into any F2 `World`.

Portability: the pack JSON is fully portable (grammar-v1, tables-v1, language-v1); only the facade is TypeScript.
