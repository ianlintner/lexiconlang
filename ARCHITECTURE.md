# Architecture

LexiconLang is a pnpm/ESM TypeScript monorepo for deterministic procedural content.
The implemented source is authoritative for current APIs. The
[expansion design](docs/superpowers/specs/2026-10-30-expansion-design.md) specifies
future interfaces and becomes normative for expansion work after approval/merge.
Do not mistake its proposed exports for currently released APIs.

## Implemented layers

- **`@lexiconlang/core`** — Sfc32 RNG, seed hashing, immutable child contexts,
  generator interfaces, combinators and a duplicate-rejecting generator registry.
- **`@lexiconlang/grammar`** — template parsing, weighted rules, modifiers and expansion.
- **`@lexiconlang/markov`** — corpus training, serialized models and seeded sampling.
- **`@lexiconlang/language`** — phonotactics, meanings, lexicons, culture templates and
  translated names. Its phonotactic `GlyphSystem` is not a rendered writing system.
- **`@lexiconlang/glyphs`** — optional visual glyph generation/rendering from names.
- **`@lexiconlang/fantasy`, `scifi`, `modern`** — content data and typed generator facades.
- **`@lexiconlang/cli`** — currently `build-markov` and `scaffold-pack`.

Engine code must not acquire new genre dependencies. The existing language/fantasy
workspace cycle is not a template for expansion packages.

## Expansion boundaries (planned, not implemented here)

```text
core <- language / grammar / markov / tables
                   ^                   ^
                   +------ packs ------+
                              ^
                   bases and genre facades
                              ^
                  CLI / MCP / docs playground
```

`packs` owns JSON Schema, asset/dependency resolution, transactional installation,
worlds and shared tooling requests. `tables` owns roll semantics and exporters.
`bases` provides narrowly documented language-inspired data via selective subpaths.
Genres supply portable JSON plus trusted TS glue where the v1 format cannot express
complex composites. No automatic global registration, downloads or executable JSON.
Node filesystem loading is a separate entrypoint; browser/core bundles stay free of it.
The .NET port consumes the same data/schema and reviewed cross-port vectors, not TS code.

## Determinism and compatibility

Existing generator IDs preserve byte-identical output, including historical quirks.
Changed behavior uses new IDs or explicit opt-in profiles. Every new independent
sub-roll uses `ctx.child("<stable-key>")`; sampling arrays remain intentionally ordered.
Legacy `withSeed` APIs keep their call-counter behavior; planned worlds use explicit keys.
Never regenerate old goldens to make expansion pass. Persist exact pack versions/hashes
for replay; dependency ranges alone are insufficient.

## Working and verification

```sh
pnpm install --frozen-lockfile
pnpm typecheck && pnpm build && pnpm test
```

Current-release smoke example, runnable from the repo root **after the build**:

```sh
node --input-type=module <<'JS'
import { createContext } from './packages/core/dist/index.js';
import { personName } from './packages/modern/dist/index.js';
const ctx = createContext({ seed: 'architecture-smoke' });
console.log(JSON.stringify(personName.generate(ctx.child('person:0'))));
JS
```

Implementation cards add package changesets, README/API docs, docs-site pages and
runnable examples for their new exports. Original, public-domain, CC0 or properly
attributed CC-BY data requires provenance; inspired-by content must not claim authenticity.
All delivery PRs require current-head CI, the configured substantive review gate and
Ian's exact-head approval before an App-authored guarded merge.
