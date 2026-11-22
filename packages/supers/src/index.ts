/**
 * @lexiconlang/supers — declarative supers genre pack.
 *
 * All content lives in `data/supers.pack.json`; this module is a thin typed
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
import packJson from "../data/supers.pack.json" with { type: "json" };

/** The validated pack manifest (also available as `@lexiconlang/supers/pack.json`). */
export const pack = packJson as unknown as PackManifestV1;

const PREFIX = "lexiconlang.supers";

function requireGrammar(suffix: string): Grammar {
  const id = `${PREFIX}/grammar/${suffix}`;
  const descriptor = pack.grammars.find((g) => g.id === id);
  if (!descriptor) throw new Error(`supers pack: missing grammar ${id}`);
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
  if (!table) throw new Error(`supers pack: missing table ${id}`);
  return table;
}

const grammars = {
  heroCodename: requireGrammar("hero-codename"),
  villainCodename: requireGrammar("villain-codename"),
  power: requireGrammar("power"),
  origin: requireGrammar("origin"),
  team: requireGrammar("team"),
  lair: requireGrammar("lair"),
  headline: requireGrammar("headline"),
  motto: requireGrammar("motto"),
} as const;

/** A name form together with a plain-English gloss of its invented elements. */
export interface GlossedName {
  form: string;
  translation: string;
}

/** A personal name in one of the pack's two modern naming styles. */
export interface PersonName extends GlossedName {
  cultureId: string;
  given: GlossedName;
  surname: GlossedName;
}

/** One superhuman faculty and its bound cost or condition. */
export interface PowerSet {
  ability: string;
  limit: string;
  origin: string;
}

/** A costumed identity with a secret civilian name, affiliation and base. */
export interface HeroDossier {
  codename: string;
  alignment: "hero" | "villain";
  secretIdentity: PersonName;
  hometown: GlossedName;
  powers: PowerSet;
  team: string;
  lair: string;
  motto: string;
  headline: string;
}

const cultures = pack.cultures;
const culturePicker: Generator<(typeof cultures)[number]> = oneOf(...cultures);

