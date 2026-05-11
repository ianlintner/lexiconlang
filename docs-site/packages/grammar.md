# @lexiconlang/grammar

Tracery-compatible context-free grammar engine with a TypeScript tagged-template
DSL.

```bash
pnpm add @lexiconlang/grammar
```

## Quick example

```ts
import { grammar, t } from "@lexiconlang/grammar";
import { createContext } from "@lexiconlang/core";

const spell = grammar({
  start:   t`${"prefix.cap"} ${"element.cap"} ${"form.cap"}`,
  prefix:  ["lesser", "greater", "true", "binding"],
  element: ["fire", "frost", "shadow", "iron"],
  form:    ["bolt", "ward", "veil", "lash"],
});

spell.generate(createContext({ seed: "abra" }));
// → "Greater Frost Ward"
```

JSON grammars from Tracery work too:

```ts
const tracery = grammar({
  start:   "#prefix.cap# #element.cap# #form.cap#",
  prefix:  ["lesser", "greater", "true", "binding"],
  // ...
});
```

## Modifiers

16 built-in modifiers; chain with dots. Examples:

```
${"hero"}        → "alaric"
${"hero.cap"}    → "Alaric"
${"hero.upper"}  → "ALARIC"
${"hero.s"}      → "alarics"
${"hero.a"}      → "an alaric"
${"hero.title"}  → "Alaric"
```

See [Custom grammars](/guide/grammars) for the full guide.

## Cross-pack resolution

Symbol names can use a `plugin:symbol` form to call into the registry:

```ts
const name = grammar({
  start: t`${"markov:elven"} ${"surname"}`,
  surname: ["Stormvale", "Moonsong", "Silverthorn"],
});
```

`#markov:elven#` resolves to a Markov-trained elvish syllable generator
registered elsewhere in the app.
