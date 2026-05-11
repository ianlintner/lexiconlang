# Glyph System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `@lexiconlang/glyphs` package that generates culture-specific visual writing systems (SVG, Unicode, Canvas) deterministically from the same seeded RNG that drives name generation.

**Architecture:** A standalone `glyphsFor(name, culture, ctx)` function enriches a `TranslatedName` with visual glyphs. Each culture optionally defines `visualGlyphSystems` (distinct from the existing phonotactic `GlyphSystem`). Glyph shapes are derived from the seeded RNG, making them reproducible. No breaking changes to existing APIs.

**Tech Stack:** TypeScript ESM, `@lexiconlang/core` (RNG, Context), inline SVG strings, Canvas 2D instruction objects (web-only), Unicode character lookup.

---

## File Map

**New files:**
- `packages/glyphs/package.json`
- `packages/glyphs/tsconfig.json`
- `packages/glyphs/src/types.ts` — all interfaces: `VisualGlyphSystem`, `Glyph`, `GlyphSet`, `ShapeParams`, `CanvasInstruction`
- `packages/glyphs/src/shape-generator.ts` — derives `ShapeParams[]` from RNG
- `packages/glyphs/src/svg-renderer.ts` — `ShapeParams[] → SVG string`
- `packages/glyphs/src/unicode-renderer.ts` — meaning ID → Unicode char
- `packages/glyphs/src/canvas-renderer.ts` — `ShapeParams[] → CanvasInstruction[]`
- `packages/glyphs/src/glyphs-for.ts` — `glyphsFor()` main function
- `packages/glyphs/src/index.ts` — public exports
- `packages/glyphs/src/glyphs.test.ts` — full test suite

**Modified files:**
- `packages/language/src/types.ts` — add optional `glyphs?: GlyphSet` to `TranslatedName`; add optional `visualGlyphSystems?: Record<string, VisualGlyphSystem>` to `Culture`
- `packages/fantasy/src/language/cultures.ts` — add `visualGlyphSystems` to `dwarvish` (SVG) and `elvish` (Unicode)
- `packages/scifi/src/language/cultures.ts` — add `visualGlyphSystems` to `humanoid` (Canvas) and `insectoid` (SVG)
- `tsconfig.json` (root) — add `@lexiconlang/glyphs` reference
- `packages/language/package.json` — add `@lexiconlang/glyphs` as optional peer (for types only, no circular dep)

---

## Task 1: Package Scaffold

**Files:**
- Create: `packages/glyphs/package.json`
- Create: `packages/glyphs/tsconfig.json`
- Create: `packages/glyphs/src/index.ts` (empty placeholder)

- [ ] **Step 1: Create `packages/glyphs/package.json`**

```json
{
  "name": "@lexiconlang/glyphs",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@lexiconlang/core": "workspace:*",
    "@lexiconlang/language": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.3",
    "vitest": "^2.1.9"
  }
}
```

- [ ] **Step 2: Create `packages/glyphs/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../core" },
    { "path": "../language" }
  ],
  "include": ["src"],
  "exclude": ["**/*.test.ts"]
}
```

- [ ] **Step 3: Create placeholder `packages/glyphs/src/index.ts`**

```ts
export {};
```

- [ ] **Step 4: Add `@lexiconlang/glyphs` to root `tsconfig.json` references**

In `tsconfig.json`, the `references` array becomes:
```json
{
  "extends": "./tsconfig.base.json",
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/grammar" },
    { "path": "./packages/markov" },
    { "path": "./packages/language" },
    { "path": "./packages/glyphs" },
    { "path": "./packages/fantasy" },
    { "path": "./packages/scifi" },
    { "path": "./packages/modern" },
    { "path": "./packages/cli" }
  ]
}
```

Note: `@lexiconlang/language` was missing — add it too.

- [ ] **Step 5: Run `pnpm install` to link the new package**

```bash
pnpm install
```

Expected: Resolves workspace dependencies, no errors.

- [ ] **Step 6: Verify the package compiles**

```bash
cd packages/glyphs && pnpm build
```

Expected: `dist/index.js` and `dist/index.d.ts` created.

- [ ] **Step 7: Commit**

```bash
git add packages/glyphs/ tsconfig.json
git commit -m "feat: scaffold @lexiconlang/glyphs package"
```

---

## Task 2: Core Types

**Files:**
- Create: `packages/glyphs/src/types.ts`
- Modify: `packages/language/src/types.ts`

- [ ] **Step 1: Write the failing test for types**

Create `packages/glyphs/src/glyphs.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { VisualGlyphSystem, Glyph, GlyphSet, ShapeParams, CanvasInstruction } from "./types.js";

describe("Types", () => {
  it("VisualGlyphSystem compiles with svg renderFormat", () => {
    const sys: VisualGlyphSystem = {
      id: "test.svg",
      type: "alphabet",
      renderFormat: "svg",
      mappingStrategy: "morpheme",
      generator: {
        baseShapes: ["rect", "line"],
        complexity: "simple",
        symmetry: false,
        palette: ["#000000"],
      },
      renderParams: { size: 32, strokeWidth: 2, fallback: "□" },
    };
    expect(sys.id).toBe("test.svg");
  });

  it("VisualGlyphSystem compiles with unicode renderFormat", () => {
    const sys: VisualGlyphSystem = {
      id: "test.unicode",
      type: "conceptual",
      renderFormat: "unicode",
      mappingStrategy: "morpheme",
      unicodeMappings: { strong: "ᚠ", mountain: "ᚢ" },
      renderParams: { fallback: "□" },
    };
    expect(sys.renderFormat).toBe("unicode");
  });

  it("GlyphSet can hold phonetic and conceptual glyphs", () => {
    const set: GlyphSet = {
      phonetic: [{ id: "g1", svg: "<svg/>" }],
      conceptual: [{ id: "g2", meaning: "strong", unicode: "ᚠ" }],
    };
    expect(set.phonetic?.length).toBe(1);
    expect(set.conceptual?.[0]?.meaning).toBe("strong");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/glyphs && npx vitest run src/glyphs.test.ts
```

Expected: FAIL — "Cannot find module './types.js'"

- [ ] **Step 3: Create `packages/glyphs/src/types.ts`**

