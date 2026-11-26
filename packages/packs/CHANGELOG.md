# @lexiconlang/packs

## 0.2.0

### Minor Changes

- 7609b94: Implement F2 `bases-v1` capability: `bases` resources now validate and install via `definePack` / `createWorld`. Added `BaseData`, `OrthographyData` and `SensitivityData` public types. `resolveCulture` applies base defaults before parent/child overrides, inherits the parent culture's base, and rejects base switching in child cultures.
- cac33e3: Add opt-in localized meaning glosses (B4). `generateName` and
  `generateStructuredName` accept a BCP 47 locale (via options or `Context.locale`)
  that localizes the human-readable translation and `parts[].meaning` only — the
  conlang form, meaning selection and RNG scope stay byte-identical to the legacy
  path. Built-in original CC0-1.0 glosses cover the core, fantasy and scifi
  meaning packs in `es`, `de`, `fr`, `pt` and `ja`. New exports: `glossFor`,
  `withGlosses`, `localizePacks`, `withBuiltinGlosses`, `BUILTIN_GLOSS_LOCALES`.
  Meaning packs may declare a `glosses` map per meaning (also supported in the
  pack-v1 JSON schema), with explicit pack glosses taking precedence over built-in
  rows.

### Patch Changes

- Updated dependencies [cac33e3]
- Updated dependencies [0942d8d]
- Updated dependencies [0942d8d]
- Updated dependencies [ec5b53f]
- Updated dependencies [51e697f]
  - @lexiconlang/language@0.4.0
  - @lexiconlang/core@0.3.0
  - @lexiconlang/grammar@0.2.1
  - @lexiconlang/markov@0.2.1
