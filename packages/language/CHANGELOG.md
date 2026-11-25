# @lexiconlang/language

## 0.4.0

### Minor Changes

- cac33e3: Add opt-in localized meaning glosses (B4). `generateName` and
  `generateStructuredName` accept a BCP 47 locale (via options or `Context.locale`)
  that localizes the human-readable translation and `parts[].meaning` only — the
  conlang form, meaning selection and RNG scope stay byte-identical to the legacy
  path. Built-in original CC0-1.0 glosses cover the core, fantasy and scifi
  meaning packs in `es`, `de`, `fr`, `pt` and `ja`. New exports: `glossFor`,
  `withGlosses`, `localizePacks`, `withBuiltinGlosses`, `BUILTIN_GLOSS_LOCALES`.
  Meaning packs may declare a `glosses` map per meaning (also supported in the
  pack-v1 JSON schema), with explicit pack glosses taking precedence over built-in
  rows.
- 0942d8d: Add opt-in content blocklist filtering: `generateNameFiltered` and the `blocklist` generator wrapper, ASCII-folded comparison of form and translation with whole-token/substring modes, per-culture/per-pack composition, and a small curated original CC0-1.0 `DEFAULT_BLOCKLIST` with provenance. Legacy `generateName` and existing culture goldens are unchanged.
- ec5b53f: Open culture schema (F1): custom name kinds, extensible word classes, structured names, opt-in gender and a lexicon cache.
  
  - `Culture.templates` is an open record: declare any kind (`ship`, `tavern`, `deity`, `guild`, `epithet`, `title`, ...) and `generateName(culture, kind, ctx)` accepts it. Built-in kinds keep their types; a missing kind still throws.
  - `WordClass` accepts pack-declared classes alongside `noun | adjective | verb | particle`; `Culture.wordClasses` documents them.
  - `Culture.nameStructures` + `generateStructuredName` add opt-in family-first / given-first order, patronymic/matronymic, clan/house, honorific and epithet slots.
  - `Culture.genderTemplates` + `generateName(..., { gender })` add opt-in `masculine | feminine | neutral | any` pools. Omitting `gender` leaves existing output byte-identical.
  - `buildLexicon(culture, ctx, cache?)`, `createLexiconCache`, `freezeCulture`: lexicons are memoized per (culture identity, seed path); `generateName` shares a bounded cache for frozen cultures only.
  - `dwarvish` gains `clan` / `epithet` kinds and a `dwarvish.house-name` structure; `humanoid` gains a `ship` kind and `scifi.humanoid.ship` structure. Existing kinds and goldens are unchanged.
- 51e697f: Orthography + sound-change engine (B3): deterministic dialect and language-family derivation over token-retaining lexicons.
  
  - `parseSoundChange` / `parseSoundChangeRule` / `applySoundChanges`: SCA²-style rule DSL (`from > to / before _ after`, `{a,b}` categories, `0` deletion, `#` boundaries) plus a validated JSON form. Environments support categories and multi-token sequences; `#` may appear in any slot. Rules are ordered, nonrecursive per pass and use no regular expressions. Rules apply once to the whole word: `#` is the word edge (not a syllable edge) and contexts can span syllables even when the culture uses a joiner. Invalid rules (duplicate `_`, multi-token bare `from`, category arity mismatch, empty/mixed environment slots) are rejected with a clear error.
  - Orthography + `createRomanizationProfile`: longest-token-first mappings, diacritics on/off (`diacritics: true` strips them), best-effort ASCII fold via an explicit table, digraph choices and unknown-token policy. Applied after generation, never to translations or SVG.
  - `TokenLexicon`, `buildTokenLexicon`, `deriveDialect`, `deriveDialectFromCulture`, `languageFamily`: daughters share parent meanings and rewrite token sequences; cognates are related forms of the same meaning. Syllable groups, the parent's joiner and its capitalization rule are retained, so a zero-change daughter reproduces its parent exactly. Stable `ctx.child` keys keep sibling rolls independent.
  - Morphology: `plural`, `genitive`, `demonym`, `adjectiveFromPlace`, `inflect` — "Velmar" → "Velmari".
  - All new APIs are opt-in; `generateWord`, `generateName`, `buildLexicon` and every existing golden output are byte-identical. No new runtime dependencies; all token data is synthetic and original.

### Patch Changes

- Updated dependencies [0942d8d]
  - @lexiconlang/core@0.3.0

## 0.3.0

### Minor Changes

- v0.3.0 alpha: complete rename to lexiconlang; CLI binary renamed from `content-gen` to `lexiconlang`; visual glyph systems for culture-specific writing (SVG, Unicode, Canvas renderers; fantasy & sci-fi presets).

### Patch Changes

- Updated dependencies
  - @lexiconlang/core@0.2.0

## 0.2.0

### Minor Changes

- 93c8536: Add visual glyph system: deterministic, seeded writing systems alongside conlang text.

  - New `@lexiconlang/glyphs` package with three renderers: SVG (inline vector), Unicode (character lookup), and Canvas (drawing instructions).
  - `glyphsFor(name, system, ctx)` orchestrates phoneme / morpheme / holistic mapping strategies.
  - `TranslatedName` gains an optional `glyphs?: GlyphSet` field; `Culture` gains an optional `visualGlyphSystems` field. Both are additive — no breaking changes.
  - Fantasy: dwarvish (SVG runes, phonemic) and elvish (Unicode ideograms, morphemic).
  - Sci-fi: humanoid (Canvas geometric, holistic) and insectoid (SVG chitin, phonemic).
  - Same seed → byte-identical glyphs across machines. Performance: ~10–25 ms for a 20-glyph page.
