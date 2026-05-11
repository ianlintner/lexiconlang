# @lexiconlang/glyphs

## 0.3.0

### Minor Changes

- v0.3.0 alpha: complete rename to lexiconlang; CLI binary renamed from `content-gen` to `lexiconlang`; visual glyph systems for culture-specific writing (SVG, Unicode, Canvas renderers; fantasy & sci-fi presets).

### Patch Changes

- Updated dependencies
  - @lexiconlang/core@0.2.0
  - @lexiconlang/language@0.3.0

## 0.2.0

### Minor Changes

- 93c8536: Add visual glyph system: deterministic, seeded writing systems alongside conlang text.

  - New `@lexiconlang/glyphs` package with three renderers: SVG (inline vector), Unicode (character lookup), and Canvas (drawing instructions).
  - `glyphsFor(name, system, ctx)` orchestrates phoneme / morpheme / holistic mapping strategies.
  - `TranslatedName` gains an optional `glyphs?: GlyphSet` field; `Culture` gains an optional `visualGlyphSystems` field. Both are additive — no breaking changes.
  - Fantasy: dwarvish (SVG runes, phonemic) and elvish (Unicode ideograms, morphemic).
  - Sci-fi: humanoid (Canvas geometric, holistic) and insectoid (SVG chitin, phonemic).
  - Same seed → byte-identical glyphs across machines. Performance: ~10–25 ms for a 20-glyph page.

### Patch Changes

- Updated dependencies [93c8536]
  - @lexiconlang/language@0.2.0
