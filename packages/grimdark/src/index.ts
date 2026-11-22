/**
 * @lexiconlang/grimdark — declarative grimdark genre pack.
 *
 * All content lives in `data/grimdark.pack.json`; this module is a thin typed
 * facade. Every sub-roll is addressed through `ctx.child("<stable-key>")`, so
 * sibling order never changes a generator's output. All names, banners,
 * heresies, plagues and ratfolk clans are original synthetic fiction (CC0-1.0):
 * no third-party setting IP is reproduced.
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
import packJson from "../data/grimdark.pack.json" with { type: "json" };

/** The validated pack manifest (also available as `@lexiconlang/grimdark/pack.json`). */
export const pack = packJson as unknown as PackManifestV1;

const PREFIX = "lexiconlang.grimdark";

function requireGrammar(suffix: string): Grammar {
  const id = `${PREFIX}/grammar/${suffix}`;
  const descriptor = pack.grammars.find((g) => g.id === id);
  if (!descriptor) throw new Error(`grimdark pack: missing grammar ${id}`);
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
  if (!table) throw new Error(`grimdark pack: missing table ${id}`);
  return table;
}

const grammars = {
  warband: requireGrammar("warband"),
  banner: requireGrammar("banner"),
  heresy: requireGrammar("heresy"),
  inquisition: requireGrammar("inquisition"),
  plague: requireGrammar("plague"),
  mutation: requireGrammar("mutation"),
  title: requireGrammar("title"),
  warmachine: requireGrammar("warmachine"),
  clan: requireGrammar("clan"),
  warlord: requireGrammar("warlord"),
  battle: requireGrammar("battle"),
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
  lineage: GlossedName;
}

const cultures = pack.cultures;
const culturePicker: Generator<(typeof cultures)[number]> = oneOf(...cultures);

/** The lineage template key differs per culture: surname for Ashbound, clan for Vermin. */
function lineageKey(culture: (typeof cultures)[number]): string {
  if (culture.templates?.clan) return "clan";
  if (culture.templates?.surname) return "surname";
  throw new Error(`grimdark pack: culture ${culture.id} has no lineage templates`);
}

