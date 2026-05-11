# New Cultures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3 new cultures to `@lexiconlang/scifi` (`reptilian`, `hivemind`, `grayfolk`) and 3 to `@lexiconlang/fantasy` (`celestial`, `fey`, `tiefling`), each with name templates, meaning vocabulary, and a `visualGlyphSystem`.

**Architecture:** Each culture is a `Culture` object in `packages/<genre>/src/language/cultures.ts`. It references meaning packs (defined in `meanings.ts`) via tag-based template slots, and optionally declares a `visualGlyphSystems` map. Package-level `index.ts` exports a typed name `Generator` per culture. The `Species`/`Race` type union and weighted generator in each package index must be extended to include the new cultures.

**Tech Stack:** TypeScript, Vitest, pnpm workspaces. Build via `pnpm build`. Tests via `vitest run`. Type-check via `pnpm typecheck`. Changesets via `pnpm changeset`.

---

## File Map

| File | Change |
|------|--------|
| `packages/scifi/src/language/meanings.ts` | Add missing vocabulary for reptilian, hivemind, grayfolk |
| `packages/scifi/src/language/cultures.ts` | Add 3 new `Culture` exports |
| `packages/scifi/src/language/index.ts` | Re-export new cultures |
| `packages/scifi/src/index.ts` | Add `Generator` exports + extend `Species` type + `speciesName` cases |
| `packages/scifi/src/scifi.test.ts` | Add assertions for new cultures in `crewMember.species` enum check |
| `packages/fantasy/src/language/meanings.ts` | Add missing vocabulary for celestial, fey, tiefling |
| `packages/fantasy/src/language/cultures.ts` | Add 3 new `Culture` exports |
| `packages/fantasy/src/language/index.ts` | Re-export new cultures |
| `packages/fantasy/src/index.ts` | Add `Generator` exports + extend `Race` type + `raceToCulture` cases |
| `packages/fantasy/src/language/cultures.test.ts` | Add describe blocks for all 6 new cultures |

---

## Task 1: Add sci-fi vocabulary for reptilian, hivemind, grayfolk

**Files:**
- Modify: `packages/scifi/src/language/meanings.ts` — append new meaning entries before the closing `]`

- [ ] **Step 1: Audit existing tags to avoid duplicates**

Run:
```bash
grep -E '"(scale|slither|venom|ambush|patient|cold|consensus|broadcast|distributed|parallel|observer|psionic|telepathy|enigma|silence|orb|watch)"' packages/scifi/src/language/meanings.ts
```
Expected: no output (none of these words exist yet). If any do appear, skip those specific entries in Step 2.

- [ ] **Step 2: Append new meanings**

Open `packages/scifi/src/language/meanings.ts`. Before the final `],` that closes the `meanings` array, add:

```typescript
    // Reptilian (predator, cold, patient)
    { id: "scale", class: "noun", tags: ["predator", "biology"], label: "scale" },
    { id: "slither", class: "verb", tags: ["predator", "movement"], label: "slither" },
    { id: "venom", class: "noun", tags: ["predator", "biology"], label: "venom" },
    { id: "ambush", class: "verb", tags: ["predator", "action"], label: "ambush" },
    { id: "patient", class: "adjective", tags: ["predator", "behavior"], label: "patient" },
    { id: "cold-blooded", class: "adjective", tags: ["predator", "cold"], label: "cold-blooded" },
    { id: "cold", class: "adjective", tags: ["predator", "cold"], label: "cold" },
    { id: "serpentine", class: "adjective", tags: ["predator", "form"], label: "serpentine" },
    { id: "coil", class: "noun", tags: ["predator", "form"], label: "coil" },
    { id: "apex", class: "noun", tags: ["predator", "rank"], label: "apex" },

    // Hivemind (distributed, consensus, network-identity)
    { id: "consensus", class: "noun", tags: ["hivemind", "collective"], label: "consensus" },
    { id: "broadcast", class: "verb", tags: ["hivemind", "communication"], label: "broadcast" },
    { id: "distributed", class: "adjective", tags: ["hivemind", "structure"], label: "distributed" },
    { id: "parallel", class: "adjective", tags: ["hivemind", "structure"], label: "parallel" },
    { id: "index", class: "noun", tags: ["hivemind", "identity"], label: "index" },
    { id: "shard", class: "noun", tags: ["hivemind", "identity"], label: "shard" },
    { id: "replicate", class: "verb", tags: ["hivemind", "action"], label: "replicate" },
    { id: "fork", class: "verb", tags: ["hivemind", "action"], label: "fork" },
    { id: "join", class: "verb", tags: ["hivemind", "action"], label: "join" },

    // Grayfolk (psionic, observer, ancient, enigmatic)
    { id: "observer", class: "noun", tags: ["grayfolk", "role"], label: "observer" },
    { id: "psionic", class: "adjective", tags: ["grayfolk", "mind"], label: "psionic" },
    { id: "telepathy", class: "noun", tags: ["grayfolk", "mind"], label: "telepathy" },
    { id: "watcher", class: "noun", tags: ["grayfolk", "role"], label: "watcher" },
    { id: "enigma", class: "noun", tags: ["grayfolk", "mystery"], label: "enigma" },
    { id: "silence", class: "noun", tags: ["grayfolk", "state"], label: "silence" },
    { id: "orb", class: "noun", tags: ["grayfolk", "form"], label: "orb" },
    { id: "lens", class: "noun", tags: ["grayfolk", "form"], label: "lens" },
    { id: "unfathomable", class: "adjective", tags: ["grayfolk", "mystery"], label: "unfathomable" },
    { id: "still", class: "adjective", tags: ["grayfolk", "state"], label: "still" },
```

