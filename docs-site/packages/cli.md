# @lexiconlang/cli

Command-line tool for working with Lexiconlang outside of a running app.

```bash
pnpm add -g @lexiconlang/cli
# or use directly via npx:
npx @lexiconlang/cli ...
```

Provides the `lexiconlang` binary with two commands.

## `build-markov`

Train a Markov model from a corpus and save the precomputed JSON model.

```bash
lexiconlang build-markov ./corpora/welsh-towns.json --out ./models/welsh.json \
  --order 3 \
  --min-length 4 \
  --max-length 12 \
  --reject-substrings-of-length 5
```

### Corpus formats

- JSON `string[]`: `["aberffraw", "betws", ...]`
- JSON weighted: `[{ "word": "betws", "weight": 3 }, ...]`
- Newline-delimited text (`#` lines ignored)

### Why pre-train?

Training is deterministic but not free — for large corpora it adds startup
time. Pre-compute once, commit the JSON, import as a module.

```ts
import welshModel from "./models/welsh.json";
import { markov } from "@lexiconlang/markov";

const townName = markov(welshModel);
```

## `scaffold-pack`

Generate a new genre-pack package skeleton in your workspace.

```bash
lexiconlang scaffold-pack noir --dir ./packages
```

Creates `./packages/noir/` with:

- `package.json` (workspace-ready)
- `tsconfig.json` (extending the workspace base)
- `src/index.ts` (with example generators)
- `src/data.ts` (placeholder weighted lists)
- `README.md`

Edit, fill in your morphemes and templates, and you have a new pack that
plays nicely with the rest of the ecosystem.
