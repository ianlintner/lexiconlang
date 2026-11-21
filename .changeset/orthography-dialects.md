---
"@lexiconlang/language": minor
---

Orthography + sound-change engine (B3): deterministic dialect and language-family derivation over token-retaining lexicons.

- `parseSoundChange` / `parseSoundChangeRule` / `applySoundChanges`: SCA²-style rule DSL (`from > to / before _ after`, `{a,b}` categories, `0` deletion, `#` boundaries) plus a validated JSON form. Rules are ordered, nonrecursive per pass and use no regular expressions.
- Orthography + `createRomanizationProfile`: longest-token-first mappings, diacritics on/off, best-effort ASCII fold via an explicit table, digraph choices and unknown-token policy. Applied after generation, never to translations or SVG.
- `TokenLexicon`, `buildTokenLexicon`, `deriveDialect`, `deriveDialectFromCulture`, `languageFamily`: daughters share parent meanings and rewrite token sequences; cognates are related forms of the same meaning. Stable `ctx.child` keys keep sibling rolls independent.
- Morphology: `plural`, `genitive`, `demonym`, `adjectiveFromPlace`, `inflect` — "Velmar" → "Velmari".
- All new APIs are opt-in; `generateWord`, `generateName`, `buildLexicon` and every existing golden output are byte-identical. No new runtime dependencies; all token data is synthetic and original.
