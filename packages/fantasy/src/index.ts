import {
  type Context,
  type Generator,
  compose,
  createContext,
  intRange,
  oneOf,
  pickOf,
  repeat,
  weightedList,
  type Seed,
} from "@content-gen/core";
import { grammar, t } from "@content-gen/grammar";
import { markov, train, type MarkovModel } from "@content-gen/markov";
import { generateName, type TranslatedName, type Culture } from "@content-gen/language";

import { corpora, type CorpusName } from "./corpora.js";
import {
  adjectives,
  animals,
  armorPieces,
  dragonAdjectives,
  dragonColors,
  epithetActions,
  epithetTargets,
  factionTypes,
  occupations,
  personalityTraits,
  placePrefixes,
  placeSuffixes,
  questHookComplications,
  questHookOpenings,
  questHookSubjects,
  tavernNouns,
  titles,
  weapons,
} from "./data.js";
import {
  dwarvish,
  elvish,
  orcish,
  halfling,
  draconic,
} from "./language/cultures.js";

// ─── Culture mapping ─────────────────────────────────────────────────────

function raceToCulture(race: Race): Culture {
  switch (race) {
    case "elf":
      return elvish;
    case "dwarf":
      return dwarvish;
    case "halfling":
      return halfling;
    case "orc":
      return orcish;
    case "dragonborn":
      return draconic;
    default:
      return dwarvish; // placeholder for human
  }
}

// ─── Markov-trained name generators ──────────────────────────────────────

function trainCorpus(name: CorpusName): MarkovModel {
  return train(corpora[name] as readonly string[], {
    order: 3,
    minLength: 4,
    maxLength: 11,
    rejectSubstringsOfLength: 5,
    meta: { source: name },
  });
}

const elvenMaleModel = trainCorpus("elven_male");
const elvenFemaleModel = trainCorpus("elven_female");
const dwarvenMaleModel = trainCorpus("dwarven_male");
const dwarvenFemaleModel = trainCorpus("dwarven_female");
const humanMaleModel = trainCorpus("human_male");
const humanFemaleModel = trainCorpus("human_female");
const orcishModel = trainCorpus("orcish");
const halflingModel = trainCorpus("halfling");
const draconicModel = trainCorpus("draconic");

/** @deprecated Use givenName generator which uses the language system. */
export const elvenMaleName = markov(elvenMaleModel, { id: "fantasy.name.elven_male" });
/** @deprecated Use givenName generator which uses the language system. */
export const elvenFemaleName = markov(elvenFemaleModel, { id: "fantasy.name.elven_female" });
/** @deprecated Use givenName generator which uses the language system. */
export const dwarvenMaleName = markov(dwarvenMaleModel, { id: "fantasy.name.dwarven_male" });
/** @deprecated Use givenName generator which uses the language system. */
export const dwarvenFemaleName = markov(dwarvenFemaleModel, { id: "fantasy.name.dwarven_female" });
/** @deprecated Use givenName generator which uses the language system. */
export const humanMaleName = markov(humanMaleModel, { id: "fantasy.name.human_male" });
/** @deprecated Use givenName generator which uses the language system. */
export const humanFemaleName = markov(humanFemaleModel, { id: "fantasy.name.human_female" });
/** @deprecated Use givenName generator which uses the language system. */
export const orcishName = markov(orcishModel, { id: "fantasy.name.orcish" });
/** @deprecated Use givenName generator which uses the language system. */
export const halflingName = markov(halflingModel, { id: "fantasy.name.halfling" });
/** @deprecated Use givenName generator which uses the language system. */
export const draconicName = markov(draconicModel, { id: "fantasy.name.draconic" });

// ─── Race / sex ──────────────────────────────────────────────────────────

export type Race = "human" | "elf" | "dwarf" | "halfling" | "orc" | "dragonborn";
export type Sex = "male" | "female";

export const race: Generator<Race> = weightedList<Race>(
  { human: 50, elf: 15, dwarf: 15, halfling: 10, orc: 5, dragonborn: 5 },
  { id: "fantasy.race" },
);

export const sex: Generator<Sex> = oneOf<Sex>("male", "female");

// ─── Name generators using language system ───────────────────────────────

