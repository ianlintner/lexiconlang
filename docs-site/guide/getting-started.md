# Getting started

Lexiconlang is a TypeScript toolkit for generating procedural names, languages,
and worldbuilding artifacts that are **deterministic, seeded, and composable**.

## Install

::: code-group

```bash [pnpm]
pnpm add @lexiconlang/language @lexiconlang/fantasy
```

```bash [npm]
npm install @lexiconlang/language @lexiconlang/fantasy
```

```bash [yarn]
yarn add @lexiconlang/language @lexiconlang/fantasy
```

:::

Other useful packages:

```bash
# Visual writing systems (SVG / Unicode / Canvas glyphs)
pnpm add @lexiconlang/glyphs

# Sci-fi and modern genre packs
pnpm add @lexiconlang/scifi @lexiconlang/modern

# Lower-level building blocks
pnpm add @lexiconlang/core @lexiconlang/grammar @lexiconlang/markov
```

**Requirements:** Node ≥ 20 or any modern browser. ESM-only. No native deps.

## Your first generator

The smallest useful program — pin a seed, ask for content:

```ts
import { fantasy } from "@lexiconlang/fantasy";

const game = fantasy.withSeed("hello-world");

const innkeeper = game.npc;
console.log(`${innkeeper.name.full}, ${innkeeper.age} — ${innkeeper.occupation}`);
console.log(`Trait: ${innkeeper.personality.trait}`);
console.log(`Quirk: ${innkeeper.personality.quirk}`);
```

Run this file. Run it again. Run it on a colleague's machine. **Output is identical
every time.** That's the central property — it isn't a happy accident, it's the
whole design.

## Generate names with meaning

Names aren't opaque strings. Every conlang name decomposes into morphemes with
English translations:

```ts
import { fantasy } from "@lexiconlang/fantasy";

const game = fantasy.withSeed("campaign-1");
const name = game.npc.name.full;

name.form;        // "Drakaztum Ironforge"        ← conlang
name.translation; // "Strong-anvil Iron-forge"    ← morphemes
name.language;    // "fantasy.dwarvish"
name.toString();  // "Drakaztum Ironforge"        ← template-string friendly
```

## Next steps

- [The seeding model](/guide/seeding) — how `ctx.child(label)` makes worlds reproducible
- [Cultures & morphemes](/guide/cultures) — how a conlang gets its words
- [Visual glyph systems](/guide/glyphs) — render names as SVG runes, Unicode ideograms, or Canvas glyphs
- [Composing generators](/guide/composing) — build your own `Generator<T>` from primitives
