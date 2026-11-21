# Authoring packs

`@lexiconlang/packs` reads declarative `*.pack.json` files. Data lives in JSON; TypeScript facades only narrow its API. All example data below is original CC0-1.0.

## From scratch

Create `harbor.pack.json`:

```json
{
  "$schema": "https://lexiconlang.dev/schemas/pack-v1.schema.json",
  "formatVersion": 1,
  "id": "example.harbor",
  "version": "1.0.0",
  "license": "CC0-1.0",
  "description": "Original fictional harbor names",
  "provenance": [{
    "id": "original", "source": "original:example.harbor", "title": "Harbor names",
    "creator": "Pack author", "license": "CC0-1.0",
    "attribution": "Original example data", "modifications": "None",
    "files": ["harbor.pack.json"]
  }],
  "depends": [], "extends": [], "requires": ["language-v1"],
  "cultures": [{
    "id": "example.harbor/culture/dock",
    "glyphs": { "classes": { "C": ["m", "n", "s"], "V": ["a", "e", "i"] },
                "syllables": [["C V", 1]], "wordShapes": [["2", 1]] },
    "meaningPacks": [],
    "templates": { "ship": [{ "value": { "kind": "literal", "form": "Quiet Wake", "translation": "calm" }, "weight": 1 }] }
  }],
  "meaningPacks": [], "grammars": [], "tables": [], "corpora": [], "markovModels": [],
  "generators": [{
    "id": "example.harbor/generator/ship", "engine": "name-v1",
    "culture": "example.harbor/culture/dock", "kind": "ship",
    "description": "Harbor ship names", "tags": ["ship"], "output": "translated-name-v1"
  }]
}
```

Validate and run it:

```sh
lexiconlang validate-pack harbor.pack.json
```

```ts
import { createWorld, definePack } from "@lexiconlang/packs";
import pack from "./harbor.pack.json" with { type: "json" };

const world = createWorld({ seed: "campaign-7" }).use(definePack(pack));
console.log(world.generate("example.harbor/generator/ship", "hero-1"));
```

Use `loadPack(text)` for JSON text and asset-backed packs. It checks the schema, duplicate keys, provenance, references, dependency versions and asset SHA-256 hashes. `definePack()` is the synchronous, asset-free path.

## Extending an existing pack

Install the base pack first, then list it in `extends` and reference the parent culture explicitly:

```json
{
  "formatVersion": 1, "id": "example.harbor-night", "version": "1.0.0",
  "license": "CC0-1.0", "description": "Night harbor names",
  "provenance": [{ "id": "original", "source": "original:example.harbor-night",
    "title": "Night names", "creator": "Pack author", "license": "CC0-1.0",
    "attribution": "Original derivative data", "modifications": "Added night names",
    "files": ["harbor-night.pack.json"] }],
  "depends": [], "extends": [{ "id": "example.harbor", "version": "1.0.0" }],
  "requires": ["language-v1"],
  "cultures": [{
    "id": "example.harbor-night/culture/dock",
    "extends": "example.harbor/culture/dock",
    "templates": { "ship": [{ "value": { "kind": "literal", "form": "Night Tide", "translation": "dark water" }, "weight": 1 }] }
  }],
  "meaningPacks": [], "grammars": [], "tables": [], "corpora": [], "markovModels": [],
  "generators": []
}
```

Install both packs before use: `world.use(base).use(child)`. `depends` makes resources available; `extends` additionally authorizes per-resource `extends`. Child fields override inherited fields; cycles and ID collisions fail the whole `use()` without mutating the world.

## Determinism

`World.generate(id, key)` always derives randomness from `ctx.child("generator:"+id).child("key:"+key)`; `generateItem(id, key, i)` adds `.child("item:"+i)`. Repeating a call with the same seed yields the same result, independent of call order. Portable grammar, table and Markov sampling use integer arithmetic and stable child labels; no changes are made to existing generator IDs or goldens.

## Licensing

Every manifest needs a provenance entry per shipped file. Acceptable data licenses are CC0-1.0, public domain with jurisdiction/basis, or CC-BY-4.0 with attribution and modification notes. Code facades are MIT.
