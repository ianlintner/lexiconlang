---
"@lexiconlang/fantasy": minor
---

Add the opt-in expanded fantasy pack: two original human naming cultures
(`humanV2`) plus tavern, spell, magic-item, pantheon, guild, rumor and shop
oracles, authored as a versioned pack-v1 JSON manifest and exposed through
`expandedWithSeed`. Legacy generators keep their IDs and byte-identical output.

All open-ended generators reach at least 60 distinct results in 100 rolls on
one seed family (asserted per generator); the two closed categorical selectors
(`spellSchool`, `magicItemRarity`) are explicitly exempt. Table entries compose
a core phrase with an independently rolled detail phrase via pack-v1
`sequence` results, and name pools use original synthetic morphemes.
`expandedGenerators` adapters now derive their world from the supplied
context's RNG under a stable child key, so different context seeds produce
different draws and equal seed+scope pairs reproduce exactly. The unused
`ExpandedAPI.context` field was removed.
