# @lexiconlang/core

The foundation of everything. Provides the seeded RNG, the `Context` tree, the
`Generator<T>` interface, and the composition primitives.

```bash
pnpm add @lexiconlang/core
```

## Exports

### Context and RNG

| Export             | Purpose                                                          |
| ------------------ | ---------------------------------------------------------------- |
| `createContext`    | Build a root context from a seed string                          |
| `Context`          | Type for the seeded context object                               |
| `RNG`              | Type for the sfc32 PRNG (rarely used directly)                   |

### The Generator interface

```ts
interface Generator<T> {
  id?: string;
  generate(ctx: Context): T;
}
```

### Primitives

| Primitive       | Signature                                                        |
| --------------- | ---------------------------------------------------------------- |
| `oneOf`         | `<T>(...xs: T[]): Generator<T>`                                  |
| `pickOf`        | `<T>(xs: readonly T[]): Generator<T>`                            |
| `weightedList`  | `<T>(weights: Record<string, number>): Generator<T>`             |
| `intRange`      | `(min: number, max: number): Generator<number>`                  |
| `repeat`        | `<T>(g: Generator<T>, count: number \| Range): Generator<T[]>`   |
| `compose`       | Build a record-typed generator from a parts map                  |
| `map`           | `<A, B>(g: Generator<A>, f: (a: A) => B): Generator<B>`          |
| `chain`         | Like `map` but `f` can call other generators with sub-contexts   |
| `Registry`      | Plugin registry for cross-pack symbol resolution                 |

### Constraints and unique generation (F4)

Opt-in combinators for rejecting values and sampling without replacement. Every
retry derives through `ctx.child("attempt:<i>")` (or `"item:<i>"`), so results
are independent of sibling generation order.

| Export                    | Signature / purpose                                                      |
| ------------------------- | ------------------------------------------------------------------------ |
| `where`                   | `(gen, predicate, { id?, maxAttempts? })`: retry until accepted           |
| `ConstraintExhaustedError`| Typed failure: `attempts`, `generatorId`, `name`                           |
| `unique`                  | `(gen, { session?, key?, id?, maxAttempts? })`: no repeats in a session   |
| `UniquenessSession`       | Caller-owned seen-set; never global, so callers cannot leak state         |
| `sampleUnique`            | `(gen, n, { seed, key?, keyLabel?, ... })`: deterministic batch, no repeats|
| `startsWith`              | `(gen, prefix, opts?)`: constrain a string generator by prefix            |
| `wordLength` / `syllableCount` | Pure string helpers (word count; vowel-group approximation)          |

`maxAttempts` defaults to 32 and is bounded to 1–1000. Exhaustion throws
`ConstraintExhaustedError` — there is no partial success.

```ts
import { createContext, oneOf, sampleUnique, where, syllableCount } from "@lexiconlang/core";

const short = where(oneOf("banana", "fig", "pear"), (s) => syllableCount(s) <= 2, {
  id: "demo.short-fruit",
});
short.generate(createContext({ seed: "snack" })); // "fig"

const names = sampleUnique(oneOf("Ash", "Birch", "Cedar"), 2, {
  seed: "batch",
  id: "demo.unique-names",
}); // deterministic, two distinct values
```

## Under the hood

- **PRNG:** sfc32 (128-bit state, passes BigCrush)
- **Forking:** SplitMix64-on-strings — `ctx.child(label)` derives a new RNG from the origin seed + label
- **Sampling:** alias-method for weighted selection (O(1))

See [The seeding model](/guide/seeding) for details.
