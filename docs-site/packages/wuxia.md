# @lexiconlang/wuxia

Original wuxia, xianxia and cultivation content pack: sects and schools,
martial techniques, a cultivation-realm ladder, treasures and pills, jianghu
nicknames, sacred mountains, secret realms and two naming styles with glosses.
Released at 0.1.0 under CC0-1.0.

```bash
pnpm add @lexiconlang/wuxia
```

## Quick start

```ts
import { wuxia } from "@lexiconlang/wuxia";

const gen = wuxia.withSeed("iron-bamboo");
console.log(gen.person());
// { form: "Hèlù Qīngyǔ", translation: "crane dew, clear rain", ... }

console.log(gen.place());           // "Shepherd Slope" (GlossedName)
console.log(gen.mountain());        // "Red Crane Ridge" (GlossedName)
console.log(gen.sect());            // "Thunder Mirror Guild"
console.log(gen.technique());       // "Iron Bamboo Sword"
console.log(gen.cultivationRealm());// "Late Starwind Realm"
console.log(gen.treasure());        // "Gold Pendant of the Cloud Vault"
console.log(gen.nickname());        // "Drunken Lotus"
console.log(gen.secretRealm());     // "Silver Threshold"
console.log(gen.pill());            // "Gold Ash Draught of Iron Will"
console.log(gen.tribulation().text);// "A cold wind turns the cultivator's robe inside out."
console.log(gen.omen().text);       // "A temple bell rings at dusk with no one near the rope."
```

Output above is from seed `iron-bamboo` with that exact call order; pin a seed
and call order for reproducible values.

## Generators

| Facade method | Generator | Output |
| --- | --- | --- |
| `person()` | `personName` | `PersonName` with surname-first form, gloss, culture and components |
| `place()` | `placeName` | glossed settlement name |
| `mountain()` | `mountainName` | glossed sacred mountain / peak |
| `sect()` | `sectName` | martial sect or school |
| `technique()` | `techniqueName` | martial technique or palm art |
| `cultivationRealm()` | `realm` | realm from an original ladder |
| `treasure()` | `treasureName` | treasure, vessel or spirit artifact |
| `nickname()` | `nickname` | jianghu nickname |
| `secretRealm()` | `secretRealm` | hidden valley or trial ground |
| `pill()` | `pillName` | alchemical pill or elixir |
| `tribulation()` | `tribulationOracle` | 2d6 ascension trial roll |
| `omen()` | `jianghuOmenOracle` | weighted roadside encounter |

Use `generators` for the bare `Generator<T>` values and `pack` for the
validated manifest. The raw JSON is exported as `@lexiconlang/wuxia/pack.json`.

## Naming styles

Two declarative cultures are included: a pinyin-style romanized style with
English glosses, and a fully translated English style. Each supplies at least
20 given names, 20 surnames/clan names, 20 settlements and 20 mountain names,
every one with a literal plain-English gloss. Names are invented, not
reconstructions of Mandarin or any real tradition.

## Determinism

The facade uses `createContext({ seed })` and a call counter; matching call
sequences yield matching output. Generator internals use stable child keys
(`ctx.child("culture")`, `ctx.child("surname")`, ...), so sibling order never
changes a result. 100 rolls on one seed family yield at least 60% distinct
values per family; this is asserted in the package tests.

## Portability and license

The pack JSON validates against the F2 `pack-v1` schema and semantic rules,
declares only the capabilities it uses (no external pack dependency), and loads
standalone with `loadPack` + `createWorld().use(...)`. Grammars, tables and
culture templates are declarative; the two-culture person/place/mountain
composites are TypeScript-only facade code. The declarative generator
descriptors expose the portable single-culture subset for person/place names;
the TS facade picks between both naming styles and adds a surname. All data is
original synthetic fiction, CC0-1.0, with no real people, trademarks or borrowed
setting IP. See the package's `data/PROVENANCE.md`.
