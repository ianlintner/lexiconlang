# @lexiconlang/cyberpunk

Cyberpunk genre pack for lexiconlang: megacorps, street gangs, runner handles,
cyberware (name, effect, street price tier), districts and arcologies, street
drugs, fixer-job and street-encounter oracles, AI names, corporate product names.

The content is a declarative pack, [`data/cyberpunk.pack.json`](data/cyberpunk.pack.json)
(`lexiconlang.cyberpunk@0.1.0`, CC0-1.0), plus a thin typed facade. Two cultures
give names a form and a plain-language translation:

- **corp-speak** — brand-polished names ("Quorix Combine" = "quorum engine joined force").
- **street-slang** — clipped, gritty names ("Skrapjaw" = "scrap jaw").

```bash
pnpm add @lexiconlang/cyberpunk
```

## Quick start

```ts
import { cyberpunk } from "@lexiconlang/cyberpunk";

const c = cyberpunk.withSeed("neon-district-9");
c.handle();                 // { form: "Ghostcrow", translation: "ghost crow", language: "…/culture/street-slang" }
c.faction.megacorp().form;  // "Veridian Capital"
c.faction.gang().form;      // "Drowned Ravens"
c.faction.org();            // "the Flats Ledger Network"
c.place.arcology().form;    // "Copperline Spire"
c.cyberware();              // { slot, name, effect, tier }
c.drug();                   // { name, effect, risk }
c.fixerJob().text;          // d20 oracle result
c.encounter().text;         // d12 oracle result
```

Each helper draws from a fresh `label:index` path of the seed, so the same seed and
call sequence always yields the same output. For key-addressed, order-independent
output use the world directly:

```ts
const world = cyberpunk.createWorld("campaign-7");
world.generate("lexiconlang.cyberpunk/generator/megacorp-name", "hq");
```

## Generators

| ID suffix (`lexiconlang.cyberpunk/generator/…`) | Output |
| --- | --- |
| `person-name-corp`, `person-name-street` | translated structured name |
| `megacorp-name`, `gang-name`, `faction-name` | factions / orgs |
| `handle` | runner alias |
| `district-name`, `arcology-name` | places |
| `ai-name`, `product-name`, `drug-name` | names |
| `cyberware`, `street-drug` | table roll: `name \| effect \| …` |
| `fixer-job`, `street-encounter` | dice oracles (d20, d12) |

All IDs are exported as `GENERATOR_IDS`. `manifest` and `pack` expose the raw JSON
manifest and the frozen validated pack; load the JSON through `@lexiconlang/packs`
in any other host to reproduce the same output.

## Quality

Distinct output over 100 rolls is at least 88% for every generator. Over 1000 keys the
duplicate rate is quantified in the test suite (about 0.4–0.65 for the 450–900
combination name families, near 0 for table/oracle text); there is no universal
uniqueness target for small intentional vocabularies.

## License and provenance

Data: CC0-1.0. Package: MIT. See [data/PROVENANCE.md](data/PROVENANCE.md).
