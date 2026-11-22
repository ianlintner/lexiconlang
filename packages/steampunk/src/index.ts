/**
 * @lexiconlang/steampunk — declarative steampunk & gaslamp genre pack.
 *
 * All content lives in `data/steampunk.pack.json`; this module is a thin typed
 * facade. Every sub-roll is addressed through `ctx.child("<stable-key>")`, so
 * sibling order never changes a generator's output.
 */
import {
  type Context,
  type Generator,
  type Seed,
  createContext,
  oneOf,
  weightedList,
} from "@lexiconlang/core";
import { grammar, type Grammar, type GrammarRules } from "@lexiconlang/grammar";
import {
  type PackManifestV1,
  type TableData,
  type TableHost,
  type TableRoll,
  rollTable,
} from "@lexiconlang/packs";
import packJson from "../data/steampunk.pack.json" with { type: "json" };

/** The validated pack manifest (also available as `@lexiconlang/steampunk/pack.json`). */
export const pack = packJson as unknown as PackManifestV1;

const PREFIX = "lexiconlang.steampunk";

function requireGrammar(suffix: string): Grammar {
  const id = `${PREFIX}/grammar/${suffix}`;
  const descriptor = pack.grammars.find((g) => g.id === id);
  if (!descriptor) throw new Error(`steampunk pack: missing grammar ${id}`);
  const rules: GrammarRules = {};
  for (const rule of descriptor.rules) {
    rules[rule.key] = Object.fromEntries(
      rule.choices.map((choice) => [choice.value, choice.weight]),
    );
  }
  return grammar(rules, { id: descriptor.id, start: descriptor.start, maxDepth: descriptor.maxDepth });
}

function requireTable(suffix: string): TableData {
  const id = `${PREFIX}/table/${suffix}`;
  const table = pack.tables.find((t) => t.id === id);
  if (!table) throw new Error(`steampunk pack: missing table ${id}`);
  return table;
}

const grammars = {
  airship: requireGrammar("airship"),
  contraption: requireGrammar("contraption"),
  guild: requireGrammar("guild"),
  society: requireGrammar("society"),
  headline: requireGrammar("headline"),
  district: requireGrammar("district"),
  automaton: requireGrammar("automaton"),
  patent: requireGrammar("patent"),
  street: requireGrammar("street"),
  rank: requireGrammar("rank"),
} as const;

/** A name form together with a plain-English gloss of its invented elements. */
export interface GlossedName {
  form: string;
  translation: string;
}

/** A personal name in one of the pack's two naming styles. */
export interface PersonName extends GlossedName {
  cultureId: string;
  given: GlossedName;
  surname: GlossedName;
}

const cultures = pack.cultures;
const culturePicker: Generator<(typeof cultures)[number]> = oneOf(...cultures);

function literalPicker(culture: (typeof cultures)[number], kind: string, key: string): Generator<GlossedName> {
  const choices = culture.templates?.[kind];
  if (!choices || choices.length === 0) {
    throw new Error(`steampunk pack: culture ${culture.id} has no ${kind} templates`);
  }
  const literalChoices = choices.map((choice) => {
    const template = choice.value;
    if (template.kind !== "literal") {
      throw new Error(`steampunk pack: ${kind} templates must be literal`);
    }
    return { form: template.form, translation: template.translation, weight: choice.weight };
  });
  const picker = weightedList<GlossedName>(
    literalChoices.map((choice) => ({
      value: { form: choice.form ?? "", translation: choice.translation ?? "" },
      weight: choice.weight,
    })),
  );
  return {
    id: `${culture.id}/${key}`,
    generate(ctx: Context) {
      return picker.generate(ctx.child(key));
    },
  };
}

/** Person name from a stable naming style: given + surname with glosses. */
export const personName: Generator<PersonName> = {
  id: `${PREFIX}/generator/person-name`,
  generate(ctx: Context) {
    const culture = culturePicker.generate(ctx.child("culture"));
    const given = literalPicker(culture, "given", "given").generate(ctx.child("given"));
    const surname = literalPicker(culture, "surname", "surname").generate(ctx.child("surname"));
    return {
      form: `${given.form} ${surname.form}`,
      translation: `${given.translation}, ${surname.translation}`,
      cultureId: culture.id,
      given,
      surname,
    };
  },
};

