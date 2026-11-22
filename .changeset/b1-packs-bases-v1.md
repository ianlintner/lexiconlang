---
"@lexiconlang/packs": minor
---

Implement F2 `bases-v1` capability: `bases` resources now validate and install via `definePack` / `createWorld`. Added `BaseData`, `OrthographyData` and `SensitivityData` public types. `resolveCulture` applies base defaults before parent/child overrides, inherits the parent culture's base, and rejects base switching in child cultures.