```ts
export type BaseShape = "rect" | "circle" | "line" | "arc" | "polygon";
export type RenderFormat = "svg" | "unicode" | "canvas";
export type MappingStrategy = "phoneme" | "morpheme" | "holistic";
export type GlyphType = "alphabet" | "conceptual";
export type Complexity = "simple" | "medium" | "complex";

export interface ShapeParams {
  type: BaseShape;
  x: number;   // 0–1 normalized within the glyph viewport
  y: number;
  x2?: number; // second point for lines
  y2?: number;
  r?: number;  // radius for circles/arcs
  w?: number;  // width for rects
  h?: number;  // height for rects
  sides?: number;      // number of sides for polygons
  startAngle?: number; // radians, for arcs
  endAngle?: number;
  rotation?: number;   // overall rotation in radians
}

export interface CanvasInstruction {
  type: "moveTo" | "lineTo" | "arc" | "rect" | "stroke" | "fill" | "beginPath" | "closePath";
  params: number[];
}

export interface GlyphGeneratorConfig {
  baseShapes: BaseShape[];
  complexity: Complexity;
  symmetry: boolean;
  palette?: string[];
}

export interface GlyphTemplateConfig {
  id: string;
  baseShape: BaseShape;
  variants: number;
  modifiers: Array<"rotate" | "scale" | "stroke">;
}

export interface GlyphRenderParams {
  size?: number;        // viewport px (default 32)
  strokeWidth?: number; // default 2
  fallback?: string;    // Unicode fallback character (default "□")
}

export interface VisualGlyphSystem {
  id: string;
  type: GlyphType;
  renderFormat: RenderFormat;
  mappingStrategy: MappingStrategy;
  generator?: GlyphGeneratorConfig;
  templates?: GlyphTemplateConfig[];
  unicodeMappings?: Record<string, string>;
  renderParams?: GlyphRenderParams;
}

export interface Glyph {
  id: string;
  meaning?: string;
  svg?: string;
  canvasInstructions?: CanvasInstruction[];
  unicode?: string;
}

export interface GlyphSet {
  phonetic?: Glyph[];
  conceptual?: Glyph[];
  holistic?: Glyph;
}
```

- [ ] **Step 4: Add `GlyphSet` and `VisualGlyphSystem` as optional fields in `packages/language/src/types.ts`**

At the top of the file, add the import:
```ts
import type { GlyphSet, VisualGlyphSystem } from "@lexiconlang/glyphs";
```

In `TranslatedName`, add:
```ts
export interface TranslatedName {
  form: string;
  translation: string;
  language: string;
  parts?: readonly { form: string; meaning: string }[];
  glyphs?: GlyphSet;  // populated only when glyphsFor() is called
  toString(): string;
}
```

In `Culture`, add:
```ts
export interface Culture {
  id: string;
  glyphs: GlyphSystem;
  meaningPacks: readonly MeaningPack[];
  templates: NameTemplates;
  capitalize?: "first" | "all" | "none";
  visualGlyphSystems?: Record<string, VisualGlyphSystem>;  // optional visual writing system
}
```

**Important:** This creates a circular dependency (`@lexiconlang/language` → `@lexiconlang/glyphs` → `@lexiconlang/language`). To avoid it, define `GlyphSet` and `VisualGlyphSystem` directly in `packages/language/src/types.ts` instead of importing from `@lexiconlang/glyphs`. The glyphs package will import these types from `@lexiconlang/language`.

So in `packages/language/src/types.ts`, add these type definitions directly (no import needed):

```ts
export type RenderFormat = "svg" | "unicode" | "canvas";
export type MappingStrategy = "phoneme" | "morpheme" | "holistic";

export interface Glyph {
  id: string;
  meaning?: string;
  svg?: string;
  canvasInstructions?: Array<{ type: string; params: number[] }>;
  unicode?: string;
}

export interface GlyphSet {
  phonetic?: Glyph[];
  conceptual?: Glyph[];
  holistic?: Glyph;
}

export interface VisualGlyphSystem {
  id: string;
  type: "alphabet" | "conceptual";
  renderFormat: RenderFormat;
  mappingStrategy: MappingStrategy;
  generator?: {
    baseShapes: Array<"rect" | "circle" | "line" | "arc" | "polygon">;
    complexity: "simple" | "medium" | "complex";
    symmetry: boolean;
    palette?: string[];
  };
  templates?: Array<{
    id: string;
    baseShape: "rect" | "circle" | "line";
    variants: number;
    modifiers: Array<"rotate" | "scale" | "stroke">;
  }>;
  unicodeMappings?: Record<string, string>;
  renderParams?: {
    size?: number;
    strokeWidth?: number;
    fallback?: string;
  };
}
```

Then update `TranslatedName` and `Culture` as shown above but without the import.

In `packages/glyphs/src/types.ts`, import from `@lexiconlang/language` instead:
```ts
export type { Glyph, GlyphSet, VisualGlyphSystem, RenderFormat, MappingStrategy } from "@lexiconlang/language";

// Glyphs-package-specific types (not needed upstream):
export type BaseShape = "rect" | "circle" | "line" | "arc" | "polygon";
export type Complexity = "simple" | "medium" | "complex";

export interface ShapeParams {
  type: BaseShape;
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  r?: number;
  w?: number;
  h?: number;
  sides?: number;
  startAngle?: number;
  endAngle?: number;
  rotation?: number;
}

export interface CanvasInstruction {
  type: "moveTo" | "lineTo" | "arc" | "rect" | "stroke" | "fill" | "beginPath" | "closePath";
  params: number[];
}
```

- [ ] **Step 5: Export new types from `packages/language/src/index.ts`**

In `packages/language/src/index.ts`, add to the existing export line:
```ts
export type {
  GlyphSystem, Constraint, Meaning, WordClass, MeaningPack, Lexicon,
  Culture, NameTemplates, NameTemplate, TemplatePart, TranslatedName,
  Glyph, GlyphSet, VisualGlyphSystem, RenderFormat, MappingStrategy,
} from "./types.js";
```

- [ ] **Step 6: Run the type test**

```bash
cd packages/glyphs && npx vitest run src/glyphs.test.ts
```

Expected: PASS — all 3 type tests pass.

- [ ] **Step 7: Verify @lexiconlang/language still builds**

```bash
cd packages/language && pnpm build
```

Expected: No errors, `dist/` updated.

- [ ] **Step 8: Commit**

```bash
git add packages/glyphs/src/types.ts packages/glyphs/src/glyphs.test.ts packages/language/src/types.ts packages/language/src/index.ts
git commit -m "feat: add Glyph/GlyphSet/VisualGlyphSystem types to @lexiconlang/language and @lexiconlang/glyphs"
```

---

## Task 3: Shape Generator

**Files:**
- Create: `packages/glyphs/src/shape-generator.ts`

The shape generator derives deterministic `ShapeParams[]` from the RNG. Each call to `generateShapes(config, ctx)` produces the same shapes for the same seed.

- [ ] **Step 1: Add shape-generator tests to `packages/glyphs/src/glyphs.test.ts`**

