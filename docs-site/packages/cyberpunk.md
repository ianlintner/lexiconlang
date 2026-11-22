# @lexiconlang/cyberpunk

Cyberpunk genre pack: megacorps, street gangs, runner handles, cyberware (name, effect,
street price tier), districts and arcologies, street drugs, fixer-job and street-encounter
oracles, AI names and corporate product names. Built on the declarative pack format
(`data/cyberpunk.pack.json`, CC0-1.0) with a thin typed facade.

```bash
pnpm add @lexiconlang/cyberpunk
```

## Quick start

```ts
import { cyberpunk } from "@lexiconlang/cyberpunk";

const c = cyberpunk.withSeed("sample");
c.handle();
c.faction.megacorp();
c.cyberware();
c.fixerJob().text;
```

## Cultures

- **corp-speak**: polished brand names; translations decode the brand.
- **street-slang**: clipped handles, gangs and districts; translations give the plain meaning.

## Sample output (seed `sample`)

```text
person (corp)    Odalys Northcott            "wealthy of north cottage"
person (street)  Mako "Neon" Santos          "shark neon saints"
handle           Ghostcrow                   "ghost crow"
megacorp         Veridian Capital            "ever-green the head count"
gang             Drowned Ravens              "underwater large crows"
organization     the Flats Ledger Network
district         Kilo Lanes                  "thousand paths"
arcology         Copperline Spire            "copper track tall needle"
AI               CobwebOS                    "spun trap operating system"
product          Atlas X                     "world bearer unknown"
drug             Nova Fizz | Numb, easy confidence for an hour, then nothing at all, which is the trouble | Legal in the arcology, deadly in the gutter
cyberware        Prowl Lens Mk II | Zoom and range-finding overlay, with a tendency to overheat | Pocket change (under 100 cred)
fixer job (d20)  Erase a vault key on a necklace from the records at a laundromat that fronts for a gang for a courier company short on drivers, by dawn. Complication: the job is a test for a bigger one. Pay is a clean ID and a clear conscience.
encounter (d12)  A drifter staring at a freshly painted warning; They want to trade a secret for protection.
```

## Generators

`person-name-corp`, `person-name-street`, `megacorp-name`, `gang-name`, `handle`,
`district-name`, `arcology-name`, `ai-name`, `product-name`, `drug-name`, `faction-name`,
`cyberware`, `street-drug`, `fixer-job`, `street-encounter`, all under
`lexiconlang.cyberpunk/generator/`. `GENERATOR_IDS` exports them.

Use `cyberpunk.createWorld(seed).generate(id, key)` for key-addressed output, or load
`data/cyberpunk.pack.json` through `@lexiconlang/packs` in any host.

## License

Data CC0-1.0, package MIT. All content is original; no trademarked or setting-specific names.