export const givenName: Generator<TranslatedName> = {
  id: "fantasy.givenName",
  generate(ctx: Context) {
    const r = race.generate(ctx.child("race"));
    const culture = raceToCulture(r);
    return generateName(culture, "given", ctx.child("name"));
  },
};

export const surname: Generator<TranslatedName> = {
  id: "fantasy.surname",
  generate(ctx: Context) {
    const r = race.generate(ctx.child("race"));
    const culture = raceToCulture(r);
    return generateName(culture, "surname", ctx.child("name"));
  },
};

export interface FullName {
  given: TranslatedName;
  surname: TranslatedName;
  full: TranslatedName;
  race: Race;
  sex: Sex;
}

export const fullName: Generator<FullName> = {
  id: "fantasy.fullName",
  generate(ctx: Context) {
    const r = race.generate(ctx.child("race"));
    const s = sex.generate(ctx.child("sex"));
    const givenTN = givenName.generate(ctx.child("given"));
    const surnameTN = surname.generate(ctx.child("surname"));
    const full: TranslatedName = {
      form: `${givenTN.form} ${surnameTN.form}`,
      translation: `${givenTN.translation} ${surnameTN.translation}`,
      language: givenTN.language,
      toString() {
        return this.form;
      },
    };
    return { given: givenTN, surname: surnameTN, full, race: r, sex: s };
  },
};

// ─── Place names ─────────────────────────────────────────────────────────

/**
 * Language-backed place name generators. These pick a random culture
 * and generate a name using the language system.
 */
const allCultures: readonly Culture[] = [dwarvish, elvish, orcish, halfling, draconic];

function generatePlaceName(
  nameKind: "settlement" | "mountain" | "river" | "forest",
  ctx: Context,
): TranslatedName {
  const culture = allCultures[ctx.rng.nextInt(0, allCultures.length - 1)]!;
  // Fallback to "given" if the template doesn't exist
  const templates = culture.templates[nameKind];
  if (!templates || templates.length === 0) {
    return generateName(culture, "given", ctx);
  }
  return generateName(culture, nameKind, ctx);
}

export const settlementName: Generator<TranslatedName> = {
  id: "fantasy.place.settlement",
  generate(ctx: Context) {
    return generatePlaceName("settlement", ctx);
  },
};

export const mountainName: Generator<TranslatedName> = {
  id: "fantasy.place.mountain",
  generate(ctx: Context) {
    return generatePlaceName("mountain", ctx);
  },
};

export const forestName: Generator<TranslatedName> = {
  id: "fantasy.place.forest",
  generate(ctx: Context) {
    return generatePlaceName("forest", ctx);
  },
};

export const riverName: Generator<TranslatedName> = {
  id: "fantasy.place.river",
  generate(ctx: Context) {
    return generatePlaceName("river", ctx);
  },
};

// Grammar-based place names (kept for variety)
const grammarSettlementName = grammar({
  start: t`${"prefix"}${"suffix"}`,
  prefix: placePrefixes,
  suffix: placeSuffixes.settlement,
}, { id: "fantasy.place.settlement.grammar" });

const grammarCityName = grammar({
  start: { "#prefix##suffix#": 4, "#prefix# of #realm#": 1, "Old #prefix##suffix#": 1 },
  prefix: placePrefixes,
  suffix: placeSuffixes.settlement,
  realm: ["the Vale", "the Mark", "the Wash", "the Reach", "the Sound"],
}, { id: "fantasy.place.city" });

const grammarVillageName = grammar({
  start: t`${"prefix"}${"suffix"}`,
  prefix: ["Little", "High", "Low", "North", "South", "East", "West",
           "Old", "New", ...placePrefixes.slice(0, 10)],
  suffix: ["bridge", "field", "ford", "thorpe", "cross", "fen", "moor", "shire", "hollow"],
}, { id: "fantasy.place.village" });

export const cityName = grammarCityName;
export const villageName = grammarVillageName;

export const tavernName = grammar({
  start: { "The #adj.cap# #noun.cap#": 6, "The #adj.cap# #animal.cap#": 4, "The #animal.cap#'s #noun.cap#": 2 },
  adj: [...adjectives.rustic, ...adjectives.shiny, ...adjectives.natural],
  noun: tavernNouns,
  animal: animals.map((a) => a.toLowerCase()),
}, { id: "fantasy.place.tavern" });

