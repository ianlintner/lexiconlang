# @lexiconlang/markov

Character-level Markov n-gram trainer and sampler with backoff smoothing,
verbatim-rejection, and a JSON model format that's safe to ship in your bundle.

```bash
pnpm add @lexiconlang/markov
```

## Train and sample

```ts
import { markov, train } from "@lexiconlang/markov";
import { createContext } from "@lexiconlang/core";

const model = train(
  ["aberffraw", "betws", "caernarfon", "dinas", "ebbw"],
  { order: 3, rejectSubstringsOfLength: 6 },
);

const townName = markov(model);
townName.generate(createContext({ seed: "wales-1" })); // "Llanrwst"
```

## Configuration

| Option                       | Default | Effect                                              |
| ---------------------------- | ------- | --------------------------------------------------- |
| `order`                      | 3       | n-gram size                                         |
| `minLength`                  | 3       | Reject samples shorter than this                    |
| `maxLength`                  | 16      | Reject samples longer than this                     |
| `rejectSubstringsOfLength`   | undefined | Refuse samples containing N+ chars from training  |
| `meta`                       | `{}`    | Arbitrary metadata serialized into the model        |

## JSON model format

`train()` returns a `MarkovModel` — a plain object that JSON-serializes cleanly:

```ts
{
  order: 3,
  transitions: { /* ... */ },
  meta: { source: "welsh-towns" },
}
```

Build offline with the CLI and import as JSON:

```bash
npx @lexiconlang/cli build-markov ./corpus.json --out ./model.json --order 3
```

See [Training Markov models](/guide/markov) for the full guide.
