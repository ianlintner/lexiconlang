# Glyph System for Lexicon

**Goal:** Extend Lexicon to generate culture-specific visual writing systems (glyphs) alongside text names. Each glyph is deterministically derived from the seed, rendering as SVG, Unicode, or Canvas.

**Architecture:** Per-culture glyph registries define rendering parameters. On-demand generation with optional lazy rendering. Three rendering formats support both web performance and visual richness.

**Tech Stack:** TypeScript, SVG (inline), Canvas 2D API, existing Lexicon RNG infrastructure.

---

## 1. Core Concepts

### Glyph Systems

A **glyph system** is a culture-level configuration that defines how names are visualized. Each system has:

- **Type** — alphabet (phonetic/morphemic writing) or conceptual (ideographic symbols)
- **Rendering format** — SVG, Unicode, or Canvas
- **Generation strategy** — seed-generated shapes or template-based variants
- **Mapping strategy** — how name parts map to glyphs (phoneme, morpheme, holistic)

### Glyph Registry

A compact JSON registry of glyph parameters:

```ts
{
  id: "dwarvish.runes",
  type: "alphabet",
  renderFormat: "svg",
  mappingStrategy: "phoneme",  // one glyph per phonetic unit
  
  // Seed-generated glyphs use parameters, not templates
  generator?: {
    baseShapes: ["rect", "circle", "line"],
    complexity: "medium",  // affects stroke variations, curves
    symmetry: true,
    palette: ["#8B4513"],  // SVG fill/stroke colors
  },
  
  // Template-based glyphs pick from predefined shapes
  templates?: [
    { id: "t1", baseShape: "rect", variants: 3, modifiers: ["rotate", "scale"] },
    { id: "t2", baseShape: "circle", variants: 2, modifiers: ["stroke"] },
  ],
  
  // Rendering configuration
  renderParams: {
    size: 32,              // px for SVG/Canvas
    strokeWidth: 2,
    canvasSize: 48,
    fallback: "□",         // Unicode fallback for rendering errors
  }
}
```

### Deterministic Generation

All glyph parameters are derived from the seeded RNG via `ctx.child("glyph:N")`. Same seed → identical glyphs across machines and runs.

---

## 2. API Design

### Extended Generator Signature

Name generators accept an optional `withGlyphs` flag:

```ts
const name = fullName.generate(ctx, { withGlyphs: true });

// Result:
{
  form: "Drakaztum",
  translation: "Strong-anvil",
  language: "fantasy.dwarvish",
  glyphs?: {
    phonetic?: Glyph[],      // phoneme-based glyphs
    conceptual?: Glyph[],    // meaning-based glyphs
    holistic?: Glyph,        // single glyph for whole name
  }
}

interface Glyph {
  id: string;                // "g1", "g2", etc.
  meaning?: string;          // semanticmeaning if conceptual
  svg?: string;              // "<svg>...</svg>"
  canvas?: ImageData;        // Canvas-rendered bitmap
  unicode?: string;          // Unicode character(s)
  metadata?: {
    seed: number[];          // RNG state that generated this glyph
    templateId?: string;     // if template-based
  }
}
```

### Backward Compatibility

- `withGlyphs` defaults to `false` — no breaking changes
- Existing code continues to work unchanged
- Glyphs are purely additive

---

## 3. Culture Definition

Cultures specify glyph systems in their configuration:

```ts
const dwarvish: Culture = {
  id: "fantasy.dwarvish",
  phonotacticArchetype: "guttural",
  meaningPacks: [...],
  nameTemplates: [...],
  
  glyphSystems: {
    // Alphabet: seed-generated runes
    phonetic: {
      id: "dwarvish.runes",
      type: "alphabet",
      renderFormat: "svg",
      mappingStrategy: "phoneme",
      generator: {
        baseShapes: ["rect", "line", "angle"],
        complexity: "angular",
        symmetry: false,
        palette: ["#8B4513", "#D2691E"],  // browns and tans
      },
      renderParams: {
        size: 28,
        strokeWidth: 2.5,
      }
    },
    
    // Conceptual: template-based ideograms
    conceptual: {
      id: "dwarvish.ideograms",
      type: "conceptual",
      renderFormat: "unicode",
      mappingStrategy: "morpheme",
      templates: [
        { id: "gem", baseShape: "diamond", variants: 2 },
        { id: "anvil", baseShape: "rect", variants: 3 },
        { id: "mountain", baseShape: "triangle", variants: 2 },
      ],
      renderParams: {
        fallback: "◆",
      }
    }
  }
}
```

---

## 4. Rendering Engines

### SVG Renderer

- **Input:** glyph parameters + RNG state
- **Output:** minimal SVG string (no whitespace, no formatting)
- **Performance:** ~1-2ms per glyph, cached as string
- **Format:** `<svg viewBox="0 0 32 32"><path d="M..."/><circle .../></svg>`
- **Optimization:** Reuse SVG templates with parameter substitution

### Canvas Renderer

- **Input:** glyph parameters + RNG state  
- **Output:** ImageData or data URI
- **Performance:** ~0.5-1.5ms per glyph (2D context rendering)
- **Use case:** When web app needs rendered bitmap or image embedding
- **Caching:** Optional (user controls via CacheStrategy)

### Unicode Renderer