export const landmarkName: Generator<TranslatedName> = {
  id: "fantasy.place.landmark",
  generate(ctx: Context) {
    return pickOf<TranslatedName>(
      mountainName, forestName, riverName,
    ).generate(ctx);
  },
};

// ─── Factions, guilds, orders ────────────────────────────────────────────

export const factionName = grammar({
  start: { "The #type# of the #adj.cap# #thing.cap#": 4, "The #adj.cap# #type#": 3, "Order of the #adj.cap# #thing.cap#": 2 },
  type: factionTypes,
  adj: [...adjectives.noble, ...adjectives.mystical, ...adjectives.shiny],
  thing: [...animals, "Crown", "Sword", "Flame", "Star", "Moon", "Dawn", "Veil", "Path"],
}, { id: "fantasy.faction" });

export const cultName = grammar({
  start: { "The #adj.cap# #shape.cap#": 5, "Children of #thing.cap#": 3, "The Cult of the #adj.cap# #thing.cap#": 2 },
  adj: adjectives.sinister,
  shape: ["Veil", "Maw", "Eye", "Hand", "Tooth", "Tongue"],
  thing: ["Worm", "Star", "Flame", "Moon", "Void", "Ash"],
}, { id: "fantasy.cult" });

// ─── Items ────────────────────────────────────────────────────────────────

export const weaponName = grammar({
  start: { "#adj.cap# #weapon.cap#": 3, "#weapon.cap# of the #adj.cap# #target.cap#": 2, "#name.cap#'s #weapon.cap#": 1 },
  adj: [...adjectives.shiny, ...adjectives.mystical, "Whispering", "Singing", "Howling"],
  weapon: weapons,
  target: epithetTargets,
  name: ["Aragorn", "Bran", "Cassia", "Dorian", "Elara"],
}, { id: "fantasy.item.weapon" });

export const armorName = grammar({
  start: t`${"adj.cap"} ${"piece.cap"}`,
  adj: [...adjectives.shiny, ...adjectives.mystical],
  piece: armorPieces,
}, { id: "fantasy.item.armor" });

// ─── Epithets, titles ────────────────────────────────────────────────────

export const epithet = grammar({
  start: { "the #target.cap# #action#": 3, "the #adj#": 2, "#action# of the #target.cap#s": 1 },
  target: epithetTargets,
  action: epithetActions,
  adj: ["Bold", "Quiet", "Wise", "Cruel", "Lost", "Ironhearted", "Crooked", "Just"],
}, { id: "fantasy.epithet" });

export const nobleTitle: Generator<string> = oneOf(...titles.noble);
export const martialTitle: Generator<string> = oneOf(...titles.martial);
export const arcaneTitle: Generator<string> = oneOf(...titles.arcane);
export const divineTitle: Generator<string> = oneOf(...titles.divine);

// ─── Personality / NPC ───────────────────────────────────────────────────

export interface Personality {
  trait: string;
  flaw: string;
  quirk: string;
}

export const personality = compose<Personality>({
  id: "fantasy.personality",
  parts: {
    trait: oneOf(...personalityTraits.positive),
    flaw: oneOf(...personalityTraits.negative),
    quirk: oneOf(...personalityTraits.quirks),
  },
});

export const occupation: Generator<string> = oneOf(...occupations);

export interface NPC {
  name: FullName;
  age: number;
  occupation: string;
  personality: Personality;
}

export const npc: Generator<NPC> = compose<NPC>({
  id: "fantasy.npc",
  parts: {
    name: fullName,
    age: intRange(18, 80),
    occupation,
    personality,
  },
});

export const heroNpc: Generator<NPC & { epithet: string; title: string }> = compose({
  id: "fantasy.npc.hero",
  parts: {
    name: fullName,
    age: intRange(18, 80),
    occupation,
    personality,
    epithet,
    title: pickOf(nobleTitle, martialTitle, arcaneTitle, divineTitle),
  },
});

// ─── Settlements (composite) ─────────────────────────────────────────────

export interface Settlement {
  name: string;
  kind: "village" | "town" | "city";
  population: number;
  notableLocations: string[];
  leader: NPC;
}

