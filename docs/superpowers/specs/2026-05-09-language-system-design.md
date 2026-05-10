# Language System Design — content-gen v0.2

**Date:** 2026-05-09
**Status:** Approved
**Scope:** New `@content-gen/language` package + breaking changes to `@content-gen/fantasy` and `@content-gen/scifi`

---

## Overview

v0.2 introduces a **procedural constructed-language (conlang) system**: each culture has a glyph system (phonotactics), a procedurally-generated lexicon (English meaning → conlang form), and name templates that compose meaningful morphemes. Every personal name and place name returns a `TranslatedName` carrying both the conlang form and its English translation.

Inspired by Dwarf Fortress's language system. Key departure: the lexicon is **seeded and deterministic** — every meaning's conlang form is derived from a key-addressed RNG fork, not sequential draws, so the lexicon is order-independent and stable across patch releases.

---

## Goals

1. Names have translatable meaning: `"Drakaztum"` → `"Strong-anvil"`
2. Every world is different: different seeds produce genuinely different conlangs for the same culture
3. Same seed, same world: byte-identical across machines, runs, and library versions
4. Patch-stable: adding new meanings in v0.2.x doesn't invalidate existing seeds
5. Genre-neutral engine: fantasy and sci-fi share the same machinery
6. Alien-system-ready: engine supports non-latin glyph classes (emojis, unicode symbols) without redesign; presets ship in v0.2.x

---

## Non-Goals (v0.2)

- Inflection, morphology, grammatical agreement
- Cross-culture loanwords
- Translation *into* a culture (English → conlang)
- Alien/glyph culture presets (engine supports them; no preset ships in v0.2)
- Translated faction names, item names, quest hooks, tavern names (stay English)

---

## Package Layout

### New package: `@content-gen/language`

Engine + universal core meanings (~150). No genre assumptions.

```text
packages/language/
  package.json
  src/
    glyphs.ts          GlyphSystem types + constraint model
    phonotactics.ts    Word generator: class-slots → glyph selection + constraints
    lexicon.ts         Meaning → conlang-form; key-addressed RNG; lazy + eager modes
    meanings.ts        Universal core meaning list + semantic tags
    language.ts        Culture definition; buildLexicon(); NameTemplate DSL
    templates.ts       Template engine: part selection by class/tag; TranslatedName output
    archetypes.ts      Reusable phonotactic presets (flowing, guttural, clipped, sibilant)
    index.ts
  src/__tests__/
    determinism.test.ts
    phonotactics.test.ts
    templates.test.ts
```

### Fantasy genre extension (`packages/fantasy/src/language/`)

```text
meanings.ts    ~350 fantasy meanings (rune, oath, anvil, hex, beast, forge, vow, …)
cultures.ts    dwarvish, elvish, orcish, halfling, draconic culture presets
```

### Sci-fi genre extension (`packages/scifi/src/language/`)

```text
meanings.ts    ~350 sci-fi meanings (void, plasma, drive, lattice, signal, hive, molt, …)
cultures.ts    humanoid, insectoid, aquatic, synth culture presets
```

---

## Core Types

### GlyphSystem

```ts
export interface GlyphSystem {
  /** Named atomic-glyph classes. "C"/"V" is convention only. */
  classes: Record<string, readonly string[]>;
  /** Syllable templates as space-separated class names: "C V", "C V C". */
  syllables: WeightedList<string>;
  /** Word-shape templates: number of syllables. e.g. "1", "2", "1-2" (range). */
  wordShapes: WeightedList<string>;
  /** Optional phonotactic constraints over class sequences. */
  constraints?: readonly Constraint[];
  /** Glyph joiner between syllables. Default "". Use "-" for hyphenated alien scripts. */
  joiner?: string;
}

export interface Constraint {
  /** Sequence of class names to match; "*" matches any class. */
  pattern: readonly string[];
  rule: "forbid" | { maxOccurrences: number };
}
```

