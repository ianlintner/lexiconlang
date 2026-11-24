# @lexiconlang/fantasy

Fantasy genre pack. Two layers:

1. **Legacy generators** (`fantasy.withSeed(...)`) — unchanged, byte-identical
   output for existing seeds. Golden vectors live in `tests/determinism.test.ts`
   and `tests/sample-output.test.ts`.
2. **Expanded pack (P1)** — opt-in, versioned JSON pack with new generator IDs.

## Expanded pack

```ts
import {
  expandedWithSeed,
  expandedPack,
  expandedGeneratorIds,
  validateFantasyPack,
} from "@lexiconlang/fantasy";

const w = expandedWithSeed("campaign-1");
w.humanV2.northronFullName();  // "Sigrid Ashford"
w.humanV2.southronFullName();  // "Isadora Marisol"
w.tavern.name();               // "The Gilded Anchor"
w.tavern.menu();               // { table, entry, text, children }
w.spell.name();                // "Aldric's Ember"
w.magicItem.full();            // "rare longsword that hums with old light"
w.pantheon.title();            // { text: "the Evergreen" }
w.guild.charter();             // { text: "…" }
w.rumor().text;                // "the miller's daughter is a dragon"
w.shop.service();              // { text: "…" }
```

The pack is authored in `src/fantasy.pack.json` (pack-v1 schema), validated at
import time with `definePack`, and consumed through `createWorld().use(...)`.
It is asset-free and inline-safe; no async loader or file I/O is required.

### Content depth and categorical exemptions

Every open-ended generator reaches **≥60 distinct results in 100 rolls** on a
single seed family; `expanded.test.ts` asserts this per generator. Tables use
`sequence` results that combine each core phrase with an independently rolled
detail phrase, and human name pools are original morpheme combinations. Two
closed vocabularies are intentionally exempt and named in the test:
`spellSchool` (8 schools) and `magicItemRarity` (5 tiers).

### Design rules

- **Determinism**: every new draw is a function of `(seed, key)`. Reusing a
  seed and key reproduces the exact output; changing either changes the draw.
- **No legacy changes**: the old `human -> dwarvish` placeholder remains in the
  legacy path for compatibility. `humanV2` is the corrected, opt-in replacement.
- **Kebab-case IDs**: resource IDs and table entry keys match the pack-v1 regex
  (`[a-z][a-z0-9-]*` segments). Schema field names retain their camelCase.
- **Original content**: all names, tables and grammars are synthetic and
  dedicated CC0-1.0; see the pack's `provenance` field.

## License

MIT
