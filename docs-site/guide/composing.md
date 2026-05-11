# Composing generators

Everything in Lexiconlang is a `Generator<T>`. They all share one interface and
they all compose.

```ts
interface Generator<T> {
  id?: string;
  generate(ctx: Context): T;
}
```

## The primitives

| Primitive       | What it does                                                  |
| --------------- | ------------------------------------------------------------- |
| `oneOf(...xs)`  | Uniform pick from a list                                      |
| `weightedList`  | Weighted pick (alias-method sampling, O(1))                   |
| `pickOf`        | Like `oneOf` but takes a list parameter                       |
| `intRange`      | Integer in `[min, max]`                                       |
| `repeat`        | Call a generator N times (N can be fixed or a range)          |
| `compose`       | Build a record-typed generator from a parts map               |
| `map`           | Transform a generator's output                                |
| `chain`         | A generator that depends on another's output                  |

## Building your own

Knights with houses, swords, mottos, ranks, years of service:

```ts
import {
  type Generator,
  compose,
  intRange,
  oneOf,
  weightedList,
} from "@lexiconlang/core";
import { fullName } from "@lexiconlang/fantasy";

interface IronKnight {
  name: string;
  house: string;
  sword: string;
  motto: string;
  rank: "Squire" | "Knight" | "Knight-Captain" | "Lord-Marshal";
  years: number;
}

const knight: Generator<IronKnight> = compose<IronKnight>({
  id: "ironknight",
  parts: {
    name:  (ctx) => String(fullName.generate(ctx).full),
    house: oneOf("Vael", "Drachen", "Kessel", "Morain"),
    sword: oneOf("Ironwill", "Last Watch", "Quietsong", "Verdict"),
    motto: oneOf("Hold the line", "By steel and silence", "Fear the morning"),
    rank:  weightedList({ Squire: 4, Knight: 8, "Knight-Captain": 2, "Lord-Marshal": 1 }),
    years: intRange(1, 40),
  },
});
```

The `compose` function uses **field names as seed labels**. That means:

- Adding a new field gives it a fresh seed without disturbing existing fields.
- Renaming a field rerolls only that field.
- Reordering fields changes nothing — labels, not positions, drive forks.

## Batches with `repeat`

```ts
import { repeat } from "@lexiconlang/core";

const party = repeat(knight, 6).generate(ctx.child("party"));
// → IronKnight[] of length 6, deterministic per index

const patrons = repeat(knight, { min: 5, max: 12 }).generate(ctx.child("patrons"));
// → variable-size, but the count itself is RNG-driven
```

## Lazy worlds with `child`

You don't have to generate everything up front. Build a world tree and walk it
lazily:

```ts
const root = createContext({ seed: "my-world" });

function settlement(path: string) {
  return knight.generate(root.child(path));
}

settlement("region:0/town:3/knight:alaric");
settlement("region:2/town:7/knight:byrnja");
// → independent, deterministic, neither one affects the other
```