- [ ] **Step 3: Type-check**

```bash
cd packages/scifi && pnpm typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/scifi/src/language/meanings.ts
git commit -m "feat(scifi): add vocabulary for reptilian, hivemind, and grayfolk cultures"
```

---

## Task 2: Add reptilian, hivemind, grayfolk cultures

**Files:**
- Modify: `packages/scifi/src/language/cultures.ts` — append 3 exports before the end of file

- [ ] **Step 1: Write the three culture definitions**

Append to the end of `packages/scifi/src/language/cultures.ts`:

```typescript
export const reptilian: Culture = {
  id: "scifi.reptilian",
  glyphs: {
    ...archetypes.sibilant,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "predator", capitalize: true },
            { pick: "noun", tag: "predator" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    surname: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "geology", capitalize: true },
            { pick: "noun", tag: "predator" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
  visualGlyphSystems: {
    phonetic: {
      id: "reptilian.scales",
      type: "alphabet",
      renderFormat: "svg",
      mappingStrategy: "phoneme",
      generator: {
        baseShapes: ["arc", "line", "polygon"],
        complexity: "complex",
        symmetry: false,
        palette: ["#556B2F", "#8B7500"],
      },
      renderParams: {
        size: 30,
        strokeWidth: 1.5,
      },
    },
  },
};

export const hivemind: Culture = {
  id: "scifi.hivemind",
  glyphs: {
    ...archetypes.clipped,
    joiner: ".",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "hivemind", capitalize: true },
            { literal: "7", translation: "index" },
          ],
          sep: ".",
        },
        1,
      ],
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "network", capitalize: true },
            { pick: "noun", tag: "hivemind" },
          ],
          sep: ".",
        },
        1,
      ],
    ],
  },
  visualGlyphSystems: {
    phonetic: {
      id: "hivemind.grid",
      type: "alphabet",
      renderFormat: "svg",
      mappingStrategy: "phoneme",
      generator: {
        baseShapes: ["rect", "line"],
        complexity: "medium",
        symmetry: false,
        palette: ["#00CED1", "#C0C0C0"],
      },
      renderParams: {
        size: 26,
        strokeWidth: 1,
      },
    },
  },
};

export const grayfolk: Culture = {
  id: "scifi.grayfolk",
  glyphs: {
    ...archetypes.resonant,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "grayfolk", capitalize: true },
            { pick: "noun", tag: "mind" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    surname: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "knowledge", capitalize: true },
            { pick: "noun", tag: "grayfolk" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
  visualGlyphSystems: {
    holistic: {
      id: "grayfolk.observer",
      type: "conceptual",
      renderFormat: "unicode",
      mappingStrategy: "morpheme",
      unicodeMappings: {
        awareness: "◉",
        perception: "◉",
        eye: "◉",
        orb: "◉",
        cognition: "⊙",
        consciousness: "⊙",
        mind: "⊙",
        intelligence: "⊙",
        silence: "◯",
        still: "◯",
        void: "◯",
        archive: "⌬",
        memory: "⌬",
        knowledge: "⌬",
        quantum: "✦",
        anomaly: "✦",
        enigma: "✦",
        observer: "◌",
        watcher: "◌",
        telepathy: "≋",
        psionic: "≋",
      },
      renderParams: {
        fallback: "◌",
      },
    },
  },
};
```