/** Place name drawn from a naming style, with a gloss of its elements. */
export const placeName: Generator<GlossedName> = {
  id: `${PREFIX}/generator/place-name`,
  generate(ctx: Context) {
    const culture = culturePicker.generate(ctx.child("culture"));
    const place = literalPicker(culture, "settlement", "settlement").generate(ctx.child("settlement"));
    return { ...place };
  },
};

// ─── Public generators ───────────────────────────────────────────────────

export const airshipName: Generator<string> = grammars.airship;
export const contraptionName: Generator<string> = grammars.contraption;
export const guildName: Generator<string> = grammars.guild;
export const societyName: Generator<string> = grammars.society;
export const headline: Generator<string> = grammars.headline;
export const districtName: Generator<string> = grammars.district;
export const automatonName: Generator<string> = grammars.automaton;
export const patentTitle: Generator<string> = grammars.patent;
export const streetName: Generator<string> = grammars.street;
export const officialTitle: Generator<string> = grammars.rank;

const tableGenerators: Readonly<Record<string, Generator<string>>> = Object.fromEntries(
  Object.entries(grammars).map(([key, gen]) => [`${PREFIX}/generator/${key === "rank" ? "official-title" : key}-name`, gen]),
);

const tableHost: TableHost = {
  table(id: string) {
    const table = pack.tables.find((entry) => entry.id === id);
    if (!table) throw new Error(`steampunk pack: unknown table ${id}`);
    return table;
  },
  generator(id: string) {
    const gen = tableGenerators[id];
    if (!gen) throw new Error(`steampunk pack: unknown table generator ${id}`);
    return gen;
  },
  expandGrammar(id: string, template: string, ctx: Context) {
    const gen = Object.values(grammars).find((g) => g.id === id);
    if (!gen) throw new Error(`steampunk pack: unknown grammar ${id}`);
    return gen.expand(template, ctx);
  },
};

function oracle(suffix: string): Generator<TableRoll> {
  const table = requireTable(suffix);
  return {
    id: table.id.replace("/table/", "/generator/"),
    generate(ctx: Context) {
      return rollTable(table, ctx.child("table"), tableHost);
    },
  };
}

export const malfunctionOracle: Generator<TableRoll> = oracle("malfunction");
export const gaslampOmenOracle: Generator<TableRoll> = oracle("gaslamp-omen");

/** All public generators, keyed by a short facade name. */
export const generators = {
  personName,
  placeName,
  airshipName,
  contraptionName,
  guildName,
  societyName,
  headline,
  districtName,
  automatonName,
  patentTitle,
  streetName,
  officialTitle,
  malfunctionOracle,
  gaslampOmenOracle,
} as const;

export type GeneratorKey = keyof typeof generators;

export interface SteampunkAPI {
  person(): PersonName;
  place(): GlossedName;
  airship(): string;
  contraption(): string;
  guild(): string;
  society(): string;
  headline(): string;
  district(): string;
  automaton(): string;
  patent(): string;
  street(): string;
  title(): string;
  malfunction(): TableRoll;
  omen(): TableRoll;
  context: Context;
}

export interface SteampunkEntry {
  withSeed(seed: Seed): SteampunkAPI;
  generators: typeof generators;
  pack: PackManifestV1;
}

/** Deterministic facade: the same seed and call sequence yields the same output. */
export const steampunk: SteampunkEntry = {
  generators,
  pack,
  withSeed(seed: Seed): SteampunkAPI {
    const root = createContext({ seed });
    let counter = 0;
    const sub = (label: string) => root.child(`${label}:${counter++}`);
    return {
      person: () => personName.generate(sub("person")),
      place: () => placeName.generate(sub("place")),
      airship: () => airshipName.generate(sub("airship")),
      contraption: () => contraptionName.generate(sub("contraption")),
      guild: () => guildName.generate(sub("guild")),
      society: () => societyName.generate(sub("society")),
      headline: () => headline.generate(sub("headline")),
      district: () => districtName.generate(sub("district")),
      automaton: () => automatonName.generate(sub("automaton")),
      patent: () => patentTitle.generate(sub("patent")),
      street: () => streetName.generate(sub("street")),
      title: () => officialTitle.generate(sub("title")),
      malfunction: () => malfunctionOracle.generate(sub("malfunction")),
      omen: () => gaslampOmenOracle.generate(sub("omen")),
      context: root,
    };
  },
};
