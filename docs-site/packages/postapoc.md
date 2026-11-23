# @lexiconlang/postapoc

Post-apocalyptic genre pack: wasteland settlements, raider bands, tech-cults,
bunkers, mutations, scavenged gear with condition, vehicles, trade goods and a
2d6 encounters oracle — 14 generators, three cultures, all original CC0 data.
Built from the declarative pack format (`postapoc.pack.json`) with a thin typed
facade.

```bash
pnpm add @lexiconlang/postapoc
```

## Quick start

```ts
import { postapoc } from "@lexiconlang/postapoc";

const w = postapoc.withSeed("ash-road");

w.person();            // Gaskit Quietfoot   (Gasket Quiet-Foot)
w.person("techcult");  // Steward Wattis of the Slow Clock
w.person("vaultborn"); // Sable of Ward C
w.settlement();        // Tirepit
w.raiders();           // The Wyre Scorpz    (The Wire Scorpions)
w.techcult();          // The Cabal of the Clean Signal
w.vault();             // Redoubt 150 — The Counting House
w.mutation();          // Blood: lined with fine, bristling quills
w.gear();              // Flare gun — sound but worn (fair) — smeared with soot
w.vehicle();           // Ox cart, with a stolen siren, is faster than it looks
w.tradeGoods();        // a small pouch of engine oil worth less than it costs
w.encounter();         // A sudden hailstorm passes within the hour
```

Same seed and same call sequence give the same output. Each call derives its
own key, so results are independent of what other pack content you generate.

## Cultures

| Culture    | Style                                                       | Example                              |
| ---------- | ----------------------------------------------------------- | ------------------------------------ |
| `scrapper` | Degraded English survivors; `form` vs plain `translation`   | `Gaskit Quietfoot` → Gasket Quiet-Foot |
| `techcult` | Reverent machine-keepers with titles and rites              | `Adept Voltan of the Warm Circuit`   |
| `vaultborn`| Clean English with ward/level tags                          | `Sable of Ward C`                    |

## Using the pack in a world

```ts
import { createWorld } from "@lexiconlang/packs";
import { postapoc, generatorIds } from "@lexiconlang/postapoc";

const world = postapoc.install(createWorld({ seed: "campaign-3" }));
world.generateItem(generatorIds.encounter, "road", 0);
```

`generatorIds` lists every id: `personScrapper`, `personTechcult`,
`personVaultborn`, `settlementScrapper`, `settlementTechcult`, `raiderBand`,
`techcultFaction`, `vaultName`, `vaultDetail`, `mutation`, `gear`, `vehicle`,
`tradeGoods`, `encounter`. The raw manifest is exported at
`@lexiconlang/postapoc/postapoc.pack.json`.

## Data and licensing

All content is original and CC0-1.0; see `PROVENANCE.md` in the package.
