# @lexiconlang/steampunk

Original steampunk and gaslamp content pack: inventions and contraptions,
airships, guilds and societies, Victorian-style names, patent titles,
newspaper headlines, districts, automatons and street omens. Released at
0.1.0 under CC0-1.0.

```bash
pnpm add @lexiconlang/steampunk
```

## Quick start

```ts
import { steampunk } from "@lexiconlang/steampunk";

const gen = steampunk.withSeed("brass-clock");
console.log(gen.person());
// { form: "Edwin Ironstone", translation: "blessed friend, iron stone", ... }

console.log(gen.airship());    // "Galvanic Kestrel Express"
console.log(gen.contraption());// "Ornate Aldric Governor Mk III"
console.log(gen.guild());      // "The Worshipful Airship Guild"
console.log(gen.society());    // "The Aetheric Discovery Society"
console.log(gen.headline());   // "Dreadful Valve Survives in Bellevue"
console.log(gen.district());   // "Gaslit Brass Quay"
console.log(gen.automaton());  // "S-17 Porter"
console.log(gen.patent());     // "A Novel Condenser for Fog Dispersal"
console.log(gen.street());     // "Rivet Lane"
console.log(gen.title());      // "First Class Steam Inspector"
console.log(gen.omen().text);  // "A warm brass coin sits on the cobbles, minted next year."
```

Output above is illustrative; pin a seed and call order for reproducible values.

## Generators

| Facade method | Generator | Output |
| --- | --- | --- |
| `person()` | `personName` | `PersonName` with form, gloss, culture and components |
| `place()` | `placeName` | glossed settlement name |
| `airship()` | `airshipName` | airship name |
| `contraption()` | `contraptionName` | invention/contraption name |
| `guild()` | `guildName` | trade guild or association |
| `society()` | `societyName` | learned society or club |
| `headline()` | `headline` | newspaper headline |
| `district()` | `districtName` | city district |
| `automaton()` | `automatonName` | automaton designation |
| `patent()` | `patentTitle` | patent application title |
| `street()` | `streetName` | gaslamp street |
| `title()` | `officialTitle` | civic rank or office |
| `malfunction()` | `malfunctionOracle` | 2d6 machine fault roll |
| `omen()` | `gaslampOmenOracle` | weighted street encounter |

Use `generators` for the bare `Generator<T>` values and `pack` for the
validated manifest. The raw JSON is exported as
`@lexiconlang/steampunk/pack.json`.

## Naming styles

Two declarative cultures are included: an Old-English-inspired industrial
north style and a cosmopolitan city style. Each supplies at least 20 given
names, 20 surnames and 20 settlement names, every one with a literal
plain-English gloss. Names are invented, not historical reconstructions.

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
