# @lexiconlang/packs

Declarative F2 pack format v1: a single JSON manifest that declares cultures,
meaning packs, grammars, tables, corpora, Markov models and generators.

```bash
pnpm add @lexiconlang/packs
```

## Capabilities

`SUPPORTED_CAPABILITIES` currently advertises:
`language-v1`, `grammar-v1`, `tables-v1`, `markov-v1`, `bases-v1`.

A manifest that declares `bases` resources must list `"bases-v1"` in its
`requires` array.

## Load and generate

```ts
import { definePack, createWorld } from "@lexiconlang/packs";
import { norse } from "@lexiconlang/bases/norse";
import { basePack } from "@lexiconlang/bases";

const world = createWorld({ seed: "demo" });
world.use(definePack(basePack(norse)));
```

## Validation

`validatePack(manifest)` returns a list of structured diagnostics (code +
JSON pointer) without throwing. `definePack()` throws `PackValidationError` on
any diagnostic. Validation covers resource IDs, references, capability
declarations, duplicate IDs and prototype-pollution attempts.

See the [F2 design section](https://github.com/ianlintner/lexiconlang/blob/main/docs/superpowers/specs/2026-10-30-expansion-design.md)
for the full schema.