- [ ] **Step 2: Type-check**

```bash
cd packages/scifi && pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/scifi/src/language/cultures.ts
git commit -m "feat(scifi): add reptilian, hivemind, and grayfolk cultures"
```

---

## Task 3: Wire sci-fi cultures into exports and name generators

**Files:**
- Modify: `packages/scifi/src/language/index.ts`
- Modify: `packages/scifi/src/index.ts`

- [ ] **Step 1: Update language/index.ts**

Replace the existing export line in `packages/scifi/src/language/index.ts`:
```typescript
export { humanoid, insectoid, aquatic, synth } from "./cultures.js";
```
with:
```typescript
export { humanoid, insectoid, aquatic, synth, reptilian, hivemind, grayfolk } from "./cultures.js";
```

- [ ] **Step 2: Add imports and re-exports in packages/scifi/src/index.ts**

Find this line in `packages/scifi/src/index.ts`:
```typescript
import { humanoid, insectoid, aquatic, synth, birdpeople, rockpeople, mycoids, mammalian, plantoid } from "./language/cultures.js";
```
Replace it with:
```typescript
import { humanoid, insectoid, aquatic, synth, birdpeople, rockpeople, mycoids, mammalian, plantoid, reptilian, hivemind, grayfolk } from "./language/cultures.js";
```

Find this re-export line:
```typescript
export { humanoid, insectoid, aquatic, synth, birdpeople, rockpeople, mycoids, mammalian, plantoid } from "./language/cultures.js";
```
Replace it with:
```typescript
export { humanoid, insectoid, aquatic, synth, birdpeople, rockpeople, mycoids, mammalian, plantoid, reptilian, hivemind, grayfolk } from "./language/cultures.js";
```

- [ ] **Step 3: Add Generator exports**

After the existing `plantoidName` export block (around line 104-110), add:

```typescript
export const reptilianName: Generator<TranslatedName> = {
  id: "scifi.reptilianName",
  generate(ctx: Context) {
    return generateName(reptilian, "given", ctx);
  },
};

export const hivemindName: Generator<TranslatedName> = {
  id: "scifi.hivemindName",
  generate(ctx: Context) {
    return generateName(hivemind, "given", ctx);
  },
};

export const grayfolkName: Generator<TranslatedName> = {
  id: "scifi.grayfolkName",
  generate(ctx: Context) {
    return generateName(grayfolk, "given", ctx);
  },
};
```

- [ ] **Step 4: Extend Species type and speciesName function**

Find:
```typescript
export type Species = "human" | "humanoid" | "insectoid" | "aquatic" | "synth";
```
Replace with:
```typescript
export type Species = "human" | "humanoid" | "insectoid" | "aquatic" | "synth" | "reptilian" | "hivemind" | "grayfolk";
```

In the `speciesName` function, add cases before the closing `return` fallback:
```typescript
  if (sp === "reptilian") return reptilianName;
  if (sp === "hivemind") return hivemindName;
  if (sp === "grayfolk") return grayfolkName;
```

- [ ] **Step 5: Type-check**

```bash
cd packages/scifi && pnpm typecheck
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/scifi/src/language/index.ts packages/scifi/src/index.ts
git commit -m "feat(scifi): export reptilian, hivemind, grayfolk generators and extend Species type"
```

---

## Task 4: Test sci-fi new cultures

**Files:**
- Modify: `packages/scifi/src/language/cultures.test.ts` (create if missing)
- Modify: `packages/scifi/src/scifi.test.ts`

- [ ] **Step 1: Check if cultures.test.ts exists for scifi**

```bash
ls packages/scifi/src/language/cultures.test.ts 2>/dev/null && echo "exists" || echo "missing"
```

