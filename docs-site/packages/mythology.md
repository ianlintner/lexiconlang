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
// { form: "Frodi Finnson", translation: "wise one, son of Finn",
//   cultureId: "lexiconlang.mythology/culture/norse", ... }

console.log(m.place());    // { form: "Tlacaelle", translation: "the great heart" }
console.log(m.deity());    // "Thorn Ankh"
console.log(m.pantheon()); // "the Salt Maintain company"
console.log(m.epithet());  // "the Cold-Flying"
console.log(m.myth());     // "the punishment of Tzin"
console.log(m.holySite()); // "the Silent orchard"
console.log(m.artifact()); // "the Laughing Anvil"
console.log(m.monster());  // "the Salt Wraith"
console.log(m.faction());  // "the First Reapers"
console.log(m.mythHook().text);   // "A sacred tree withers on the day its keeper lies."
console.log(m.rite().text);       // "A small clay boat is floated downstream..."
console.log(m.relicPower().text); // "It protects its bearer from one act of betrayal."
console.log(m.omen().text);       // "A mirror clouds over from the inside."
```

Every method in `withSeed(seed)` draws from a stable child context: same seed and
call sequence ⇒ same output, and adding a generator never shifts existing ones.

## Generators

| Method | What it produces |
| --- | --- |
| `person()` | Given + surname with glosses and naming-style id |
| `place()` | Settlement name with gloss |
| `deity()` | Invented divine name |
| `pantheon()` | Divine family or council name |
| `epithet()` | Divine or heroic epithet |
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
