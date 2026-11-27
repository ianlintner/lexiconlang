# @lexiconlang/espionage

Espionage & military genre pack for lexiconlang. Original, CC0-licensed content:
two-word operation codenames, callsigns, agencies, military units, safehouses,
dead-drops, cover identities (mid-century and modern), mission briefings,
ranks by branch, unit mottos, and an invented "Meridian" tongue whose place,
faction and agent names come with English translations.

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
e.deadDrop("drop");        // "a rolled newspaper in the orchard wall; the signal is ..."
e.missionBriefing("job");  // "Neutralise a trade-delegation interpreter at a customs checkpoint, ..."
e.coverIdentityModern("cover").form; // "Fatima Nakamura"
e.meridianPlace("city");   // { form: "Venzor Nul", translation: "seventh coast", ... }
e.rank("r");               // "Naval Service: Lieutenant"
```

Every method accepts a stable `key`; the same seed and key always give the same
output, and keys are independent sibling rolls.

## Generators (18)

`operation-codename`, `callsign`, `agency-name`, `military-unit`, `safehouse`,
`dead-drop`, `insignia-motto`, `officer`, `cover-occupation`, `mission-briefing`,
`cover-identity-postwar`, `cover-identity-modern`, `meridian-agent`,
`meridian-place`, `meridian-faction`, `rank-ladder`, `field-complication`,
`asset-reliability` (d6).

## Portable data

`src/espionage.pack.json` is a standalone F2 pack (`id: lexiconlang.espionage`)
exported as `@lexiconlang/espionage/espionage.pack.json`; install it into any
world with `createWorld({ seed }).use(pack)`.

## License

Facade code MIT; all original pack data CC0-1.0. See `PROVENANCE.md`.