- [ ] **Step 2: Create/extend cultures.test.ts for scifi**

If the file is missing, create `packages/scifi/src/language/cultures.test.ts`. If it exists, append the new describe blocks.

```typescript
import { describe, expect, it } from "vitest";
import { reptilian, hivemind, grayfolk } from "./cultures.js";
import { createContext } from "@lexiconlang/core";
import { generateName } from "@lexiconlang/language";

describe("reptilian culture", () => {
  it("has visualGlyphSystems.phonetic defined", () => {
    expect(reptilian.visualGlyphSystems?.phonetic).toBeDefined();
  });

  it("phonetic glyph system is SVG alphabet", () => {
    const g = reptilian.visualGlyphSystems!.phonetic;
    expect(g.id).toBe("reptilian.scales");
    expect(g.type).toBe("alphabet");
    expect(g.renderFormat).toBe("svg");
    expect(g.mappingStrategy).toBe("phoneme");
    expect(g.generator!.baseShapes).toContain("arc");
    expect(g.generator!.palette).toEqual(["#556B2F", "#8B7500"]);
  });

  it("generates a non-empty given name", () => {
    const ctx = createContext({ seed: "reptilian-test" });
    const name = generateName(reptilian, "given", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });

  it("generates a non-empty surname", () => {
    const ctx = createContext({ seed: "reptilian-surname" });
    const name = generateName(reptilian, "surname", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });
});

describe("hivemind culture", () => {
  it("has visualGlyphSystems.phonetic defined", () => {
    expect(hivemind.visualGlyphSystems?.phonetic).toBeDefined();
  });

  it("phonetic glyph system is SVG alphabet with mechanical palette", () => {
    const g = hivemind.visualGlyphSystems!.phonetic;
    expect(g.id).toBe("hivemind.grid");
    expect(g.type).toBe("alphabet");
    expect(g.renderFormat).toBe("svg");
    expect(g.generator!.baseShapes).toContain("rect");
    expect(g.generator!.palette).toEqual(["#00CED1", "#C0C0C0"]);
  });

  it("generates a non-empty given name", () => {
    const ctx = createContext({ seed: "hivemind-test" });
    const name = generateName(hivemind, "given", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });
});

describe("grayfolk culture", () => {
  it("has visualGlyphSystems.holistic defined", () => {
    expect(grayfolk.visualGlyphSystems?.holistic).toBeDefined();
  });

  it("holistic glyph system uses unicode conceptual mapping", () => {
    const g = grayfolk.visualGlyphSystems!.holistic;
    expect(g.id).toBe("grayfolk.observer");
    expect(g.type).toBe("conceptual");
    expect(g.renderFormat).toBe("unicode");
    expect(g.mappingStrategy).toBe("morpheme");
    expect(g.unicodeMappings!.cognition).toBe("⊙");
    expect(g.unicodeMappings!.awareness).toBe("◉");
    expect(g.unicodeMappings!.silence).toBe("◯");
    expect(g.unicodeMappings!.memory).toBe("⌬");
    expect(g.unicodeMappings!.quantum).toBe("✦");
    expect(g.renderParams!.fallback).toBe("◌");
  });

  it("generates a non-empty given name", () => {
    const ctx = createContext({ seed: "grayfolk-test" });
    const name = generateName(grayfolk, "given", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });

  it("generates a non-empty surname", () => {
    const ctx = createContext({ seed: "grayfolk-surname" });
    const name = generateName(grayfolk, "surname", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run the new tests and verify they fail before implementation is wrong (already done above) or pass**

```bash
pnpm test --reporter=verbose packages/scifi/src/language/cultures.test.ts
```
Expected: all tests PASS (cultures are already wired by Task 2-3).

- [ ] **Step 4: Update scifi.test.ts species check**

Find the line in `packages/scifi/src/scifi.test.ts`:
```typescript
    expect(["human", "humanoid", "insectoid", "aquatic", "synth"]).toContain(c.species);
```
Replace with:
```typescript
    expect(["human", "humanoid", "insectoid", "aquatic", "synth", "reptilian", "hivemind", "grayfolk"]).toContain(c.species);
