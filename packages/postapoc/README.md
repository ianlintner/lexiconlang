# @lexiconlang/postapoc

Post-apocalyptic genre pack for lexiconlang, built on the declarative F2 pack format
(`postapoc.pack.json`) with a thin typed facade.

```bash
pnpm add @lexiconlang/postapoc
```

```ts
import { postapoc } from "@lexiconlang/postapoc";

const w = postapoc.withSeed("ash-road");
w.person();              // { form: "Gaskit Quietfoot", translation: "Gasket Quiet-Foot", ... }
w.person("techcult");    // "Steward Wattis of the Slow Clock"
w.settlement();          // "Tirepit"
w.raiders();             // "The Wyre Scorpz"
w.vault();               // { name: "Redoubt 150 — The Counting House", detail: "..." }
w.mutation();            // "Blood: lined with fine, bristling quills"
w.gear();                // "Flare gun — sound but worn (fair) — smeared with soot"
w.vehicle();             // "Ox cart, with a stolen siren, is faster than it looks"
w.tradeGoods();          // "a small pouch of engine oil worth less than it costs"
w.encounter();           // "A sudden hailstorm passes within the hour"
```

Cultures: **scrapper** (degraded-English survivors), **techcult** (reverent machine-keepers) and
**vaultborn** (bunker-raised). Every name carries a plain-English `translation`.

Generators are also reachable by id through any `@lexiconlang/packs` world:
`postapoc.install(world)` then `world.generate(generatorIds.mutation, "key")`.

See `PROVENANCE.md` for data licensing (CC0-1.0, original).
