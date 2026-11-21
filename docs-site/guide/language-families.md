# Language families and sound changes

::: tip New in v0.3
`@lexiconlang/language` now ships a deterministic **sound-change engine**,
**romanization profiles**, and **dialect/language-family derivation** in the
same package. All new APIs are opt-in: `generateWord`, `generateName` and
`buildLexicon` keep byte-identical output for existing seeds.
:::

A daughter language is not a re-rolled culture. It reuses the parent's
**meanings** and rewrites the parent's **token sequences** with ordered rules,
then renders them through an orthography. Shared meanings therefore yield
cognates by construction: `m:river` means the same thing in every daughter,
and its form is related because the tokens came from the same proto form.

## The rule DSL

```ts
import { parseSoundChange } from "@lexiconlang/language";

parseSoundChange("t > s / _ #"); // { from: ["t"], to: ["s"], after: [["#"]] }
parseSoundChange("{k,p} > {t,b} / # _"); // categories, two members
parseSoundChange("{k,p} > {t,b} / {a,e} _"); // category in the environment
parseSoundChange("t > s / # a _"); // multi-token environment with a boundary
parseSoundChange("e > 0 / _ #"); // deletion: to: []
```

| Part | Meaning |
| --- | --- |
| `from > to` | Token sequences. Categories use `{a,b}`; `0` means deletion. A single literal `from` cannot map to a category of several outputs. |
| `/ before _ after` | Environment. `_` is the target; `#` is the sequence boundary and may appear in any slot. Whitespace separates slots; `{a,b}` is one slot with alternatives. |
| JSON form | `{ key, from, to, before?, after? }` — pass through `parseSoundChangeRule` to validate. Each environment slot is an array of alternatives, e.g. `before: [["#"], ["a", "e"]]`; the legacy flat form `before: ["#"]` is also accepted. |

Rules are applied in authored order. Within one rule, each position fires at
most once and its output is not re-scanned by the same rule (nonrecursive per
pass); later rules may act on earlier output. `from` entries are literal tokens
(alternatives of a category), never regular expressions.

**Whole-word scope.** A rule sees the entire word's token sequence, including
when the parent culture inserts a syllable joiner. `#` matches only the start
or end of the whole word, and contexts may span syllable boundaries, so e.g.
`u > Z / r _` can rewrite `u` across a syllable break. The parent's joiner and
capitalization are restored when the daughter renders its form; a zero-change
daughter reproduces its parent byte-for-byte.

## Orthography and romanization

```ts
import {
  applyOrthography,
  createRomanizationProfile,
  type OrthographyData,
} from "@lexiconlang/language";

const ortho: OrthographyData = {
  id: "my.latin",
  mappings: [
    { from: "š", to: "š" },
    { from: "a", to: "a" },
  ],
  unknown: "preserve",
};

applyOrthography(["š", "a"], ortho); // "ša"
const ascii = createRomanizationProfile({
  diacritics: false,
  digraphs: { š: "sh" },
  asciiFold: true,
});
applyOrthography(["š", "ā", "a"], ortho, ascii); // "shaa"
```

Matching is longest-token first (ties by authored order) over the token
sequence, never over an already-joined string. `asciiFold` uses a small,
explicit, deterministic fold table — no locale collation. `diacritics: true`
(the default) **strips** diacritics; set it to `false` to keep them. When
`asciiFold` is enabled it takes precedence over `diacritics`. Profiles are
applied **after** word generation and sound changes, never to translations or
SVG.

## Deriving dialects

```ts
import { createContext } from "@lexiconlang/core";
import {
  deriveDialect,
  languageFamily,
  parseSoundChange,
  type TokenLexicon,
} from "@lexiconlang/language";

// proto is a TokenLexicon (build one with buildTokenLexicon(culture, ctx),
// or supply your own with tokensOf(meaningId)).
const northern = deriveDialect(
  proto,
  {
    id: "my.northern",
    parent: proto.cultureId,
    soundChanges: [parseSoundChange("a > e / _ #")],
  },
  ctx.child("northern"),
);

northern.formOf("m:star"); // rewritten form, capitalized like generated forms
northern.tokensOf("m:star"); // ["t", "a", "l", "e"]

// buildTokenLexicon also retains syllable groups and the parent's joiner:
// a daughter with zero sound changes reproduces its parent's forms exactly
// (e.g. "tis-pap" stays "tis-pap" for a culture with joiner "-").

const daughters = languageFamily(
  proto,
  [
    { id: "my.north", soundChanges: [parseSoundChange("a > e / _ #")] },
    { id: "my.south", soundChanges: [parseSoundChange("k > š / # _")] },
  ],
  ctx.child("family"),
);
daughters[0]!.cognatesWith(daughters[1]!, "m:river"); // true when tokens match
```

`deriveDialectFromCulture(culture, data, ctx)` is the direct bridge from a
`Culture`: it builds a token-retaining proto lexicon and derives the daughter
in one call. Further daughters can be chained by passing any `DerivedLanguage`
back into `deriveDialect`. Every `ctx.child(...)` fork has a stable key, so
adding or removing a branch cannot perturb sibling rolls.

Orthography is inherited unless overridden in the dialect descriptor. Local
morphology rules (`prefix` / `suffix` over literal tokens) are available only
on the dialect that declares them.

## Morphology helpers

| Helper | Rule | Example |
| --- | --- | --- |
| `plural(form)` | `-i` after consonants, `-ar` after vowels | `Velmar` → `Velmari` |
| `genitive(form)` | `-is` | `Velmar` → `Velmaris` |
| `demonym(place)` | `-i` | `Velmar` → `Velmari` |
| `adjectiveFromPlace(place)` | `-ic` | `Velmar` → `Velmaric` |
| `inflect(form, rule)` | custom prefix/suffix | `Velmar` + `u` → `Velmaru` |

The demonym helper is the same productive `-i` affix the place generators use,
so "Velmar" → "Velmari" stays consistent across both paths.

## Run it

See [`examples/11-dialects.ts`](https://github.com/ianlintner/lexiconlang/blob/main/examples/11-dialects.ts):

```bash
pnpm install
pnpm --filter examples dialects
```

## Provenance

All token inventories, mappings and rule sets in this package and its examples
are synthetic and original to lexiconlang; no third-party corpus or licensed
data is redistributed.