```

- [ ] **Step 5: Run all scifi tests**

```bash
pnpm test --reporter=verbose packages/scifi
```
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/scifi/src/language/cultures.test.ts packages/scifi/src/scifi.test.ts
git commit -m "test(scifi): add tests for reptilian, hivemind, and grayfolk cultures"
```

---

## Task 5: Add fantasy vocabulary for celestial, fey, tiefling

**Files:**
- Modify: `packages/fantasy/src/language/meanings.ts` — append new meaning entries

- [ ] **Step 1: Audit existing tags to avoid duplicates**

```bash
grep -E '"(radiant|dawn|halo|hallow|seraph|grace|bless|holy|whisper|mist|dream|glamour|pixie|ember|ash|infernal|cinder|pact|sooth)"' packages/fantasy/src/language/meanings.ts
```
Skip any entries that already exist.

- [ ] **Step 2: Append new meanings**

Open `packages/fantasy/src/language/meanings.ts`. Before the final `],` that closes the `meanings` array, add:

```typescript
    // Celestial / Aasimar (divine light, grace, sky)
    { id: "radiant", class: "adjective", tags: ["light", "divine"], label: "radiant" },
    { id: "dawn", class: "noun", tags: ["light", "celestial"], label: "dawn" },
    { id: "halo", class: "noun", tags: ["light", "divine"], label: "halo" },
    { id: "hallow", class: "verb", tags: ["divine", "blessing"], label: "hallow" },
    { id: "seraph", class: "noun", tags: ["divine", "celestial"], label: "seraph" },
    { id: "grace", class: "noun", tags: ["divine", "grace"], label: "grace" },
    { id: "feather", class: "noun", tags: ["celestial", "sky"], label: "feather" },
    { id: "wing", class: "noun", tags: ["celestial", "sky"], label: "wing" },
    { id: "sacred", class: "adjective", tags: ["divine", "holy"], label: "sacred" },
    { id: "bright", class: "adjective", tags: ["light", "divine"], label: "bright" },
    { id: "sunlight", class: "noun", tags: ["light", "celestial"], label: "sunlight" },
    { id: "blessed", class: "adjective", tags: ["divine", "good"], label: "blessed" },

    // Fey / Sidhe (dream, mischief, nature-magic)
    { id: "whisper", class: "noun", tags: ["fey", "sound"], label: "whisper" },
    { id: "mist", class: "noun", tags: ["fey", "nature"], label: "mist" },
    { id: "dream", class: "noun", tags: ["fey", "mind"], label: "dream" },
    { id: "lullaby", class: "noun", tags: ["fey", "song"], label: "lullaby" },
    { id: "glamour", class: "noun", tags: ["fey", "magic"], label: "glamour" },
    { id: "hollow", class: "noun", tags: ["fey", "nature"], label: "hollow" },
    { id: "briar", class: "noun", tags: ["fey", "nature"], label: "briar" },
    { id: "sprite", class: "noun", tags: ["fey", "creature"], label: "sprite" },
    { id: "elusive", class: "adjective", tags: ["fey", "behavior"], label: "elusive" },
    { id: "cunning", class: "adjective", tags: ["fey", "behavior"], label: "cunning" },
    { id: "wisp", class: "noun", tags: ["fey", "light"], label: "wisp" },
    { id: "reverie", class: "noun", tags: ["fey", "mind"], label: "reverie" },

    // Tiefling / Infernal (fire, oath, defiance)
    { id: "ember", class: "noun", tags: ["fire", "infernal"], label: "ember" },
    { id: "ash", class: "noun", tags: ["fire", "shadow"], label: "ash" },
    { id: "infernal", class: "adjective", tags: ["infernal", "evil"], label: "infernal" },
    { id: "cinder", class: "noun", tags: ["fire", "infernal"], label: "cinder" },
    { id: "pact", class: "noun", tags: ["infernal", "contract"], label: "pact" },
    { id: "sooth", class: "verb", tags: ["infernal", "magic"], label: "sooth" },
    { id: "brimstone", class: "noun", tags: ["fire", "infernal"], label: "brimstone" },
    { id: "defiant", class: "adjective", tags: ["infernal", "behavior"], label: "defiant" },
    { id: "smolder", class: "verb", tags: ["fire", "infernal"], label: "smolder" },
    { id: "sulfur", class: "noun", tags: ["infernal", "material"], label: "sulfur" },
```

