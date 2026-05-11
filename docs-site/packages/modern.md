# @lexiconlang/modern

Modern-day genre pack: people with full contact details, cities, streets,
companies, bands, songs, books — ~16 generators total.

```bash
pnpm add @lexiconlang/modern
```

## Quick start

```ts
import { person, city, company } from "@lexiconlang/modern";
import { createContext } from "@lexiconlang/core";

const ctx = createContext({ seed: "test-data" });

const p = person.generate(ctx.child("user:1"));
// → { name, email, phone, address, dateOfBirth, occupation, ... }

city.generate(ctx.child("hq"));       // "Westbridge"
company.generate(ctx.child("acme"));  // "Northstar Logistics"
```

## What's included

- **People** with name, email, phone, address, DOB, occupation
- **Geography** — cities, streets, neighborhoods, postal codes
- **Organizations** — companies, departments, job titles
- **Creative** — bands, song titles, book titles

## Use as test data

For test fixtures, pin a seed and the data is identical across runs:

```ts
const fixtures = repeat(person, 100).generate(
  createContext({ seed: "test-fixtures" }).child("users")
);
```

Re-run your tests — same 100 users, same names, same emails, same addresses.

See the [package source](https://github.com/ianlintner/lexiconlang/tree/main/packages/modern) for the full list.
