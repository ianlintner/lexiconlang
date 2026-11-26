# @lexiconlang/core

## 0.3.0

### Minor Changes

- 0942d8d: Add opt-in constrained and unique generation combinators: `where` with typed `ConstraintExhaustedError` and stable `attempt:<i>` retry keys, caller-owned `UniquenessSession` with `unique`/`sampleUnique` (no replacement, `item:<i>` contexts), and pure `startsWith`/`wordLength`/`syllableCount` helpers. Existing generator IDs and golden outputs are unchanged.

## 0.2.0

### Minor Changes

- v0.3.0 alpha: complete rename to lexiconlang; CLI binary renamed from `content-gen` to `lexiconlang`; visual glyph systems for culture-specific writing (SVG, Unicode, Canvas renderers; fantasy & sci-fi presets).
