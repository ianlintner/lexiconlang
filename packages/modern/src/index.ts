import {
  type Context,
  type Generator,
  type Seed,
  compose,
  createContext,
  intRange,
  oneOf,
  weightedList,
} from "@lexicon/core";
import { grammar, t } from "@lexicon/grammar";

// ─── Person names (deliberately mixed origins) ───────────────────────────

const givenMale = [
  "Aiden", "Alex", "Ben", "Carlos", "Daniel", "Ethan", "Felix", "Gabriel",
  "Hassan", "Isaac", "Jayden", "Kenji", "Liam", "Marcus", "Noah",
  "Omar", "Parker", "Quinn", "Ravi", "Samir", "Theo", "Umar",
  "Victor", "Wyatt", "Xavier", "Yusuf", "Zane", "Anders", "Bo",
  "Cole", "Diego", "Eli", "Finn", "George",
];

const givenFemale = [
  "Aaliyah", "Beatrice", "Camila", "Diana", "Elena", "Fatima", "Grace",
  "Hannah", "Imani", "Julia", "Kira", "Lina", "Mira", "Naomi",
  "Olivia", "Priya", "Quinn", "Riya", "Sofia", "Tara", "Una",
  "Valeria", "Wren", "Xiomara", "Yara", "Zara", "Anya", "Brielle",
  "Chloe", "Daria", "Eve",
];

const surnames = [
  "Adams", "Brooks", "Chen", "Davis", "Evans", "Fischer", "Garcia",
  "Hayashi", "Ibarra", "Johnson", "Kowalski", "Lopez", "Martinez",
  "Nguyen", "Okonkwo", "Patel", "Quintero", "Robinson", "Smith",
  "Tanaka", "Uddin", "Vargas", "Wilson", "Xu", "Yamamoto", "Zhao",
  "Anderson", "Brown", "Clark", "Diaz", "Edwards", "Foster",
];

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

// ─── Cities ──────────────────────────────────────────────────────────────

export const cityName = grammar({
  start: { "#prefix##suffix#": 4, "#proper#": 3, "#proper# #suffix2#": 1 },
  prefix: ["New", "North", "South", "East", "West", "Old", "Port",
           "Lake", "Mount", "Fort", "Saint"],
  suffix: ["ville", "burg", "field", "ford", "town", "side",
           "view", "haven", "ridge", "wood", "shore", "stead"],
  proper: ["Bridgeport", "Crestwood", "Fairhaven", "Glenwood", "Harborlight",
           "Ironbridge", "Lakemont", "Maplebrook", "Northgate", "Oakdale",
           "Riverstone", "Silverlake", "Westvale", "Brookline", "Cedarville"],
  suffix2: ["Heights", "Hills", "Falls", "Junction", "Springs", "Plains"],
}, { id: "modern.city" });

// ─── Streets ─────────────────────────────────────────────────────────────

export const streetName = grammar({
  start: { "#stem# #type#": 5, "#ordinal# #type#": 3, "#tree# #type#": 2 },
  stem: ["Maple", "Oak", "Elm", "Cedar", "Pine", "Birch", "Willow", "Aspen",
         "Riverside", "Hillside", "Meadow", "Park", "Sunset", "Highland",
         "Lakeview", "Spring", "Lincoln", "Jackson", "Madison", "Adams"],
  ordinal: ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"],
  tree: ["Cherry", "Magnolia", "Sycamore", "Cypress"],
  type: ["Street", "Avenue", "Lane", "Road", "Boulevard", "Drive", "Way", "Court"],
}, { id: "modern.street" });

// ─── Companies ───────────────────────────────────────────────────────────

export const companyName = grammar({
  start: { "#brand# #type#": 4, "#brand# & #brand2#": 3, "#person.cap# & #person2.cap#": 2 },
  brand: ["Sterling", "Apex", "Vertex", "Nimbus", "Pinnacle", "Catalyst",
          "Quanta", "Helix", "Beacon", "Anchor", "Compass", "Parallel",
          "Northwind", "Lighthouse", "Granite", "Cedar"],
  brand2: ["Group", "Holdings", "Partners", "Capital", "Ventures",
           "Industries", "Solutions", "Labs", "Works", "Studios"],
  type: ["Inc.", "LLC", "Corp.", "Group", "Industries", "Logistics",
         "Technologies", "Holdings", "Systems", "Capital"],
  person: surnames.slice(0, 16).map((s) => s.toLowerCase()),
  person2: surnames.slice(16, 32).map((s) => s.toLowerCase()),
}, { id: "modern.company" });

// ─── Email-style domain (purely synthetic) ──────────────────────────────

export const domainName = grammar({
  start: { "#stem##stem2#.#tld#": 5, "#stem#-#stem2#.#tld#": 2 },
  stem: ["sky", "river", "stone", "echo", "pulse", "drift", "atlas",
         "north", "ember", "vault", "loft", "harbor", "summit"],
  stem2: ["works", "labs", "tech", "co", "io", "group", "studio", "shop"],
  tld: ["com", "io", "net", "co", "app", "dev"],
}, { id: "modern.domain" });

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

const occupations = [
  "Software Engineer", "Teacher", "Nurse", "Accountant", "Mechanic",
  "Lawyer", "Designer", "Consultant", "Architect", "Plumber",
  "Chef", "Journalist", "Doctor", "Pharmacist", "Electrician",
  "Carpenter", "Manager", "Analyst", "Photographer", "Writer",
];

export const occupation: Generator<string> = oneOf(...occupations);

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

export const bandName = grammar({
  start: { "The #adj.cap# #noun.cap#s": 3, "#stem.cap# #stem2.cap#": 3, "#animal.cap# #suffix#": 2 },
  adj: ["lonely", "burning", "neon", "midnight", "broken", "shy", "wild"],
  noun: ["heart", "wave", "moon", "ghost", "wolf", "kid", "saint", "river"],
  stem: ["stellar", "neon", "iron", "velvet", "static", "moss", "drift", "ember"],
  stem2: ["choir", "veil", "tide", "machine", "club", "house", "garden"],
  animal: ["fox", "wolf", "bear", "horse", "bird", "fish", "crow"],
  suffix: ["Brigade", "Brigade", "Avenue", "Highway", "Express"],
}, { id: "modern.band" });

export const songTitle = grammar({
  start: { "#prefix# #object.cap#": 4, "#emotion.cap# in the #place.cap#": 3, "#verb.cap# the #object.cap#": 2 },
  prefix: ["Last", "First", "Lonely", "Broken", "Stolen", "Quiet"],
  object: ["promise", "letter", "dance", "summer", "city", "sky", "mirror"],
  emotion: ["love", "fear", "grief", "joy", "hope"],
  place: ["dark", "rain", "morning", "kitchen", "highway", "alley"],
  verb: ["chase", "burn", "find", "lose", "remember"],
}, { id: "modern.song" });

export const bookTitle = grammar({
  start: { "The #noun.cap# of #place.cap#": 4, "#adj.cap# #noun.cap#": 3, "How to #verb# a #noun#": 2 },
  noun: ["secret", "garden", "house", "letter", "machine", "kingdom",
         "country", "harvest", "promise", "river", "bridge", "winter"],
  place: ["small things", "lost time", "stolen years", "yesterday",
          "the unfinished", "burning bridges"],
  adj: ["the silent", "the last", "small", "ordinary", "broken", "improbable"],
  verb: ["lose", "build", "remember", "save", "dismantle"],
}, { id: "modern.book" });

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
