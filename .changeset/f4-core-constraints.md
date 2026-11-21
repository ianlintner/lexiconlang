---
"@lexiconlang/core": minor
---

Add opt-in constrained and unique generation combinators: `where` with typed `ConstraintExhaustedError` and stable `attempt:<i>` retry keys, caller-owned `UniquenessSession` with `unique`/`sampleUnique` (no replacement, `item:<i>` contexts), and pure `startsWith`/`wordLength`/`syllableCount` helpers. Existing generator IDs and golden outputs are unchanged.