**Alien-language example:**

```ts
{ classes: { sigil: ["⟁","⟆","◈","◇"], mark: ["·","˙","ˋ"] },
  syllables: [["sigil", 3], ["sigil mark", 2], ["sigil sigil", 1]],
  wordShapes: [["1", 2], ["2", 1]],
  joiner: "" }
```

### Meaning & Lexicon

```ts
export interface Meaning {
  /** Stable English identifier — NEVER rename after release. Drives RNG fork key. */
  id: string;
  /** Grammatical class. Drives template selection. */
  class: WordClass;
  /** Semantic tags. Drives template filtering. e.g. ["nature", "water", "flowing"] */
  tags: readonly string[];
  /** Human-readable label (may differ from id; id is for stability). */
  label?: string;
}

export type WordClass = "noun" | "adjective" | "verb" | "particle";

export interface Lexicon {
  readonly cultureId: string;
  /** Returns the conlang form for a meaning. Generates lazily, caches. */
  formOf(meaningId: string): string;
  /** All meanings matching a class and optional tag. No RNG. */
  byClass(c: WordClass, tag?: string): readonly Meaning[];
  /** Materialise the full lexicon eagerly (glossary, tooling). */
  materialize(): ReadonlyMap<string, string>;
}
```

### MeaningPack & Culture

```ts
/** A named, versioned collection of Meaning entries. */
export interface MeaningPack {
  id: string;                    // "core", "fantasy.industrial", "scifi.hive"
  version: string;               // semver — bump when IDs are added/changed
  meanings: readonly Meaning[];
}

export interface Culture {
  id: string;                              // "fantasy.dwarvish"
  glyphs: GlyphSystem;
  meaningPacks: readonly MeaningPack[];    // [coreMeanings, fantasyIndustrial, …]
  templates: NameTemplates;
  /** "none" is the correct default for non-latin glyph systems. */
  capitalize?: "first" | "all" | "none";
}

export interface NameTemplates {
  given: WeightedList<NameTemplate>;
  surname?: WeightedList<NameTemplate>;
  settlement: WeightedList<NameTemplate>;
  mountain: WeightedList<NameTemplate>;
  river: WeightedList<NameTemplate>;
  forest: WeightedList<NameTemplate>;
}

export type NameTemplate =
  | { kind: "compose"; parts: readonly TemplatePart[]; sep?: string }
  | { kind: "literal"; form: string; translation: string };

export type TemplatePart =
  | { pick: WordClass; tag?: string; capitalize?: boolean }
  | { literal: string; translation?: string };
```

### TranslatedName

```ts
export interface TranslatedName {
  /** The conlang string. e.g. "Drakaztum" */
  form: string;
  /** English translation. e.g. "Strong-anvil" */
  translation: string;
  /** Culture identifier. e.g. "fantasy.dwarvish" */
  language: string;
  /** Morpheme-level breakdown for tooling/display. */
  parts?: readonly { form: string; meaning: string }[];
  /** toString() returns .form — preserves template-string compat. */
  toString(): string;
}
```

---

## Determinism Design

### Key-addressed RNG forks

Each meaning's conlang form is derived from a fork keyed on the meaning id, not iteration order:

```ts
export function buildLexicon(culture: Culture, ctx: Context): Lexicon {
  const cultureCtx = ctx.child(`lang:${culture.id}`);
  const cache = new Map<string, string>();

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
    byClass(c, tag) { /* pure metadata lookup, no RNG */ },
    materialize() { /* walk all meanings, call formOf on each */ },
  };
}
```

**Stability guarantees:**

- Adding `"fjord"` in v0.2.1 doesn't shift any other meaning's draws
- Reordering meaning packs produces identical output
- Shuffling glyph class arrays does shift output — treat class arrays as ordered; append-only

### Stability rules enforced in CI

