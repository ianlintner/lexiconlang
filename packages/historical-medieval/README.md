# @lexiconlang/historical-medieval

A declarative, deterministic genre pack for historical-medieval-flavoured test data: people, manors, guilds, monasteries, feudal titles, market goods and prices, domain events, and a simple heraldry generator that emits a blazon string plus an SVG shield.

All data is original synthetic CC0-1.0 material — see [`data/PROVENANCE.md`](./data/PROVENANCE.md). Nothing here claims universal historical accuracy.

```bash
pnpm add @lexiconlang/historical-medieval
```

## Quick start

```ts
import { historicalMedieval } from "@lexiconlang/historical-medieval";

const hm = historicalMedieval.withSeed("my-seed");

hm.name();       // { given, byname, full, culture, translation }
hm.manor();      // "Ashford Grange"
hm.guild();      // "Guild of Weavers"
hm.monastery();  // "Abbey of St. Hilda"
hm.title();      // "Marcher Lord"
hm.listing();    // { good: "saffron", price: 8, unit: "shilling" }
hm.event();      // "the harvest failed in the north"
hm.arms();       // { field, charge, chargeTincture, attitude, blazon }
hm.shield();     // '<svg …>…</svg>'
```

Every method draws from a key-scoped sub-context, so identical seeds and call sequences reproduce identical output. Values also depend on call order within one seeded facade.

## API

- `withSeed(seed)` — seeded facade (the recommended entry point).
- `personName` / `personNameGenerator({ culture })` — names from four original naming cultures (`latin`, `oldenglish`, `celtic`, `norse`), with translations.
- `manorName`, `guildName`, `monasteryName` — grammar-backed place and organization names from the pack.
- `feudalTitle`, `marketGood`, `marketListing`, `domainEvent` — weighted tables sourced from the pack.
- `heraldry` — `Generator<HeraldicDevice>`; `hasHeraldicContrast(field, tincture)`, `blazon(device)` and `shieldSvg(device)` expose the rule and the text/SVG renderings.
- `cultures` — the four naming cultures with given-name and byname pools.
- `historicalMedievalPack` — the underlying validated pack manifest (`lexiconlang.historical-medieval`).

## Heraldic rules (documented subset)

- **Field** and **charge tincture** are chosen from seven conventional tinctures: Or, Argent, Azure, Gules, Sable, Vert, Purpure.
- The generator picks the charge tincture directly from the opposite metal/colour class (no rejection sampling); `hasHeraldicContrast(field, tincture)` exposes the predicate. The generator does not enforce every historical exception; `blazon(device)` renders a caller-supplied device verbatim, so callers using it directly remain responsible for their own rules.
- **Attitude** is selected from rampant, passant, statant, displayed, salient and segreant. Attitudes apply to living charges; static charges render without an attitude (e.g. `"Gules, a cross Or"`).
- The declarative grammar in the pack JSON uses a simplified template (`a <charge> <attitude>` for every charge) and draws given names and bynames from a shared pool; the typed facade above applies full English articles, living-charge attitudes and per-culture selection. Both are deterministic.
- A blazon has the form `"<Field>, a|an <charge> <attitude?> <ChargeTincture>"`, e.g. `"Azure, a lion rampant Or"`. Articles follow English usage (`an eagle`).
- The SVG renderer is intentionally simple (shield path + representative glyph), suitable for test fixtures rather than heraldic publication.

## Pack format and quality

The pack is JSON (`data/historical-medieval.pack.json`) validated with `@lexiconlang/packs` and exposed through this thin typed TS facade. It declares four cultures, five grammars (manor, guild, monastery, person-name, heraldry), five weighted tables and eight declarative generator descriptors; the TS facade exposes eleven generators (the extra three are market unit, market listing and culture selection). Table pools contain 170 entries each for titles, market goods and events; tests assert that 100 rolls on one seed family yield ≥ 60% distinct results per family.

### Measured duplicate rates (1,000 draws per family)

| Family | Duplicate rate |
| --- | --- |
| person name | 0.365 |
| manor name | 0.333 |
| guild name | 0.581 |
| monastery name | 0.861 |
| feudal title | 0.830 |
| market good | 0.830 |
| domain event | 0.830 |
| market listing | 0.059 |
| heraldry | 0.388 |

Finite pools cap distinct values: the 170-entry tables necessarily yield at least 0.83 duplicates at 1,000 draws, so these are reported rather than presented as balance claims. The heraldry figure is higher because the enforced metal/colour contrast excludes roughly half of the 7×7 tincture pairs. Weights in the pack JSON are retained by the declarative engines; the thin TS facade samples the same pools uniformly. No claim is made that any distribution is "balanced" or historically representative.
