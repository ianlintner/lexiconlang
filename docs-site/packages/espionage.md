# @lexiconlang/espionage

Espionage & military genre pack built on the declarative F2 pack format.
Original, CC0-licensed content: operation codenames, callsigns, agencies,
units, safehouses, dead-drops, cover identities, mission briefings, ranks and
unit mottos.

```bash
pnpm add @lexiconlang/espionage
```

## Quick start

```ts
import { espionage } from "@lexiconlang/espionage";

const e = espionage.withSeed("cold-harbor");

e.operationCodename("op"); // "Operation Glass Parapet"
e.callsign("lead");        // "Yarrow Seven"
e.agencyName("home");      // "Joint Covert Support Office"
e.militaryUnit("escort");  // "101st Fusilier Group"
e.safehouse("hide");       // "a cheerful garden apartment in the university quarter"
e.deadDrop("drop");        // "a rolled newspaper in the orchard wall; the signal is a paper boat in the gutter"
e.insigniaMotto("badge");  // "Resolute shields"
e.officer("liaison");      // "Midshipman Vera Sorensen, Naval Service"
e.coverOccupation("job");  // "cultural exchange officer at Dovecote Publishing"
e.missionBriefing("tasking");
e.coverIdentityPostwar("a").form; // "Beryl Jarrett"
e.coverIdentityModern("b").form;  // "Fatima Nakamura"
e.meridianAgent("agent");   // { form: "Mirel Quillfeather", translation: "quiet one the scribe", ... }
e.meridianPlace("city");    // { form: "Venzor Nul", translation: "seventh coast", ... }
e.meridianFaction("org");   // { form: "Tormund Hesh", translation: "ridge guild", ... }
e.rank("r");                // "Naval Service: Lieutenant"
e.fieldComplication("fc");  // "The dead drop is cleared by a stranger."
e.assetReliability("ar");   // "Reliable — consistent, cautious, rarely volunteers more than asked."
```

Same seed plus same key gives byte-identical output. Keys are stable sub-paths:
adding a new call never changes an earlier result.

## Sample output

Seed family `espionage.withSeed("cold-harbor")`:

| Family | Sample |
| --- | --- |
| Operation codename | `Operation Glass Parapet` |
| Callsign | `Yarrow Seven` |
| Agency | `Joint Covert Support Office` |
| Military unit | `101st Fusilier Group` |
| Safehouse | `a cheerful garden apartment in the university quarter` |
| Dead-drop | `a rolled newspaper in the orchard wall; the signal is a paper boat in the gutter` |
| Officer | `Midshipman Vera Sorensen, Naval Service` |
| Cover identity (mid-century / modern) | `Beryl Jarrett` / `Fatima Nakamura` |
| Meridian place | `Venzor Nul` — "seventh coast" |
| Briefing | `Neutralise a trade-delegation interpreter at a customs checkpoint, while avoiding the border patrol.` |

## Cultures

- **postwar** and **modern** — generic cover-identity name pools for two eras.
- **meridian** — an invented tongue. Places, factions and agent names are built
  from literal morphemes that each carry an English meaning, so
  `Venzor Nul` renders as "seventh coast".

The generators use the grammar v1, structured-name v1 and F3 table engines. The
rank ladder, field complication and asset reliability families are oracles; the
reliability table is a d6.

## Portable data

```ts
import { pack } from "@lexiconlang/espionage";
import { createWorld } from "@lexiconlang/packs";

const world = createWorld({ seed: "my-campaign" }).use(pack);
const codename = world.generate("lexiconlang.espionage/generator/operation-codename", "op");
```

`src/espionage.pack.json` is a standalone F2 pack that validates with
`validatePack(data)` and leaves existing generator IDs untouched.

## License

Facade code MIT; all original pack data CC0-1.0. No real people, trademarks or
setting-specific IP.