1. **Meaning IDs are immutable.** Snapshot test pins the set of IDs per meaning pack. Renames/deletes fail CI until explicitly marked `@stability-break` with a CHANGELOG entry.
2. **Culture glyph definitions are versioned.** Treat as semver: patch = no phonotactic changes; minor = additive class glyphs (may change new words, not existing); major = template/class structure changes.
3. **Lexicon snapshot test.** For each shipped culture, seed `"test-seed-1"`, materialize, snapshot. Accidental algorithm changes fail CI.

---

## Word Generation Algorithm

`generateWord(glyphs, ctx)`:

1. Pick word shape (e.g. `"2"` syllables) from `glyphs.wordShapes` using `ctx.child("shape")`
2. For each syllable slot, pick a syllable template (e.g. `"C V C"`) from `glyphs.syllables` using `ctx.child("syl:N")`
3. For each class slot in the template, pick a glyph from `glyphs.classes[name]` using `ctx.child("syl:N:slot:M")`
4. Apply constraints — if a forbidden pattern matches across the assembled word, redraw the offending slot using `ctx.child("syl:N:slot:M:retry:R")` (max 8 retries; on exhaustion, accept and log a debug warning)
5. Join syllables with `glyphs.joiner ?? ""`
6. Apply `culture.capitalize` rule

---

## Phonotactic Archetypes (shipped presets)

```ts
const archetypes = {
  flowing:   { /* high V ratio, CVV/VCV syllables, soft consonants l r n m */ },
  guttural:  { /* CVC/CVCC, hard stops k g d, no VV sequences */ },
  clipped:   { /* short wordShapes "1", CVC only, no middle syllables */ },
  sibilant:  { /* s sh z zh dominant consonants, CV/CVV */ },
  resonant:  { /* l r m n heavy, CVCV pattern */ },
} satisfies Record<string, Partial<GlyphSystem>>;
```

Culture definitions extend an archetype and override specific fields. This keeps culture definitions short while ensuring aesthetic coherence.

---

## Fantasy Culture Presets

| Culture     | Archetype  | Example name     | Translation        |
|-------------|------------|------------------|--------------------|
| `dwarvish`  | guttural   | `Drakaztum`      | Strong-anvil       |
| `elvish`    | flowing    | `Aelthelan`      | Silver-stream      |
| `orcish`    | guttural   | `Gorukash`       | Iron-blood         |
| `halfling`  | clipped    | `Brimbel`        | Hill-home          |
| `draconic`  | sibilant   | `Szaraveth`      | Fire-eternal       |

## Sci-fi Culture Presets

| Culture      | Archetype  | Example name | Translation       |
| ------------ | ---------- | ------------ | ----------------- |
| `humanoid`   | resonant   | `Velarun`    | Void-navigator    |
| `insectoid`  | guttural   | `Krazzivek`  | Swarm-signal      |
| `aquatic`    | flowing    | `Shaalumei`  | Deep-current      |
| `synth`      | clipped    | `Kex-7`      | Lattice-node      |

---

## API Surface

### Standalone (language package)

```ts
import { defineCulture, buildLexicon, generateName } from "@content-gen/language";

const ctx = createContext({ seed: "campaign-7" });
const name = generateName(dwarvish, "given", ctx.child("hero:name"));
// → { form: "Drakaztum", translation: "Strong-anvil", language: "fantasy.dwarvish", parts: [...] }

// Full glossary
const lexicon = buildLexicon(dwarvish, ctx);
const glossary = lexicon.materialize();
```

### Fantasy integration (v0.2)

```ts
import { fantasy } from "@content-gen/fantasy";

const game = fantasy.withSeed("campaign-7");

game.npc.name.full
// → TranslatedName { form: "Aelthelan Stormvale", translation: "Silver-stream Storm-vale", … }

game.npc.name.full.form        // "Aelthelan Stormvale"  (just the string)
`${game.npc.name.full}`        // "Aelthelan Stormvale"  (toString compat)
game.npc.name.full.translation // "Silver-stream Storm-vale"

game.place.settlement()
// → { name: TranslatedName, kind: "village", population: 284, … }
```

