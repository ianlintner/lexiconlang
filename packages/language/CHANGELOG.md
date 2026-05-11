# @lexiconlang/language

## 0.2.0

### Minor Changes

- 93c8536: Add visual glyph system: deterministic, seeded writing systems alongside conlang text.

  - New `@lexiconlang/glyphs` package with three renderers: SVG (inline vector), Unicode (character lookup), and Canvas (drawing instructions).
  - `glyphsFor(name, system, ctx)` orchestrates phoneme / morpheme / holistic mapping strategies.
  - `TranslatedName` gains an optional `glyphs?: GlyphSet` field; `Culture` gains an optional `visualGlyphSystems` field. Both are additive — no breaking changes.
  - Fantasy: dwarvish (SVG runes, phonemic) and elvish (Unicode ideograms, morphemic).
  - Sci-fi: humanoid (Canvas geometric, holistic) and insectoid (SVG chitin, phonemic).
  - Same seed → byte-identical glyphs across machines. Performance: ~10–25 ms for a 20-glyph page.
