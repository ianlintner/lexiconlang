---
"@lexiconlang/language": minor
---

Orthography + sound-change engine (B3): deterministic dialect and language-family derivation over token-retaining lexicons.

- `parseSoundChange` / `parseSoundChangeRule` / `applySoundChanges`: SCA²-style rule DSL (`from > to / before _ after`, `{a,b}` categories, `0` deletion, `#` boundaries) plus a validated JSON form. Environments support categories and multi-token sequences; `#` may appear in any slot. Rules are ordered, nonrecursive per pass and use no regular expressions. Rules apply once to the whole word: `#` is the word edge (not a syllable edge) and contexts can span syllables even when the culture uses a joiner. Invalid rules (duplicate `_`, multi-token bare `from`, category arity mismatch, empty/mixed environment slots) are rejected with a clear error.
- Orthography + `createRomanizationProfile`: longest-token-first mappings, diacritics on/off (`diacritics: true` strips them), best-effort ASCII fold via an explicit table, digraph choices and unknown-token policy. Applied after generation, never to translations or SVG.
- `TokenLexicon`, `buildTokenLexicon`, `deriveDialect`, `deriveDialectFromCulture`, `languageFamily`: daughters share parent meanings and rewrite token sequences; cognates are related forms of the same meaning. Syllable groups, the parent's joiner and its capitalization rule are retained, so a zero-change daughter reproduces its parent exactly. Stable `ctx.child` keys keep sibling rolls independent.
- Morphology: `plural`, `genitive`, `demonym`, `adjectiveFromPlace`, `inflect` — "Velmar" → "Velmari".
- All new APIs are opt-in; `generateWord`, `generateName`, `buildLexicon` and every existing golden output are byte-identical. No new runtime dependencies; all token data is synthetic and original.
