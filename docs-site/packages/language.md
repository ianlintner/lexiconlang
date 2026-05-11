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
