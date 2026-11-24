# Provenance — `@lexiconlang/cyberpunk`

All data in `cyberpunk.pack.json` (name pools, translations, grammars, tables,
cultures) is **original work authored for LexiconLang** and dedicated to the
public domain under **CC0-1.0**. The TypeScript facade and package are MIT.

- No third-party corpora, word lists, name lists or setting text were copied.
- No real living people, trademarks or setting-specific IP: names such as
  corporations, gangs, districts, products and AI names are invented
  combinations of common words and syllables. "Runner" handles are generic aliases.
- Person-name translations are invented, informal glosses for flavor; they are
  not etymological claims.
- Pack provenance entry: `original-lexiconlang` (CC0-1.0), file `cyberpunk.pack.json`.

## Portability limits

The pack uses only F2 portable engines (`name-v1`-style structured names,
`grammar-v1`, `table-v1`). The TS `withSeed` facade is a convenience wrapper:
it splits table text on ` | ` into fields (cyberware, street drug). Other hosts
get the same text via `world.generate(id, key)`.
