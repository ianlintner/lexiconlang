# @lexiconlang/bases

Real-language-inspired base descriptors: phonotactics, romanization, naming
structures and small literal vocabularies for the 16 shipped bases — the six B1
bases (Norse, Celtic, Latin, Greek, Japanese, Arabic) and the ten B2 bases
(Slavic, Old English, Persian, Sanskrit, Mandarin, Nahuatl, Yoruba, Polynesian,
Ancient Egyptian, Finnish).

```bash
pnpm add @lexiconlang/bases
```

> **Inspired-by, not reconstruction.** Each base is fictional, simplified and
> deliberately incomplete. See the package's `PROVENANCE.md` for authorship,
> licensing (CC0-1.0) and the sensitivity framework.

## Why bases exist

A *base* is narrower than a genre. It carries only the phonological and naming
"shape" of a language family: consonant/vowel inventories, syllable templates,
a romanization table, and the structure of personal names (e.g. Norse
patronymic, Arabic nasab, Japanese family-first). Genre packs layer meaning
packs and content generators on top.

Import a base by subpath so bundlers tree-shake the other five:

```ts
import { createContext } from "@lexiconlang/core";
import { coreMeanings, generateName } from "@lexiconlang/language";
import { norse } from "@lexiconlang/bases/norse";
import { cultureFor, renderOrthography } from "@lexiconlang/bases";

const culture = cultureFor(norse, [coreMeanings]);
const ctx = createContext({ seed: "demo" });
generateName(culture, "given", ctx).form;  // e.g. "Sven"

renderOrthography("thorn", norse.orthography); // "þorn"
```

`cultureFor()` returns a frozen, ordinary F1 `Culture` usable with every
existing `@lexiconlang/language` API. Pass a meaning pack array when you want
composed names; omit it for literal-only templates.

B2 example — Mandarin family-first with optional tone marks:

```ts
import { createContext } from "@lexiconlang/core";
import { coreMeanings, generateStructuredName } from "@lexiconlang/language";
import { mandarin } from "@lexiconlang/bases/mandarin";
import { cultureFor, renderOrthography } from "@lexiconlang/bases";

const culture = cultureFor(mandarin, [coreMeanings]);
const name = generateStructuredName(
  culture,
  { structure: "mandarin.family-first" },
  createContext({ seed: "demo" }),
);
console.log(name.form); // family name, space, given name

renderOrthography("la", mandarin.orthography);  // "lā"
renderOrthography("lā", mandarin.romanization); // "la"
```

## The six bases

| subpath | inspired by | naming structure | sample names |
| --- | --- | --- | --- |
| `./norse` | Old Norse | patronymic (`-son` slot) | Sven, Bjorn, Naubul |
| `./celtic` | Old Irish / Gaelic-Welsh | given-only | Aedan, Mairin, Eibhloai |
| `./latin` | Classical Latin | tria-nomina shape | Marcus, Lucius, Osupaem |
| `./greek` | Ancient Greek (romanized) | given-only | Alexis, Daphne, Bakoo |
| `./japanese` | Modern Japanese (romanized) | family-first | Haru, Yuki, Dizoshouo |
| `./arabic` | Modern Standard Arabic (romanized) | nasab / kunya | Layla, Karim, Dhaamuus |

All literal names are invented placeholders; no sacred, restricted or
living-person names ship.

## The ten B2 bases

| subpath | inspired by | naming structure | scope note |
| --- | --- | --- | --- |
| `./slavic` | Old East Slavic (romanized) | patronymic | soft/hard consonant pairs |
| `./old-english` | Old English | patronymic | Germanic clusters, æ/þ |
| `./persian` | New Persian (romanized) | nasab | long vowels |
| `./sanskrit` | Sanskrit (romanized) | patronymic | aspirates, long vowels |
| `./mandarin` | Mandarin pinyin | family-first | tone marks + ASCII pinyin fallback |
| `./nahuatl` | Classical Nahuatl | given-only | `tl`/`ts` clusters |
| `./yoruba` | Yoruba | given-only | open syllables, tone + ASCII fallback |
| `./polynesian` | Māori-inspired | given-only | CV-only phonotactics |
| `./ancient-egyptian` | Ancient Egyptian (romanized) | given-only | consonantal frames |
| `./finnish` | Finnish | given-family | vowel harmony |

`./mandarin`, `./yoruba` and `./polynesian` ship an `orthography` with diacritics
and a matching `romanization` table back to ASCII. Diacritics are opt-in — call
`renderOrthography(form, base.orthography)` when you want them; generated names
use the authored ASCII forms by default.

`./polynesian` is a documented Māori-inspired **fictional** CV-only sound
palette; no iwi, marae, deity names or pan-Polynesian claim is made. The broad
B2 labels are package-discovery categories, not claims of cultural uniformity.
The S0 spec's `ancient-egyptian` slug is used in place of the roadmap's shorter
`egyptian` label; the spec wins and this is the only deviation from the card.

## Use as an F2 `extends` target

Every base has a canonical pack manifest at `data/<slug>/<slug>.pack.json`:

```ts
import { definePack, createWorld } from "@lexiconlang/packs";
import { norse } from "@lexiconlang/bases/norse";
import { basePack } from "@lexiconlang/bases";

const world = createWorld({ seed: "my-world" });
world.use(definePack(basePack(norse)));
```

A genre pack declares `"extends"` on the base pack and sets
`"requires": ["language-v1", "bases-v1"]` to inherit its culture:

```json
{
  "formatVersion": 1,
  "id": "mygenre.pack",
  "extends": [{ "id": "lexiconlang.bases.norse", "version": "^0.1.0" }],
  "requires": ["language-v1", "bases-v1"],
  "cultures": [
    {
      "id": "mygenre.pack/culture/default",
      "extends": "lexiconlang.bases.norse/culture/default"
    }
  ]
}
```

Base defaults are applied before the parent culture and the child culture. A
child may not switch base away from its inherited parent — create a new root
culture to select a different base.

`@lexiconlang/packs` advertises `bases-v1` in `SUPPORTED_CAPABILITIES`, so base
resources validate and install with `definePack` / `createWorld`.

## Root exports

`BASE_SLUGS`, `cultureFor`, `basePack`, `renderOrthography`, `defineBase`,
`literal`, `pick`, and the `BaseData` / `BaseSlug` / `OrthographyData` /
`SensitivityData` types. Each subpath additionally exports `rawData`, `culture`
and `pack`.
