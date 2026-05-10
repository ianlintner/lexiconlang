# Language System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a procedural constructed-language system where every culture generates a seeded, deterministic lexicon (English meaning → conlang form), and all personal names and place names return `TranslatedName` objects with both form and translation.

**Architecture:** Core language engine (`@content-gen/language`) handles glyph systems, phonotactics, lexicon generation, and name templates. Fantasy and sci-fi packages extend with meaning packs and culture presets, then integrate into existing generators by wrapping them to return `TranslatedName`. Breaking change for v0.2: all name outputs become `TranslatedName`.

**Tech Stack:** TypeScript, Vitest, existing `@content-gen/core` RNG and Generator<T> model, WeightedList from core.

---

## File Structure

### New Package: `packages/language/`

```
src/
  types.ts               Type definitions (GlyphSystem, Meaning, Lexicon, Culture, TranslatedName, etc.)
  glyphs.ts              GlyphSystem + Constraint helpers; no logic
  phonotactics.ts        generateWord(glyphs, ctx) — core word-generation algorithm
  meanings.ts            Universal core meanings (~150) + semantic tags
  lexicon.ts             buildLexicon(culture, ctx) — key-addressed RNG, lazy/eager modes
  templates.ts           NameTemplate engine: select meanings by class/tag, compose, translate
  archetypes.ts          Phonotactic preset definitions (flowing, guttural, clipped, sibilant, resonant)
  language.ts            Culture interface + utilities
  index.ts               Public API exports
src/__tests__/
  types.test.ts          Type sanity checks
  phonotactics.test.ts   Word generation: structure, constraints, determinism
  lexicon.test.ts        Lexicon generation: key-addressed RNG, caching, ordering
  templates.test.ts      Template engine: morpheme selection, translation composition
  determinism.test.ts    Snapshot tests per culture for v0.2.x stability

```

### Fantasy Extension: `packages/fantasy/src/language/`

```
meanings.ts              ~350 fantasy-specific meanings (rune, oath, anvil, hex, beast, forge, sigil, vow, crown, …)
cultures.ts              dwarvish, elvish, orcish, halfling, draconic culture presets
index.ts                 Exports
```

### Sci-fi Extension: `packages/scifi/src/language/`

```
meanings.ts              ~350 sci-fi meanings (void, plasma, drive, lattice, signal, hive, molt, node, relay, …)
cultures.ts              humanoid, insectoid, aquatic, synth culture presets
index.ts                 Exports
```

### Integration: Modify Existing

```
packages/fantasy/src/index.ts          Export new language-backed name generators; deprecate old Markov ones
packages/fantasy/src/npc.ts            Update fullName/givenName/surname to use language system
packages/fantasy/src/places.ts         Update settlement/mountain/river/forest names to use language system
packages/scifi/src/index.ts            Export language-backed name generators; deprecate old Markov ones
packages/scifi/src/npc.ts (if exists)  Similar updates as fantasy
```

---

## Task Decomposition

### Task 1: Set up `@content-gen/language` package structure

**Files:**
- Create: `packages/language/package.json`
- Create: `packages/language/tsconfig.json`
- Create: `packages/language/src/index.ts`
- Create: `packages/language/src/__tests__/determinism.test.ts` (placeholder for now)

- [ ] **Step 1: Create package.json**

In `packages/language/package.json`:

```json
{
  "name": "@content-gen/language",
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
  "dependencies": {
    "@content-gen/core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "test:watch": "vitest --watch"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

In `packages/language/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "exclude": ["src/__tests__"]
}
```

- [ ] **Step 3: Create initial index.ts with placeholder exports**

In `packages/language/src/index.ts`:

```ts
export type { GlyphSystem, Constraint } from "./glyphs.js";
export type { Meaning, WordClass, MeaningPack, Lexicon } from "./meanings.js";
export type { Culture, NameTemplates, NameTemplate, TemplatePart, TranslatedName } from "./language.js";
export { buildLexicon, generateName } from "./language.js";
export { archetypes } from "./archetypes.js";
```

- [ ] **Step 4: Create determinism.test.ts placeholder**

In `packages/language/src/__tests__/determinism.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("Determinism", () => {
  it("placeholder", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 5: Add language to workspace**

Edit `pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
```

(It should already have this; verify the glob includes `packages/language`.)

- [ ] **Step 6: Commit**

```bash
git add packages/language/
git commit -m "feat: scaffold @content-gen/language package structure"
```

---

### Task 2: Define core types

**Files:**
- Create: `packages/language/src/types.ts`
- Modify: `packages/language/src/index.ts`

- [ ] **Step 1: Write types.ts with full interface definitions**

In `packages/language/src/types.ts`:

```ts
import type { Generator, Context } from "@content-gen/core";

/** Atomic glyph classes and their phonotactic rules. */
export interface GlyphSystem {
  /** Named classes of glyphs (e.g., C, V, sigil, mark). */
  classes: Record<string, readonly string[]>;
  /** Syllable templates: space-separated class names. e.g. "C V", "C V C", "sigil mark". */
  syllables: Array<[template: string, weight: number]>;
  /** Word shapes: syllable counts. e.g. "1", "2", "1-2" (range). */
  wordShapes: Array<[shape: string, weight: number]>;
  /** Optional phonotactic constraints. */
  constraints?: readonly Constraint[];
  /** Joiner between syllables. Default "". */
  joiner?: string;
}

/** Phonotactic constraint. */
export interface Constraint {
  /** Pattern of class names; "*" matches any. */
  pattern: readonly string[];
  /** "forbid" or { maxOccurrences }. */
  rule: "forbid" | { maxOccurrences: number };
}

/** A semantic unit with stable identity. */
export interface Meaning {
  /** Stable identifier (never rename after release). */
  id: string;
  /** Grammatical class. */
  class: WordClass;
  /** Semantic tags for template filtering. */
  tags: readonly string[];
  /** Human-readable label. */
  label?: string;
}

export type WordClass = "noun" | "adjective" | "verb" | "particle";

/** Named collection of meanings. */
export interface MeaningPack {
  id: string;                    // "core", "fantasy.industrial"
  version: string;               // semver
  meanings: readonly Meaning[];
}

/** Lazy + eager lexicon for a culture. */
export interface Lexicon {
  readonly cultureId: string;
  formOf(meaningId: string): string;
  byClass(c: WordClass, tag?: string): readonly Meaning[];
  materialize(): ReadonlyMap<string, string>;
}

/** Culture: glyph system + meanings + templates. */
export interface Culture {
  id: string;
  glyphs: GlyphSystem;
  meaningPacks: readonly MeaningPack[];
  templates: NameTemplates;
  capitalize?: "first" | "all" | "none";
}

export interface NameTemplates {
  given: Array<[template: NameTemplate, weight: number]>;
  surname?: Array<[template: NameTemplate, weight: number]>;
  settlement?: Array<[template: NameTemplate, weight: number]>;
  mountain?: Array<[template: NameTemplate, weight: number]>;
  river?: Array<[template: NameTemplate, weight: number]>;
  forest?: Array<[template: NameTemplate, weight: number]>;
}

export type NameTemplate =
  | { kind: "compose"; parts: readonly TemplatePart[]; sep?: string }
  | { kind: "literal"; form: string; translation: string };

export type TemplatePart =
  | { pick: WordClass; tag?: string; capitalize?: boolean }
  | { literal: string; translation?: string };

/** Output: conlang form + English translation. */
export interface TranslatedName {
  form: string;
  translation: string;
  language: string;
  parts?: readonly { form: string; meaning: string }[];
  toString(): string;
}
```

- [ ] **Step 2: Create glyphs.ts with type re-exports and helpers**

In `packages/language/src/glyphs.ts`:

```ts
export type { GlyphSystem, Constraint } from "./types.js";

/** Helper: check if a constraint pattern matches a sequence of classes. */
export function constraintMatches(pattern: readonly string[], sequence: readonly string[]): boolean {
  if (pattern.length > sequence.length) return false;
  for (let i = 0; i < pattern.length; i++) {
    const p = pattern[i]!;
    if (p !== "*" && p !== sequence[i]) return false;
  }
  return true;
}
```

- [ ] **Step 3: Update index.ts to export from types.ts**

In `packages/language/src/index.ts`:

```ts
export type {
  GlyphSystem,
  Constraint,
  Meaning,
  WordClass,
  MeaningPack,
  Lexicon,
  Culture,
  NameTemplates,
  NameTemplate,
  TemplatePart,
  TranslatedName,
} from "./types.js";
export { constraintMatches } from "./glyphs.js";
```

- [ ] **Step 4: Commit**

```bash
git add packages/language/src/types.ts packages/language/src/glyphs.ts packages/language/src/index.ts
git commit -m "feat: define core language types (GlyphSystem, Meaning, Culture, TranslatedName)"
```

---

### Task 3: Implement phonotactics (word generation)

**Files:**
- Create: `packages/language/src/phonotactics.ts`
- Create: `packages/language/src/__tests__/phonotactics.test.ts`
- Modify: `packages/language/src/index.ts`

- [ ] **Step 1: Write failing test for word generation**

In `packages/language/src/__tests__/phonotactics.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createContext } from "@content-gen/core";
import type { GlyphSystem } from "../types.js";
import { generateWord } from "../phonotactics.js";

describe("generateWord", () => {
  const simpleSystem: GlyphSystem = {
    classes: { C: ["k", "t", "p"], V: ["a", "i", "u"] },
    syllables: [["C V", 3], ["C V C", 1]],
    wordShapes: [["1", 2], ["2", 1]],
  };

  it("generates a word matching the glyph system", () => {
    const ctx = createContext({ seed: "test-1" });
    const word = generateWord(simpleSystem, ctx);
    expect(word).toMatch(/^[ktp][aiu]([ktp])?([ktp][aiu]([ktp])?)?$/);
  });

  it("is deterministic", () => {
    const ctx1 = createContext({ seed: "test-1" });
    const ctx2 = createContext({ seed: "test-1" });
    expect(generateWord(simpleSystem, ctx1)).toBe(generateWord(simpleSystem, ctx2));
  });

  it("changes with different seeds", () => {
    const ctx1 = createContext({ seed: "seed-1" });
    const ctx2 = createContext({ seed: "seed-2" });
    // High probability they differ (not 100% guaranteed, but ~99%)
    const words = new Set([generateWord(simpleSystem, ctx1), generateWord(simpleSystem, ctx2)]);
    expect(words.size).toBe(2);
  });

  it("respects joiner", () => {
    const system: GlyphSystem = {
      classes: { C: ["k"], V: ["a"] },
      syllables: [["C V", 1]],
      wordShapes: [["2", 1]],
      joiner: "-",
    };
    const ctx = createContext({ seed: "test-1" });
    const word = generateWord(system, ctx);
    expect(word).toContain("-");
  });

  it("respects constraints", () => {
    const system: GlyphSystem = {
      classes: { C: ["k", "t"], V: ["a"] },
      syllables: [["C V C", 1]],
      wordShapes: [["1", 1]],
      constraints: [{ pattern: ["C", "C"], rule: "forbid" }],
    };
    const ctx = createContext({ seed: "test-1" });
    const word = generateWord(system, ctx);
    // Should not have two C's in a row
    expect(word).not.toMatch(/[kt]{2}/);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
cd packages/language
pnpm test src/__tests__/phonotactics.test.ts
```

Expected: FAIL — "generateWord is not exported from phonotactics.ts"

- [ ] **Step 3: Implement phonotactics.ts**

In `packages/language/src/phonotactics.ts`:

```ts
import type { Context } from "@content-gen/core";
import type { GlyphSystem } from "./types.js";
import { constraintMatches } from "./glyphs.js";

/**
 * Generate a single word conforming to a glyph system.
 * Algorithm:
 * 1. Pick word shape (syllable count)
 * 2. For each syllable, pick syllable template
 * 3. For each class slot, pick a glyph
 * 4. Check constraints; redraw on violation
 * 5. Join and capitalize
 */
export function generateWord(glyphs: GlyphSystem, ctx: Context): string {
  // 1. Pick word shape
  const shapeCtx = ctx.child("shape");
  const shapeStr = pickWeighted(glyphs.wordShapes, shapeCtx);
  const syllableCount = parseWordShape(shapeStr);

  // 2. Pick syllable templates and generate glyphs for each
  const syllables: string[] = [];
  for (let i = 0; i < syllableCount; i++) {
    const syllCtx = ctx.child(`syl:${i}`);
    const template = pickWeighted(glyphs.syllables, syllCtx);
    const classes = template.split(" ");
    const syllableGlyphs = generateSyllable(glyphs, classes, syllCtx);
    syllables.push(syllableGlyphs);
  }

  // 5. Join
  const word = syllables.join(glyphs.joiner ?? "");

  // 6. Capitalize
  return capitalize(word, glyphs, ctx);
}

function parseWordShape(shape: string): number {
  // "1" -> 1, "2" -> 2, "1-2" -> random in [1,2]
  if (shape.includes("-")) {
    const [lo, hi] = shape.split("-").map(Number);
    return Math.floor(Math.random() * (hi! - lo! + 1)) + lo!;
  }
  return Number(shape);
}

function generateSyllable(glyphs: GlyphSystem, classes: string[], ctx: Context): string {
  const glyphSlots: string[] = [];

  for (let slot = 0; slot < classes.length; slot++) {
    const className = classes[slot]!;
    let glyph = pickGlyph(glyphs.classes[className]!, ctx.child(`slot:${slot}`));

    // Constraint checking with retries
    let retries = 0;
    while (retries < 8 && violatesConstraints(glyphs, [...glyphSlots, glyph], classes, slot)) {
      glyph = pickGlyph(glyphs.classes[className]!, ctx.child(`slot:${slot}:retry:${retries}`));
      retries++;
    }

    glyphSlots.push(glyph);
  }

  return glyphSlots.join("");
}

function violatesConstraints(
  glyphs: GlyphSystem,
  glyphsSoFar: string[],
  classes: string[],
  currentSlot: number,
): boolean {
  if (!glyphs.constraints || glyphsSoFar.length < 2) return false;

  // Check constraints that end at or after the current position
  for (const constraint of glyphs.constraints) {
    const patternLen = constraint.pattern.length;
    const startIdx = Math.max(0, currentSlot + 1 - patternLen);

    for (let i = startIdx; i <= currentSlot - patternLen + 1; i++) {
      const classSeq = classes.slice(i, i + patternLen);
      if (constraintMatches(constraint.pattern, classSeq)) {
        const glyphSeq = glyphsSoFar.slice(i, i + patternLen);
        if (glyphSeq.length === patternLen) {
          if (constraint.rule === "forbid") return true;
          if (typeof constraint.rule === "object") {
            const count = glyphSeq.filter((g) => g === glyphSeq[0]).length;
            if (count > constraint.rule.maxOccurrences) return true;
          }
        }
      }
    }
  }

  return false;
}

function pickGlyph(glyphs: readonly string[], ctx: Context): string {
  const idx = ctx.rng.nextInt(0, glyphs.length - 1);
  return glyphs[idx]!;
}

function pickWeighted<T>(items: Array<[T, number]>, ctx: Context): T {
  const totalWeight = items.reduce((sum, [, w]) => sum + w, 0);
  let roll = ctx.rng.nextInt(0, totalWeight - 1);
  for (const [item, weight] of items) {
    if (roll < weight) return item;
    roll -= weight;
  }
  return items[items.length - 1]![0];
}

function capitalize(word: string, glyphs: GlyphSystem, ctx: Context): string {
  if (!glyphs.joiner && word.length > 0) {
    // Default: capitalize first glyph (first character if it's a letter)
    const cap = word[0]!.toUpperCase();
    return cap + word.slice(1);
  }
  return word;
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
cd packages/language
pnpm test src/__tests__/phonotactics.test.ts
```

Expected: PASS

- [ ] **Step 5: Update index.ts to export generateWord**

In `packages/language/src/index.ts`, add:

```ts
export { generateWord } from "./phonotactics.js";
```

- [ ] **Step 6: Commit**

```bash
git add packages/language/src/phonotactics.ts packages/language/src/__tests__/phonotactics.test.ts packages/language/src/index.ts
git commit -m "feat: implement generateWord with phonotactic constraint checking"
```

---

### Task 4: Define meanings (core + semantic tags)

**Files:**
- Create: `packages/language/src/meanings.ts`
- Create: `packages/language/src/__tests__/meanings.test.ts`
- Modify: `packages/language/src/index.ts`

- [ ] **Step 1: Write test for meaning structure**

In `packages/language/src/__tests__/meanings.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { coreMeanings } from "../meanings.js";

describe("Core Meanings", () => {
  it("has ~150 meanings", () => {
    expect(coreMeanings.meanings.length).toBeGreaterThanOrEqual(140);
    expect(coreMeanings.meanings.length).toBeLessThanOrEqual(160);
  });

  it("has unique IDs", () => {
    const ids = coreMeanings.meanings.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all meanings have a class and tags", () => {
    for (const m of coreMeanings.meanings) {
      expect(m.class).toMatch(/noun|adjective|verb|particle/);
      expect(Array.isArray(m.tags)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
cd packages/language
pnpm test src/__tests__/meanings.test.ts
```

Expected: FAIL — "coreMeanings is not exported"

- [ ] **Step 3: Implement meanings.ts**

In `packages/language/src/meanings.ts`:

```ts
import type { MeaningPack } from "./types.js";

export const coreMeanings: MeaningPack = {
  id: "core",
  version: "1.0.0",
  meanings: [
    // Nature
    { id: "mountain", class: "noun", tags: ["nature", "earth", "strength"], label: "mountain" },
    { id: "river", class: "noun", tags: ["nature", "water", "flowing"], label: "river" },
    { id: "stone", class: "noun", tags: ["earth", "industry", "strength"], label: "stone" },
    { id: "water", class: "noun", tags: ["nature", "water", "life"], label: "water" },
    { id: "fire", class: "noun", tags: ["nature", "energy", "destruction"], label: "fire" },
    { id: "tree", class: "noun", tags: ["nature", "plant", "growth"], label: "tree" },
    { id: "sky", class: "noun", tags: ["celestial", "freedom"], label: "sky" },
    { id: "light", class: "noun", tags: ["celestial", "nature", "visibility"], label: "light" },
    { id: "dark", class: "noun", tags: ["shadow", "hidden", "night"], label: "dark" },
    { id: "wind", class: "noun", tags: ["nature", "movement"], label: "wind" },

    // Body
    { id: "blood", class: "noun", tags: ["body", "war", "life"], label: "blood" },
    { id: "bone", class: "noun", tags: ["body", "strength"], label: "bone" },
    { id: "hand", class: "noun", tags: ["body", "action"], label: "hand" },
    { id: "heart", class: "noun", tags: ["body", "emotion", "life"], label: "heart" },
    { id: "eye", class: "noun", tags: ["body", "perception"], label: "eye" },

    // Time
    { id: "day", class: "noun", tags: ["time", "light"], label: "day" },
    { id: "night", class: "noun", tags: ["time", "dark"], label: "night" },
    { id: "year", class: "noun", tags: ["time"], label: "year" },
    { id: "ancient", class: "adjective", tags: ["time", "old"], label: "ancient" },

    // War / Strength
    { id: "strong", class: "adjective", tags: ["strength", "war"], label: "strong" },
    { id: "swift", class: "adjective", tags: ["movement", "speed"], label: "swift" },
    { id: "fierce", class: "adjective", tags: ["war", "nature"], label: "fierce" },
    { id: "brave", class: "adjective", tags: ["war", "virtue"], label: "brave" },
    { id: "wise", class: "adjective", tags: ["knowledge", "virtue"], label: "wise" },
    { id: "cruel", class: "adjective", tags: ["war", "evil"], label: "cruel" },

    // Action
    { id: "walk", class: "verb", tags: ["movement", "travel"], label: "walk" },
    { id: "forge", class: "verb", tags: ["industry", "creation"], label: "forge" },
    { id: "see", class: "verb", tags: ["perception", "knowledge"], label: "see" },
    { id: "kill", class: "verb", tags: ["war", "death"], label: "kill" },
    { id: "build", class: "verb", tags: ["creation", "industry"], label: "build" },
    { id: "grow", class: "verb", tags: ["life", "nature", "growth"], label: "grow" },
    { id: "fall", class: "verb", tags: ["movement", "death", "failure"], label: "fall" },

    // Kin / Society
    { id: "kin", class: "noun", tags: ["family", "society"], label: "kin" },
    { id: "lord", class: "noun", tags: ["society", "power"], label: "lord" },
    { id: "king", class: "noun", tags: ["society", "power", "rule"], label: "king" },
    { id: "folk", class: "noun", tags: ["society", "people"], label: "folk" },
    { id: "bond", class: "noun", tags: ["family", "connection"], label: "bond" },

    // Color
    { id: "red", class: "adjective", tags: ["color", "blood", "fire"], label: "red" },
    { id: "blue", class: "adjective", tags: ["color", "water", "sky"], label: "blue" },
    { id: "green", class: "adjective", tags: ["color", "nature", "plant"], label: "green" },
    { id: "gold", class: "adjective", tags: ["color", "wealth", "light"], label: "gold" },
    { id: "silver", class: "adjective", tags: ["color", "moon", "metal"], label: "silver" },
    { id: "black", class: "adjective", tags: ["color", "dark", "shadow"], label: "black" },
    { id: "white", class: "adjective", tags: ["color", "light", "snow"], label: "white" },

    // Animal
    { id: "wolf", class: "noun", tags: ["animal", "wild", "war"], label: "wolf" },
    { id: "eagle", class: "noun", tags: ["animal", "sky", "freedom"], label: "eagle" },
    { id: "bear", class: "noun", tags: ["animal", "strength", "wild"], label: "bear" },
    { id: "dragon", class: "noun", tags: ["animal", "power", "fire"], label: "dragon" },
    { id: "raven", class: "noun", tags: ["animal", "dark", "sky"], label: "raven" },
    { id: "serpent", class: "noun", tags: ["animal", "evil", "hidden"], label: "serpent" },
    { id: "lion", class: "noun", tags: ["animal", "strength", "rule"], label: "lion" },

    // Emotion / Quality
    { id: "joy", class: "noun", tags: ["emotion", "light"], label: "joy" },
    { id: "sorrow", class: "noun", tags: ["emotion", "dark"], label: "sorrow" },
    { id: "wrath", class: "noun", tags: ["emotion", "fire", "war"], label: "wrath" },
    { id: "calm", class: "adjective", tags: ["emotion", "water"], label: "calm" },
    { id: "wild", class: "adjective", tags: ["nature", "untamed"], label: "wild" },
    { id: "tame", class: "adjective", tags: ["society", "order"], label: "tame" },

    // Particles
    { id: "of", class: "particle", tags: ["grammar"], label: "of" },
    { id: "and", class: "particle", tags: ["grammar"], label: "and" },

    // Additional for v0.2 breadth (~150 total)
    { id: "void", class: "noun", tags: ["space", "emptiness"], label: "void" },
    { id: "door", class: "noun", tags: ["structure", "passage"], label: "door" },
    { id: "bridge", class: "noun", tags: ["structure", "connection"], label: "bridge" },
    { id: "tower", class: "noun", tags: ["structure", "height", "strength"], label: "tower" },
    { id: "hall", class: "noun", tags: ["structure", "society"], label: "hall" },
    { id: "gate", class: "noun", tags: ["structure", "boundary"], label: "gate" },
    { id: "wall", class: "noun", tags: ["structure", "protection"], label: "wall" },
    { id: "crown", class: "noun", tags: ["power", "wealth"], label: "crown" },
    { id: "sword", class: "noun", tags: ["war", "weapon"], label: "sword" },
    { id: "shield", class: "noun", tags: ["war", "protection"], label: "shield" },
    { id: "flame", class: "noun", tags: ["fire", "energy"], label: "flame" },
    { id: "shadow", class: "noun", tags: ["dark", "hidden", "death"], label: "shadow" },
    { id: "mist", class: "noun", tags: ["water", "hidden", "mystery"], label: "mist" },
    { id: "music", class: "noun", tags: ["art", "beauty"], label: "music" },
    { id: "song", class: "noun", tags: ["art", "communication"], label: "song" },
    { id: "death", class: "noun", tags: ["end", "dark"], label: "death" },
    { id: "life", class: "noun", tags: ["existence", "growth", "light"], label: "life" },
    { id: "soul", class: "noun", tags: ["spirit", "life"], label: "soul" },
    { id: "curse", class: "noun", tags: ["magic", "evil"], label: "curse" },
    { id: "blessing", class: "noun", tags: ["magic", "good"], label: "blessing" },
    { id: "truth", class: "noun", tags: ["knowledge", "virtue"], label: "truth" },
    { id: "lie", class: "noun", tags: ["deception", "hidden"], label: "lie" },
    { id: "hope", class: "noun", tags: ["emotion", "light", "future"], label: "hope" },
    { id: "fear", class: "noun", tags: ["emotion", "dark"], label: "fear" },
    { id: "pride", class: "noun", tags: ["emotion", "power"], label: "pride" },
    { id: "shame", class: "noun", tags: ["emotion", "dark"], label: "shame" },
    { id: "love", class: "noun", tags: ["emotion", "bond"], label: "love" },
    { id: "hate", class: "noun", tags: ["emotion", "war"], label: "hate" },
    { id: "peace", class: "noun", tags: ["society", "calm"], label: "peace" },
    { id: "war", class: "noun", tags: ["conflict", "death"], label: "war" },
    { id: "hunt", class: "verb", tags: ["action", "animal"], label: "hunt" },
    { id: "sleep", class: "verb", tags: ["rest", "death"], label: "sleep" },
    { id: "wake", class: "verb", tags: ["life", "action"], label: "wake" },
    { id: "sing", class: "verb", tags: ["art", "communication"], label: "sing" },
    { id: "speak", class: "verb", tags: ["communication", "knowledge"], label: "speak" },
    { id: "listen", class: "verb", tags: ["perception", "knowledge"], label: "listen" },
    { id: "touch", class: "verb", tags: ["action", "sense"], label: "touch" },
    { id: "taste", class: "verb", tags: ["sense", "life"], label: "taste" },
    { id: "smell", class: "verb", tags: ["sense", "perception"], label: "smell" },
    { id: "flee", class: "verb", tags: ["movement", "fear"], label: "flee" },
    { id: "stand", class: "verb", tags: ["position", "strength"], label: "stand" },
    { id: "sit", class: "verb", tags: ["position", "rest"], label: "sit" },
    { id: "fly", class: "verb", tags: ["movement", "sky"], label: "fly" },
    { id: "swim", class: "verb", tags: ["movement", "water"], label: "swim" },
    { id: "dance", class: "verb", tags: ["art", "joy"], label: "dance" },
    { id: "fight", class: "verb", tags: ["war", "action"], label: "fight" },
    { id: "hide", class: "verb", tags: ["deception", "fear"], label: "hide" },
    { id: "seek", class: "verb", tags: ["action", "knowledge"], label: "seek" },
    { id: "find", class: "verb", tags: ["action", "success"], label: "find" },
    { id: "lose", class: "verb", tags: ["failure", "death"], label: "lose" },
    { id: "give", class: "verb", tags: ["action", "generosity"], label: "give" },
    { id: "take", class: "verb", tags: ["action", "possession"], label: "take" },
    { id: "break", class: "verb", tags: ["destruction", "action"], label: "break" },
    { id: "heal", class: "verb", tags: ["life", "virtue"], label: "heal" },
    { id: "harm", class: "verb", tags: ["war", "evil"], label: "harm" },
    { id: "curse", class: "verb", tags: ["magic", "evil"], label: "curse (verb)" },
  ],
};
```

- [ ] **Step 4: Run test, verify it passes**

```bash
cd packages/language
pnpm test src/__tests__/meanings.test.ts
```

Expected: PASS

- [ ] **Step 5: Update index.ts**

In `packages/language/src/index.ts`, add:

```ts
export { coreMeanings } from "./meanings.js";
```

- [ ] **Step 6: Commit**

```bash
git add packages/language/src/meanings.ts packages/language/src/__tests__/meanings.test.ts packages/language/src/index.ts
git commit -m "feat: define ~150 core universal meanings with semantic tags"
```

---

### Task 5: Implement lexicon generation (key-addressed RNG)

**Files:**
- Create: `packages/language/src/lexicon.ts`
- Create: `packages/language/src/__tests__/lexicon.test.ts`
- Modify: `packages/language/src/index.ts`

- [ ] **Step 1: Write failing tests for lexicon**

In `packages/language/src/__tests__/lexicon.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createContext } from "@content-gen/core";
import type { Culture } from "../types.js";
import { buildLexicon } from "../lexicon.js";
import { coreMeanings } from "../meanings.js";
import { archetypes } from "../archetypes.js";

describe("buildLexicon", () => {
  const testCulture: Culture = {
    id: "test.culture",
    glyphs: archetypes.flowing,
    meaningPacks: [coreMeanings],
    templates: {
      given: [
        { kind: "compose", parts: [{ pick: "adjective" }, { pick: "noun" }], sep: " " },
      ],
    },
  };

  it("builds a lexicon for a culture", () => {
    const ctx = createContext({ seed: "test-1" });
    const lex = buildLexicon(testCulture, ctx);
    expect(lex.cultureId).toBe("test.culture");
  });

  it("generates conlang forms for all core meanings", () => {
    const ctx = createContext({ seed: "test-1" });
    const lex = buildLexicon(testCulture, ctx);
    const forms = lex.materialize();
    expect(forms.size).toBe(coreMeanings.meanings.length);
  });

  it("is deterministic (same seed → same forms)", () => {
    const ctx1 = createContext({ seed: "test-1" });
    const lex1 = buildLexicon(testCulture, ctx1);
    const forms1 = lex1.materialize();

    const ctx2 = createContext({ seed: "test-1" });
    const lex2 = buildLexicon(testCulture, ctx2);
    const forms2 = lex2.materialize();

    expect(forms1).toEqual(forms2);
  });

  it("is order-independent (reorder meaning packs, same forms)", () => {
    const ctx = createContext({ seed: "test-1" });
    const lex1 = buildLexicon(testCulture, ctx);

    const reorderedCulture: Culture = {
      ...testCulture,
      meaningPacks: [...testCulture.meaningPacks].reverse(),
    };
    const ctx2 = createContext({ seed: "test-1" });
    const lex2 = buildLexicon(reorderedCulture, ctx2);

    // "stone" should have the same form in both
    expect(lex1.formOf("stone")).toBe(lex2.formOf("stone"));
  });

  it("caches forms", () => {
    const ctx = createContext({ seed: "test-1" });
    const lex = buildLexicon(testCulture, ctx);
    const form1 = lex.formOf("stone");
    const form2 = lex.formOf("stone");
    expect(form1).toBe(form2); // Same reference
  });

  it("byClass filters by word class", () => {
    const ctx = createContext({ seed: "test-1" });
    const lex = buildLexicon(testCulture, ctx);
    const nouns = lex.byClass("noun");
    expect(nouns.length).toBeGreaterThan(0);
    for (const n of nouns) {
      expect(n.class).toBe("noun");
    }
  });

  it("byClass with tag filters by word class and tag", () => {
    const ctx = createContext({ seed: "test-1" });
    const lex = buildLexicon(testCulture, ctx);
    const animals = lex.byClass("noun", "animal");
    expect(animals.length).toBeGreaterThan(0);
    for (const a of animals) {
      expect(a.class).toBe("noun");
      expect(a.tags).toContain("animal");
    }
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
cd packages/language
pnpm test src/__tests__/lexicon.test.ts
```

Expected: FAIL — "buildLexicon not exported"

- [ ] **Step 3: Implement lexicon.ts**

In `packages/language/src/lexicon.ts`:

```ts
import type { Context } from "@content-gen/core";
import type { Culture, Lexicon, WordClass } from "./types.js";
import { generateWord } from "./phonotactics.js";

/**
 * Build a deterministic, key-addressed lexicon for a culture.
 * Each meaning's conlang form is derived from a fork keyed on the meaning ID,
 * ensuring order-independence and patch stability.
 */
export function buildLexicon(culture: Culture, ctx: Context): Lexicon {
  const cultureCtx = ctx.child(`lang:${culture.id}`);
  const cache = new Map<string, string>();

  // Build a flat map of all meanings from all packs
  const allMeanings = new Map<string, { class: WordClass; tags: readonly string[]; label?: string }>();
  for (const pack of culture.meaningPacks) {
    for (const meaning of pack.meanings) {
      allMeanings.set(meaning.id, { class: meaning.class, tags: meaning.tags, label: meaning.label });
    }
  }

  return {
    cultureId: culture.id,

    formOf(meaningId: string): string {
      let form = cache.get(meaningId);
      if (form !== undefined) return form;

      // Key-addressed fork: order-independent
      const wordCtx = cultureCtx.child(`word:${meaningId}`);
      form = generateWord(culture.glyphs, wordCtx);
      cache.set(meaningId, form);
      return form;
    },

    byClass(c: WordClass, tag?: string) {
      const result = [];
      for (const pack of culture.meaningPacks) {
        for (const meaning of pack.meanings) {
          if (meaning.class !== c) continue;
          if (tag && !meaning.tags.includes(tag)) continue;
          result.push(meaning);
        }
      }
      return result;
    },

    materialize() {
      const result = new Map<string, string>();
      for (const meaningId of allMeanings.keys()) {
        result.set(meaningId, this.formOf(meaningId));
      }
      return result;
    },
  };
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
cd packages/language
pnpm test src/__tests__/lexicon.test.ts
```

Expected: PASS

- [ ] **Step 5: Update index.ts**

In `packages/language/src/index.ts`, add:

```ts
export { buildLexicon } from "./lexicon.js";
```

- [ ] **Step 6: Commit**

```bash
git add packages/language/src/lexicon.ts packages/language/src/__tests__/lexicon.test.ts packages/language/src/index.ts
git commit -m "feat: implement deterministic, key-addressed lexicon generation"
```

---

### Task 6: Implement archetypes (phonotactic presets)

**Files:**
- Create: `packages/language/src/archetypes.ts`
- Modify: `packages/language/src/index.ts`

- [ ] **Step 1: Implement archetypes.ts**

In `packages/language/src/archetypes.ts`:

```ts
import type { GlyphSystem } from "./types.js";

/**
 * Reusable phonotactic presets for culture definitions.
 * Cultures extend one of these and override specific fields.
 */
export const archetypes = {
  flowing: {
    classes: {
      C: ["l", "r", "n", "m", "w", "y"],
      V: ["a", "e", "i", "o", "u"],
    },
    syllables: [
      ["V", 1],
      ["C V", 3],
      ["V C", 2],
      ["C V V", 2],
      ["V V C", 1],
    ],
    wordShapes: [["1", 1], ["2", 3], ["3", 2], ["1-2", 1]],
  } as Partial<GlyphSystem>,

  guttural: {
    classes: {
      C: ["k", "g", "d", "t", "p", "b", "kh", "gh"],
      V: ["a", "o", "u"],
    },
    syllables: [
      ["C V C", 3],
      ["C V", 1],
      ["C C V C", 2],
    ],
    wordShapes: [["1", 2], ["2", 2], ["1-2", 1]],
  } as Partial<GlyphSystem>,

  clipped: {
    classes: {
      C: ["k", "t", "p", "s", "sh", "ch"],
      V: ["a", "i"],
    },
    syllables: [["C V C", 2], ["C V", 1]],
    wordShapes: [["1", 3], ["2", 1]],
  } as Partial<GlyphSystem>,

  sibilant: {
    classes: {
      C: ["s", "sh", "z", "zh", "ts", "ch", "j"],
      V: ["a", "e", "i", "o", "u"],
    },
    syllables: [
      ["C V", 2],
      ["C V C", 1],
      ["C V V", 2],
      ["C C V", 1],
    ],
    wordShapes: [["1", 1], ["2", 2], ["1-2", 1]],
  } as Partial<GlyphSystem>,

  resonant: {
    classes: {
      C: ["l", "r", "m", "n", "ng"],
      V: ["a", "e", "i", "o", "u"],
    },
    syllables: [
      ["C V C V", 2],
      ["C V C", 1],
      ["C V", 1],
    ],
    wordShapes: [["1", 1], ["2", 3]],
  } as Partial<GlyphSystem>,
} satisfies Record<string, Partial<GlyphSystem>>;
```

- [ ] **Step 2: Update index.ts**

In `packages/language/src/index.ts`, add:

```ts
export { archetypes } from "./archetypes.js";
```

- [ ] **Step 3: Commit**

```bash
git add packages/language/src/archetypes.ts packages/language/src/index.ts
git commit -m "feat: define phonotactic archetypes (flowing, guttural, clipped, sibilant, resonant)"
```

---

### Task 7: Implement template engine (morpheme selection + composition)

**Files:**
- Create: `packages/language/src/templates.ts`
- Create: `packages/language/src/__tests__/templates.test.ts`
- Modify: `packages/language/src/index.ts`

- [ ] **Step 1: Write failing test for template engine**

In `packages/language/src/__tests__/templates.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createContext } from "@content-gen/core";
import type { Culture } from "../types.js";
import { generateName } from "../templates.js";
import { coreMeanings } from "../meanings.js";
import { archetypes } from "../archetypes.js";

describe("generateName", () => {
  const testCulture: Culture = {
    id: "test.dwarvish",
    glyphs: {
      ...archetypes.guttural,
      joiner: "",
    },
    meaningPacks: [coreMeanings],
    templates: {
      given: [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "strength", capitalize: true },
            { pick: "noun", tag: "industry" },
          ],
          sep: "",
        },
      ],
      surname: [
        {
          kind: "compose",
          parts: [{ pick: "noun", tag: "earth" }, { pick: "noun", tag: "nature" }],
          sep: "",
        },
      ],
    },
  };

  it("generates a name with form and translation", () => {
    const ctx = createContext({ seed: "test-1" });
    const name = generateName(testCulture, "given", ctx);
    expect(name.form).toBeTruthy();
    expect(name.translation).toBeTruthy();
    expect(name.language).toBe("test.dwarvish");
    expect(typeof name.toString()).toBe("string");
  });

  it("toString() returns the form", () => {
    const ctx = createContext({ seed: "test-1" });
    const name = generateName(testCulture, "given", ctx);
    expect(String(name)).toBe(name.form);
  });

  it("is deterministic", () => {
    const ctx1 = createContext({ seed: "test-1" });
    const name1 = generateName(testCulture, "given", ctx1);

    const ctx2 = createContext({ seed: "test-1" });
    const name2 = generateName(testCulture, "given", ctx2);

    expect(name1.form).toBe(name2.form);
    expect(name1.translation).toBe(name2.translation);
  });

  it("composes multiple meanings", () => {
    const ctx = createContext({ seed: "test-1" });
    const name = generateName(testCulture, "surname", ctx);
    // Should have at least 2 morphemes (2 nouns)
    expect(name.parts?.length || 0).toBeGreaterThanOrEqual(2);
  });

  it("respects capitalization", () => {
    const ctx = createContext({ seed: "test-1" });
    const name = generateName(testCulture, "given", ctx);
    // First character should be uppercase (from capitalize: true on adjective)
    expect(name.form[0]!.toUpperCase()).toBe(name.form[0]);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
cd packages/language
pnpm test src/__tests__/templates.test.ts
```

Expected: FAIL — "generateName not exported"

- [ ] **Step 3: Implement templates.ts**

In `packages/language/src/templates.ts`:

```ts
import type { Context } from "@content-gen/core";
import type { Culture, NameTemplate, TranslatedName, TemplatePart, WordClass } from "./types.js";
import { buildLexicon } from "./lexicon.js";

/**
 * Generate a name from a template for a given culture.
 * Selects meanings by class/tag, composes them, and returns form + translation.
 */
export function generateName(culture: Culture, nameKind: keyof Culture["templates"], ctx: Context): TranslatedName {
  const templates = culture.templates[nameKind];
  if (!templates || templates.length === 0) {
    throw new Error(`No templates for ${nameKind} in culture ${culture.id}`);
  }

  // Pick a template
  const template = pickWeighted(templates, ctx.child("template"));

  // Build lexicon
  const lexicon = buildLexicon(culture, ctx.child("lexicon"));

  // Render name from template
  const rendered = renderTemplate(template, culture, lexicon, ctx.child("render"));

  const translatedName: TranslatedName = {
    form: rendered.form,
    translation: rendered.translation,
    language: culture.id,
    parts: rendered.parts,
    toString() {
      return this.form;
    },
  };

  return translatedName;
}

function renderTemplate(
  template: NameTemplate,
  culture: Culture,
  lexicon: ReturnType<typeof buildLexicon>,
  ctx: Context,
): { form: string; translation: string; parts: Array<{ form: string; meaning: string }> } {
  if (template.kind === "literal") {
    return {
      form: template.form,
      translation: template.translation,
      parts: [{ form: template.form, meaning: template.translation }],
    };
  }

  // kind === "compose"
  const parts: Array<{ form: string; meaning: string }> = [];
  const forms: string[] = [];
  const translations: string[] = [];

  for (let i = 0; i < template.parts.length; i++) {
    const part = template.parts[i]!;
    const partCtx = ctx.child(`part:${i}`);

    if ("literal" in part && part.literal !== undefined) {
      forms.push(part.literal);
      translations.push(part.translation ?? "");
      parts.push({ form: part.literal, meaning: part.translation ?? "" });
    } else if ("pick" in part) {
      // Pick a meaning matching class + tag
      const candidates = lexicon.byClass(part.pick, part.tag);
      if (candidates.length === 0) {
        throw new Error(`No meanings for class ${part.pick} tag ${part.tag} in ${culture.id}`);
      }
      const meaning = candidates[partCtx.rng.nextInt(0, candidates.length - 1)]!;
      const form = lexicon.formOf(meaning.id);
      const morpheme = part.capitalize ? capitalize(form) : form;
      forms.push(morpheme);
      translations.push(meaning.label ?? meaning.id);
      parts.push({ form: morpheme, meaning: meaning.label ?? meaning.id });
    }
  }

  const form = forms.join(template.sep ?? "");
  const translation = translations.join(template.sep ?? "-");

  return { form, translation, parts };
}

function capitalize(s: string): string {
  if (s.length === 0) return s;
  return s[0]!.toUpperCase() + s.slice(1);
}

function pickWeighted<T>(items: Array<[T, number]>, ctx: Context): T {
  const totalWeight = items.reduce((sum, [, w]) => sum + w, 0);
  let roll = ctx.rng.nextInt(0, totalWeight - 1);
  for (const [item, weight] of items) {
    if (roll < weight) return item;
    roll -= weight;
  }
  return items[items.length - 1]![0];
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
cd packages/language
pnpm test src/__tests__/templates.test.ts
```

Expected: PASS

- [ ] **Step 5: Update index.ts**

In `packages/language/src/index.ts`, add:

```ts
export { generateName } from "./templates.js";
```

- [ ] **Step 6: Commit**

```bash
git add packages/language/src/templates.ts packages/language/src/__tests__/templates.test.ts packages/language/src/index.ts
git commit -m "feat: implement template engine with morpheme selection and composition"
```

---

### Task 8: Build fantasy meanings + culture presets

**Files:**
- Create: `packages/fantasy/src/language/meanings.ts`
- Create: `packages/fantasy/src/language/cultures.ts`
- Create: `packages/fantasy/src/language/index.ts`
- Modify: `packages/fantasy/src/index.ts`

- [ ] **Step 1: Create fantasy meanings.ts**

In `packages/fantasy/src/language/meanings.ts`:

```ts
import type { MeaningPack } from "@content-gen/language";

export const fantasyIndustrial: MeaningPack = {
  id: "fantasy.industrial",
  version: "1.0.0",
  meanings: [
    { id: "rune", class: "noun", tags: ["magic", "power"], label: "rune" },
    { id: "oath", class: "noun", tags: ["contract", "honor"], label: "oath" },
    { id: "anvil", class: "noun", tags: ["industry", "craft"], label: "anvil" },
    { id: "hex", class: "noun", tags: ["magic", "curse"], label: "hex" },
    { id: "beast", class: "noun", tags: ["animal", "war"], label: "beast" },
    { id: "forge", class: "verb", tags: ["industry", "creation"], label: "forge" },
    { id: "vow", class: "noun", tags: ["contract", "honor"], label: "vow" },
    { id: "crown", class: "noun", tags: ["power", "rule"], label: "crown" },
    { id: "scepter", class: "noun", tags: ["power", "rule"], label: "scepter" },
    { id: "throne", class: "noun", tags: ["power", "rule"], label: "throne" },
    { id: "citadel", class: "noun", tags: ["structure", "power"], label: "citadel" },
    { id: "fortress", class: "noun", tags: ["structure", "strength"], label: "fortress" },
    { id: "dungeon", class: "noun", tags: ["structure", "dark"], label: "dungeon" },
    { id: "crypt", class: "noun", tags: ["structure", "death"], label: "crypt" },
    { id: "tower", class: "noun", tags: ["structure", "height"], label: "tower" },
    { id: "grove", class: "noun", tags: ["nature", "magic"], label: "grove" },
    { id: "ruin", class: "noun", tags: ["structure", "old"], label: "ruin" },
    { id: "potion", class: "noun", tags: ["magic", "craft"], label: "potion" },
    { id: "spell", class: "noun", tags: ["magic", "power"], label: "spell" },
    { id: "curse", class: "noun", tags: ["magic", "evil"], label: "curse" },
    { id: "bless", class: "verb", tags: ["magic", "good"], label: "bless" },
    { id: "witch", class: "noun", tags: ["magic", "woman"], label: "witch" },
    { id: "sorcerer", class: "noun", tags: ["magic", "man"], label: "sorcerer" },
    { id: "priestess", class: "noun", tags: ["divine", "woman"], label: "priestess" },
    { id: "priest", class: "noun", tags: ["divine", "man"], label: "priest" },
    { id: "knight", class: "noun", tags: ["war", "honor"], label: "knight" },
    { id: "squire", class: "noun", tags: ["war", "youth"], label: "squire" },
    { id: "merchant", class: "noun", tags: ["society", "trade"], label: "merchant" },
    { id: "peasant", class: "noun", tags: ["society", "low"], label: "peasant" },
    { id: "guard", class: "noun", tags: ["war", "protection"], label: "guard" },
    { id: "archer", class: "noun", tags: ["war", "skill"], label: "archer" },
    { id: "warrior", class: "noun", tags: ["war", "strength"], label: "warrior" },
    { id: "champion", class: "noun", tags: ["war", "honor"], label: "champion" },
    { id: "elf", class: "noun", tags: ["race", "nature"], label: "elf" },
    { id: "dwarf", class: "noun", tags: ["race", "earth"], label: "dwarf" },
    { id: "human", class: "noun", tags: ["race", "versatile"], label: "human" },
    { id: "orc", class: "noun", tags: ["race", "war"], label: "orc" },
    { id: "halfling", class: "noun", tags: ["race", "small"], label: "halfling" },
    { id: "dragon", class: "noun", tags: ["race", "power"], label: "dragon" },
    { id: "goblin", class: "noun", tags: ["race", "evil"], label: "goblin" },
    { id: "troll", class: "noun", tags: ["race", "strength"], label: "troll" },
    { id: "necromancer", class: "noun", tags: ["magic", "death", "evil"], label: "necromancer" },
    { id: "dragon", class: "noun", tags: ["beast", "power"], label: "dragon" },
    { id: "basilisk", class: "noun", tags: ["beast", "poison"], label: "basilisk" },
    { id: "phoenix", class: "noun", tags: ["beast", "fire"], label: "phoenix" },
    { id: "griffon", class: "noun", tags: ["beast", "sky"], label: "griffon" },
    { id: "unicorn", class: "noun", tags: ["beast", "magic"], label: "unicorn" },
    { id: "minion", class: "noun", tags: ["war", "evil"], label: "minion" },
    { id: "servant", class: "noun", tags: ["society", "low"], label: "servant" },
    { id: "mage", class: "noun", tags: ["magic", "power"], label: "mage" },
    { id: "sage", class: "noun", tags: ["knowledge", "old"], label: "sage" },
    { id: "oracle", class: "noun", tags: ["magic", "knowledge"], label: "oracle" },
    { id: "sigil", class: "noun", tags: ["magic", "symbol"], label: "sigil" },
    { id: "amulet", class: "noun", tags: ["magic", "protection"], label: "amulet" },
    { id: "talisman", class: "noun", tags: ["magic", "luck"], label: "talisman" },
    { id: "staff", class: "noun", tags: ["magic", "weapon"], label: "staff" },
    { id: "wand", class: "noun", tags: ["magic", "power"], label: "wand" },
    { id: "chalice", class: "noun", tags: ["magic", "artifact"], label: "chalice" },
    { id: "tome", class: "noun", tags: ["magic", "knowledge"], label: "tome" },
    { id: "scroll", class: "noun", tags: ["magic", "spell"], label: "scroll" },
    { id: "grimoire", class: "noun", tags: ["magic", "knowledge"], label: "grimoire" },
    { id: "contract", class: "noun", tags: ["magic", "binding"], label: "contract" },
    { id: "pact", class: "noun", tags: ["magic", "binding"], label: "pact" },
    { id: "quest", class: "noun", tags: ["adventure", "honor"], label: "quest" },
    { id: "treasure", class: "noun", tags: ["wealth", "power"], label: "treasure" },
    { id: "hoard", class: "noun", tags: ["wealth", "greed"], label: "hoard" },
    { id: "artifact", class: "noun", tags: ["magic", "power"], label: "artifact" },
    { id: "relic", class: "noun", tags: ["magic", "old"], label: "relic" },
    { id: "cursed", class: "adjective", tags: ["magic", "evil"], label: "cursed" },
    { id: "blessed", class: "adjective", tags: ["magic", "good"], label: "blessed" },
    { id: "enchanted", class: "adjective", tags: ["magic", "power"], label: "enchanted" },
    { id: "ancient", class: "adjective", tags: ["time", "old"], label: "ancient" },
    { id: "mystical", class: "adjective", tags: ["magic", "mystery"], label: "mystical" },
    { id: "ethereal", class: "adjective", tags: ["magic", "light"], label: "ethereal" },
    { id: "undead", class: "adjective", tags: ["death", "evil"], label: "undead" },
    { id: "immortal", class: "adjective", tags: ["magic", "eternal"], label: "immortal" },
    { id: "legendary", class: "adjective", tags: ["power", "fame"], label: "legendary" },
    { id: "mythical", class: "adjective", tags: ["magic", "legend"], label: "mythical" },
    { id: "noble", class: "adjective", tags: ["society", "honor"], label: "noble" },
    { id: "valiant", class: "adjective", tags: ["war", "honor"], label: "valiant" },
    { id: "sinister", class: "adjective", tags: ["evil", "dark"], label: "sinister" },
    { id: "infernal", class: "adjective", tags: ["evil", "fire"], label: "infernal" },
    { id: "celestial", class: "adjective", tags: ["good", "light"], label: "celestial" },
    { id: "divine", class: "adjective", tags: ["good", "holy"], label: "divine" },
    { id: "demonic", class: "adjective", tags: ["evil", "demon"], label: "demonic" },
    { id: "spectral", class: "adjective", tags: ["death", "ghost"], label: "spectral" },
    { id: "phantom", class: "noun", tags: ["death", "ghost"], label: "phantom" },
    { id: "spirit", class: "noun", tags: ["death", "magic"], label: "spirit" },
    { id: "ghost", class: "noun", tags: ["death", "ghost"], label: "ghost" },
    { id: "wraith", class: "noun", tags: ["death", "evil"], label: "wraith" },
    { id: "spectre", class: "noun", tags: ["death", "ghost"], label: "spectre" },
    { id: "lich", class: "noun", tags: ["death", "magic", "evil"], label: "lich" },
    { id: "vampire", class: "noun", tags: ["death", "evil"], label: "vampire" },
    { id: "werewolf", class: "noun", tags: ["beast", "curse"], label: "werewolf" },
    { id: "golem", class: "noun", tags: ["magic", "construct"], label: "golem" },
    { id: "elemental", class: "noun", tags: ["magic", "nature"], label: "elemental" },
  ],
};

export const fantasyMeaning: MeaningPack = {
  id: "fantasy.meaning",
  version: "1.0.0",
  meanings: [
    { id: "verdant", class: "adjective", tags: ["nature", "green", "life"], label: "verdant" },
    { id: "arcane", class: "adjective", tags: ["magic", "knowledge"], label: "arcane" },
    { id: "forbidden", class: "adjective", tags: ["magic", "taboo"], label: "forbidden" },
    { id: "dark", class: "adjective", tags: ["evil", "shadow"], label: "dark" },
    { id: "bright", class: "adjective", tags: ["good", "light"], label: "bright" },
    { id: "eternal", class: "adjective", tags: ["time", "infinite"], label: "eternal" },
    { id: "fallen", class: "adjective", tags: ["evil", "defeat"], label: "fallen" },
    { id: "risen", class: "adjective", tags: ["good", "victory"], label: "risen" },
    { id: "lost", class: "adjective", tags: ["mystery", "missing"], label: "lost" },
    { id: "hidden", class: "adjective", tags: ["mystery", "secret"], label: "hidden" },
  ],
};
```

- [ ] **Step 2: Create fantasy cultures.ts**

In `packages/fantasy/src/language/cultures.ts`:

```ts
import type { Culture } from "@content-gen/language";
import { archetypes, coreMeanings } from "@content-gen/language";
import { fantasyIndustrial, fantasyMeaning } from "./meanings.js";

export const dwarvish: Culture = {
  id: "fantasy.dwarvish",
  glyphs: {
    ...archetypes.guttural,
    joiner: "",
  },
  meaningPacks: [coreMeanings, fantasyIndustrial, fantasyMeaning],
  templates: {
    given: [
      {
        kind: "compose",
        parts: [
          { pick: "adjective", tag: "strength", capitalize: true },
          { pick: "noun", tag: "industry" },
        ],
        sep: "",
      },
    ],
    surname: [
      {
        kind: "compose",
        parts: [
          { pick: "noun", tag: "earth", capitalize: true },
          { pick: "noun", tag: "industry" },
        ],
        sep: "",
      },
    ],
    settlement: [
      {
        kind: "compose",
        parts: [
          { pick: "noun", tag: "weather" },
          { pick: "noun", tag: "fortification" },
        ],
        sep: "",
      },
    ],
  },
};

export const elvish: Culture = {
  id: "fantasy.elvish",
  glyphs: {
    ...archetypes.flowing,
    joiner: "",
  },
  meaningPacks: [coreMeanings, fantasyIndustrial, fantasyMeaning],
  templates: {
    given: [
      {
        kind: "compose",
        parts: [
          { pick: "adjective", tag: "nature", capitalize: true },
          { pick: "noun", tag: "nature" },
        ],
        sep: "",
      },
    ],
    surname: [
      {
        kind: "compose",
        parts: [
          { pick: "noun", tag: "nature" },
          { pick: "noun", tag: "celestial" },
        ],
        sep: "",
      },
    ],
    settlement: [
      {
        kind: "compose",
        parts: [
          { pick: "noun", tag: "nature", capitalize: true },
          { pick: "noun", tag: "nature" },
        ],
        sep: "",
      },
    ],
  },
};

export const orcish: Culture = {
  id: "fantasy.orcish",
  glyphs: {
    ...archetypes.guttural,
    joiner: "",
  },
  meaningPacks: [coreMeanings, fantasyIndustrial, fantasyMeaning],
  templates: {
    given: [
      {
        kind: "compose",
        parts: [
          { pick: "adjective", tag: "war", capitalize: true },
          { pick: "noun", tag: "war" },
        ],
        sep: "",
      },
    ],
    surname: [
      {
        kind: "compose",
        parts: [
          { pick: "noun", tag: "blood" },
          { pick: "noun", tag: "strength" },
        ],
        sep: "",
      },
    ],
  },
};

export const halfling: Culture = {
  id: "fantasy.halfling",
  glyphs: {
    ...archetypes.clipped,
    joiner: "",
  },
  meaningPacks: [coreMeanings, fantasyIndustrial, fantasyMeaning],
  templates: {
    given: [
      {
        kind: "compose",
        parts: [
          { pick: "noun", tag: "nature", capitalize: true },
          { pick: "noun", tag: "small" },
        ],
        sep: "",
      },
    ],
    surname: [
      {
        kind: "compose",
        parts: [{ pick: "noun", tag: "nature", capitalize: true }, { pick: "noun", tag: "society" }],
        sep: "",
      },
    ],
  },
};

export const draconic: Culture = {
  id: "fantasy.draconic",
  glyphs: {
    ...archetypes.sibilant,
    joiner: "",
  },
  meaningPacks: [coreMeanings, fantasyIndustrial, fantasyMeaning],
  templates: {
    given: [
      {
        kind: "compose",
        parts: [
          { pick: "adjective", tag: "power", capitalize: true },
          { pick: "noun", tag: "fire" },
        ],
        sep: "",
      },
    ],
    surname: [
      {
        kind: "compose",
        parts: [
          { pick: "noun", tag: "power" },
          { pick: "adjective", tag: "eternal" },
        ],
        sep: "",
      },
    ],
  },
};
```

- [ ] **Step 3: Create language/index.ts**

In `packages/fantasy/src/language/index.ts`:

```ts
export { fantasyIndustrial, fantasyMeaning } from "./meanings.js";
export { dwarvish, elvish, orcish, halfling, draconic } from "./cultures.js";
```

- [ ] **Step 4: Update fantasy index.ts**

In `packages/fantasy/src/index.ts`, add at the end:

```ts
export * as language from "./language/index.js";
```

- [ ] **Step 5: Commit**

```bash
git add packages/fantasy/src/language/
git commit -m "feat: add fantasy meanings and culture presets (dwarvish, elvish, orcish, halfling, draconic)"
```

---

### Task 9: Create sci-fi meanings + culture presets

**Files:**
- Create: `packages/scifi/src/language/meanings.ts`
- Create: `packages/scifi/src/language/cultures.ts`
- Create: `packages/scifi/src/language/index.ts`
- Modify: `packages/scifi/src/index.ts`

- [ ] **Step 1: Create sci-fi meanings.ts**

In `packages/scifi/src/language/meanings.ts`:

```ts
import type { MeaningPack } from "@content-gen/language";

export const scifiMeanings: MeaningPack = {
  id: "scifi.tech",
  version: "1.0.0",
  meanings: [
    { id: "void", class: "noun", tags: ["space", "emptiness"], label: "void" },
    { id: "plasma", class: "noun", tags: ["energy", "state"], label: "plasma" },
    { id: "drive", class: "noun", tags: ["technology", "propulsion"], label: "drive" },
    { id: "lattice", class: "noun", tags: ["structure", "technology"], label: "lattice" },
    { id: "signal", class: "noun", tags: ["communication", "technology"], label: "signal" },
    { id: "hive", class: "noun", tags: ["structure", "society"], label: "hive" },
    { id: "molt", class: "verb", tags: ["biology", "change"], label: "molt" },
    { id: "node", class: "noun", tags: ["technology", "network"], label: "node" },
    { id: "relay", class: "noun", tags: ["communication", "technology"], label: "relay" },
    { id: "sync", class: "verb", tags: ["technology", "connection"], label: "sync" },
    { id: "quantum", class: "adjective", tags: ["technology", "advanced"], label: "quantum" },
    { id: "neural", class: "adjective", tags: ["biology", "mind"], label: "neural" },
    { id: "photon", class: "noun", tags: ["energy", "light"], label: "photon" },
    { id: "electron", class: "noun", tags: ["energy", "particle"], label: "electron" },
    { id: "atom", class: "noun", tags: ["science", "small"], label: "atom" },
    { id: "molecule", class: "noun", tags: ["science", "chemistry"], label: "molecule" },
    { id: "reactor", class: "noun", tags: ["technology", "power"], label: "reactor" },
    { id: "chamber", class: "noun", tags: ["structure", "enclosed"], label: "chamber" },
    { id: "vault", class: "noun", tags: ["structure", "security"], label: "vault" },
    { id: "portal", class: "noun", tags: ["technology", "passage"], label: "portal" },
    { id: "gateway", class: "noun", tags: ["structure", "passage"], label: "gateway" },
    { id: "station", class: "noun", tags: ["structure", "outpost"], label: "station" },
    { id: "colony", class: "noun", tags: ["society", "outpost"], label: "colony" },
    { id: "vessel", class: "noun", tags: ["technology", "transport"], label: "vessel" },
    { id: "shuttle", class: "noun", tags: ["technology", "small"], label: "shuttle" },
    { id: "probe", class: "noun", tags: ["technology", "exploration"], label: "probe" },
    { id: "sentinel", class: "noun", tags: ["technology", "protection"], label: "sentinel" },
    { id: "drone", class: "noun", tags: ["technology", "autonomous"], label: "drone" },
    { id: "android", class: "noun", tags: ["life", "artificial"], label: "android" },
    { id: "cyborg", class: "noun", tags: ["life", "hybrid"], label: "cyborg" },
    { id: "synthetic", class: "adjective", tags: ["artificial", "technology"], label: "synthetic" },
    { id: "biological", class: "adjective", tags: ["life", "organic"], label: "biological" },
    { id: "organic", class: "adjective", tags: ["life", "natural"], label: "organic" },
    { id: "digital", class: "adjective", tags: ["technology", "data"], label: "digital" },
    { id: "analog", class: "adjective", tags: ["technology", "mechanical"], label: "analog" },
    { id: "hybrid", class: "adjective", tags: ["combined", "mixed"], label: "hybrid" },
    { id: "protocol", class: "noun", tags: ["rules", "communication"], label: "protocol" },
    { id: "algorithm", class: "noun", tags: ["technology", "logic"], label: "algorithm" },
    { id: "code", class: "noun", tags: ["technology", "data"], label: "code" },
    { id: "cipher", class: "noun", tags: ["security", "encryption"], label: "cipher" },
    { id: "firewall", class: "noun", tags: ["security", "protection"], label: "firewall" },
    { id: "virus", class: "noun", tags: ["danger", "infection"], label: "virus" },
    { id: "mutation", class: "noun", tags: ["change", "biology"], label: "mutation" },
    { id: "evolution", class: "noun", tags: ["change", "biology"], label: "evolution" },
    { id: "adaptation", class: "noun", tags: ["change", "survival"], label: "adaptation" },
    { id: "ascension", class: "noun", tags: ["advancement", "evolution"], label: "ascension" },
    { id: "transcendence", class: "noun", tags: ["advancement", "spiritual"], label: "transcendence" },
    { id: "consciousness", class: "noun", tags: ["mind", "awareness"], label: "consciousness" },
    { id: "entity", class: "noun", tags: ["life", "existence"], label: "entity" },
    { id: "being", class: "noun", tags: ["life", "existence"], label: "being" },
    { id: "intelligence", class: "noun", tags: ["mind", "knowledge"], label: "intelligence" },
    { id: "cognition", class: "noun", tags: ["mind", "thought"], label: "cognition" },
    { id: "network", class: "noun", tags: ["technology", "connection"], label: "network" },
    { id: "matrix", class: "noun", tags: ["technology", "data"], label: "matrix" },
    { id: "nexus", class: "noun", tags: ["connection", "center"], label: "nexus" },
    { id: "hub", class: "noun", tags: ["connection", "center"], label: "hub" },
    { id: "cluster", class: "noun", tags: ["group", "organization"], label: "cluster" },
    { id: "collective", class: "noun", tags: ["group", "unity"], label: "collective" },
    { id: "swarm", class: "noun", tags: ["group", "insect"], label: "swarm" },
    { id: "formation", class: "noun", tags: ["organization", "structure"], label: "formation" },
    { id: "construct", class: "noun", tags: ["creation", "artificial"], label: "construct" },
    { id: "framework", class: "noun", tags: ["structure", "foundation"], label: "framework" },
    { id: "architecture", class: "noun", tags: ["structure", "design"], label: "architecture" },
    { id: "system", class: "noun", tags: ["organization", "order"], label: "system" },
    { id: "nexal", class: "adjective", tags: ["connection", "linked"], label: "nexal" },
    { id: "sentient", class: "adjective", tags: ["awareness", "life"], label: "sentient" },
    { id: "aware", class: "adjective", tags: ["mind", "consciousness"], label: "aware" },
    { id: "evolved", class: "adjective", tags: ["advanced", "changed"], label: "evolved" },
    { id: "primal", class: "adjective", tags: ["basic", "instinctive"], label: "primal" },
    { id: "transcendent", class: "adjective", tags: ["spiritual", "advanced"], label: "transcendent" },
    { id: "parasitic", class: "adjective", tags: ["predatory", "harmful"], label: "parasitic" },
    { id: "symbiotic", class: "adjective", tags: ["mutual", "beneficial"], label: "symbiotic" },
    { id: "feral", class: "adjective", tags: ["wild", "untamed"], label: "feral" },
    { id: "tamed", class: "adjective", tags: ["controlled", "trained"], label: "tamed" },
    { id: "corrupted", class: "adjective", tags: ["damaged", "evil"], label: "corrupted" },
    { id: "pure", class: "adjective", tags: ["clean", "uncorrupted"], label: "pure" },
    { id: "stellar", class: "adjective", tags: ["space", "excellent"], label: "stellar" },
    { id: "lunar", class: "adjective", tags: ["space", "moon"], label: "lunar" },
    { id: "cosmic", class: "adjective", tags: ["space", "universal"], label: "cosmic" },
    { id: "terrestrial", class: "adjective", tags: ["planet", "ground"], label: "terrestrial" },
    { id: "aquatic", class: "adjective", tags: ["water", "life"], label: "aquatic" },
    { id: "aerial", class: "adjective", tags: ["air", "sky"], label: "aerial" },
  ],
};
```

- [ ] **Step 2: Create sci-fi cultures.ts**

In `packages/scifi/src/language/cultures.ts`:

```ts
import type { Culture } from "@content-gen/language";
import { archetypes, coreMeanings } from "@content-gen/language";
import { scifiMeanings } from "./meanings.js";

export const humanoid: Culture = {
  id: "scifi.humanoid",
  glyphs: {
    ...archetypes.resonant,
    joiner: "",
  },
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      {
        kind: "compose",
        parts: [
          { pick: "adjective", tag: "technology", capitalize: true },
          { pick: "noun", tag: "propulsion" },
        ],
        sep: "",
      },
    ],
  },
};

export const insectoid: Culture = {
  id: "scifi.insectoid",
  glyphs: {
    ...archetypes.guttural,
    joiner: "",
  },
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      {
        kind: "compose",
        parts: [
          { pick: "noun", tag: "insect", capitalize: true },
          { pick: "noun", tag: "communication" },
        ],
        sep: "",
      },
    ],
  },
};

export const aquatic: Culture = {
  id: "scifi.aquatic",
  glyphs: {
    ...archetypes.flowing,
    joiner: "",
  },
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      {
        kind: "compose",
        parts: [
          { pick: "noun", tag: "water", capitalize: true },
          { pick: "noun", tag: "life" },
        ],
        sep: "",
      },
    ],
  },
};

export const synth: Culture = {
  id: "scifi.synth",
  glyphs: {
    ...archetypes.clipped,
    joiner: "-",
  },
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      {
        kind: "compose",
        parts: [
          { pick: "noun", tag: "technology", capitalize: true },
          { literal: "-", translation: "" },
          { pick: "noun", tag: "number" },
        ],
        sep: "",
      },
    ],
  },
};
```

- [ ] **Step 3: Create language/index.ts**

In `packages/scifi/src/language/index.ts`:

```ts
export { scifiMeanings } from "./meanings.js";
export { humanoid, insectoid, aquatic, synth } from "./cultures.js";
```

- [ ] **Step 4: Update scifi index.ts**

In `packages/scifi/src/index.ts`, add at the end:

```ts
export * as language from "./language/index.js";
```

- [ ] **Step 5: Commit**

```bash
git add packages/scifi/src/language/
git commit -m "feat: add scifi meanings and culture presets (humanoid, insectoid, aquatic, synth)"
```

---

### Task 10: Integration — Update fantasy NPC/place names

**Files:**
- Modify: `packages/fantasy/src/npc.ts` (or equivalent where fullName/givenName/surname are defined)
- Modify: `packages/fantasy/src/places.ts` (or equivalent)
- Modify: `packages/fantasy/src/index.ts`

**Note:** You'll need to locate where names are currently generated. This task assumes a structure similar to what you showed in the initial code review. Adjust file paths as needed.

- [ ] **Step 1: Verify current name generation structure**

```bash
cd packages/fantasy && grep -r "fullName\|givenName\|surname" src/
```

Expected: Find where these are defined (likely in `src/index.ts` or a separate file)

- [ ] **Step 2: Create language-backed name generator wrapper**

Add to `packages/fantasy/src/npc.ts` (or new file if needed):

```ts
import type { Context, Generator } from "@content-gen/core";
import { generateName } from "@content-gen/language";
import type { TranslatedName } from "@content-gen/language";
import {
  dwarvish,
  elvish,
  orcish,
  halfling,
  draconic,
  type Race,
} from "./language/cultures.js";

/** Map race to culture for language generation. */
function raceToCulture(r: Race) {
  const map = {
    human: { given: dwarvish, surname: dwarvish },     // Placeholder: use dwarvish for humans
    elf: { given: elvish, surname: elvish },
    dwarf: { given: dwarvish, surname: dwarvish },
    halfling: { given: halfling, surname: halfling },
    orc: { given: orcish, surname: orcish },
    dragonborn: { given: draconic, surname: draconic },
  };
  return map[r];
}

/** Language-backed given name generator. */
export const givenName: Generator<TranslatedName> = {
  id: "fantasy.givenName",
  generate(ctx: Context) {
    const r = race.generate(ctx.child("race"));
    const cultures = raceToCulture(r);
    return generateName(cultures.given, "given", ctx.child("name"));
  },
};

/** Language-backed surname generator. */
export const surname: Generator<TranslatedName> = {
  id: "fantasy.surname",
  generate(ctx: Context) {
    const r = race.generate(ctx.child("race"));
    const cultures = raceToCulture(r);
    return generateName(cultures.surname, "surname", ctx.child("name"));
  },
};

/** Language-backed full name. */
export interface FullName {
  given: TranslatedName;
  surname: TranslatedName;
  full: TranslatedName;
  race: Race;
  sex: Sex;
}

export const fullName: Generator<FullName> = {
  id: "fantasy.fullName",
  generate(ctx: Context) {
    const r = race.generate(ctx.child("race"));
    const s = sex.generate(ctx.child("sex"));
    const givenTN = givenName.generate(ctx.child("given"));
    const surnameTN = surname.generate(ctx.child("surname"));
    const fullForm = `${givenTN.form} ${surnameTN.form}`;
    const fullTranslation = `${givenTN.translation} ${surnameTN.translation}`;
    return {
      given: givenTN,
      surname: surnameTN,
      full: {
        form: fullForm,
        translation: fullTranslation,
        language: givenTN.language,
        toString() { return this.form; },
      },
      race: r,
      sex: s,
    };
  },
};
```

Note: You'll also need to import `race` and `sex` from the existing generators.

- [ ] **Step 3: Update fantasy index.ts to export new generators**

Replace the old `fullName`/`givenName`/`surname` exports with the language-backed versions. Mark old Markov ones as `@deprecated`.

- [ ] **Step 4: Update settlement names**

Similarly, wrap place generators (`settlementName`, `cityName`, etc.) to use language system. Example:

```ts
export const settlementName: Generator<TranslatedName> = {
  id: "fantasy.place.settlement",
  generate(ctx: Context) {
    // Pick a random culture's settlement template
    const cultures = [dwarvish, elvish, orcish, halfling, draconic];
    const culture = cultures[ctx.rng.nextInt(0, cultures.length - 1)]!;
    return generateName(culture, "settlement", ctx);
  },
};
```

- [ ] **Step 5: Commit**

```bash
git add packages/fantasy/src/npc.ts packages/fantasy/src/index.ts
git commit -m "feat: integrate language system into fantasy NPC and place names"
```

---

### Task 11: Integration — Update sci-fi names

**Files:**
- Modify: `packages/scifi/src/index.ts` (or equivalent)

- [ ] **Step 1: Wrap sci-fi name generators**

Replace or wrap `humanoidName`, `insectoidName`, `aquaticName` to use language system:

```ts
import { generateName } from "@content-gen/language";
import type { TranslatedName } from "@content-gen/language";
import { humanoid, insectoid, aquatic } from "./language/cultures.js";

export const humanoidName: Generator<TranslatedName> = {
  id: "scifi.humanoidName",
  generate(ctx: Context) {
    return generateName(humanoid, "given", ctx);
  },
};

export const insectoidName: Generator<TranslatedName> = {
  id: "scifi.insectoidName",
  generate(ctx: Context) {
    return generateName(insectoid, "given", ctx);
  },
};

export const aquaticName: Generator<TranslatedName> = {
  id: "scifi.aquaticName",
  generate(ctx: Context) {
    return generateName(aquatic, "given", ctx);
  },
};
```

- [ ] **Step 2: Mark old Markov generators as deprecated**

Add `@deprecated` JSDoc to the old Markov-based generators.

- [ ] **Step 3: Commit**

```bash
git add packages/scifi/src/index.ts
git commit -m "feat: integrate language system into scifi alien names"
```

---

### Task 12: Add determinism snapshot tests

**Files:**
- Modify: `packages/language/src/__tests__/determinism.test.ts`

- [ ] **Step 1: Write determinism snapshot test**

In `packages/language/src/__tests__/determinism.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createContext } from "@content-gen/core";
import { buildLexicon } from "../lexicon.js";
import {
  dwarvish,
  elvish,
  orcish,
  halfling,
  draconic,
} from "../../fantasy/src/language/cultures.js";
import {
  humanoid,
  insectoid,
  aquatic,
  synth,
} from "../../scifi/src/language/cultures.js";

const cultures = [
  dwarvish,
  elvish,
  orcish,
  halfling,
  draconic,
  humanoid,
  insectoid,
  aquatic,
  synth,
];

describe("Determinism Snapshots", () => {
  for (const culture of cultures) {
    it(`${culture.id} lexicon is stable`, () => {
      const ctx = createContext({ seed: "test-determinism-1" });
      const lexicon = buildLexicon(culture, ctx);
      const glossary = lexicon.materialize();
      // Snapshot the entire glossary
      expect(glossary).toMatchSnapshot();
    });
  }

  it("Meaning ID set is stable per culture", () => {
    const ctx = createContext({ seed: "test" });
    for (const culture of cultures) {
      const lexicon = buildLexicon(culture, ctx);
      const ids = [...lexicon.byClass("noun").map((m) => m.id)];
      expect(ids).toMatchSnapshot(culture.id + ":noun-ids");
    }
  });
});
```

- [ ] **Step 2: Run test to generate snapshots**

```bash
cd packages/language
pnpm test src/__tests__/determinism.test.ts
```

This will create snapshot files. Commit them.

- [ ] **Step 3: Commit**

```bash
git add packages/language/src/__tests__/determinism.test.ts packages/language/src/__tests__/*.snap
git commit -m "test: add determinism snapshots for all cultures"
```

---

### Task 13: Update pnpm workspace and dependencies

**Files:**
- Modify: `pnpm-workspace.yaml`
- Modify: `packages/fantasy/package.json`
- Modify: `packages/scifi/package.json`
- Modify: `package.json` (root)

- [ ] **Step 1: Ensure language package is in workspace**

Verify `pnpm-workspace.yaml` includes `packages/language`:

```yaml
packages:
  - "packages/*"
```

- [ ] **Step 2: Add language as dependency to fantasy**

In `packages/fantasy/package.json`, add to `dependencies`:

```json
"@content-gen/language": "workspace:*"
```

- [ ] **Step 3: Add language as dependency to scifi**

In `packages/scifi/package.json`, add to `dependencies`:

```json
"@content-gen/language": "workspace:*"
```

- [ ] **Step 4: Run pnpm install**

```bash
cd /Users/ianlintner/Projects/content-gen
pnpm install
```

- [ ] **Step 5: Commit**

```bash
git add pnpm-workspace.yaml packages/fantasy/package.json packages/scifi/package.json
git commit -m "chore: add @content-gen/language to workspace and genre dependencies"
```

---

### Task 14: Run all tests and build

**Files:** (verification only)

- [ ] **Step 1: Run language tests**

```bash
cd packages/language
pnpm test
```

Expected: All tests pass

- [ ] **Step 2: Run fantasy tests**

```bash
cd packages/fantasy
pnpm test
```

Expected: Tests pass (or update snapshots if fullName shape changed)

- [ ] **Step 3: Run scifi tests**

```bash
cd packages/scifi
pnpm test
```

Expected: Tests pass

- [ ] **Step 4: Build all packages**

```bash
cd /Users/ianlintner/Projects/content-gen
pnpm build
```

Expected: No errors

- [ ] **Step 5: Final commit (if needed)**

If any snapshot updates or fixes were needed, commit them:

```bash
git add -A && git commit -m "test: update snapshots after language system integration" || echo "No changes needed"
```

---

## Summary

This plan implements the v0.2 language system across three packages:

1. **`@content-gen/language`** (9 tasks): Core engine for phonotactics, lexicon, and templates
2. **Fantasy extension** (2 tasks): Meanings and culture presets
3. **Sci-fi extension** (2 tasks): Meanings and culture presets
4. **Integration** (3 tasks): Wrap existing fantasy/scifi generators to return `TranslatedName`
5. **Testing & build** (3 tasks): Determinism snapshots, dependencies, full test suite

Each commit is atomic and testable. The plan assumes familiarity with TypeScript, the existing `@content-gen/core` API (Context, RNG, Generator<T>, WeightedList), and Vitest.