export const settlement: Generator<Settlement> = {
  id: "fantasy.settlement",
  generate(ctx: Context) {
    const kind = weightedList<"village" | "town" | "city">({
      village: 6, town: 3, city: 1,
    }).generate(ctx.child("kind"));
    const nameGen =
      kind === "city" ? grammarCityName : kind === "town" ? grammarSettlementName : grammarVillageName;
    const name = nameGen.generate(ctx.child("name"));
    const popRanges = { village: [40, 400], town: [400, 4000], city: [4000, 40000] } as const;
    const [lo, hi] = popRanges[kind];
    const population = ctx.child("pop").rng.nextInt(lo, hi);
    const taverns = repeat(tavernName, kind === "city" ? 4 : kind === "town" ? 2 : 1)
      .generate(ctx.child("taverns"));
    const leader = npc.generate(ctx.child("leader"));
    return {
      name,
      kind,
      population,
      notableLocations: taverns,
      leader,
    };
  },
};

// ─── Quest hooks ─────────────────────────────────────────────────────────

export const questHook = grammar({
  start: t`${"open"} ${"subject"}, ${"comp"}.`,
  open: questHookOpenings,
  subject: questHookSubjects,
  comp: questHookComplications,
}, { id: "fantasy.quest.hook" });

// ─── Dragon ──────────────────────────────────────────────────────────────

export const dragon = grammar({
  start: t`${"adj"} the ${"color.cap"} ${"kind.cap"}`,
  adj: dragonAdjectives,
  color: dragonColors,
  kind: ["Wyrm", "Drake", "Dragon", "Wyvern"],
}, { id: "fantasy.creature.dragon" });

// ─── Public surface ─────────────────────────────────────────────────────

export const generators = {
  race,
  sex,
  givenName,
  surname,
  fullName,
  npc,
  heroNpc,
  personality,
  occupation,
  epithet,
  settlement,
  cityName,
  villageName,
  tavernName,
  mountainName,
  forestName,
  riverName,
  landmarkName,
  factionName,
  cultName,
  weaponName,
  armorName,
  questHook,
  dragon,
  elvenMaleName,
  elvenFemaleName,
  dwarvenMaleName,
  dwarvenFemaleName,
  humanMaleName,
  humanFemaleName,
  orcishName,
  halflingName,
  draconicName,
  nobleTitle,
  martialTitle,
  arcaneTitle,
  divineTitle,
} as const;

export interface FantasyAPI {
  npc: NPC;
  hero: NPC & { epithet: string; title: string };
  name: { full: () => FullName; given: () => TranslatedName; surname: () => TranslatedName };
  place: {
    settlement: () => Settlement;
    city: () => string;
    village: () => string;
    tavern: () => string;
    mountain: () => TranslatedName;
    forest: () => TranslatedName;
    river: () => TranslatedName;
    landmark: () => TranslatedName;
  };
  faction: { order: () => string; cult: () => string };
  item: { weapon: () => string; armor: () => string };
  quest: () => string;
  dragon: () => string;
  context: Context;
}

export interface FantasyEntry {
  withSeed(seed: Seed): FantasyAPI;
  generators: typeof generators;
}

export const fantasy: FantasyEntry = {
  generators,
  withSeed(seed: Seed): FantasyAPI {
    const root = createContext({ seed });
    let counter = 0;
    const sub = (label: string) => root.child(`${label}:${counter++}`);
    return {
      get npc() { return npc.generate(sub("npc")); },
      get hero() { return heroNpc.generate(sub("hero")); },
      name: {
        full: () => fullName.generate(sub("name.full")),
        given: () => givenName.generate(sub("name.given")),
        surname: () => surname.generate(sub("name.surname")),
      },
      place: {
        settlement: () => settlement.generate(sub("settlement")),
        city: () => cityName.generate(sub("city")),
        village: () => villageName.generate(sub("village")),
        tavern: () => tavernName.generate(sub("tavern")),
        mountain: () => mountainName.generate(sub("mountain")),
        forest: () => forestName.generate(sub("forest")),
        river: () => riverName.generate(sub("river")),
        landmark: () => landmarkName.generate(sub("landmark")),
      },
      faction: {
        order: () => factionName.generate(sub("faction")),
        cult: () => cultName.generate(sub("cult")),
      },
      item: {
        weapon: () => weaponName.generate(sub("weapon")),
        armor: () => armorName.generate(sub("armor")),
      },
      quest: () => questHook.generate(sub("quest")),
      dragon: () => dragon.generate(sub("dragon")),
      context: root,
    };
  },
};

export * as language from "./language/index.js";
