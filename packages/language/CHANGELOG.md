# @lexiconlang/language

## 0.4.0

### Minor Changes

- ec5b53f: Open culture schema (F1): custom name kinds, extensible word classes, structured names, opt-in gender and a lexicon cache.
  
  - `Culture.templates` is an open record: declare any kind (`ship`, `tavern`, `deity`, `guild`, `epithet`, `title`, ...) and `generateName(culture, kind, ctx)` accepts it. Built-in kinds keep their types; a missing kind still throws.
  - `WordClass` accepts pack-declared classes alongside `noun | adjective | verb | particle`; `Culture.wordClasses` documents them.
  - `Culture.nameStructures` + `generateStructuredName` add opt-in family-first / given-first order, patronymic/matronymic, clan/house, honorific and epithet slots.
  - `Culture.genderTemplates` + `generateName(..., { gender })` add opt-in `masculine | feminine | neutral | any` pools. Omitting `gender` leaves existing output byte-identical.
  - `buildLexicon(culture, ctx, cache?)`, `createLexiconCache`, `freezeCulture`: lexicons are memoized per (culture identity, seed path); `generateName` shares a bounded cache for frozen cultures only.
  - `dwarvish` gains `clan` / `epithet` kinds and a `dwarvish.house-name` structure; `humanoid` gains a `ship` kind and `scifi.humanoid.ship` structure. Existing kinds and goldens are unchanged.

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
