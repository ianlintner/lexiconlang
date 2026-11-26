# @lexiconlang/grimdark

Original grimdark content pack: warbands and banners, heresies and
inquisitions, plagues and mutations, grim titles, siege engines, ratfolk
vermin clans with warlords, and doom-laden battles. Released at 0.1.0 under
CC0-1.0. No Warhammer, Skaven or other setting-specific IP is used.

```bash
pnpm add @lexiconlang/grimdark
```

## Quick start

```ts
import { grimdark } from "@lexiconlang/grimdark";

const gen = grimdark.withSeed("black-standard");
console.log(gen.person());       // { form: "Aldrek Ashgrave", translation: "old ruler, ash tomb", ... }
console.log(gen.warband());      // "Grim Banner of the Fallen"
console.log(gen.banner());       // "Blood and Ruin"
console.log(gen.heresy());       // "The Hollow Litany of the Worm"
console.log(gen.inquisition());  // "The Pale Inquisition of the Ninth Seal"
console.log(gen.plague());       // "The Rotting Pox of Dreadmoor"
console.log(gen.mutation());     // "The Horned Maw of the Hollow Choir"
console.log(gen.title());        // "Ashwarden of Blackfen"
console.log(gen.warMachine());   // "The Iron Trebuchet Mark IX"
console.log(gen.clan());         // "The Greywhisker Clan"
console.log(gen.warlord());      // "Warlord Cinderfang the Ashen"
console.log(gen.battle());       // "The Massacre at Dreadmoor of Ash"
console.log(gen.omen().text);    // "Ashen crows gather on the war banner and refuse to fly."
console.log(gen.plagueOutcome().text); // "The gates are sealed from within..."
```

Output above is illustrative; pin a seed and call order for reproducible values.

## Generators

| Facade method | Generator | Output |
| --- | --- | --- |
| `person()` | `personName` | `PersonName` with form, gloss, culture and components |
| `place()` | `placeName` | glossed settlement name |
| `warband()` | `warbandName` | dark-fantasy warband / company |
| `banner()` | `bannerMotto` | doom-laden war banner motto |
| `heresy()` | `heresyName` | heretical creed, sect or gospel |
| `inquisition()` | `inquisitionName` | inquisitorial court or tribunal |
| `plague()` | `plagueName` | plague or pestilence |
| `mutation()` | `mutationName` | mutation and afflicted body-part |
| `title()` | `grimTitle` | grim title or office |
| `warMachine()` | `warMachineName` | siege engine / war machine |
| `clan()` | `clanName` | ratfolk / vermin clan |
| `warlord()` | `warlordName` | ratfolk warlord designation |
| `verminWarlord()` | `verminWarlordName` | glossed given + clan name |
| `battle()` | `battleName` | doom-laden battle name |
| `omen()` | `doomOmenOracle` | weighted omen of impending doom |
| `plagueOutcome()` | `plagueOutcomeOracle` | 2d6 plague outcome |

Use `generators` for the bare `Generator<T>` values and `pack` for the
validated manifest. The raw JSON is exported as
`@lexiconlang/grimdark/pack.json`.

## Naming styles

Two declarative cultures are included: an Ashbound human warband style and a
Vermin ratfolk clan style. Each supplies at least 20 given names, 20 lineage
(surname or clan) names and 20 settlement names, every one with a literal
plain-English gloss. Ratfolk clans and warlords are entirely original
invented strings; no commercial-setting names appear.

## Determinism

The facade uses `createContext({ seed })` and a call counter; matching call
sequences yield matching output. Generator internals use stable child keys
(`ctx.child("culture")`, `ctx.child("given")`, ...), so sibling order never
changes a result. 100 rolls on one seed family yield at least 60% distinct
values per family; this is asserted in the package tests.

## Portability and license

The pack JSON validates against the F2 `pack-v1` schema and semantic rules.
Grammars, tables and culture templates are declarative; the two-culture
person/place composite is a TypeScript-only facade. All data is original
synthetic fiction, CC0-1.0, with no real people, trademarks or borrowed
setting IP. See the package's `PROVENANCE.md`.
