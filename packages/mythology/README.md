# @lexiconlang/mythology

Declarative mythology & pantheons genre pack for LexiconLang. All names, glosses,
grammars and oracle tables live in [`data/mythology.pack.json`](./data/mythology.pack.json);
this package is a thin typed facade over that manifest.

**Framing:** every culture is *inspired by* a language family or historical naming
style and is deliberately fictionalised. No content is a reconstruction of a real
religion, no living person is named, and no trademarked or setting-specific IP is
used. See [PROVENANCE.md](./data/PROVENANCE.md).

## Install

```sh
pnpm add @lexiconlang/mythology
```

## Quick start

```ts
import { mythology } from "@lexiconlang/mythology";

const m = mythology.withSeed("old-oak");
console.log(m.person());   // { form: "Llalli Chicomecoatl", translation: "earth, seven serpent", ... }
console.log(m.place());    // { form: "Nekhen", translation: "the vulture town" }
console.log(m.deity());    // "Gullsend"
console.log(m.pantheon()); // "the Family of the Seven"
console.log(m.myth());     // "the burning grove at Dalar"
console.log(m.omen());     // { entry: "dream", text: "Someone in the household dreams of a locked door.", ... }
```

Every call in `withSeed(seed)` draws from its own child context, so the same seed
and call sequence always produce the same output, and adding a generator does not
change existing results. `deity()`/`epithet()` use pan-cultural grammars;
`culturalDeity()`/`culturalEpithet()` draw from each naming style's own banks.

## Generators

| Facade method | Generator | Output |
| --- | --- | --- |
| `person()` | `personName` | Given + surname with glosses and `cultureId` |
| `place()` | `placeName` | Settlement name with gloss |
| `deity()` | `deityName` | Invented deity name (grammar) |
| `culturalDeity()` | `culturalDeityName` | Glossed divine name from a naming style |
| `pantheon()` | `pantheonName` | Divine family / council name |
| `epithet()` | `epithet` | Divine or heroic epithet (grammar) |
| `culturalEpithet()` | `culturalEpithet` | Glossed epithet from a naming style |
| `myth()` | `mythTitle` | Myth or legend title |
| `holySite()` | `holySiteName` | Shrine / grove / spring name |
| `artifact()` | `artifactName` | Legendary artifact name |
| `monster()` | `monsterName` | Mythic monster name |
| `faction()` | `factionName` | Cult or temple order name |
| `mythHook()` | `mythHookOracle` | Original plot hook (table) |
| `rite()` | `sacredRiteOracle` | Fictional ritual description (table) |
| `relicPower()` | `relicPowerOracle` | Artifact folkloric effect (table) |
| `omen()` | `divineOmenOracle` | 2d6 omen reading (table) |

The raw generators are also exported individually via `generators`, and the
underlying validated manifest is exported as `pack` (or import the JSON directly
from `@lexiconlang/mythology/pack.json`).

## Naming styles

Five cultures ship, each with at least 24 given names, 24 surnames/epithets and
24 settlements, all with plain-English glosses:

- `hellenic` — inspired by romanized Ancient Greek; extends the greek B1 base.
- `norse` — inspired by Old Norse; extends the norse B1 base.
- `sylvan` — inspired by Old Irish / Gaelic; extends the celtic B1 base.
- `riverland` — inspired by ancient Egyptian naming; self-contained.
- `mesoamerican` — inspired by Nahuatl naming; self-contained.

`riverland` and `mesoamerican` are self-contained by design: although the B2
`ancient-egyptian` and `nahuatl` base packs are available on main, this pack does
not depend on them — its names are original fiction, not reconstructions of
historical forms. The manifest also declares a `pan-mythic` culture whose template
banks concatenate all five styles; it backs the manifest's all-culture name
generators and draws from the same selection pool as the facade. Note that the
manifest's `person-name` (`name-v1`, `kind: given`) emits a single given name,
while the facade's `person()` composes given + surname into a full person name.

## License

TypeScript source: MIT. All pack data: CC0-1.0 (public-domain dedication).