- **Input:** glyph ID or semantic meaning
- **Output:** single Unicode character
- **Performance:** O(1), <0.1ms (lookup)
- **Format:** native Unicode character(s) or sequence
- **Fallback:** user-defined character if lookup fails
- **Use case:** Minimal file size, fast rendering, terminal/text-native

---

## 5. Integration Points

### New Package: `@lexicon/glyphs`

**Exports:**
- `GlyphSystem` interface
- `Glyph` interface
- `GlyphRegistry` (lookup/cache)
- `SVGRenderer`
- `CanvasRenderer`
- `UnicodeRenderer`
- `glyphsFor(name, glyphSystem, ctx)` — standalone function for glyph generation

**Dependencies:**
- `@lexicon/core` (RNG, Context)

### Updates to `@lexicon/fantasy` and `@lexicon/scifi`

- Import `@lexicon/glyphs` as optional devDependency (for types)
- Add `glyphSystems` to culture definitions
- No changes to name generator signatures (glyph generation is opt-in)

### No Breaking Changes

- Existing code works unchanged
- `withGlyphs` flag is optional
- `glyphSystems` in cultures is optional
- Cultures without glyph definitions simply return `undefined` for `glyphs`

---

## 6. Data Flow

```
Context with seed
    ↓
[Generate Name] → TranslatedName
    ↓
withGlyphs: true?
    ├─ No → return name as-is
    └─ Yes → 
        ├─ For each phoneme/morpheme/holistic:
        │   ├─ ctx.child("glyph:N") → new RNG state
        │   ├─ derive glyph parameters from RNG
        │   ├─ select renderer (SVG/Canvas/Unicode)
        │   └─ render → Glyph object
        └─ attach glyphs to name.glyphs → return
```

---

## 7. Performance Targets

**Constraints:**
- Web-only (no server-side rendering required)
- Page of 20 names with glyphs should load/render in <200ms
- No giant PNGs or heavy assets
- Minimal memory footprint

**Implementation:**
- SVG: ~2-5ms per glyph (5 glyphs per name = 10-25ms overhead per name)
- Unicode: <1ms per glyph (negligible overhead)
- Canvas: ~0.5-1.5ms per glyph (similar to SVG)
- Caching: Optional in-memory cache for repeated glyphs
- Lazy rendering: Glyphs only generated when `withGlyphs: true`

**Optimization strategies:**
- Reuse SVG path definitions
- Pre-compile Bezier curves for common shapes
- IndexedDB caching for optional persistence
- Worker threads for batch glyph generation (future enhancement)

---

## 8. Testing & Examples

### Test Cases

1. **Determinism:** Same seed → same glyphs across contexts
2. **Rendering fidelity:** Each format produces expected output
3. **Optional flag:** `withGlyphs: false` produces no glyphs
4. **Missing systems:** Cultures without glyph definitions return `undefined`
5. **Seed isolation:** Glyph RNG doesn't affect name generation
6. **Fallbacks:** Unicode renderer falls back gracefully

### Example Usage

```ts
import { fantasy } from "@lexicon/fantasy";

const game = fantasy.withSeed("campaign-1");

// Without glyphs (fast, existing behavior)
const name1 = game.npc.name.full;
// → { form: "Drakaztum Ironforge", translation: "...", glyphs: undefined }

// With glyphs (adds visual output)
const name2 = game.npc.name.full({ withGlyphs: true });
// → {
//     form: "Drakaztum Ironforge",
//     translation: "...",
//     glyphs: {
//       phonetic: [
//         { id: "g1", svg: "<svg>...</svg>", unicode: "ᚨ" },
//         { id: "g2", svg: "<svg>...</svg>", unicode: "ᚱ" },
//         // ...
//       ],
//       conceptual: [
//         { meaning: "strong", svg: "<svg>...</svg>", unicode: "💪" },
//         { meaning: "anvil", svg: "<svg>...</svg>", unicode: "🔨" },
//       ]
//     }
//   }

// Render to HTML
name2.glyphs?.phonetic?.forEach(glyph => {
  const div = document.createElement("div");
  div.innerHTML = glyph.svg;
  document.body.appendChild(div);
});

// Or use Unicode for text
const text = name2.glyphs?.conceptual?.map(g => g.unicode).join("");
console.log(text); // "💪🔨" (Strong-anvil)
```

---

## 9. Scope & Out of Scope

### In Scope
- Per-culture glyph system definitions
- SVG, Canvas, and Unicode rendering
- Seed-generated and template-based glyphs
- Optional glyph generation via `withGlyphs` flag
- Integration into fantasy and scifi packs
- Deterministic, reproducible glyphs

### Out of Scope
- Glyph editor UI (users define glyphs in code/JSON)
- Server-side rendering (web-only)
- Raster image generation (no PNG/JPG)
- Glyph-to-speech or pronunciation guides
- Historical/real-world writing system emulation
- Dynamic glyph animation

---

## 10. Implementation Plan Structure

The implementation will be staged:

1. **Core infrastructure** — `@lexicon/glyphs` package, interfaces, RNG integration
2. **Rendering engines** — SVG, Canvas, Unicode renderers
3. **Culture integration** — Add glyph systems to 2-3 sample cultures
4. **Testing** — Determinism, fidelity, performance
5. **Documentation & examples** — Usage guide, performance notes

Each stage has clear, testable deliverables.
