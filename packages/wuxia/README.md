# @lexiconlang/wuxia

A deterministic wuxia / xianxia / cultivation genre pack: sects and schools,
martial techniques, a cultivation-realm ladder, treasures and pills, jianghu
nicknames, sacred mountains and hidden secret realms. Two naming styles supply
pinyin-style names and fully translated English names, each with a gloss.

The content is a declarative F2 pack (`data/wuxia.pack.json`) with a thin typed
TypeScript facade. It uses original synthetic data only; no real people,
trademarks, or setting-specific IP.

```bash
pnpm add @lexiconlang/wuxia
```

## Quick start

```ts
import { wuxia } from "@lexiconlang/wuxia";

const gen = wuxia.withSeed("iron-bamboo");
console.log(gen.person());          // { form: "Hèlù Qīngyǔ", translation: "crane dew, clear rain", ... }
console.log(gen.sect());            // "Thunder Mirror Guild"
console.log(gen.technique());       // "Iron Bamboo Sword"
console.log(gen.cultivationRealm());// "Late Starwind Realm"
console.log(gen.treasure());        // "Gold Pendant of the Cloud Vault"
console.log(gen.nickname());        // "Drunken Lotus"
console.log(gen.omen().text);       // "A temple bell rings at dusk with no one near the rope."
```

Each call advances a call counter, so the same seed and the same call sequence
always produce identical output. For direct generator use, import the individual
`Generator` values and address sub-rolls with `ctx.child(key)`:

```ts
import { createContext } from "@lexiconlang/core";
import { techniqueName, tribulationOracle } from "@lexiconlang/wuxia";

const ctx = createContext({ seed: "disciple-1" });
techniqueName.generate(ctx.child("technique"));
tribulationOracle.generate(ctx.child("tribulation"));
```

## Public API

- `wuxia.withSeed(seed)` — facade with `person`, `place`, `mountain`, `sect`,
  `technique`, `cultivationRealm`, `treasure`, `nickname`, `secretRealm`,
  `pill`, `tribulation` and `omen`.
- `generators` — the same 12 generators as `Generator` values.
- `pack` — the validated manifest object; the raw JSON is also published at
  `@lexiconlang/wuxia/pack.json`.
- `GlossedName`, `PersonName`, `WuxiaAPI`, `WuxiaEntry` — public types.

## Determinism and sibling ordering

Every sub-roll derives from `ctx.child("<stable-key>")`; adding a new sibling
generator or changing call order does not alter existing sequences. Existing
generator IDs from other packages are untouched.

## Portability

Grammars, tables and culture templates are declarative JSON and can be consumed
by other ports. The TypeScript person/place/mountain composites (which choose a
culture and combine two literal templates) are TS-only composites and are not
yet portable via a generator descriptor. The included tables use weighted/dice
entries and plain text results only.

The manifest has no external pack dependencies and only declares the
`language-v1`, `grammar-v1` and `tables-v1` capabilities it actually uses, so
`loadPack(pack.json)` plus `createWorld().use(...)` works standalone. All
naming data is original pinyin-styled literal text; no real-language base is
required or imported.

## License and provenance

All data is original synthetic fiction released as CC0-1.0. See
[data/PROVENANCE.md](./data/PROVENANCE.md) for the inventory.
