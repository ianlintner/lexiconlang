# Custom grammars

`@lexiconlang/grammar` is a Tracery-compatible context-free grammar engine
with a TypeScript tagged-template DSL. JSON grammars from Tracery are mostly
source-compatible; the TS form is type-checked and ergonomic.

## TS template DSL

```ts
import { grammar, t } from "@lexiconlang/grammar";

const spell = grammar({
  start:   t`${"prefix.cap"} ${"element.cap"} ${"form.cap"}`,
  prefix:  ["lesser", "greater", "true", "binding"],
  element: ["fire", "frost", "shadow", "iron"],
  form:    ["bolt", "ward", "veil", "lash"],
});

spell.generate(ctx); // "Greater Frost Ward"
```

`${"symbol.modifier"}` looks up a symbol in the grammar and pipes its output
through built-in modifiers.

## JSON form (Tracery compatible)

```json
{
  "start":   "#prefix.cap# #element.cap# #form.cap#",
  "prefix":  ["lesser", "greater", "true", "binding"],
  "element": ["fire", "frost", "shadow", "iron"],
  "form":    ["bolt", "ward", "veil", "lash"]
}
```

Both forms compile to the same AST.

## Built-in modifiers

| Modifier  | Effect                                  |
| --------- | --------------------------------------- |
| `.cap`    | Capitalize first letter                 |
| `.upper`  | UPPERCASE                               |
| `.lower`  | lowercase                               |
| `.s`      | Pluralize (English heuristic)           |
| `.a`      | Prepend "a"/"an"                        |
| `.title`  | Title Case                              |
| `.trim`   | Trim whitespace                         |
| ... 9 more | See package reference                  |

## Cross-pack symbol resolution

Symbols can reference generators in other plugins via namespace:

```ts
const spell = grammar({
  start: t`${"prefix.cap"} ${"markov:elven"}-${"element.cap"}`,
});
```

`#markov:elven#` resolves through the registry to a Markov-trained elvish
syllable generator. Strategies inter-operate.

## When to use grammars vs. other primitives

| Need                                        | Use                       |
| ------------------------------------------- | ------------------------- |
| Pick from N weighted options                | `weightedList`            |
| Structured templates with recursion         | `grammar`                 |
| Phonotactically coherent name parts         | `markov`                  |
| Names that decompose into morpheme meanings | `@lexiconlang/language`   |
| Object types with multiple fields           | `compose`                 |
