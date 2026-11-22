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

console.log(hm.name().full);       // "Rhys the Stout"
console.log(hm.manor());           // "St. Dunstan's Lang Hamlet"
console.log(hm.guild());           // "Guild of Tanners"
console.log(hm.monastery());       // "Franciscan House of Rievaulx"
console.log(hm.title());           // "Eastern Squire"
console.log(hm.listing());         // { good: "Fine linen", price: 9, unit: "penny" }
console.log(hm.event());           // "the roof of the granary was repaired"

const arms = hm.arms();
console.log(arms.blazon);          // "Vert, a tower Or"
console.log(hm.shield().slice(0, 60)); // '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120"'
```

Examples below come from one seeded facade, so they depend on call order; the same seed and call sequence always reproduce them. Each facade call has its own key-scoped sub-context.

| Generator | Example |
| --- | --- |
| person name | `Rhys the Stout` |
| manor | `St. Dunstan's Lang Hamlet` |
| guild | `Guild of Tanners` |
| monastery | `Franciscan House of Rievaulx` |
| title | `Eastern Squire` |
| market listing | `{ good: "Fine linen", price: 9, unit: "penny" }` |
| domain event | `the roof of the granary was repaired` |
| heraldry | `Vert, a tower Or` |

## Naming cultures

Four original, synthetic styles: `latin`, `oldenglish`, `celtic`, `norse`. Each has translated given names and bynames. Select one explicitly:

```ts
hm.name({ culture: "norse" });
```

## Heraldic rules (subset)

Text blazons use seven tinctures (Or, Argent, Azure, Gules, Sable, Vert, Purpure) and a single charge. `heraldry.generate()` enforces the documented metal-on-colour / colour-on-metal contrast rule: the field and the charge tincture are always different and always one metal plus one colour. This is a generator convention, not a claim of universal heraldic accuracy. `blazon(device)` renders an arbitrary device verbatim, so callers supplying their own device remain responsible for its rules. Attitudes cover rampant, passant, statant, displayed, salient and segreant. `shieldSvg(arms)` renders a simple deterministic SVG shield suitable for fixtures.

## Open formats

The pack is `data/historical-medieval.pack.json` (pack v1, CC0-1.0) validated by `@lexiconlang/packs`. It uses original data only — no real living people, trademarks or setting-specific IP. See the package's `data/PROVENANCE.md`.
