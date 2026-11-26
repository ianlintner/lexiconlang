# @lexiconlang/horror

Horror and cosmic-horror genre pack built on the declarative F2 pack format.
Original, CC0-licensed content for 1920s-style investigators, unpronounceable
eldritch entities, forbidden tomes, cults, haunted places, small towns, omens
and monster traits.

```bash
pnpm add @lexiconlang/horror
```

## Quick start

```ts
import { horror } from "@lexiconlang/horror";

const h = horror.withSeed("dunwich-1927");

h.investigator("lead");     // "Insp. Rosalind Silverton"
h.eldritchEntity("thing");  // "thul-ot"
h.forbiddenTome("book");    // "Folio of the Cinder Water"
h.cult("locals");           // "The Eye at the Rented Room"
h.hauntedLocation("site");  // "the old cellar beneath the bakery"
h.town("setting");          // { form: "Cindercross", translation: "Cindercross", ... }
h.omen("sign");             // "lamps extinguishing in sequence"
h.secret("town");           // "the town's founding pact is renewed each winter"
h.monsterTrait("clue");     // "a voice made of several voices"
h.monsterForm("glimpse");   // "a shape glimpsed between travels"
```

Same seed plus same key gives byte-identical output. Keys are stable sub-paths:
adding a new call never changes an earlier result.

## Sample output

A small investigation seed family (`horror.withSeed("the-silver-cord")`):

| Family | Sample |
| --- | --- |
| Investigator | `Prof. Cecilia Valentine` |
| Eldritch entity | `nyxar'nykorr` |
| Forbidden tome | `The Thornbound Register` |
| Cult | `Order of the Thorn` |
| Haunted place | `cliffside lighthouse near Mistbrook` |
| Town | `Cindergate` |
| Omen | `a second moon visible at noon` |
| Secret | `the mayor's family never buries their dead` |
| Monster trait | `an outline that flickers at the edges` |

## Content and engines

Two original fictional cultures back the names:

- **investigator** — realistic 1920s-style literals giving names, surnames and
  small-town names with meaningful translations.
- **eldritch** — a consonant-dense, unpronounceable sound inventory and
  translated epithets producing entity names such as `tharn'vorrath`.

The eleven generators use grammar v1, name v1 and F3 weighted-table engines.
The omen, secret, monster-trait, monster-form and investigator-role families
are text oracles with every entry reachable from a fixed seed.

## Portable data

```ts
import { pack } from "@lexiconlang/horror";
import { createWorld } from "@lexiconlang/packs";

const world = createWorld({ seed: "my-campaign" }).use(pack);
const entity = world.generate(
  "lexiconlang.horror/generator/eldritch-entity",
  "boss",
);
```

`src/horror.pack.json` is a standalone F2 pack: `id: lexiconlang.horror`,
`formatVersion: 1`, `requires: [language-v1, grammar-v1, tables-v1]`,
`depends: []`. It validates with `validatePack(data)` with zero diagnostics and
installs no base packs it does not reference. Existing fantasy/scifi/modern
generator IDs and outputs are untouched.

## License

Facade code MIT; all original pack data CC0-1.0. No real people, trademarks or
setting-specific IP.
