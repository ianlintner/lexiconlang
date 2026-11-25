# @lexiconlang/weird-west

Weird west genre pack: frontier towns, outlaws with monikers, gangs, saloons, mines, ranches and
brands, wanted posters (with a 2d6 bounty table), occult encounters, relics, rumors and frontier
anomalies. Pack id `lexiconlang.weird-west`, version 0.1.0, data CC0-1.0 and fully original.

```bash
pnpm add @lexiconlang/weird-west
```

```ts
import { weirdWest } from "@lexiconlang/weird-west";

const w = weirdWest.withSeed("alpha");
console.log(w.town());
console.log(w.outlaw());
console.log(w.wantedPoster());
```

## Sample output (seed `alpha`)

```text
town:      Coyote Spring
outlaw:    Zeb "Bone Dice" Pike
gang:      Voss's Posse
saloon:    The Last Bell
mine:      The Copper Strike
ranch:     The Wickham Homestead
brand:     Crescent Moon chained to Quarter Moon
poster:    WANTED · Iron Lung Yancy · for robbing a mining payroll · Known by a silver tooth · Last seen near Hangman's Creek, drinking away the proceeds · REWARD: $800
encounter: a gunslinger's unburied shadow — sings a hymn in reverse — Every canteen turns brackish.
relic:     the Undertaker's Salt-Crusted Star Badge, bends a river a single yard, but it sours milk and friendships
rumor:     a half-drunk ranch hand says the Calloway claim has run dry and something else is digging — the talk is out of Holy Landing
anomaly:   a boneyard where headstones swap names — on a cattle drive's old route — Compasses lose their north.
```

## Cultures

Two invented tongues, `dustborn` and `saltmarch`, produce `given`, `moniker` and `town` names with English translations:

```ts
w.name("saltmarch", "moniker"); // { form: "Illu Raal", translation: "Tidal Mill", ... }
```

## Generators

`town`, `outlawAlias`, `gang`, `saloon`, `mine`, `ranch`, `brand`, `wantedPoster`, `bounty`,
`occultEncounter`, `relic`, `rumor`, `anomaly`, plus six culture name generators, all exposed
through `weirdWest.generators` and `createWeirdWestWorld(seed).generate(id, key)`.

## License and portability

Data is CC0-1.0 (see the package `PROVENANCE.md`). The pack JSON is portable; the facade is TypeScript.