```ts
import { createContext } from "@lexiconlang/core";
import { generateShapes } from "./shape-generator.js";

describe("generateShapes", () => {
  it("produces same shapes for same seed", () => {
    const ctx1 = createContext({ seed: "test-seed" });
    const ctx2 = createContext({ seed: "test-seed" });
    const config = {
      baseShapes: ["rect", "line"] as const,
      complexity: "simple" as const,
      symmetry: false,
      palette: ["#000000"],
    };
    const shapes1 = generateShapes(config, ctx1);
    const shapes2 = generateShapes(config, ctx2);
    expect(shapes1).toEqual(shapes2);
  });

  it("produces different shapes for different seeds", () => {
    const ctx1 = createContext({ seed: "seed-a" });
    const ctx2 = createContext({ seed: "seed-b" });
    const config = {
      baseShapes: ["rect", "line"] as const,
      complexity: "medium" as const,
      symmetry: false,
      palette: [],
    };
    const shapes1 = generateShapes(config, ctx1);
    const shapes2 = generateShapes(config, ctx2);
    expect(shapes1).not.toEqual(shapes2);
  });

  it("simple complexity produces 1-2 shapes", () => {
    const ctx = createContext({ seed: "simple" });
    const shapes = generateShapes({
      baseShapes: ["line"],
      complexity: "simple",
      symmetry: false,
    }, ctx);
    expect(shapes.length).toBeGreaterThanOrEqual(1);
    expect(shapes.length).toBeLessThanOrEqual(2);
  });

  it("complex complexity produces 3-5 shapes", () => {
    const ctx = createContext({ seed: "complex" });
    const shapes = generateShapes({
      baseShapes: ["rect", "circle", "line"],
      complexity: "complex",
      symmetry: false,
    }, ctx);
    expect(shapes.length).toBeGreaterThanOrEqual(3);
    expect(shapes.length).toBeLessThanOrEqual(5);
  });

  it("all shape coordinates are in [0,1] range", () => {
    const ctx = createContext({ seed: "bounds" });
    const shapes = generateShapes({
      baseShapes: ["rect", "circle", "line", "arc", "polygon"],
      complexity: "complex",
      symmetry: false,
    }, ctx);
    for (const s of shapes) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(1);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThanOrEqual(1);
    }
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd packages/glyphs && npx vitest run src/glyphs.test.ts --reporter=verbose 2>&1 | head -40
```

Expected: FAIL — "Cannot find module './shape-generator.js'"

- [ ] **Step 3: Create `packages/glyphs/src/shape-generator.ts`**

```ts
import type { Context } from "@lexiconlang/core";
import type { ShapeParams, BaseShape } from "./types.js";

interface GeneratorConfig {
  baseShapes: readonly BaseShape[];
  complexity: "simple" | "medium" | "complex";
  symmetry: boolean;
  palette?: string[];
}

const COMPLEXITY_SHAPE_COUNT: Record<string, [number, number]> = {
  simple: [1, 2],
  medium: [2, 3],
  complex: [3, 5],
};

export function generateShapes(config: GeneratorConfig, ctx: Context): ShapeParams[] {
  const [minShapes, maxShapes] = COMPLEXITY_SHAPE_COUNT[config.complexity]!;
  const count = ctx.child("count").rng.nextInt(minShapes, maxShapes + 1);
  const shapes: ShapeParams[] = [];

  for (let i = 0; i < count; i++) {
    const shapeCtx = ctx.child(`shape:${i}`);
    const shapeType = config.baseShapes[
      shapeCtx.rng.nextInt(0, config.baseShapes.length)
    ]!;
    shapes.push(generateShape(shapeType, shapeCtx));
  }

  return shapes;
}

function generateShape(type: BaseShape, ctx: Context): ShapeParams {
  const x = ctx.child("x").rng.nextRange(0.1, 0.9);
  const y = ctx.child("y").rng.nextRange(0.1, 0.9);

  switch (type) {
    case "line": {
      const x2 = ctx.child("x2").rng.nextRange(0.1, 0.9);
      const y2 = ctx.child("y2").rng.nextRange(0.1, 0.9);
      return { type, x, y, x2, y2 };
    }
    case "circle": {
      const r = ctx.child("r").rng.nextRange(0.05, 0.3);
      return { type, x, y, r };
    }
    case "rect": {
      const w = ctx.child("w").rng.nextRange(0.1, 0.5);
      const h = ctx.child("h").rng.nextRange(0.1, 0.5);
      const rotation = ctx.child("rot").rng.nextRange(0, Math.PI * 2);
      return { type, x, y, w, h, rotation };
    }
    case "arc": {
      const r = ctx.child("r").rng.nextRange(0.1, 0.4);
      const startAngle = ctx.child("sa").rng.nextRange(0, Math.PI * 2);
      const endAngle = ctx.child("ea").rng.nextRange(0, Math.PI * 2);
      return { type, x, y, r, startAngle, endAngle };
    }
    case "polygon": {
      const r = ctx.child("r").rng.nextRange(0.1, 0.35);
      const sides = ctx.child("sides").rng.nextInt(3, 8);
      const rotation = ctx.child("rot").rng.nextRange(0, Math.PI * 2);
      return { type, x, y, r, sides, rotation };
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd packages/glyphs && npx vitest run src/glyphs.test.ts --reporter=verbose 2>&1 | head -40
```

Expected: PASS — all shape-generator tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/glyphs/src/shape-generator.ts packages/glyphs/src/glyphs.test.ts
git commit -m "feat: add deterministic shape generator for glyph rendering"
```

---

## Task 4: SVG Renderer

**Files:**
- Create: `packages/glyphs/src/svg-renderer.ts`

Converts `ShapeParams[]` to a compact inline SVG string. The SVG uses a normalized 32×32 (or configurable) viewport.

- [ ] **Step 1: Add SVG renderer tests to `packages/glyphs/src/glyphs.test.ts`**

```ts
import { renderSvg } from "./svg-renderer.js";

