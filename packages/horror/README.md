# @lexiconlang/horror

Horror and cosmic-horror genre pack for lexiconlang. Original, CC0-licensed
content: 1920s-style investigators, harsh-sounding eldritch entities with
epithets, forbidden tomes, cults, haunted places, small towns, sanity-shaking
omens, secrets and monster traits.

```bash
pnpm add @lexiconlang/horror
```

## Quick start

```ts
import { horror } from "@lexiconlang/horror";

const h = horror.withSeed("dunwich-1927");

h.investigator("lead");    // → "Insp. Rosalind Silverton"
h.eldritchEntity("thing"); // → "thul-ot"
h.forbiddenTome("book");   // → "Folio of the Cinder Water"
h.cult("locals");          // → "The Eye at the Rented Room"
h.hauntedLocation("site"); // → "the old cellar beneath the bakery"
h.town("setting");         // → { form: "Cindercross", translation: "Cindercross", ... }
h.omen("sign");            // → "lamps extinguishing in sequence"
h.monsterTrait("clue");    // → "a voice made of several voices"
```

Every method accepts a stable `key`; the same seed and key always give the
same output. Different keys are independent sibling rolls, so adding a new
call never shifts earlier results.

## What's included

| Family | Generator ID | Engine |
| --- | --- | --- |
| Investigators | `lexiconlang.horror/generator/investigator` | grammar v1 |
| Eldritch entities | `lexiconlang.horror/generator/eldritch-entity` | grammar v1 |
| Forbidden tomes | `lexiconlang.horror/generator/forbidden-tome` | grammar v1 |
| Cults | `lexiconlang.horror/generator/cult` | grammar v1 |
| Haunted places | `lexiconlang.horror/generator/haunted-location` | grammar v1 |
| Small towns | `lexiconlang.horror/generator/town` | name v1 |
| Omens, secrets, monster traits, forms, roles | five `.../generator/*` IDs | F3 weighted/dice tables |

The two naming styles are original fictional cultures: `investigator` uses
realistic 1920s-style literals; `eldritch` uses a consonant-dense,
unpronounceable sound inventory plus translated epithets. No real people,
trademarks, or setting-specific IP; all strings are synthetic fiction.

## Portable pack data

The F2 declarative pack lives at `src/horror.pack.json`. Import the frozen
pack to use it from a plain `@lexiconlang/packs` world:

```ts
import { pack } from "@lexiconlang/horror";
import { createWorld } from "@lexiconlang/packs";

const world = createWorld({ seed: "my-campaign" }).use(pack);
const name = world.generate("lexiconlang.horror/generator/eldritch-entity", "boss");
```

`pack` validates with zero diagnostics via `validatePack(data)`. Genre packs
declare their own IDs only; the facade does not import any aggregate index and
installs no base packs it does not reference.

## License

Facade code MIT; original pack data and corpora CC0-1.0. See `PROVENANCE.md`.
