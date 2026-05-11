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

## Under the hood

- **PRNG:** sfc32 (128-bit state, passes BigCrush)
- **Forking:** SplitMix64-on-strings — `ctx.child(label)` derives a new RNG from the origin seed + label
- **Sampling:** alias-method for weighted selection (O(1))

See [The seeding model](/guide/seeding) for details.