function literalPicker(culture: (typeof cultures)[number], kind: string, key: string): Generator<GlossedName> {
  const choices = culture.templates?.[kind];
  if (!choices || choices.length === 0) {
    throw new Error(`supers pack: culture ${culture.id} has no ${kind} templates`);
  }
  const literalChoices = choices.map((choice) => {
    const template = choice.value;
    if (template.kind !== "literal") {
      throw new Error(`supers pack: ${kind} templates must be literal`);
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

/** Modern secret identity from a stable naming style: given + surname with glosses. */
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

// ─── Grammar-backed public generators ────────────────────────────────────

export const heroCodename: Generator<string> = grammars.heroCodename;
export const villainCodename: Generator<string> = grammars.villainCodename;
export const powerName: Generator<string> = grammars.power;
export const originName: Generator<string> = grammars.origin;
export const teamName: Generator<string> = grammars.team;
export const lairName: Generator<string> = grammars.lair;
export const headline: Generator<string> = grammars.headline;
export const motto: Generator<string> = grammars.motto;

const grammarById = new Map<string, Grammar>(
  Object.values(grammars).map((gen) => [gen.id, gen]),
);

// ─── Table-backed oracles ────────────────────────────────────────────────

const tableGenerators: Readonly<Record<string, Generator<string>>> = Object.fromEntries(
  Object.entries(grammars).map(([key, gen]) => [`${PREFIX}/generator/${key}`, gen]),
);

const tableHost: TableHost = {
  table(id: string) {
    const table = pack.tables.find((entry) => entry.id === id);
    if (!table) throw new Error(`supers pack: unknown table ${id}`);
    return table;
  },
  generator(id: string) {
    const gen = tableGenerators[id];
    if (!gen) throw new Error(`supers pack: unknown table generator ${id}`);
    return gen;
  },
  expandGrammar(id: string, template: string, ctx: Context) {
    const gen = grammarById.get(id);
    if (!gen) throw new Error(`supers pack: unknown grammar ${id}`);
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

export const powerLimitOracle: Generator<TableRoll> = oracle("power-limit");
export const incidentOracle: Generator<TableRoll> = oracle("incident");
export const shadowOmenOracle: Generator<TableRoll> = oracle("shadow-omen");

// ─── Typed composites ────────────────────────────────────────────────────

/** A power set: an ability, its limiting cost and the origin that granted it. */
export const powerSet: Generator<PowerSet> = {
  id: `${PREFIX}/generator/power-set`,
  generate(ctx: Context) {
    return {
      ability: powerName.generate(ctx.child("ability")),
      limit: powerLimitOracle.generate(ctx.child("limit")).text,
      origin: originName.generate(ctx.child("origin")),
    };
  },
};

/**
 * A complete costumed dossier. Alignment is resolved from a weighted list and
 * every component uses a stable child key, so reordering fields never shifts
 * another field's RNG lane.
 */
export const heroDossier: Generator<HeroDossier> = {
  id: `${PREFIX}/generator/hero-dossier`,
  generate(ctx: Context) {
    const alignmentPicker = weightedList<"hero" | "villain">([
      { value: "hero", weight: 3 },
      { value: "villain", weight: 2 },
    ]);
    const alignment = alignmentPicker.generate(ctx.child("alignment"));
    return {
      codename:
        alignment === "hero"
          ? heroCodename.generate(ctx.child("codename"))
          : villainCodename.generate(ctx.child("codename")),
      alignment,
      secretIdentity: personName.generate(ctx.child("secret-identity")),
      hometown: placeName.generate(ctx.child("hometown")),
      powers: powerSet.generate(ctx.child("powers")),
      team: teamName.generate(ctx.child("team")),
      lair: lairName.generate(ctx.child("lair")),
      motto: motto.generate(ctx.child("motto")),
      headline: headline.generate(ctx.child("headline")),
    };
  },
};

/** All public generators, keyed by a short facade name. */
export const generators = {
  personName,
  placeName,
  heroCodename,
  villainCodename,
  powerName,
  originName,
  teamName,
  lairName,
  headline,
  motto,
  powerLimitOracle,
  incidentOracle,
  shadowOmenOracle,
  powerSet,
  heroDossier,
} as const;

export type GeneratorKey = keyof typeof generators;

export interface SupersAPI {
  person(): PersonName;
  place(): GlossedName;
  hero(): string;
  villain(): string;
  power(): string;
  origin(): string;
  team(): string;
  lair(): string;
  headline(): string;
  motto(): string;
  limit(): TableRoll;
  incident(): TableRoll;
  omen(): TableRoll;
  powerSet(): PowerSet;
  dossier(): HeroDossier;
  context: Context;
}

export interface SupersEntry {
  withSeed(seed: Seed): SupersAPI;
  generators: typeof generators;
  pack: PackManifestV1;
}

/** Deterministic facade: the same seed and call sequence yields the same output. */
export const supers: SupersEntry = {
  generators,
  pack,
  withSeed(seed: Seed): SupersAPI {
    const root = createContext({ seed });
    let counter = 0;
    const sub = (label: string) => root.child(`${label}:${counter++}`);
    return {
      person: () => personName.generate(sub("person")),
      place: () => placeName.generate(sub("place")),
      hero: () => heroCodename.generate(sub("hero")),
      villain: () => villainCodename.generate(sub("villain")),
      power: () => powerName.generate(sub("power")),
      origin: () => originName.generate(sub("origin")),
      team: () => teamName.generate(sub("team")),
      lair: () => lairName.generate(sub("lair")),
      headline: () => headline.generate(sub("headline")),
      motto: () => motto.generate(sub("motto")),
      limit: () => powerLimitOracle.generate(sub("limit")),
      incident: () => incidentOracle.generate(sub("incident")),
      omen: () => shadowOmenOracle.generate(sub("omen")),
      powerSet: () => powerSet.generate(sub("power-set")),
      dossier: () => heroDossier.generate(sub("dossier")),
      context: root,
    };
  },
};
