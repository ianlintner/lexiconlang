# Design: 6 new cultures for sci-fi and fantasy packs

**Date:** 2026-05-11
**Status:** Draft — pending review
**Scope:** Additive only. No breaking changes.

## Goal

Expand `@lexiconlang/scifi` and `@lexiconlang/fantasy` with 3 new cultures each (6 total), filling obvious gaps in the existing roster and giving each pack more thematic range. Every new culture ships with name templates, meaning packs, and a `visualGlyphSystem`.

## Current roster (for context)

- **Sci-fi (9):** humanoid, insectoid, aquatic, synth, birdpeople, rockpeople, mycoids, mammalian, plantoid
- **Fantasy (7):** dwarvish, elvish, orcish, halfling, draconic, plantoid, mycanoids

## New cultures

### Sci-fi (`@lexiconlang/scifi`)

#### 1. `scifi.reptilian`
- **Concept:** Cold-blooded predator-strategists; patient, deliberate, ancient.
- **Archetype:** `sibilant`, joiner `""` — hissing, sinuous syllables.
- **Templates:** `given` composes `adjective[predator|cold]` + `noun[predator|biology]` (e.g. `Patient Fang`, `Cold Scale`). `surname` composes `noun[geology|biology]` + `noun[predator]` (e.g. `Stone-Coil`).
- **Visual glyph system:** `phonetic` alphabet, SVG, complexity `complex`, asymmetric. Base shapes `["arc", "line", "polygon"]`. Palette: deep green/bronze (`["#556B2F", "#8B7500"]`). Size 30, stroke 1.5.

#### 2. `scifi.hivemind`
- **Concept:** Distributed AI collective; identity lives in the network, not the node.
- **Archetype:** `clipped`, joiner `"."` — short, dotted, packet-like (e.g. `Node.7`, `Sync.Vault`).
- **Templates:** `given` composes `noun[network|collective]` + `noun[technology|node]` joined by `.`. Includes `{ literal: <digit>, translation: "index" }` patterns for occasional ID-style names.
- **Visual glyph system:** `phonetic` alphabet, SVG, complexity `medium`, no symmetry. Base shapes `["rect", "line"]` — orthogonal mechanical grid. Palette: cyan/silver (`["#00CED1", "#C0C0C0"]`). Size 26, stroke 1.

#### 3. `scifi.grayfolk`
- **Concept:** Hyper-intelligent observer civilization; telepathic, large-eyed, ancient. Names read as mind-states or detached observations.
- **Archetype:** `resonant`, joiner `""` — thrumming, smooth.
- **Templates:** `given` composes `adjective[mind|awareness|advanced]` + `noun[mind|awareness]` (e.g. `Quiet Cognition`, `Vast Memory`). `surname` composes `noun[knowledge|mystery]` + `noun[mind]` (e.g. `Archive Awareness`).
- **Visual glyph system:** `conceptual` unicode mapping, complexity `simple`. Big-eye / sphere motif maps morphemes like `eye/orb/watch/observe/awareness` to ◉, `mind/cognition/consciousness` to ⊙, `void/quiet/silence` to ◯, `archive/memory` to ⌬, `quantum/anomaly` to ✦. `renderParams.fallback: "◌"`.

### Fantasy (`@lexiconlang/fantasy`)

#### 4. `fantasy.celestial`
- **Concept:** Angel-touched / aasimar lineage; divine, radiant, principled.
- **Archetype:** `resonant`, joiner `""` — flowing, vowel-rich.
- **Templates:** `given` composes `adjective[light|good|divine]` + `noun[light|divine|celestial]` (e.g. `Radiant Dawn`, `Bright Halo`). `surname` composes `noun[celestial|sky]` + `noun[divine|grace]` (e.g. `Starwarden`, `Sunhallow`). `settlement` composes `noun[divine]` + `noun[structure]` (e.g. `Hallowed Citadel`).
- **Visual glyph system:** `conceptual` unicode mapping. Maps `light/radiant/bright/dawn` → ✨, `sun/sunlight` → ☀, `star/starlight` → 🌟, `moon` → 🌙, `crown/halo/grace` → ⚜, `feather/wing` → 🪶, `holy/divine/sacred` → ✝, `song/blessing` → 🎵. `renderParams.fallback: "◇"`.