describe("renderSvg", () => {
  it("returns a valid SVG string", () => {
    const shapes: ShapeParams[] = [{ type: "line", x: 0.1, y: 0.1, x2: 0.9, y2: 0.9 }];
    const svg = renderSvg(shapes, { size: 32, strokeWidth: 2, fallback: "□" });
    expect(svg).toMatch(/^<svg /);
    expect(svg).toMatch(/<\/svg>$/);
    expect(svg).toContain("viewBox");
    expect(svg).toContain("<line");
  });

  it("renders circle shapes", () => {
    const shapes: ShapeParams[] = [{ type: "circle", x: 0.5, y: 0.5, r: 0.3 }];
    const svg = renderSvg(shapes, { size: 32, strokeWidth: 2, fallback: "□" });
    expect(svg).toContain("<circle");
  });

  it("renders rect shapes", () => {
    const shapes: ShapeParams[] = [{ type: "rect", x: 0.2, y: 0.2, w: 0.5, h: 0.4, rotation: 0 }];
    const svg = renderSvg(shapes, { size: 32, strokeWidth: 2, fallback: "□" });
    expect(svg).toContain("<rect");
  });

  it("renders polygon shapes", () => {
    const shapes: ShapeParams[] = [{ type: "polygon", x: 0.5, y: 0.5, r: 0.3, sides: 6, rotation: 0 }];
    const svg = renderSvg(shapes, { size: 32, strokeWidth: 2, fallback: "□" });
    expect(svg).toContain("<polygon");
  });

  it("produces same SVG for same shapes", () => {
    const shapes: ShapeParams[] = [
      { type: "line", x: 0.1, y: 0.2, x2: 0.8, y2: 0.9 },
      { type: "circle", x: 0.5, y: 0.5, r: 0.2 },
    ];
    const params = { size: 32, strokeWidth: 2, fallback: "□" };
    expect(renderSvg(shapes, params)).toBe(renderSvg(shapes, params));
  });

  it("is compact — no newlines or extra whitespace", () => {
    const shapes: ShapeParams[] = [{ type: "line", x: 0.1, y: 0.1, x2: 0.9, y2: 0.9 }];
    const svg = renderSvg(shapes, { size: 32, strokeWidth: 2, fallback: "□" });
    expect(svg).not.toContain("\n");
    expect(svg).not.toContain("  ");
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd packages/glyphs && npx vitest run src/glyphs.test.ts --reporter=verbose 2>&1 | grep -E "FAIL|Cannot find"
```

Expected: FAIL — "Cannot find module './svg-renderer.js'"

- [ ] **Step 3: Create `packages/glyphs/src/svg-renderer.ts`**

```ts
import type { ShapeParams } from "./types.js";

interface RenderParams {
  size: number;
  strokeWidth: number;
  fallback: string;
  color?: string;
}

export function renderSvg(shapes: ShapeParams[], params: RenderParams): string {
  const { size, strokeWidth, color = "#000000" } = params;
  const inner = shapes.map(s => shapeToSvgElement(s, size, strokeWidth, color)).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${inner}</svg>`;
}

function n(val: number): string {
  return Number(val.toFixed(2)).toString();
}

function shapeToSvgElement(shape: ShapeParams, size: number, sw: number, color: string): string {
  const attr = `fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"`;

  switch (shape.type) {
    case "line": {
      const x1 = n(shape.x * size);
      const y1 = n(shape.y * size);
      const x2 = n((shape.x2 ?? 1 - shape.x) * size);
      const y2 = n((shape.y2 ?? 1 - shape.y) * size);
      return `<line ${attr} x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    }
    case "circle": {
      const cx = n(shape.x * size);
      const cy = n(shape.y * size);
      const r = n((shape.r ?? 0.2) * size);
      return `<circle ${attr} cx="${cx}" cy="${cy}" r="${r}"/>`;
    }
    case "rect": {
      const x = n(shape.x * size);
      const y = n(shape.y * size);
      const w = n((shape.w ?? 0.3) * size);
      const h = n((shape.h ?? 0.3) * size);
      const rot = shape.rotation ? n((shape.rotation * 180) / Math.PI) : "0";
      const cx = n(shape.x * size + (shape.w ?? 0.3) * size * 0.5);
      const cy = n(shape.y * size + (shape.h ?? 0.3) * size * 0.5);
      return `<rect ${attr} x="${x}" y="${y}" width="${w}" height="${h}" transform="rotate(${rot},${cx},${cy})"/>`;
    }
    case "arc": {
      const cx = shape.x * size;
      const cy = shape.y * size;
      const r = (shape.r ?? 0.25) * size;
      const sa = shape.startAngle ?? 0;
      const ea = shape.endAngle ?? Math.PI;
      const x1 = n(cx + r * Math.cos(sa));
      const y1 = n(cy + r * Math.sin(sa));
      const x2 = n(cx + r * Math.cos(ea));
      const y2 = n(cy + r * Math.sin(ea));
      const large = Math.abs(ea - sa) > Math.PI ? 1 : 0;
      return `<path ${attr} d="M${x1},${y1} A${n(r)},${n(r)} 0 ${large},1 ${x2},${y2}"/>`;
    }
    case "polygon": {
      const cx = shape.x * size;
      const cy = shape.y * size;
      const r = (shape.r ?? 0.25) * size;
      const sides = shape.sides ?? 6;
      const rot = shape.rotation ?? 0;
      const points = Array.from({ length: sides }, (_, i) => {
        const angle = rot + (i * 2 * Math.PI) / sides;
        return `${n(cx + r * Math.cos(angle))},${n(cy + r * Math.sin(angle))}`;
      }).join(" ");
      return `<polygon ${attr} points="${points}"/>`;
    }
  }
}
```

- [ ] **Step 4: Run SVG tests**

```bash
cd packages/glyphs && npx vitest run src/glyphs.test.ts --reporter=verbose 2>&1 | head -50
```

Expected: All SVG renderer tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/glyphs/src/svg-renderer.ts packages/glyphs/src/glyphs.test.ts
git commit -m "feat: add SVG renderer for glyph shapes"
```

---

## Task 5: Unicode Renderer

**Files:**
- Create: `packages/glyphs/src/unicode-renderer.ts`

Maps meaning IDs to Unicode characters. Uses built-in rune-like character ranges from the Unicode standard and falls back to a configurable character.

- [ ] **Step 1: Add Unicode renderer tests to `packages/glyphs/src/glyphs.test.ts`**

```ts
import { renderUnicode } from "./unicode-renderer.js";

describe("renderUnicode", () => {
  it("returns unicode for a known meaning mapping", () => {
    const mappings = { strong: "ᚠ", mountain: "ᚢ" };
    expect(renderUnicode("strong", mappings, "□")).toBe("ᚠ");
    expect(renderUnicode("mountain", mappings, "□")).toBe("ᚢ");
  });

  it("returns fallback for unknown meaning", () => {
    const mappings = { strong: "ᚠ" };
    expect(renderUnicode("unknown", mappings, "□")).toBe("□");
  });

  it("returns fallback when mappings is empty", () => {
    expect(renderUnicode("strong", {}, "?")).toBe("?");
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd packages/glyphs && npx vitest run src/glyphs.test.ts --reporter=verbose 2>&1 | grep -E "FAIL|Cannot"
```

Expected: FAIL — "Cannot find module './unicode-renderer.js'"

- [ ] **Step 3: Create `packages/glyphs/src/unicode-renderer.ts`**

```ts
export function renderUnicode(
  meaningId: string,
  mappings: Record<string, string>,
  fallback: string,
): string {
  return mappings[meaningId] ?? fallback;
}

/** Elder Futhark runes — useful for fantasy cultures. */
export const elderFuthark: Record<string, string> = {
  cattle: "ᚠ",
  aurochs: "ᚢ",
  thorn: "ᚦ",
  god: "ᚨ",
  ride: "ᚱ",
  torch: "ᚲ",
  gift: "ᚷ",
  joy: "ᚹ",
  hail: "ᚺ",
  need: "ᚾ",
  ice: "ᛁ",
  harvest: "ᛃ",
  yew: "ᛇ",
  lot: "ᛈ",
  elk: "ᛉ",
  sun: "ᛊ",
  tyr: "ᛏ",
  birch: "ᛒ",
  horse: "ᛖ",
  man: "ᛗ",
  water: "ᛚ",
  ing: "ᛜ",
  homeland: "ᛞ",
  day: "ᛟ",
};

/** Linear-B syllabary — useful for aquatic/ancient cultures. */
export const linearB: Record<string, string> = {
  a: "𐀀", e: "𐀁", i: "𐀂", o: "𐀃", u: "𐀄",
  da: "𐀅", de: "𐀆", di: "𐀇", do: "𐀈", du: "𐀉",
  ja: "𐀊", je: "𐀋", jo: "𐀍", ju: "𐀎",
  ka: "𐀏", ke: "𐀐", ki: "𐀑", ko: "𐀒", ku: "𐀓",
};

/** Arrows and geometric — useful for sci-fi/synth cultures. */
export const geometricSymbols: Record<string, string> = {
  signal: "◈", data: "◉", node: "◎", core: "●",
  link: "◇", matrix: "◆", unit: "■", sector: "□",
  vector: "▲", cycle: "△", branch: "▶", merge: "◀",
  stream: "≋", pulse: "≈", sync: "⊕", void: "⊗",
};
```

- [ ] **Step 4: Run Unicode tests**

```bash
cd packages/glyphs && npx vitest run src/glyphs.test.ts --reporter=verbose 2>&1 | head -50
```

Expected: All Unicode renderer tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/glyphs/src/unicode-renderer.ts packages/glyphs/src/glyphs.test.ts
git commit -m "feat: add Unicode renderer with Elder Futhark, Linear-B, and geometric symbol presets"
```

---

## Task 6: Canvas Renderer

**Files:**
- Create: `packages/glyphs/src/canvas-renderer.ts`

Converts `ShapeParams[]` to a list of `CanvasInstruction` objects. The consumer executes these instructions against a Canvas 2D context. No Canvas API is called here — this file is pure data transformation, so it works in Node.js and the browser.

- [ ] **Step 1: Add Canvas renderer tests to `packages/glyphs/src/glyphs.test.ts`**

```ts
import { renderCanvas } from "./canvas-renderer.js";
import type { CanvasInstruction } from "./types.js";

describe("renderCanvas", () => {
  it("returns an array of canvas instructions", () => {
    const shapes: ShapeParams[] = [{ type: "line", x: 0.1, y: 0.1, x2: 0.9, y2: 0.9 }];
    const instructions = renderCanvas(shapes, { size: 32, strokeWidth: 2, fallback: "□" });
    expect(Array.isArray(instructions)).toBe(true);
    expect(instructions.length).toBeGreaterThan(0);
  });

  it("starts with beginPath", () => {
    const shapes: ShapeParams[] = [{ type: "circle", x: 0.5, y: 0.5, r: 0.3 }];
    const instructions = renderCanvas(shapes, { size: 32, strokeWidth: 2, fallback: "□" });
    expect(instructions[0]?.type).toBe("beginPath");
  });

  it("ends with stroke", () => {
    const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.1, w: 0.5, h: 0.4, rotation: 0 }];
    const instructions = renderCanvas(shapes, { size: 32, strokeWidth: 2, fallback: "□" });
    expect(instructions[instructions.length - 1]?.type).toBe("stroke");
  });

  it("instructions have numeric params arrays", () => {
    const shapes: ShapeParams[] = [{ type: "line", x: 0.2, y: 0.3, x2: 0.7, y2: 0.8 }];
    const instructions = renderCanvas(shapes, { size: 32, strokeWidth: 2, fallback: "□" });
    for (const inst of instructions) {
      expect(Array.isArray(inst.params)).toBe(true);
      for (const p of inst.params) {
        expect(typeof p).toBe("number");
      }
    }
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd packages/glyphs && npx vitest run src/glyphs.test.ts --reporter=verbose 2>&1 | grep -E "FAIL|Cannot"
```

Expected: FAIL — "Cannot find module './canvas-renderer.js'"

- [ ] **Step 3: Create `packages/glyphs/src/canvas-renderer.ts`**

```ts
import type { ShapeParams, CanvasInstruction } from "./types.js";

interface RenderParams {
  size: number;
  strokeWidth: number;
  fallback: string;
}

export function renderCanvas(shapes: ShapeParams[], params: RenderParams): CanvasInstruction[] {
  const { size } = params;
  const instructions: CanvasInstruction[] = [{ type: "beginPath", params: [] }];

  for (const shape of shapes) {
    instructions.push(...shapeToInstructions(shape, size));
  }

  instructions.push({ type: "stroke", params: [] });
  return instructions;
}

function shapeToInstructions(shape: ShapeParams, size: number): CanvasInstruction[] {
  switch (shape.type) {
    case "line":
      return [
        { type: "moveTo", params: [shape.x * size, shape.y * size] },
        { type: "lineTo", params: [(shape.x2 ?? 1 - shape.x) * size, (shape.y2 ?? 1 - shape.y) * size] },
      ];

    case "circle":
      return [
        {
          type: "arc",
          params: [shape.x * size, shape.y * size, (shape.r ?? 0.2) * size, 0, Math.PI * 2],
        },
      ];

    case "rect": {
      const x = shape.x * size;
      const y = shape.y * size;
      const w = (shape.w ?? 0.3) * size;
      const h = (shape.h ?? 0.3) * size;
      return [{ type: "rect", params: [x, y, w, h] }];
    }

    case "arc":
      return [
        {
          type: "arc",
          params: [
            shape.x * size,
            shape.y * size,
            (shape.r ?? 0.25) * size,
            shape.startAngle ?? 0,
            shape.endAngle ?? Math.PI,
          ],
        },
      ];

    case "polygon": {
      const cx = shape.x * size;
      const cy = shape.y * size;
      const r = (shape.r ?? 0.25) * size;
      const sides = shape.sides ?? 6;
      const rot = shape.rotation ?? 0;
      const result: CanvasInstruction[] = [];
      for (let i = 0; i < sides; i++) {
        const angle = rot + (i * 2 * Math.PI) / sides;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        result.push({ type: i === 0 ? "moveTo" : "lineTo", params: [px, py] });
      }
      result.push({ type: "closePath", params: [] });
      return result;
    }
  }
}
```

- [ ] **Step 4: Run Canvas tests**

```bash
cd packages/glyphs && npx vitest run src/glyphs.test.ts --reporter=verbose 2>&1 | head -60
```

Expected: All Canvas renderer tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/glyphs/src/canvas-renderer.ts packages/glyphs/src/glyphs.test.ts
git commit -m "feat: add Canvas instruction renderer for glyph shapes"
```

---

## Task 7: `glyphsFor` Main Function

**Files:**
- Create: `packages/glyphs/src/glyphs-for.ts`

The main function that generates a `GlyphSet` for a `TranslatedName`. Handles all mapping strategies and dispatches to the correct renderer.

- [ ] **Step 1: Add `glyphsFor` tests to `packages/glyphs/src/glyphs.test.ts`**

```ts
import { glyphsFor } from "./glyphs-for.js";
import type { VisualGlyphSystem } from "@lexiconlang/language";
import type { TranslatedName } from "@lexiconlang/language";

const mockName: TranslatedName = {
  form: "Drakaztum",
  translation: "Strong-anvil",
  language: "fantasy.dwarvish",
  parts: [
    { form: "Drak", meaning: "strong" },
    { form: "aztum", meaning: "anvil" },
  ],
  toString() { return this.form; },
};

const svgSystem: VisualGlyphSystem = {
  id: "dwarvish.runes",
  type: "alphabet",
  renderFormat: "svg",
  mappingStrategy: "morpheme",
  generator: {
    baseShapes: ["rect", "line"],
    complexity: "simple",
    symmetry: false,
    palette: ["#000000"],
  },
  renderParams: { size: 32, strokeWidth: 2, fallback: "□" },
};

const unicodeSystem: VisualGlyphSystem = {
  id: "elvish.symbols",
  type: "conceptual",
  renderFormat: "unicode",
  mappingStrategy: "morpheme",
  unicodeMappings: { strong: "ᚠ", anvil: "ᛒ" },
  renderParams: { fallback: "□" },
};

describe("glyphsFor", () => {
  it("generates SVG glyphs for each morpheme", () => {
    const ctx = createContext({ seed: "test" });
    const set = glyphsFor(mockName, { phonetic: svgSystem }, ctx);
    expect(set.phonetic).toBeDefined();
    expect(set.phonetic?.length).toBe(2); // 2 parts = 2 glyphs
    expect(set.phonetic?.[0]?.svg).toMatch(/^<svg /);
  });

  it("generates Unicode glyphs using meaning mappings", () => {
    const ctx = createContext({ seed: "test" });
    const set = glyphsFor(mockName, { conceptual: unicodeSystem }, ctx);
    expect(set.conceptual).toBeDefined();
    expect(set.conceptual?.[0]?.unicode).toBe("ᚠ");
    expect(set.conceptual?.[1]?.unicode).toBe("ᛒ");
  });

  it("is deterministic — same seed produces same glyphs", () => {
    const ctx1 = createContext({ seed: "stable-seed" });
    const ctx2 = createContext({ seed: "stable-seed" });
    const set1 = glyphsFor(mockName, { phonetic: svgSystem }, ctx1);
    const set2 = glyphsFor(mockName, { phonetic: svgSystem }, ctx2);
    expect(set1.phonetic?.[0]?.svg).toBe(set2.phonetic?.[0]?.svg);
  });

  it("different seeds produce different SVG glyphs", () => {
    const ctx1 = createContext({ seed: "seed-a" });
    const ctx2 = createContext({ seed: "seed-b" });
    const set1 = glyphsFor(mockName, { phonetic: svgSystem }, ctx1);
    const set2 = glyphsFor(mockName, { phonetic: svgSystem }, ctx2);
    expect(set1.phonetic?.[0]?.svg).not.toBe(set2.phonetic?.[0]?.svg);
  });

  it("holistic strategy returns one glyph for the whole name", () => {
    const holisticSystem: VisualGlyphSystem = {
      ...svgSystem,
      mappingStrategy: "holistic",
    };
    const ctx = createContext({ seed: "holistic" });
    const set = glyphsFor(mockName, { holistic: holisticSystem }, ctx);
    expect(set.holistic).toBeDefined();
    expect(set.holistic?.svg).toMatch(/^<svg /);
  });

  it("missing unicode mapping returns fallback", () => {
    const ctx = createContext({ seed: "fallback" });
    const nameWithUnknown: TranslatedName = {
      ...mockName,
      parts: [{ form: "xyz", meaning: "unknown-thing" }],
    };
    const set = glyphsFor(nameWithUnknown, { conceptual: unicodeSystem }, ctx);
    expect(set.conceptual?.[0]?.unicode).toBe("□");
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd packages/glyphs && npx vitest run src/glyphs.test.ts --reporter=verbose 2>&1 | grep -E "FAIL|Cannot"
```

Expected: FAIL — "Cannot find module './glyphs-for.js'"

- [ ] **Step 3: Create `packages/glyphs/src/glyphs-for.ts`**

```ts
import type { Context } from "@lexiconlang/core";
import type { TranslatedName, VisualGlyphSystem, Glyph, GlyphSet } from "@lexiconlang/language";
import { generateShapes } from "./shape-generator.js";
import { renderSvg } from "./svg-renderer.js";
import { renderUnicode } from "./unicode-renderer.js";
import { renderCanvas } from "./canvas-renderer.js";

type GlyphSystemMap = {
  phonetic?: VisualGlyphSystem;
  conceptual?: VisualGlyphSystem;
  holistic?: VisualGlyphSystem;
};

export function glyphsFor(
  name: TranslatedName,
  systems: GlyphSystemMap,
  ctx: Context,
): GlyphSet {
  const result: GlyphSet = {};

  if (systems.phonetic) {
    result.phonetic = generateGlyphsForSystem(name, systems.phonetic, ctx.child("phonetic"));
  }

  if (systems.conceptual) {
    result.conceptual = generateGlyphsForSystem(name, systems.conceptual, ctx.child("conceptual"));
  }

  if (systems.holistic) {
    result.holistic = generateSingleGlyph("holistic", undefined, systems.holistic, ctx.child("holistic"));
  }

  return result;
}

function generateGlyphsForSystem(
  name: TranslatedName,
  system: VisualGlyphSystem,
  ctx: Context,
): Glyph[] {
  const parts = name.parts ?? [{ form: name.form, meaning: name.translation }];

  return parts.map((part, i) =>
    generateSingleGlyph(`g${i}`, part.meaning, system, ctx.child(`glyph:${i}`))
  );
}

function generateSingleGlyph(
  id: string,
  meaning: string | undefined,
  system: VisualGlyphSystem,
  ctx: Context,
): Glyph {
  const glyph: Glyph = { id, meaning };
  const renderParams = {
    size: system.renderParams?.size ?? 32,
    strokeWidth: system.renderParams?.strokeWidth ?? 2,
    fallback: system.renderParams?.fallback ?? "□",
  };

  if (system.renderFormat === "unicode") {
    glyph.unicode = renderUnicode(
      meaning ?? id,
      system.unicodeMappings ?? {},
      renderParams.fallback,
    );
    return glyph;
  }

  const generatorConfig = system.generator ?? {
    baseShapes: ["rect", "line"] as const,
    complexity: "simple" as const,
    symmetry: false,
  };
  const shapes = generateShapes(generatorConfig, ctx);

  if (system.renderFormat === "svg") {
    glyph.svg = renderSvg(shapes, renderParams);
  } else if (system.renderFormat === "canvas") {
    glyph.canvasInstructions = renderCanvas(shapes, renderParams);
  }

  return glyph;
}
```

- [ ] **Step 4: Run all tests**

```bash
cd packages/glyphs && npx vitest run src/glyphs.test.ts --reporter=verbose
```

Expected: All tests PASS including glyphsFor tests.

- [ ] **Step 5: Commit**

```bash
git add packages/glyphs/src/glyphs-for.ts packages/glyphs/src/glyphs.test.ts
git commit -m "feat: add glyphsFor() main function with morpheme/phoneme/holistic mapping"
```

---

## Task 8: Package Exports

**Files:**
- Modify: `packages/glyphs/src/index.ts`

- [ ] **Step 1: Update `packages/glyphs/src/index.ts` with all public exports**

```ts
export type { Glyph, GlyphSet, VisualGlyphSystem, RenderFormat, MappingStrategy } from "@lexiconlang/language";
export type { ShapeParams, CanvasInstruction, BaseShape, Complexity } from "./types.js";
export { generateShapes } from "./shape-generator.js";
export { renderSvg } from "./svg-renderer.js";
export { renderUnicode, elderFuthark, linearB, geometricSymbols } from "./unicode-renderer.js";
export { renderCanvas } from "./canvas-renderer.js";
export { glyphsFor } from "./glyphs-for.js";
```

- [ ] **Step 2: Build the package**

```bash
cd packages/glyphs && pnpm build
```

Expected: `dist/` generated with `index.js` and `index.d.ts`, no TypeScript errors.

- [ ] **Step 3: Verify exports compile correctly**

```bash
cd packages/glyphs && node --input-type=module <<'EOF'
import { glyphsFor, renderSvg, elderFuthark } from "./dist/index.js";
console.log("glyphsFor:", typeof glyphsFor);
console.log("renderSvg:", typeof renderSvg);
console.log("elderFuthark cattle:", elderFuthark.cattle);
EOF
```

Expected output:
```
glyphsFor: function
renderSvg: function
elderFuthark cattle: ᚠ
```

- [ ] **Step 4: Commit**

```bash
git add packages/glyphs/src/index.ts
git commit -m "feat: export all public API from @lexiconlang/glyphs"
```

---

## Task 9: Fantasy Culture Integration

**Files:**
- Modify: `packages/fantasy/src/language/cultures.ts`
- Create: `packages/fantasy/src/glyphs.integration.test.ts`

Add `visualGlyphSystems` to `dwarvish` (SVG, alphabet) and `elvish` (Unicode, conceptual). Integration tests live in the fantasy package (correct dependency direction: fantasy → glyphs, not glyphs → fantasy).

- [ ] **Step 1: Write integration test in `packages/fantasy/src/glyphs.integration.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { createContext } from "@lexiconlang/core";
import { generateName } from "@lexiconlang/language";
import { glyphsFor } from "@lexiconlang/glyphs";
import { dwarvish, elvish } from "./language/cultures.js";

describe("Fantasy culture glyph integration", () => {
  it("dwarvish culture has visualGlyphSystems defined", () => {
    expect(dwarvish.visualGlyphSystems).toBeDefined();
    expect(dwarvish.visualGlyphSystems?.phonetic).toBeDefined();
  });

  it("generates glyphs for a dwarvish name", () => {
    const ctx = createContext({ seed: "dwarven-hero" });
    const name = generateName(dwarvish, "given", ctx.child("name"));
    const glyphs = glyphsFor(name, dwarvish.visualGlyphSystems ?? {}, ctx.child("glyphs"));
    expect(glyphs.phonetic).toBeDefined();
    expect(glyphs.phonetic?.length).toBeGreaterThan(0);
    expect(glyphs.phonetic?.[0]?.svg).toMatch(/^<svg /);
  });

  it("elvish culture has unicode glyph system", () => {
    expect(elvish.visualGlyphSystems?.conceptual?.renderFormat).toBe("unicode");
  });

  it("generates unicode glyphs for an elvish name", () => {
    const ctx = createContext({ seed: "elven-hero" });
    const name = generateName(elvish, "given", ctx.child("name"));
    const glyphs = glyphsFor(name, elvish.visualGlyphSystems ?? {}, ctx.child("glyphs"));
    expect(glyphs.conceptual).toBeDefined();
    expect(glyphs.conceptual?.[0]?.unicode).toBeDefined();
  });

  it("glyph generation doesn't affect name determinism", () => {
    const ctx1 = createContext({ seed: "stable" });
    const ctx2 = createContext({ seed: "stable" });
    const name1 = generateName(dwarvish, "given", ctx1.child("name"));
    const name2 = generateName(dwarvish, "given", ctx2.child("name"));
    expect(name1.form).toBe(name2.form);
  });
});
```

- [ ] **Step 2: Run to verify integration test fails**

```bash
cd packages/fantasy && npx vitest run src/glyphs.integration.test.ts 2>&1 | head -20
```

Expected: FAIL — `dwarvish.visualGlyphSystems` is undefined.

- [ ] **Step 3: Add `visualGlyphSystems` to `dwarvish` in `packages/fantasy/src/language/cultures.ts`**

Add to the `dwarvish` culture object (after the existing `templates` field):

```ts
import { elderFuthark } from "@lexiconlang/glyphs";

// In dwarvish:
visualGlyphSystems: {
  phonetic: {
    id: "dwarvish.runes",
    type: "alphabet",
    renderFormat: "svg",
    mappingStrategy: "morpheme",
    generator: {
      baseShapes: ["rect", "line", "polygon"],
      complexity: "medium",
      symmetry: false,
      palette: ["#8B4513"],
    },
    renderParams: { size: 28, strokeWidth: 2.5, fallback: "□" },
  },
},
```

- [ ] **Step 4: Add `visualGlyphSystems` to `elvish` in `packages/fantasy/src/language/cultures.ts`**

```ts
// In elvish:
visualGlyphSystems: {
  conceptual: {
    id: "elvish.runes",
    type: "conceptual",
    renderFormat: "unicode",
    mappingStrategy: "morpheme",
    unicodeMappings: {
      ...elderFuthark,
      // Override with more elvish-fitting meanings
      "silver": "ᛊ",
      "stream": "ᛚ",
      "light": "ᛟ",
      "star": "ᛁ",
      "dawn": "ᛞ",
      "moon": "ᛗ",
      "leaf": "ᛒ",
      "wind": "ᚹ",
      "song": "ᚷ",
      "wise": "ᚺ",
    },
    renderParams: { fallback: "✦" },
  },
},
```

- [ ] **Step 5: Add `@lexiconlang/glyphs` to `packages/fantasy/package.json` dependencies**

```json
"dependencies": {
  "@lexiconlang/core": "workspace:*",
  "@lexiconlang/glyphs": "workspace:*",
  "@lexiconlang/grammar": "workspace:*",
  "@lexiconlang/language": "workspace:*",
  "@lexiconlang/markov": "workspace:*"
}
```

- [ ] **Step 6: Run integration tests**

```bash
pnpm install && cd packages/fantasy && npx vitest run src/glyphs.integration.test.ts --reporter=verbose
```

Expected: All 5 integration tests PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/fantasy/src/language/cultures.ts packages/fantasy/package.json packages/fantasy/src/glyphs.integration.test.ts
git commit -m "feat: add visualGlyphSystems to dwarvish (SVG) and elvish (Unicode) cultures"
```

---

## Task 10: Scifi Culture Integration

**Files:**
- Modify: `packages/scifi/src/language/cultures.ts`
- Create: `packages/scifi/src/glyphs.integration.test.ts`

Add `visualGlyphSystems` to `humanoid` (Canvas) and `insectoid` (SVG, angular shapes). Tests live in the scifi package.

- [ ] **Step 1: Create `packages/scifi/src/glyphs.integration.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { createContext } from "@lexiconlang/core";
import { generateName } from "@lexiconlang/language";
import { glyphsFor } from "@lexiconlang/glyphs";
import { humanoid, insectoid } from "./language/cultures.js";

describe("Scifi culture glyph integration", () => {
  it("humanoid culture has canvas glyph system", () => {
    expect(humanoid.visualGlyphSystems?.conceptual?.renderFormat).toBe("canvas");
  });

  it("generates canvas instructions for a humanoid name", () => {
    const ctx = createContext({ seed: "human-crew" });
    const name = generateName(humanoid, "given", ctx.child("name"));
    const glyphs = glyphsFor(name, humanoid.visualGlyphSystems ?? {}, ctx.child("glyphs"));
    expect(glyphs.conceptual).toBeDefined();
    expect(glyphs.conceptual?.[0]?.canvasInstructions).toBeDefined();
    expect(glyphs.conceptual?.[0]?.canvasInstructions?.length).toBeGreaterThan(0);
  });

  it("insectoid culture has SVG glyph system", () => {
    expect(insectoid.visualGlyphSystems?.phonetic?.renderFormat).toBe("svg");
  });

  it("generates SVG glyphs for an insectoid name", () => {
    const ctx = createContext({ seed: "hive-scout" });
    const name = generateName(insectoid, "given", ctx.child("name"));
    const glyphs = glyphsFor(name, insectoid.visualGlyphSystems ?? {}, ctx.child("glyphs"));
    expect(glyphs.phonetic?.[0]?.svg).toMatch(/^<svg /);
  });
});
```

- [ ] **Step 2: Run to verify scifi tests fail**

```bash
cd packages/scifi && npx vitest run src/glyphs.integration.test.ts 2>&1 | grep -E "FAIL|undefined"
```

Expected: FAIL — scifi cultures have no `visualGlyphSystems`.

- [ ] **Step 3: Add `visualGlyphSystems` to `humanoid` in `packages/scifi/src/language/cultures.ts`**

```ts
import { geometricSymbols } from "@lexiconlang/glyphs";

// In humanoid culture:
visualGlyphSystems: {
  conceptual: {
    id: "humanoid.matrix",
    type: "conceptual",
    renderFormat: "canvas",
    mappingStrategy: "morpheme",
    generator: {
      baseShapes: ["circle", "line", "polygon"],
      complexity: "medium",
      symmetry: true,
      palette: ["#00ff88"],
    },
    renderParams: { size: 40, strokeWidth: 1.5, fallback: "◈" },
  },
},
```

- [ ] **Step 4: Add `visualGlyphSystems` to `insectoid` in `packages/scifi/src/language/cultures.ts`**

```ts
// In insectoid culture:
visualGlyphSystems: {
  phonetic: {
    id: "insectoid.chitin-marks",
    type: "alphabet",
    renderFormat: "svg",
    mappingStrategy: "morpheme",
    generator: {
      baseShapes: ["line", "polygon", "arc"],
      complexity: "complex",
      symmetry: false,
      palette: ["#222222"],
    },
    renderParams: { size: 32, strokeWidth: 1.5, fallback: "⟨⟩" },
  },
},
```

- [ ] **Step 5: Add `@lexiconlang/glyphs` to `packages/scifi/package.json` dependencies**

In `packages/scifi/package.json`:
```json
"dependencies": {
  "@lexiconlang/core": "workspace:*",
  "@lexiconlang/glyphs": "workspace:*",
  "@lexiconlang/grammar": "workspace:*",
  "@lexiconlang/language": "workspace:*",
  "@lexiconlang/markov": "workspace:*"
}
```

- [ ] **Step 6: Run all integration tests**

```bash
pnpm install && cd packages/scifi && npx vitest run src/glyphs.integration.test.ts --reporter=verbose
```

Expected: All 4 scifi integration tests PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/scifi/src/language/cultures.ts packages/scifi/package.json packages/scifi/src/glyphs.integration.test.ts
git commit -m "feat: add visualGlyphSystems to humanoid (Canvas) and insectoid (SVG) scifi cultures"
```

---

## Task 11: Full Test Suite and Build Verification

**Files:**
- Modify: `packages/glyphs/src/glyphs.test.ts` (add performance + edge case tests)

- [ ] **Step 1: Add performance and edge case tests to `packages/glyphs/src/glyphs.test.ts`**

```ts
import { performance } from "node:perf_hooks";

describe("Performance", () => {
  it("generates 20 SVG glyphs in under 200ms", () => {
    const start = performance.now();
    for (let i = 0; i < 20; i++) {
      const ctx = createContext({ seed: `perf:${i}` });
      const mockPerfName: TranslatedName = {
        form: "Testname",
        translation: "test-word",
        language: "test",
        parts: [
          { form: "Test", meaning: "test" },
          { form: "name", meaning: "word" },
        ],
        toString() { return this.form; },
      };
      glyphsFor(mockPerfName, { phonetic: svgSystem }, ctx);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });
});

describe("Edge cases", () => {
  it("handles name with no parts — falls back to whole form", () => {
    const ctx = createContext({ seed: "no-parts" });
    const nameless: TranslatedName = {
      form: "Zyx",
      translation: "unknown",
      language: "test",
      toString() { return this.form; },
    };
    const set = glyphsFor(nameless, { phonetic: svgSystem }, ctx);
    expect(set.phonetic?.length).toBe(1);
  });

  it("handles empty systems map — returns empty GlyphSet", () => {
    const ctx = createContext({ seed: "empty" });
    const set = glyphsFor(mockName, {}, ctx);
    expect(set.phonetic).toBeUndefined();
    expect(set.conceptual).toBeUndefined();
    expect(set.holistic).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the complete test suite**

```bash
cd packages/glyphs && npx vitest run src/ --reporter=verbose
```

Expected: All tests PASS. Count should be 20+ tests across unit + integration.

- [ ] **Step 3: Run typecheck across all packages**

Run from the monorepo root:

```bash
pnpm typecheck
```

Expected: No TypeScript errors across all packages.

- [ ] **Step 4: Run the full monorepo build**

```bash
pnpm build
```

Expected: All packages build without errors.

- [ ] **Step 5: Run the full monorepo test suite**

```bash
pnpm test
```

Expected: All existing tests still pass (no regressions).

- [ ] **Step 6: Final commit**

```bash
git add packages/glyphs/src/glyphs.test.ts
git commit -m "test: add performance and edge case tests for glyph system

- 20 SVG glyphs must render in <200ms
- Names with no parts fall back to single holistic glyph
- Empty systems map returns empty GlyphSet
- All existing tests still pass"
```

---

## Summary of Public API

After this implementation, users can generate visual glyphs alongside names:

```ts
import { createContext } from "@lexiconlang/core";
import { generateName } from "@lexiconlang/language";
import { glyphsFor, elderFuthark } from "@lexiconlang/glyphs";
import { dwarvish } from "@lexiconlang/fantasy/language";

const ctx = createContext({ seed: "my-world" });

// Generate the name (unchanged API)
const name = generateName(dwarvish, "given", ctx.child("npc:1:name"));
// → { form: "Drakaztum", translation: "Strong-anvil", ... }

// Generate glyphs separately (opt-in, no breaking change)
const glyphs = glyphsFor(name, dwarvish.visualGlyphSystems ?? {}, ctx.child("npc:1:glyphs"));
// → {
//     phonetic: [
//       { id: "g0", meaning: "strong", svg: "<svg>...</svg>" },
//       { id: "g1", meaning: "anvil",  svg: "<svg>...</svg>" },
//     ]
//   }

// Render to DOM
glyphs.phonetic?.forEach(glyph => {
  const span = document.createElement("span");
  span.innerHTML = glyph.svg ?? glyph.unicode ?? glyph.canvasInstructions?.[0]?.type ?? "";
  document.body.appendChild(span);
});
```
