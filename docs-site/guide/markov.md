# Training Markov models

`@lexiconlang/markov` is a character-level n-gram trainer and sampler. Feed it
a corpus, get a `Generator<string>` that produces words that *feel* like the
corpus without copying it verbatim.

## Train inline

```ts
import { markov, train } from "@lexiconlang/markov";

const welsh = train(
  ["aberffraw", "betws", "caernarfon", "dinas", "ebbw", /* ... */],
  {
    order: 3,
    minLength: 4,
    maxLength: 12,
    rejectSubstringsOfLength: 6, // refuse names that contain 6+ chars from training
  },
);

const townName = markov(welsh);
townName.generate(ctx); // "Llanrwst" — never seen in training, but feels right
```

## Train offline via the CLI

For production, train once and ship the precomputed JSON model:

```bash
npx @lexiconlang/cli build-markov ./corpora/welsh-towns.json \
  --out ./models/welsh.json \
  --order 3 \
  --reject-substrings-of-length 5
```

Then load and use:

```ts
import welshModel from "./models/welsh.json";
import { markov } from "@lexiconlang/markov";

const townName = markov(welshModel);
```

## Corpus formats

The CLI accepts:

- JSON `string[]`: `["aberffraw", "betws", ...]`
- JSON weighted: `[{ "word": "betws", "weight": 3 }, ...]`
- Newline-delimited text file (lines starting with `#` are ignored)

## Tuning the model

| Option                       | Effect                                                    |
| ---------------------------- | --------------------------------------------------------- |
| `order: 2`                   | Looser, more inventive, can sound nonsense                |
| `order: 3` *(default)*       | Good balance for most natural languages                   |
| `order: 4`                   | Tighter, sounds closer to corpus, less diversity          |
| `rejectSubstringsOfLength: N`| Refuse outputs containing any N-char substring from training |
| `minLength` / `maxLength`    | Reject outputs outside this range                         |

`rejectSubstringsOfLength` is the key knob for **avoiding verbatim training
entries**. A small corpus + high order tends to regurgitate training data;
this option fixes that by retrying until the sample is sufficiently novel.
