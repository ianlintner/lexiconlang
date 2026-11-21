# @lexiconlang/language

The language system: phonotactics, lexicon generation, morpheme packs, and name
templates.

```bash
pnpm add @lexiconlang/language
```

## What it does

A culture in Lexiconlang owns a *language* — a phonotactic recipe and a set of
meaning packs. The package generates conlang forms on demand from the seed, so
a culture's vocabulary is consistent and reproducible without storing a
dictionary.

## Generate a name from a culture

```ts
import { createContext } from "@lexiconlang/core";
import { generateName } from "@lexiconlang/language";
import { dwarvish } from "@lexiconlang/fantasy";

const ctx = createContext({ seed: "my-world" });
const name = generateName(dwarvish, "given", ctx.child("hero"));

name.form;         // "Drakaztum"
name.translation;  // "Strong-anvil"
name.language;     // "fantasy.dwarvish"
```

## Build a lexicon directly

```ts
import { buildLexicon } from "@lexiconlang/language";

const lexicon = buildLexicon(dwarvish, ctx);
lexicon.lookup("anvil"); // "ztum" — the dwarvish form for "anvil"
lexicon.lookup("strong"); // "drakaz"
```

The lexicon is content-addressable: `lookup("anvil")` is deterministic given
the culture seed.

## Key types

| Type             | Purpose                                                   |
| ---------------- | --------------------------------------------------------- |
| `Culture`        | Phonotactic system + meaning packs + name templates       |
| `GlyphSystem`    | Phonotactic configuration (consonants, vowels, syllables) |
| `MeaningPack`    | Set of morphemes with class and tag metadata              |
| `Morpheme`       | Single semantic unit (class, tags, label, id)             |
| `NameTemplate`   | Recipe for composing morphemes into a name                |
| `TranslatedName` | Output: `{ form, translation, language, parts?, glyphs? }` |
| `Lexicon`        | Culture-specific meaning → conlang form mapping           |

## Built-in archetypes

```ts
import { archetypes } from "@lexiconlang/language";
// archetypes.flowing, .guttural, .sibilant, .clipped, .resonant
```

See [Cultures & morphemes](/guide/cultures) for the full guide.

## Content blocklist (F4)

Generated names and words can be screened against a blocklist of profanity and
accidental real-word collisions. Screening is **opt-in**: `generateName` and all
existing culture packs are unchanged. Use `generateNameFiltered` when you want
a filter, or `blocklist` to wrap any generator.

- Comparison uses an **ASCII-folded copy** (NFKC + accents/case folded); the
  emitted form is never modified. Both `form` and `translation` are checked.
- `whole-token` (default) matches bounded words; `substring` matches embedded
  terms.
- `DEFAULT_BLOCKLIST` is a small, original, CC0-1.0 curated list with an inline
  provenance note in the package. It is best-effort, not exhaustive.
- Per-culture/per-pack lists are composed by passing an array of `Blocklist`
  values; each has an `id` and optional `provenance`.

```ts
import { createContext } from "@lexiconlang/core";
import { DEFAULT_BLOCKLIST, createBlocklist, generateNameFiltered } from "@lexiconlang/language";
import { dwarvish } from "@lexiconlang/fantasy";

const packSafety = createBlocklist({
  id: "my-game.dwarvish/safety",
  terms: ["grim", "stash"],
  mode: "whole-token",
});

const ctx = createContext({ seed: "party" });
const name = generateNameFiltered(dwarvish, "given", ctx.child("name"), {
  blocklists: [DEFAULT_BLOCKLIST, packSafety],
  maxAttempts: 32,
});
```

Exhaustion throws `ConstraintExhaustedError` from `@lexiconlang/core`. Retries
derive from `ctx.child("attempt:<i>")`, so filtered results are deterministic.
