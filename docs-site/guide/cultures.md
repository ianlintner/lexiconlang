# Cultures & morphemes

A **culture** in Lexiconlang is the unit that owns a language. It bundles
together:

- A **phonotactic archetype** — which sounds cluster together, syllable shapes, joiners
- **Meaning packs** — sets of morphemes (semantic units) with class and tag metadata
- **Name templates** — recipes for how morphemes combine into names
- (Optional) **A visual glyph system** — see [the glyph guide](/guide/glyphs)

## Phonotactic archetypes

Reusable templates that define a language's aesthetic:

| Archetype  | Feels like                | Used by                       |
| ---------- | ------------------------- | ----------------------------- |
| `flowing`  | Smooth, vowel-rich        | Elvish, aquatic, plantoid     |
| `guttural` | Hard consonant clusters   | Dwarvish, orcish              |
| `sibilant` | S/Z/Sh-heavy              | Draconic, insectoid           |
| `clipped`  | Short, light syllables    | Halfling                      |
| `resonant` | Long vowels, soft endings | Mycoid, some aquatic variants |

Cultures can override any field — most just spread an archetype and tweak the
joiner or syllable budget.

## Meaning packs and morphemes

A **morpheme** is a semantic unit with a class (`noun`/`adjective`/`verb`) and
tags. Examples:

```ts
{ id: "anvil",    class: "noun",      tags: ["industry", "metal"], label: "anvil" }
{ id: "strong",   class: "adjective", tags: ["strength", "war"],   label: "strong" }
{ id: "iron",     class: "noun",      tags: ["metal", "industry"], label: "iron" }
{ id: "fortify",  class: "verb",      tags: ["war", "industry"],   label: "fortify" }
```

Cultures combine multiple meaning packs: most fantasy cultures use
`coreMeanings` (general concepts) plus `fantasyIndustrial` (smithing, mining,
crafting) plus genre-specific packs.

## Name templates

Templates declare which morpheme kinds to pick and how to join them:

```ts
templates: {
  given: [
    [{
      kind: "compose",
      parts: [
        { pick: "adjective", tag: "strength", capitalize: true },
        { pick: "noun",      tag: "industry" },
      ],
      sep: "",          // form joiner — no separator
      transSep: "-",    // translation joiner — keep hyphens
    }, 1]
  ],
  surname: [/* ... */],
  settlement: [/* ... */],
}
```

The result is a `TranslatedName`:

```ts
{
  form: "Drakaztum",            // ← from culture's lexicon, generated on demand
  translation: "Strong-anvil",  // ← English morpheme labels
  language: "fantasy.dwarvish",
  parts: [
    { form: "Drakaz", meaning: "Strong" },
    { form: "tum",    meaning: "anvil" },
  ],
}
```

## The lexicon is generated, not stored

This is the part that distinguishes Lexiconlang from a wordlist library. A
culture doesn't carry a dictionary of conlang words. It carries a
**phonotactic recipe** and a **meaning pack**, and the conlang form for
"anvil" is *generated* the first time it's needed, from a hash of the culture
seed and the morpheme id.

That means:

- A culture has consistent words across all its names.
- Two players with the same seed have the same vocabulary.
- New morphemes can be added without breaking existing names.

## Available cultures

| Pack   | Culture       | Archetype   | Visual glyph system            |
| ------ | ------------- | ----------- | ------------------------------ |
| fantasy | dwarvish     | guttural    | SVG runes (phonemic)           |
| fantasy | elvish       | flowing     | Unicode ideograms (morphemic)  |
| fantasy | orcish       | guttural    | —                              |
| fantasy | halfling     | clipped     | —                              |
| fantasy | draconic     | sibilant    | —                              |
| scifi   | humanoid     | flowing     | Canvas geometric (holistic)    |
| scifi   | insectoid    | sibilant    | SVG chitin (phonemic)          |
| scifi   | aquatic      | flowing     | —                              |
| scifi   | synth        | clipped     | —                              |
| scifi   | birdpeople   | flowing     | —                              |
| scifi   | rockpeople   | guttural    | —                              |
| scifi   | mycoids      | resonant    | —                              |
| scifi   | mammalian    | flowing     | —                              |
| scifi   | plantoid     | flowing     | —                              |

Cultures without visual glyph systems can still have names generated — glyphs
are purely additive.
