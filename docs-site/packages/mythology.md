# @lexiconlang/mythology

Original mythology & pantheons genre pack: deities, divine families, epithets,
myth titles, holy sites, legendary artifacts, monsters, cult orders and oracle
tables in five invented naming styles. Released at 0.1.0 under CC0-1.0.

All cultures are **inspired-by framing only** — fictionalised, not reconstructions
of any real religion. Three styles extend B1 base packs (greek, norse, celtic);
two are self-contained because their B2 bases have not merged yet.

```bash
pnpm add @lexiconlang/mythology
```

## Quick start

```ts
import { mythology } from "@lexiconlang/mythology";

const m = mythology.withSeed("old-oak");
console.log(m.person());
// { form: "Llalli Chicomecoatl", translation: "earth, seven serpent",
//   cultureId: "lexiconlang.mythology/culture/mesoamerican", ... }

console.log(m.place());    // { form: "Nekhen", translation: "the vulture town" }
console.log(m.deity());    // "Nor Dike"
console.log(m.pantheon()); // "the family of Lysaker"
console.log(m.epithet());  // "the Keeping of the Feast"
console.log(m.myth());     // "the burning grove at Dalar"
console.log(m.holySite()); // "the ruin at Petraea"
console.log(m.artifact()); // "the Hollow Ring"
console.log(m.monster());  // "the Bone Wend"
console.log(m.faction());  // "the lantern Order"
console.log(m.mythHook().text);   // "An old king bargains for one more harvest."
console.log(m.rite().text);       // "A small clay boat is floated downstream carrying a written regret."
console.log(m.relicPower().text); // "It grants one night of untroubled sleep."
console.log(m.omen().text);       // "Someone in the household dreams of a locked door."
console.log(m.culturalDeity());   // { form: "kratos", translation: "invented divine name" }
console.log(m.culturalEpithet()); // { form: "Many-Counselled", translation: "of many counsels" }
```

Every method in `withSeed(seed)` draws from a per-method child context: same seed and
call sequence ⇒ same output, and adding a generator never shifts existing ones.
`deity()` and `epithet()` use the pan-cultural grammars; `culturalDeity()` and
`culturalEpithet()` draw from each naming style's own deity/epithet banks.

## Generators

| Method | What it produces |
| --- | --- |
| `person()` | Given + surname with glosses and naming-style id |
| `place()` | Settlement name with gloss |
| `deity()` | Invented divine name |
| `culturalDeity()` | Glossed divine name from a naming style |
| `pantheon()` | Divine family or council name |
| `epithet()` | Divine or heroic epithet |
| `culturalEpithet()` | Glossed epithet from a naming style |
| `myth()` | Myth / legend title |
| `holySite()` | Shrine, grove or spring name |
| `artifact()` | Legendary artifact name |
| `monster()` | Mythic monster name |
| `faction()` | Cult or temple order name |
| `mythHook()` | Original plot hook (weighted oracle) |
| `rite()` | Fictional ritual description (weighted oracle) |
| `relicPower()` | Artifact folkloric effect (weighted oracle) |
| `omen()` | 2d6 divine omen reading (dice oracle) |

The manifest is available as `pack` or via `@lexiconlang/mythology/pack.json`.
All raw generators are exported via `generators`.

## Pack format

Built on the F2 declarative format: `data/mythology.pack.json` plus a thin typed
TypeScript facade. Schema version `pack-v1`; requires `language-v1`, `grammar-v1`,
`tables-v1` and `bases-v1`. Validated by `@lexiconlang/packs` (`validatePack`).

See the package README and `data/PROVENANCE.md` for framing and licensing notes.
