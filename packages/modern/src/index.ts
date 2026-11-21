import {
  type Context,
  type Generator,
  type Seed,
  createContext,
  intRange,
  oneOf,
} from "@lexiconlang/core";
import { grammar, type GrammarRules } from "@lexiconlang/grammar";
import { data, type GrammarData, type RuleValue } from "./data.js";

// ─── Person names (deliberately mixed origins) ───────────────────────────

const givenMale = data.givenMale;
const givenFemale = data.givenFemale;
const surnames = data.surnames;

export const givenMaleName: Generator<string> = oneOf(...givenMale);
export const givenFemaleName: Generator<string> = oneOf(...givenFemale);
export const surname: Generator<string> = oneOf(...surnames);

export type Sex = "male" | "female";
export const sex: Generator<Sex> = oneOf<Sex>("male", "female");

export interface PersonName {
  given: string;
  surname: string;
  full: string;
  sex: Sex;
}

export const personName: Generator<PersonName> = {
  id: "modern.personName",
  generate(ctx: Context) {
    const s = sex.generate(ctx.child("sex"));
    const given = (s === "male" ? givenMaleName : givenFemaleName).generate(ctx.child("given"));
    const sur = surname.generate(ctx.child("surname"));
    return { given, surname: sur, full: `${given} ${sur}`, sex: s };
  },
};

// Grammar descriptors come from modern.pack.json; rule key order is preserved.
function rulesOf(name: keyof typeof data.grammars): GrammarRules {
  const descriptor: GrammarData = data.grammars[name];
  const rules: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(descriptor.rules) as readonly [string, RuleValue][]) {
    if (typeof value === "object" && value !== null && !Array.isArray(value) && "source" in value && "slice" in value) {
      const derived = value as { source: "surnames"; slice: readonly [number, number]; lowercase: true };
      rules[key] = surnames.slice(derived.slice[0], derived.slice[1]).map((s) => s.toLowerCase());
    } else {
      rules[key] = value;
    }
  }
  return rules as GrammarRules;
}

// ─── Cities ──────────────────────────────────────────────────────────────

export const cityName = grammar(rulesOf("city"), { id: data.grammars.city.id });

// ─── Streets ─────────────────────────────────────────────────────────────

export const streetName = grammar(rulesOf("street"), { id: data.grammars.street.id });

// ─── Companies ───────────────────────────────────────────────────────────

export const companyName = grammar(rulesOf("company"), { id: data.grammars.company.id });

// ─── Email-style domain (purely synthetic) ──────────────────────────────

export const domainName = grammar(rulesOf("domain"), { id: data.grammars.domain.id });

// ─── Phone (US-format placeholder) ──────────────────────────────────────

export const phoneNumber: Generator<string> = {
  id: "modern.phone",
  generate(ctx: Context) {
    const a = ctx.child("a").rng.nextInt(200, 999);
    const b = ctx.child("b").rng.nextInt(200, 999);
    const c = ctx.child("c").rng.nextInt(0, 10000);
    return `(${a}) ${b}-${c.toString().padStart(4, "0")}`;
  },
};

// ─── Address ─────────────────────────────────────────────────────────────

export interface Address {
  number: number;
  street: string;
  city: string;
  zip: string;
}

export const address: Generator<Address> = {
  id: "modern.address",
  generate(ctx: Context) {
    const number = ctx.child("num").rng.nextInt(1, 9999);
    const street = streetName.generate(ctx.child("street"));
    const city = cityName.generate(ctx.child("city"));
    const zip = ctx.child("zip").rng.nextInt(10000, 99999).toString();
    return { number, street, city, zip };
  },
};

// ─── Person (composite) ──────────────────────────────────────────────────

export interface Person {
  name: PersonName;
  age: number;
  email: string;
  phone: string;
  address: Address;
  occupation: string;
}

export const occupation: Generator<string> = oneOf(...data.occupations);

export const person: Generator<Person> = {
  id: "modern.person",
  generate(ctx: Context) {
    const name = personName.generate(ctx.child("name"));
    const domain = domainName.generate(ctx.child("domain"));
    const local = `${name.given.toLowerCase()}.${name.surname.toLowerCase()}`;
    return {
      name,
      age: intRange(18, 80).generate(ctx.child("age")),
      email: `${local}@${domain}`,
      phone: phoneNumber.generate(ctx.child("phone")),
      address: address.generate(ctx.child("address")),
      occupation: occupation.generate(ctx.child("occupation")),
    };
  },
};

// ─── Bands / songs / book titles ────────────────────────────────────────

export const bandName = grammar(rulesOf("band"), { id: data.grammars.band.id });
export const songTitle = grammar(rulesOf("song"), { id: data.grammars.song.id });
export const bookTitle = grammar(rulesOf("book"), { id: data.grammars.book.id });

// ─── Public API ──────────────────────────────────────────────────────────

export const generators = {
  personName,
  surname,
  givenMaleName,
  givenFemaleName,
  sex,
  cityName,
  streetName,
  companyName,
  domainName,
  phoneNumber,
  address,
  person,
  occupation,
  bandName,
  songTitle,
  bookTitle,
} as const;

export interface ModernAPI {
  person: Person;
  name: () => PersonName;
  city: () => string;
  street: () => string;
  address: () => Address;
  company: () => string;
  domain: () => string;
  phone: () => string;
  band: () => string;
  song: () => string;
  book: () => string;
  context: Context;
}

export interface ModernEntry {
  withSeed(seed: Seed): ModernAPI;
  generators: typeof generators;
}

export const modern: ModernEntry = {
  generators,
  withSeed(seed: Seed): ModernAPI {
    const root = createContext({ seed });
    let counter = 0;
    const sub = (label: string) => root.child(`${label}:${counter++}`);
    return {
      get person() { return person.generate(sub("person")); },
      name: () => personName.generate(sub("name")),
      city: () => cityName.generate(sub("city")),
      street: () => streetName.generate(sub("street")),
      address: () => address.generate(sub("address")),
      company: () => companyName.generate(sub("company")),
      domain: () => domainName.generate(sub("domain")),
      phone: () => phoneNumber.generate(sub("phone")),
      band: () => bandName.generate(sub("band")),
      song: () => songTitle.generate(sub("song")),
      book: () => bookTitle.generate(sub("book")),
      context: root,
    };
  },
};
