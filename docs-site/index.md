---
layout: home

hero:
  name: "Lexiconlang"
  text: "Procedural constructed languages"
  tagline: Deterministic, seeded conlangs with phonotactics, lexicons, culture-specific naming, and visual glyph systems.
  image:
    src: /hero.svg
    alt: Lexiconlang glyph
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/ianlintner/lexiconlang

features:
  - icon: 🎯
    title: Deterministic by construction
    details: "Pin a seed, ask for content. Same seed → byte-identical output across machines, runs, and library versions. Save = seed."
  - icon: 🗣
    title: Names with meaning
    details: "Every name decomposes into morphemes with English translations. Drakaztum isn't just a string — it's “Strong-anvil.”"
  - icon: 🌀
    title: Hierarchical seeds
    details: "ctx.child(label) forks a deterministic sub-stream. Order-independent, patch-stable, perfect for lazily-generated worlds."
  - icon: ✨
    title: Visual glyph systems
    details: "Optional SVG / Unicode / Canvas glyphs per culture. Same seed → identical writing system, every time."
  - icon: 🧩
    title: Composable primitives
    details: "compose, oneOf, weightedList, repeat, map, chain — strategies inter-operate behind one Generator<T> interface."
  - icon: 📦
    title: Tree-shakeable genre packs
    details: "Pull in only the cultures and generators you need: fantasy, sci-fi, modern, or build your own."
---

<style>
.VPHero .image-bg { display: none; }
</style>

## At a glance

```ts
import { fantasy } from "@lexiconlang/fantasy";

const game = fantasy.withSeed("campaign-1");

const name = game.npc.name.full;
// → { form: "Drakaztum Ironforge",
//     translation: "Strong-anvil Iron-forge",
//     language: "fantasy.dwarvish" }
```

Hand the same seed to a friend's machine and they generate the same NPC, the
same tavern, the same dragon. Encode `v:N` into the path to support
player-driven rerolls without disturbing the rest of the world.

## What's new in v0.3

- **`@lexiconlang/glyphs`** — visual writing systems with SVG / Unicode / Canvas renderers.
- **Per-culture glyph registries** on dwarvish, elvish, humanoid, and insectoid cultures.
- **Three mapping strategies** — phoneme, morpheme, and holistic.
- **Zero breaking changes** — glyphs are opt-in; existing code keeps working.

[Read the glyph system guide →](/guide/glyphs)
