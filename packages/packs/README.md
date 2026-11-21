# @lexiconlang/packs

Declarative JSON packs for LexiconLang: published v1 JSON Schema, `definePack`/`loadPack`/`validatePack`, and a deterministic `createWorld` registry.

```ts
import { createWorld, definePack } from "@lexiconlang/packs";
import pack from "./harbor.pack.json" with { type: "json" };

const world = createWorld({ seed: "campaign-7" }).use(definePack(pack));
console.log(world.generate("example.harbor/generator/ship", "hero-1"));
```

The schema is published at `@lexiconlang/packs/schema/pack-v1.schema.json`; reference it from a manifest with `$schema: "https://lexiconlang.dev/schemas/pack-v1.schema.json"`. Node filesystem loading is available from `@lexiconlang/packs/node` (`loadPackFile`). See `docs-site/guide/authoring-packs.md` for the full format and extension semantics.
