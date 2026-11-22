# N1 portable vector emitter

`emit.mjs` produces committed golden vectors used by the .NET N1 conformance suite. It imports the built TypeScript workspace packages, loads `portable.pack.json` with the F2 `@lexiconlang/packs` loader, and records:

- core `sfc32` draws and states for empty, ASCII, accented and supplementary-plane seeds, including nested forks;
- sibling-fork independence draws;
- `name-v1`, `grammar-v1`, `table-v1` (weighted, dice, nested sequence) and `markov-v1` outputs from an installed pack;
- pack identity (`id`, `version`, `hash`, manifest hash) so a pack edit cannot silently change expectations.

Run from the repository root:

```sh
pnpm build
node scripts/portable-vectors/emit.mjs
```

Vectors are reviewed artifacts. Never regenerate `vectors.json` to make a failing port pass: fix the port instead. The .NET test suite reads a vendored copy of `vectors.json`, `portable.pack.json` and `assets/syllables.markov.json` as embedded resources and asserts byte-level equality.

The demo pack data is original synthetic content dedicated as CC0-1.0; no third-party corpora are used.
