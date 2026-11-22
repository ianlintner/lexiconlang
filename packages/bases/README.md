# `@lexiconlang/bases`

Real-language-inspired base descriptors for LexiconLang. Six B1 bases:
**Norse, Celtic, Latin, Greek, Japanese, Arabic**.

Bases are *not* genres and not complete languages. Each is a compact bundle of
phonotactics, romanization, naming structure and a few literal placeholders —
designed to be imported selectively and extended by F2 packs.

> **Framing.** Every base is fictional, simplified and "inspired-by". See
> [PROVENANCE.md](./PROVENANCE.md) for authorship, licensing and sensitivity notes.

## Install

```sh
pnpm add @lexiconlang/bases
```

The package has **no runtime dependencies** beyond its workspace peers
(`@lexiconlang/core`, `@lexiconlang/language`, `@lexiconlang/packs`) and is
tree-shakeable (`sideEffects: false`).

## Direct use

Import a base through its subpath so bundlers can drop the other five:

```ts
import { createContext } from "@lexiconlang/core";
import { coreMeanings, generateName } from "@lexiconlang/language";
import { norse } from "@lexiconlang/bases/norse";
import { cultureFor, basePack, renderOrthography } from "@lexiconlang/bases";

// A frozen F1 Culture, ready for the existing generator APIs.
const culture = cultureFor(norse, [coreMeanings]);
const name = generateName(culture, "given", createContext({ seed: "demo" }));
console.log(name.form); // e.g. "Sven"

// Render a form through the base's orthography (longest match first).
console.log(renderOrthography("thorn", norse.orthography)); // "þorn"

// An F2 pack manifest that declares a `bases-v1` base and its root culture.
const manifest = basePack(norse);
```

### Sample names

| base | examples (`given`, seeds 0–3) |
| --- | --- |
| Norse | Sven, Bjorn, Naubul, Fokvaer |
| Celtic | Aedan, Mairin, Iabh, Eibhloai |
| Latin | Marcus, Lucius, Osupaem, Xaeroeeh |
| Greek | Alexis, Daphne, Bakoo, Ksoipreid |
| Japanese | Haru, Yuki, Haru, Yuki |
| Arabic | Layla, Karim, Layla, Karim |

## Use as an `extends` target in pack JSON

Each base ships a canonical pack manifest at
`data/<slug>/<slug>.pack.json`. A genre pack can inherit it:

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
  ],
  "...": "..."
}
```

The loader applies base defaults first, then the parent culture, then the child
culture. A child culture may not switch base away from its parent: create a new
root culture to select a different base.

`@lexiconlang/packs` now advertises `bases-v1` in `SUPPORTED_CAPABILITIES`;
`bases` resources validate and install with `definePack` / `createWorld`.

## API (`@lexiconlang/bases` root export)

| symbol | description |
| --- | --- |
| `BASE_SLUGS` | readonly tuple of the six slugs in spec order |
| `cultureFor(base, meaningPacks?)` | frozen F1 `Culture` from a base descriptor |
| `basePack(base)` | F2 pack manifest declaring the base and its root culture |
| `renderOrthography(form, orthography)` | pure, deterministic, longest-match token mapping |
| `defineBase(input)` | build a `BaseData` descriptor with defaults |
| `literal`, `pick` | template helpers used by the inline descriptors |

Per-base subpaths (`./norse`, `./celtic`, `./latin`, `./greek`, `./japanese`,
`./arabic`) export `rawData`, `culture`, `pack` and the default descriptor.

See [the docs-site page](../../docs-site/packages/bases.md) for the guided tour.