#### 5. `fantasy.fey`
- **Concept:** Sylvan tricksters / sidhe; magic-of-nature, song, dream, mischief.
- **Archetype:** `sibilant`, joiner `""` — whispery, lilting.
- **Templates:** `given` composes `adjective[nature|magic|dream]` + `noun[nature|song|dream]` (e.g. `Wild Lullaby`, `Mistwhisper`). `surname` composes `noun[nature]` + `noun[magic|song]` (e.g. `Hollowdream`, `Briarsong`).
- **Visual glyph system:** `phonetic` alphabet, SVG, complexity `medium`, asymmetric. Base shapes `["arc", "line"]` — organic curves and tendrils. Palette: moss/violet (`["#556B2F", "#9370DB"]`). Size 26, stroke 1.5.

#### 6. `fantasy.tiefling`
- **Concept:** Infernal / demon-blooded lineage; fire, oath, defiance.
- **Archetype:** `guttural`, joiner `""` — sharp, hard syllables.
- **Templates:** `given` composes `adjective[fire|evil|shadow]` + `noun[fire|evil]` (e.g. `Ember Oath`, `Shadow Vow`). `surname` composes `noun[fire|shadow]` + `noun[contract|power]` (e.g. `Ashbinder`, `Soothrender`).
- **Visual glyph system:** `phonetic` alphabet, SVG, complexity `complex`, asymmetric. Base shapes `["polygon", "line"]` — sharp angular sigils. Palette: ember/onyx (`["#8B0000", "#2F2F2F"]`). Size 28, stroke 2.

## Implementation outline

For each genre pack:

1. **Extend `meanings.ts`** with any missing vocabulary the new templates depend on. Survey first, then add only what's needed. Likely gaps to fill:
   - **scifi:** `scale`, `slither`, `venom`, `ambush`, `patient`, `cold` (reptilian); `consensus`, `broadcast`, `parallel`, `distributed`, `index` (hivemind); `observer`, `psionic`, `telepathy`, `enigma`, `silence`, `eye`, `orb`, `watch` (grayfolk).
   - **fantasy:** `radiant`, `dawn`, `halo`, `hallow`, `seraph`, `feather`, `wing`, `grace`, `bless`, `holy` (celestial); `whisper`, `mist`, `dream`, `lullaby`, `briar`, `hollow`, `glamour`, `pixie`, `sprite` (fey); `ember`, `ash`, `horn`, `oath`, `vow`, `sooth`, `infernal`, `cinder`, `pact` (tiefling). Check existing entries before adding to avoid duplicates.
2. **Add `Culture` exports** in `language/cultures.ts` (one per new culture).
3. **Re-export** from `language/index.ts` and the package's `src/index.ts`.
4. **Tests** in `cultures.test.ts` (fantasy already has one; create one for scifi if missing): for each new culture, generate a sample given/surname name and assert non-empty strings + correct morpheme tags. Tests follow the existing pattern in `packages/fantasy/src/language/cultures.test.ts`.
5. **Changesets:** one minor bump per package (`@lexiconlang/scifi` and `@lexiconlang/fantasy`).

## Out of scope

- New archetypes in `@lexiconlang/language` — reusing existing ones.
- Docs-site updates (`docs-site/guide/glyphs.md`) — can be a follow-up.
- README updates within each package — only if trivially adjacent to the diff.
- New rendering engines or glyph types — using only existing `conceptual` / `alphabet` types and `svg` / `canvas` / `unicode` formats.

## Risks & open questions

- **Vocabulary collisions:** `meanings.ts` may already contain some words I'd add (e.g. `dawn`, `oath`, `bless`). Plan handles this by surveying before adding.
- **Tag-template mismatch:** if a template references a tag with zero matching meanings, name generation falls through. Tests must assert each new culture produces a valid name. Add meanings *before* wiring the template if a tag would otherwise be empty.
- **`grayfolk` naming:** the id `scifi.grayfolk` is a working name. If the user prefers `scifi.gray`, `scifi.observer`, or `scifi.psion`, rename before finalizing.