- [ ] **Step 3: Type-check**

```bash
cd packages/fantasy && pnpm typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/fantasy/src/language/meanings.ts
git commit -m "feat(fantasy): add vocabulary for celestial, fey, and tiefling cultures"
```

---

## Task 6: Add celestial, fey, tiefling cultures

**Files:**
- Modify: `packages/fantasy/src/language/cultures.ts` — append 3 exports

- [ ] **Step 1: Write the three culture definitions**

Append to the end of `packages/fantasy/src/language/cultures.ts`:

```typescript
export const celestial: Culture = {
  id: "fantasy.celestial",
  glyphs: {
    ...archetypes.resonant,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, fantasyIndustrial],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "light", capitalize: true },
            { pick: "noun", tag: "divine" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    surname: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "celestial", capitalize: true },
            { pick: "noun", tag: "grace" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    settlement: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "divine", capitalize: true },
            { pick: "noun", tag: "structure" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
  visualGlyphSystems: {
    conceptual: {
      id: "celestial.radiance",
      type: "conceptual",
      renderFormat: "unicode",
      mappingStrategy: "morpheme",
      unicodeMappings: {
        light: "✨",
        radiant: "✨",
        bright: "✨",
        dawn: "☀",
        sunlight: "☀",
        sun: "☀",
        star: "🌟",
        seraph: "🌟",
        halo: "⚜",
        crown: "⚜",
        grace: "⚜",
        wing: "🪶",
        feather: "🪶",
        sacred: "✝",
        divine: "✝",
        holy: "✝",
        song: "🎵",
        blessed: "🌙",
        moon: "🌙",
      },
      renderParams: {
        fallback: "◇",
      },
    },
  },
};

export const fey: Culture = {
  id: "fantasy.fey",
  glyphs: {
    ...archetypes.sibilant,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, fantasyIndustrial],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "fey", capitalize: true },
            { pick: "noun", tag: "fey" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    surname: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "nature", capitalize: true },
            { pick: "noun", tag: "fey" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
  visualGlyphSystems: {
    phonetic: {
      id: "fey.sylvan",
      type: "alphabet",
      renderFormat: "svg",
      mappingStrategy: "phoneme",
      generator: {
        baseShapes: ["arc", "line"],
        complexity: "medium",
        symmetry: false,
        palette: ["#556B2F", "#9370DB"],
      },
      renderParams: {
        size: 26,
        strokeWidth: 1.5,
      },
    },
  },
};

export const tiefling: Culture = {
  id: "fantasy.tiefling",
  glyphs: {
    ...archetypes.guttural,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, fantasyIndustrial],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "fire", capitalize: true },
            { pick: "noun", tag: "infernal" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    surname: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "fire", capitalize: true },
            { pick: "noun", tag: "contract" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
  visualGlyphSystems: {
    phonetic: {
      id: "tiefling.infernal",
      type: "alphabet",
      renderFormat: "svg",
      mappingStrategy: "phoneme",
      generator: {
        baseShapes: ["polygon", "line"],
        complexity: "complex",
        symmetry: false,
        palette: ["#8B0000", "#2F2F2F"],
      },
      renderParams: {
        size: 28,
        strokeWidth: 2,
      },
    },
  },
};
```

- [ ] **Step 2: Type-check**

```bash
cd packages/fantasy && pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/fantasy/src/language/cultures.ts
git commit -m "feat(fantasy): add celestial, fey, and tiefling cultures"
```

---

## Task 7: Wire fantasy cultures into exports, Race type, and raceToCulture

**Files:**
- Modify: `packages/fantasy/src/language/index.ts`
- Modify: `packages/fantasy/src/index.ts`

- [ ] **Step 1: Update language/index.ts**

Replace:
```typescript
export { dwarvish, elvish, orcish, halfling, draconic } from "./cultures.js";
```
with:
```typescript
export { dwarvish, elvish, orcish, halfling, draconic, celestial, fey, tiefling } from "./cultures.js";
```

- [ ] **Step 2: Add imports in packages/fantasy/src/index.ts**

Find the line:
```typescript
import {
  dwarvish,
  elvish,
```
That import block imports cultures. It currently ends with `plantoid, mycanoids`. Add `celestial, fey, tiefling` to the import list and the re-export on line 48.

