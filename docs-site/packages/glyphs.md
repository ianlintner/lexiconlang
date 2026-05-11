# @lexiconlang/glyphs

::: tip New in v0.3
:::

Deterministic visual writing systems. Render conlang names as **SVG runes**,
**Unicode ideograms**, or **Canvas drawing instructions** — driven by the same
seeded RNG as the names themselves.

```bash
pnpm add @lexiconlang/glyphs
```

See the [glyph system guide](/guide/glyphs) for concepts and recipes.

## Main API

```ts
function glyphsFor(
  name: TranslatedName,
  system: VisualGlyphSystem,
  ctx: Context,
): GlyphSet;
```

Returns a `GlyphSet` matching the system's mapping strategy:

```ts
interface GlyphSet {
  phonetic?: Glyph[];     // for "phoneme" strategy
  conceptual?: Glyph[];   // for "morpheme" strategy
  holistic?: Glyph;       // for "holistic" strategy
}

interface Glyph {
  id: string;
  meaning?: string;
  svg?: string;                              // for SVG renderer
  unicode?: string;                          // for Unicode renderer
  canvasInstructions?: CanvasInstruction[];  // for Canvas renderer
}
```

## Renderers

Direct access to the three renderers if you want to render without going through
`glyphsFor`:

| Function              | Signature                                                                     |
| --------------------- | ----------------------------------------------------------------------------- |
| `generateShapes`      | `(complexity, ctx): ShapeParams[]` — deterministic procedural shapes          |
| `renderToSVG`         | `(shapes, params?): string` — compact inline SVG                              |
| `renderToCanvas`      | `(shapes, params?): CanvasInstruction[]` — replayable drawing instructions    |
| `renderToUnicode`     | `(meaning, config?): string` — Unicode character lookup with fallback         |
| `executeCanvasInstructions` | `(ctx2d, instructions): void` — replay instructions on a real Canvas    |

## Built-in Unicode registry

`UnicodeRegistry` is a base mapping of common meanings → Unicode characters
(`strong → 💪`, `fire → 🔥`, `stone → 🪨`, …). Cultures can override or extend
it via `unicodeMappings`.

## Determinism

Same seed → byte-identical glyphs across machines, runs, and library versions.
Tested with golden snapshots in the package's test suite.

## Performance

- SVG: ~2–5 ms / glyph
- Unicode: <0.1 ms / glyph
- Canvas: ~1–2 ms / glyph

20-glyph page renders comfortably under the 200 ms target.
