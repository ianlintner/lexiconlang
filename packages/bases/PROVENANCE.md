# Provenance and sensitivity note — `@lexiconlang/bases`

## License and authorship

All data in this package (phonotactic profiles, orthography mappings, name-structure
descriptors, template lists, and the sample literal placeholders) is **original work
authored for LexiconLang** and released under **CC0-1.0** (public domain dedication),
matching the package license. No third-party corpora, word lists, name lists, or
translations are included.

The six "inspired-by" labels (Old Norse, Old Irish / Gaelic-Welsh, Classical Latin,
Ancient Greek in romanized transcription, modern Japanese in romanized form, Modern
Standard Arabic in romanized form) describe **family resemblance only**. The
phonotactics and letter inventories are simplified, deliberately incomplete, and
fictionalised for name generation. Each base's `scope` field in the data file states
this explicitly.

## Sensitivity framework

Following the design spec (`docs/superpowers/specs/2026-10-30-expansion-design.md`,
§S0) every base declares a `sensitivity` block:

- `framing`: "inspired-by, fictional, simplified" — the bases are not linguistic
  references and are not presented as reconstructions of any real language.
- `exclusions`: sacred / liturgical / restricted names and living-person names are
  not shipped. All literal template forms are invented placeholders
  (`Sven`, `Bjorn`, `Aedan`, `Mairin`, `Marcus`, `Lucius`, `Alexis`, `Daphne`,
  `Haru`, `Yuki`, `Karim`, `Layla`); none is a deity, saint, scripture figure,
  tribal name, or the name of a real person.
- `review`: "context-sensitive" — downstream genre packs may combine a base with
  content generators; those packs are responsible for their own content review.

The structural patterns themselves (e.g. Norse patronymic `-son`, Arabic `ibn`/`Abu`,
Japanese family-first order, Latin tria-nomina shape) are grammatical descriptions,
not authored content. They are included because the spec explicitly requires them
as naming-convention features.

## No corpus

No Markov corpora ship with B1. The spec permits an optional small PD/CC0 corpus;
this first release ships none, so there are no corpus provenance records. Genre
packs that add corpora must include their own `provenance` entries in the pack
manifest (enforced by `@lexiconlang/packs` schema validation).

## Files

- `data/<slug>/<slug>.pack.json` — the exact F2 pack manifestation of each inline
  base descriptor, generated from `src/<slug>.ts` via `basePack(base)`.
- `src/<slug>.ts` — the authored descriptor (single source of truth).
- `src/define.ts`, `src/registry.ts` — construction and conversion helpers.
