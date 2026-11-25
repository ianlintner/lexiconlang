# @lexiconlang/pirates

An original, CC0 pirates & age-of-sail genre pack built on the declarative
pack format: ships and classes, pirate captains with epithets, crews, ports and
coves, treasure and maps, sea-shanty titles, naval ranks and a sea-encounter
oracle.

```bash
pnpm add @lexiconlang/pirates
```

## Quick start

```ts
import { pirates } from "@lexiconlang/pirates";

const voyage = pirates.withSeed("the-grey-gull");

console.log(voyage.ship());       // "The Gilded Wake"
console.log(voyage.shipClass());  // "heavy galleon"
console.log(voyage.captain());    // { full, translation, given, surname, epithet, culture }
console.log(voyage.crew());       // "the Salt-Stained Mates"
console.log(voyage.port());       // "Blackwater Landing"
console.log(voyage.treasure());   // "Buried Pearls"
console.log(voyage.map());        // "the faded sounding chart"
console.log(voyage.shanty());     // "The Ballad of the drowned bell"
console.log(voyage.rank());       // "Quartermaster"
console.log(voyage.encounter());  // { table, entry, text, ... }
console.log(voyage.weather());    // d6 weather and omens
console.log(voyage.cargo());      // cargo and plunder oracle
```

Every method uses a fixed, named child key, so repeated calls are stable and
adding a new method never shifts an existing result.

## Cultures

Two authored naming styles are included, each with translated person, place,
ship and faction term pools:

- `lexiconlang.pirates/culture/corsair`
- `lexiconlang.pirates/culture/buccaneer`

`voyage.captain()` selects one culture and returns both the surface form and
an English translation.

## Generators

The package exports individual `Generator<T>` values for all 14 content
families under `pirates.generators`, plus named top-level exports
(`shipName`, `shipClass`, `captainName`, `captainEpithet`, `crewName`,
`portCove`, `factionName`, `treasure`, `mapName`, `shantyTitle`, `navalRank`,
`seaEncounter`, `weatherPortent`, `cargoHaul`).

The declarative source of truth is `data/pirates.pack.json` (pack v1). Use
`validatePack(pirates.data)` from `@lexiconlang/packs` to check it.

## Provenance

All data is original and released as CC0-1.0. No real living people,
trademarked names or setting-specific IP are used. See `PROVENANCE.md`.
