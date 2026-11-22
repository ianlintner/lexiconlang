---
"@lexiconlang/language": minor
"@lexiconlang/packs": minor
---

Add opt-in localized meaning glosses (B4). `generateName` and
`generateStructuredName` accept a BCP 47 locale (via options or `Context.locale`)
that localizes the human-readable translation and `parts[].meaning` only — the
conlang form, meaning selection and RNG scope stay byte-identical to the legacy
path. Built-in original CC0-1.0 glosses cover the core, fantasy and scifi
meaning packs in `es`, `de`, `fr`, `pt` and `ja`. New exports: `glossFor`,
`withGlosses`, `localizePacks`, `withBuiltinGlosses`, `BUILTIN_GLOSS_LOCALES`.
Meaning packs may declare a `glosses` map per meaning (also supported in the
pack-v1 JSON schema), with explicit pack glosses taking precedence over built-in
rows.