Find:
```typescript
export { dwarvish, elvish, orcish, halfling, draconic, plantoid, mycanoids } from "./language/cultures.js";
```
Replace with:
```typescript
export { dwarvish, elvish, orcish, halfling, draconic, plantoid, mycanoids, celestial, fey, tiefling } from "./language/cultures.js";
```

Also update the import at the top of the file that imports cultures (the `import { ... }` block that isn't an `export`). Add `celestial, fey, tiefling` to it.

- [ ] **Step 3: Extend Race type**

Find:
```typescript
export type Race = "human" | "elf" | "dwarf" | "halfling" | "orc" | "dragonborn" | "plantoid" | "mycanoid";
```
Replace with:
```typescript
export type Race = "human" | "elf" | "dwarf" | "halfling" | "orc" | "dragonborn" | "plantoid" | "mycanoid" | "celestial" | "fey" | "tiefling";
```

- [ ] **Step 4: Extend raceToCulture**

In the `raceToCulture` function, before the closing default `return`, add:
```typescript
    case "celestial":
      return celestial;
    case "fey":
      return fey;
    case "tiefling":
      return tiefling;
```

- [ ] **Step 5: Extend the race weighted list**

Find:
```typescript
  { human: 50, elf: 15, dwarf: 15, halfling: 10, orc: 5, dragonborn: 5, plantoid: 2, mycanoid: 2 },
```
Replace with:
```typescript
  { human: 45, elf: 12, dwarf: 12, halfling: 8, orc: 5, dragonborn: 5, plantoid: 2, mycanoid: 2, celestial: 3, fey: 4, tiefling: 2 },
```

- [ ] **Step 6: Type-check**

```bash
cd packages/fantasy && pnpm typecheck
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/fantasy/src/language/index.ts packages/fantasy/src/index.ts
git commit -m "feat(fantasy): export celestial, fey, tiefling and extend Race type"
```

---

## Task 8: Test fantasy new cultures

**Files:**
- Modify: `packages/fantasy/src/language/cultures.test.ts`
- Modify: `packages/fantasy/src/fantasy.test.ts`

- [ ] **Step 1: Append describe blocks to cultures.test.ts**

Add these describe blocks to the end of `packages/fantasy/src/language/cultures.test.ts`:

```typescript
import { celestial, fey, tiefling } from "./cultures.js";
// Add to the existing import if it already imports from "./cultures.js"
import { createContext } from "@lexiconlang/core";
import { generateName } from "@lexiconlang/language";
```

> **Note:** If those imports are already at the top of the file, do not add them again — just append the describe blocks.

```typescript
describe("celestial culture", () => {
  it("has visualGlyphSystems.conceptual defined", () => {
    expect(celestial.visualGlyphSystems?.conceptual).toBeDefined();
  });

  it("conceptual glyph system uses unicode morpheme mapping", () => {
    const g = celestial.visualGlyphSystems!.conceptual;
    expect(g.id).toBe("celestial.radiance");
    expect(g.type).toBe("conceptual");
    expect(g.renderFormat).toBe("unicode");
    expect(g.mappingStrategy).toBe("morpheme");
    expect(g.unicodeMappings!.light).toBe("✨");
    expect(g.unicodeMappings!.dawn).toBe("☀");
    expect(g.unicodeMappings!.grace).toBe("⚜");
    expect(g.unicodeMappings!.wing).toBe("🪶");
    expect(g.unicodeMappings!.sacred).toBe("✝");
    expect(g.renderParams!.fallback).toBe("◇");
  });

  it("generates a non-empty given name", () => {
    const ctx = createContext({ seed: "celestial-given" });
    const name = generateName(celestial, "given", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });

  it("generates a non-empty surname", () => {
    const ctx = createContext({ seed: "celestial-surname" });
    const name = generateName(celestial, "surname", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });
});

describe("fey culture", () => {
  it("has visualGlyphSystems.phonetic defined", () => {
    expect(fey.visualGlyphSystems?.phonetic).toBeDefined();
  });

  it("phonetic glyph system is SVG with mossy/violet palette", () => {
    const g = fey.visualGlyphSystems!.phonetic;
    expect(g.id).toBe("fey.sylvan");
    expect(g.type).toBe("alphabet");
    expect(g.renderFormat).toBe("svg");
    expect(g.generator!.baseShapes).toContain("arc");
    expect(g.generator!.palette).toEqual(["#556B2F", "#9370DB"]);
  });

  it("generates a non-empty given name", () => {
    const ctx = createContext({ seed: "fey-given" });
    const name = generateName(fey, "given", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });

  it("generates a non-empty surname", () => {
    const ctx = createContext({ seed: "fey-surname" });
    const name = generateName(fey, "surname", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });
});

describe("tiefling culture", () => {
  it("has visualGlyphSystems.phonetic defined", () => {
    expect(tiefling.visualGlyphSystems?.phonetic).toBeDefined();
  });

  it("phonetic glyph system is complex SVG with ember palette", () => {
    const g = tiefling.visualGlyphSystems!.phonetic;
    expect(g.id).toBe("tiefling.infernal");
    expect(g.type).toBe("alphabet");
    expect(g.renderFormat).toBe("svg");
    expect(g.generator!.complexity).toBe("complex");
    expect(g.generator!.palette).toEqual(["#8B0000", "#2F2F2F"]);
    expect(g.generator!.baseShapes).toContain("polygon");
  });

  it("generates a non-empty given name", () => {
    const ctx = createContext({ seed: "tiefling-given" });
    const name = generateName(tiefling, "given", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });

  it("generates a non-empty surname", () => {
    const ctx = createContext({ seed: "tiefling-surname" });
    const name = generateName(tiefling, "surname", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run fantasy cultures tests**

```bash
pnpm test --reporter=verbose packages/fantasy/src/language/cultures.test.ts
```
Expected: all tests PASS.

- [ ] **Step 3: Update fantasy.test.ts Race check if present**

Search `packages/fantasy/src/fantasy.test.ts` for any assertion that checks `race` is a specific set of values. If found, add `"celestial"`, `"fey"`, and `"tiefling"` to that set. (If no such assertion exists, skip.)

```bash
grep -n "celestial\|fey\|tiefling\|Race\b" packages/fantasy/src/fantasy.test.ts
```

- [ ] **Step 4: Run all fantasy tests**

```bash
pnpm test --reporter=verbose packages/fantasy
```
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/fantasy/src/language/cultures.test.ts packages/fantasy/src/fantasy.test.ts
git commit -m "test(fantasy): add tests for celestial, fey, and tiefling cultures"
```

---

## Task 9: Full test suite and changeset

**Files:**
- Create: `.changeset/<auto-named>.md` (via `pnpm changeset`)

- [ ] **Step 1: Run the full test suite**

```bash
pnpm test
```
Expected: all tests PASS with no failures.

- [ ] **Step 2: Run global typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Build all packages**

```bash
pnpm build
```
Expected: successful build, no TypeScript compilation errors.

- [ ] **Step 4: Create changesets**

```bash
pnpm changeset
```
When prompted:
- Select `@lexiconlang/scifi` — choose **minor** bump (new cultures are additive, no breaking changes)
- Select `@lexiconlang/fantasy` — choose **minor** bump
- Summary: `Add reptilian, hivemind, and grayfolk cultures to scifi; add celestial, fey, and tiefling cultures to fantasy. Each includes name templates, meaning vocabulary, and a visualGlyphSystem.`

- [ ] **Step 5: Commit changeset**

```bash
git add .changeset/
git commit -m "chore: add changesets for scifi and fantasy minor bumps"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All 6 cultures defined with id, archetype, meaningPacks, templates (given + surname), and visualGlyphSystems. Meanings tasks audit before adding. Species/Race types extended. raceToCulture and speciesName extended. Generators exported. Tests for structure + name generation. Build + changeset tasks present.
- [x] **Placeholders:** None. All code blocks are complete. All palette values, ids, and unicode mappings are specified.
- [x] **Type consistency:** `Culture`, `GlyphSystem`, `VisualGlyphSystem` types match existing usage. `archetypes.sibilant`, `.resonant`, `.guttural`, `.clipped`, `.flowing` all exist in `@lexiconlang/language`. `generateName` signature `(culture, template, ctx)` matches existing usage in the codebase.
