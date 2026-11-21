---
"@lexiconlang/language": minor
"@lexiconlang/fantasy": minor
"@lexiconlang/scifi": minor
---

Open culture schema (F1): custom name kinds, extensible word classes, structured names, opt-in gender and a lexicon cache.

- `Culture.templates` is an open record: declare any kind (`ship`, `tavern`, `deity`, `guild`, `epithet`, `title`, ...) and `generateName(culture, kind, ctx)` accepts it. Built-in kinds keep their types; a missing kind still throws.
- `WordClass` accepts pack-declared classes alongside `noun | adjective | verb | particle`; `Culture.wordClasses` documents them.
- `Culture.nameStructures` + `generateStructuredName` add opt-in family-first / given-first order, patronymic/matronymic, clan/house, honorific and epithet slots.
- `Culture.genderTemplates` + `generateName(..., { gender })` add opt-in `masculine | feminine | neutral | any` pools. Omitting `gender` leaves existing output byte-identical.
- `buildLexicon(culture, ctx, cache?)`, `createLexiconCache`, `freezeCulture`: lexicons are memoized per (culture identity, seed path); `generateName` shares a bounded cache for frozen cultures only.
- `dwarvish` gains `clan` / `epithet` kinds and a `dwarvish.house-name` structure; `humanoid` gains a `ship` kind and `scifi.humanoid.ship` structure. Existing kinds and goldens are unchanged.
