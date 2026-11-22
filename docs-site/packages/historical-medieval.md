# @lexiconlang/historical-medieval

Declarative historical-medieval genre pack: people, manors, guilds, monasteries,
feudal titles, market listings, domain events and simple heraldry (blazon + SVG shield).

```bash
pnpm add @lexiconlang/historical-medieval
```

## Quick start

```ts
import { historicalMedieval } from "@lexiconlang/historical-medieval";

const hm = historicalMedieval.withSeed("chronicle");

console.log(hm.name().full);       // "Wulfstan of Lēah"
console.log(hm.manor());           // "Ashby Grange"
console.log(hm.guild());           // "Guild of Dyers"
console.log(hm.monastery());       // "Priory of St. Cuthbert"
console.log(hm.title());           // "Reeve"
console.log(hm.listing());         // { good: "fine salt", price: 7, unit: "penny" }
console.log(hm.event());           // "a relic was displayed at the abbey in the north"

const arms = hm.arms();
console.log(arms.blazon);          // "Azure, a lion rampant Or"
console.log(hm.shield().slice(0, 60)); // '<svg xmlns="http://www.w3.org/2000/svg" …'
```

## Sample output (seed `chronicle`)

| Generator | Example |
| --- | --- |
| person name | `Eiríkr af Fjalli` |
| manor | `Thorn Hall` |
| guild | `Worshipful Company of Goldsmiths` |
| monastery | `Monastery of the Sacred Well` |
| title | `Marcher Lord` |
| market listing | `{ good: "winter rye", price: 12, unit: "penny" }` |
| domain event | `the river froze at the coast` |
| heraldry | `Gules, a griffin displayed Argent` |

## Naming cultures

Four original, synthetic styles: `latin`, `oldenglish`, `celtic`, `norse`. Each has translated given names and bynames. Select one explicitly:

```ts
hm.name({ culture: "norse" });
```

## Heraldic rules (subset)

Text blazons use seven tinctures (Or, Argent, Azure, Gules, Sable, Vert, Purpure) and a single charge. The documented heuristic is metal on colour / colour on metal; this is a generator convention, not a claim of universal heraldic accuracy. Attitudes cover rampant, passant, statant, displayed, salient and segreant. `shieldSvg(arms)` renders a simple deterministic SVG shield suitable for fixtures.

## Open formats

The pack is `data/historical-medieval.pack.json` (pack v1, CC0-1.0) validated by `@lexiconlang/packs`. It uses original data only — no real living people, trademarks or setting-specific IP. See the package's `data/PROVENANCE.md`.