### Generator integration

```ts
import { nameGenerator } from "@content-gen/language";
import { dwarvish } from "@content-gen/fantasy/language";

const dwarvenGiven = nameGenerator(dwarvish, "given");
// dwarvenGiven satisfies Generator<TranslatedName>
```

---

## Breaking Changes (v0.1 → v0.2)

| Location                         | Before       | After            |
| -------------------------------- | ------------ | ---------------- |
| `fantasy.npc.name.full`          | `string`     | `TranslatedName` |
| `fantasy.npc.name.given`         | `string`     | `TranslatedName` |
| `fantasy.npc.name.surname`       | `string`     | `TranslatedName` |
| `fantasy.place.settlement().name` | `string`     | `TranslatedName` |
| `fantasy.place.mountain()`       | `string`     | `TranslatedName` |
| `fantasy.place.river()`          | `string`     | `TranslatedName` |
| `fantasy.place.forest()`         | `string`     | `TranslatedName` |
| `scifi.humanoidName` etc.        | `string`     | `TranslatedName` |

**Migration:** `name.full.form` or `` `${name.full}` `` replaces bare `name.full` string usage.

Markov-based name generators remain exported as `@deprecated` until v0.3.

---

## Testing Strategy

1. **Determinism snapshots** — each culture, seed `"test-seed-1"`, materialize lexicon, snapshot.
2. **Order-independence** — shuffle meaning pack order, assert lexicon identical.
3. **Meaning ID freeze** — snapshot meaning ID set per pack; renames/deletes fail CI.
4. **Phonotactic constraints** — generate 1000 words per culture, assert no forbidden cluster appears.
5. **Translation round-trip** — render name, verify `parts` array concatenates to `translation`.
6. **toString compat** — `String(translatedName) === translatedName.form`.
7. **Integration tests** — fantasy/scifi existing tests updated for `TranslatedName` shape.

---

## Meaning Pack — Universal Core (excerpt)

Full list lives in `packages/language/src/meanings.ts`. Representative sample:

| id          | class     | tags                    |
|-------------|-----------|-------------------------|
| `mountain`  | noun      | nature, earth, strength |
| `river`     | noun      | nature, water, flowing  |
| `stone`     | noun      | earth, industry         |
| `blood`     | noun      | war, body               |
| `light`     | noun      | celestial, nature       |
| `dark`      | noun      | shadow, celestial       |
| `strong`    | adjective | strength, war           |
| `swift`     | adjective | nature, travel          |
| `ancient`   | adjective | time                    |
| `walk`      | verb      | travel                  |
| `forge`     | verb      | industry                |
| `see`       | verb      | perception              |

Fantasy meanings add: `rune, oath, anvil, hex, beast, grove, sigil, vow, crown, …`
Sci-fi meanings add: `void, plasma, drive, lattice, signal, hive, molt, node, relay, …`

---

## Alien / Non-Latin Glyph Systems

The engine is glyph-class-agnostic. No latin assumption anywhere. A culture may declare any named classes containing any Unicode codepoints or emoji:

```ts
const xenolithCulture: Culture = {
  id: "scifi.xenolith",
  glyphs: {
    classes: {
      sigil:    ["⟁", "⟆", "◈", "◇", "⊕", "⊗"],
      mark:     ["·", "˙", "ˋ", "ˊ"],
      radical:  ["〒", "〓", "〼"],
    },
    syllables: [["sigil", 3], ["sigil mark", 2], ["radical sigil", 1]],
    wordShapes: [["1", 1], ["2", 2]],
    joiner: "",
  },
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: { /* … */ },
  capitalize: "none",
};
// Produces: { form: "⟁·◈⊗", translation: "Signal-void", language: "scifi.xenolith" }
```

Preset alien cultures ship in v0.2.x after the core engine is validated with latin cultures.
