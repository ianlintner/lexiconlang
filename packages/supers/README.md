# @lexiconlang/supers

A declarative genre pack for masked-hero fiction, published at `0.1.0` under
CC0-1.0. All content lives in `data/supers.pack.json`; `src/index.ts` is a thin
typed facade.

## Generators

- **Codenames** — `hero()`, `villain()`
- **Powers and limits** — `power()`, `limit()` (2d6 oracle), `powerSet()`
- **Origins** — `origin()`
- **Teams and organizations** — `team()`
- **Modern secret identities** — `person()` (two glossed naming styles)
- **Places** — `place()`, `lair()`
- **Narrative hooks** — `headline()`, `motto()`, `incident()`, `omen()`

## Example

```ts
import { supers } from "@lexiconlang/supers";

const gen = supers.withSeed("nightwatch-17");
console.log(gen.hero());           // "Open Finch"
console.log(gen.villain());        // "Razor I"
console.log(gen.person().form);    // "Kira Kane"
console.log(gen.dossier());        // full costumed identity
```

See [docs-site/packages/supers.md](../../docs-site/packages/supers.md) for the
full API, sample output and cross-genre usage.

## Data and provenance

Two original modern naming styles, eight grammars and three weighted/dice
tables supply the content. No real living people, trademarks or borrowed
setting IP. See [data/PROVENANCE.md](data/PROVENANCE.md) and
[data/LICENSES/CC0-1.0.txt](data/LICENSES/CC0-1.0.txt).