function literalPicker(culture: (typeof cultures)[number], kind: string, key: string): Generator<GlossedName> {
  const choices = culture.templates?.[kind];
  if (!choices || choices.length === 0) {
    throw new Error(`grimdark pack: culture ${culture.id} has no ${kind} templates`);
  }
  const literalChoices = choices.map((choice) => {
    const template = choice.value;
    if (template.kind !== "literal") {
      throw new Error(`grimdark pack: ${kind} templates must be literal`);
    }
    return { form: template.form ?? "", translation: template.translation ?? "", weight: choice.weight };
  });
  const picker = weightedList<GlossedName>(
    literalChoices.map((choice) => ({
      value: { form: choice.form, translation: choice.translation },
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

/** Person name from a stable naming style: given + lineage with glosses. */
export const personName: Generator<PersonName> = {
  id: `${PREFIX}/generator/person-name`,
  generate(ctx: Context) {
    const culture = culturePicker.generate(ctx.child("culture"));
    const given = literalPicker(culture, "given", "given").generate(ctx.child("given"));
    const key = lineageKey(culture);
    const lineage = literalPicker(culture, key, "lineage").generate(ctx.child("lineage"));
    return {
      form: `${given.form} ${lineage.form}`,
      translation: `${given.translation}, ${lineage.translation}`,
      cultureId: culture.id,
      given,
      lineage,
    };
  },
};

/** Place-name qualifier: a translated descriptor appended to a settlement. */
interface PlaceQualifier extends GlossedName {}
const placeQualifiers = weightedList<PlaceQualifier>([
  { value: { form: "the Ashen March", translation: "ash borderland" }, weight: 1 },
  { value: { form: "of the Broken Oath", translation: "broken oath" }, weight: 1 },
  { value: { form: "the Cinder Reach", translation: "cinder expanse" }, weight: 1 },
  { value: { form: "of the Dread Crown", translation: "dread crown" }, weight: 1 },
  { value: { form: "the Fell Border", translation: "cruel border" }, weight: 1 },
  { value: { form: "of the Hollow Choir", translation: "hollow choir" }, weight: 1 },
  { value: { form: "the Iron Vigil", translation: "iron watch" }, weight: 1 },
  { value: { form: "of the Last Pyre", translation: "last pyre" }, weight: 1 },
  { value: { form: "the Mourn Road", translation: "mourning road" }, weight: 1 },
  { value: { form: "of the Ninth Seal", translation: "ninth seal" }, weight: 1 },
  { value: { form: "the Rotting Fen", translation: "rotting marsh" }, weight: 1 },
  { value: { form: "of the Silent Bell", translation: "silent bell" }, weight: 1 },
  { value: { form: "the Thorn Weald", translation: "thorn forest" }, weight: 1 },
  { value: { form: "of the Withered Host", translation: "withered army" }, weight: 1 },
]);

/** Place name drawn from a naming style, with a gloss of its elements. */
export const placeName: Generator<GlossedName> = {
  id: `${PREFIX}/generator/place-name`,
  generate(ctx: Context) {
    const culture = culturePicker.generate(ctx.child("culture"));
    const place = literalPicker(culture, "settlement", "settlement").generate(ctx.child("settlement"));
    const qualifier = placeQualifiers.generate(ctx.child("realm"));
    return {
      form: `${place.form} ${qualifier.form}`,
      translation: `${place.translation}, ${qualifier.translation}`,
    };
  },
};

/** Ratfolk warlord name: given name + warlord epithet, both from the pack. */
export const verminWarlordName: Generator<GlossedName> = {
  id: `${PREFIX}/generator/vermin-warlord-name`,
  generate(ctx: Context) {
    const culture = cultures.find((c) => c.id === `${PREFIX}/culture/vermin`);
    if (!culture) throw new Error("grimdark pack: missing vermin culture");
    const given = literalPicker(culture, "given", "given").generate(ctx.child("given"));
    const clan = literalPicker(culture, "clan", "clan").generate(ctx.child("clan"));
    return {
      form: `${given.form} ${clan.form}`,
      translation: `${given.translation}, ${clan.translation}`,
    };
  },
};

// ─── Public generators ───────────────────────────────────────────────────

export const warbandName: Generator<string> = grammars.warband;
export const bannerMotto: Generator<string> = grammars.banner;
export const heresyName: Generator<string> = grammars.heresy;
export const inquisitionName: Generator<string> = grammars.inquisition;
export const plagueName: Generator<string> = grammars.plague;
export const mutationName: Generator<string> = grammars.mutation;
export const grimTitle: Generator<string> = grammars.title;
export const warMachineName: Generator<string> = grammars.warmachine;
export const clanName: Generator<string> = grammars.clan;
export const warlordName: Generator<string> = grammars.warlord;
export const battleName: Generator<string> = grammars.battle;

const tableGenerators: Readonly<Record<string, Generator<string>>> = Object.fromEntries(
  Object.entries(grammars).map(([key, gen]) => [`${PREFIX}/generator/${key === "title" ? "grim-title" : key === "warmachine" ? "war-machine-name" : key}-name`, gen]),
);

const tableHost: TableHost = {
  table(id: string) {
    const table = pack.tables.find((entry) => entry.id === id);
    if (!table) throw new Error(`grimdark pack: unknown table ${id}`);
    return table;
  },
  generator(id: string) {
    const gen = tableGenerators[id];
    if (!gen) throw new Error(`grimdark pack: unknown table generator ${id}`);
    return gen;
  },
  expandGrammar(id: string, template: string, ctx: Context) {
    const gen = Object.values(grammars).find((g) => g.id === id);
    if (!gen) throw new Error(`grimdark pack: unknown grammar ${id}`);
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

export const doomOmenOracle: Generator<TableRoll> = oracle("doom-omen");
export const plagueOutcomeOracle: Generator<TableRoll> = oracle("plague-outcome");

/** All public generators, keyed by a short facade name. */
export const generators = {
  personName,
  placeName,
  warbandName,
  bannerMotto,
  heresyName,
  inquisitionName,
  plagueName,
  mutationName,
  grimTitle,
  warMachineName,
  clanName,
  warlordName,
  verminWarlordName,
  battleName,
  doomOmenOracle,
  plagueOutcomeOracle,
} as const;

export type GeneratorKey = keyof typeof generators;

export interface GrimdarkAPI {
  person(): PersonName;
  place(): GlossedName;
  warband(): string;
  banner(): string;
  heresy(): string;
  inquisition(): string;
  plague(): string;
  mutation(): string;
  title(): string;
  warMachine(): string;
  clan(): string;
  warlord(): string;
  verminWarlord(): GlossedName;
  battle(): string;
  omen(): TableRoll;
  plagueOutcome(): TableRoll;
  context: Context;
}

export interface GrimdarkEntry {
  withSeed(seed: Seed): GrimdarkAPI;
  generators: typeof generators;
  pack: PackManifestV1;
}

/** Deterministic facade: the same seed and call sequence yields the same output. */
export const grimdark: GrimdarkEntry = {
  generators,
  pack,
  withSeed(seed: Seed): GrimdarkAPI {
    const root = createContext({ seed });
    let counter = 0;
    const sub = (label: string) => root.child(`${label}:${counter++}`);
    return {
      person: () => personName.generate(sub("person")),
      place: () => placeName.generate(sub("place")),
      warband: () => warbandName.generate(sub("warband")),
      banner: () => bannerMotto.generate(sub("banner")),
      heresy: () => heresyName.generate(sub("heresy")),
      inquisition: () => inquisitionName.generate(sub("inquisition")),
      plague: () => plagueName.generate(sub("plague")),
      mutation: () => mutationName.generate(sub("mutation")),
      title: () => grimTitle.generate(sub("title")),
      warMachine: () => warMachineName.generate(sub("warmachine")),
      clan: () => clanName.generate(sub("clan")),
      warlord: () => warlordName.generate(sub("warlord")),
      verminWarlord: () => verminWarlordName.generate(sub("verminWarlord")),
      battle: () => battleName.generate(sub("battle")),
      omen: () => doomOmenOracle.generate(sub("omen")),
      plagueOutcome: () => plagueOutcomeOracle.generate(sub("plagueOutcome")),
      context: root,
    };
  },
};
