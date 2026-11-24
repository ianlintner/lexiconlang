/**
 * @lexiconlang/wuxia — declarative wuxia / xianxia / cultivation genre pack.
 *
 * All content lives in `data/wuxia.pack.json`; this module is a thin typed
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
import packJson from "../data/wuxia.pack.json" with { type: "json" };

/** The validated pack manifest (also available as `@lexiconlang/wuxia/pack.json`). */
export const pack = packJson as unknown as PackManifestV1;

const PREFIX = "lexiconlang.wuxia";

function requireGrammar(suffix: string): Grammar {
  const id = `${PREFIX}/grammar/${suffix}`;
  const descriptor = pack.grammars.find((g) => g.id === id);
  if (!descriptor) throw new Error(`wuxia pack: missing grammar ${id}`);
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
  if (!table) throw new Error(`wuxia pack: missing table ${id}`);
  return table;
}

const grammars = {
  sect: requireGrammar("sect"),
  technique: requireGrammar("technique"),
  realm: requireGrammar("realm"),
  treasure: requireGrammar("treasure"),
  nickname: requireGrammar("nickname"),
  mountain: requireGrammar("mountain"),
  secretRealm: requireGrammar("secret-realm"),
  pill: requireGrammar("pill"),
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

function literalPicker(
  culture: (typeof cultures)[number],
  kind: string,
  key: string,
): Generator<GlossedName> {
  const choices = culture.templates?.[kind];
  if (!choices || choices.length === 0) {
    throw new Error(`wuxia pack: culture ${culture.id} has no ${kind} templates`);
  }
  const literalChoices = choices.map((choice) => {
    const template = choice.value;
    if (template.kind !== "literal") {
      throw new Error(`wuxia pack: ${kind} templates must be literal`);
    }
    return {
      form: template.form ?? "",
      translation: template.translation ?? "",
      weight: choice.weight,
    };
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

/** Person name from a stable naming style: surname + given with glosses (family-first). */
export const personName: Generator<PersonName> = {
  id: `${PREFIX}/generator/person-name`,
  generate(ctx: Context) {
    const culture = culturePicker.generate(ctx.child("culture"));
    const surname = literalPicker(culture, "surname", "surname").generate(ctx.child("surname"));
    const given = literalPicker(culture, "given", "given").generate(ctx.child("given"));
    return {
      form: `${surname.form} ${given.form}`,
      translation: `${surname.translation}, ${given.translation}`,
      cultureId: culture.id,
      given,
      surname,
    };
  },
};

/** Settlement name drawn from a naming style, with a gloss of its elements. */
export const placeName: Generator<GlossedName> = {
  id: `${PREFIX}/generator/place-name`,
  generate(ctx: Context) {
    const culture = culturePicker.generate(ctx.child("culture"));
    const place = literalPicker(culture, "settlement", "settlement").generate(ctx.child("settlement"));
    return { ...place };
  },
};

/** Sacred mountain or famous peak from a naming style, with gloss. */
export const mountainName: Generator<GlossedName> = {
  id: `${PREFIX}/generator/mountain-name`,
  generate(ctx: Context) {
    const culture = culturePicker.generate(ctx.child("culture"));
    const mountain = literalPicker(culture, "mountain", "mountain").generate(ctx.child("mountain"));
    return { ...mountain };
  },
};

// ─── Public generators ───────────────────────────────────────────────────

export const sectName: Generator<string> = grammars.sect;
export const techniqueName: Generator<string> = grammars.technique;
export const realm: Generator<string> = grammars.realm;
export const treasureName: Generator<string> = grammars.treasure;
export const nickname: Generator<string> = grammars.nickname;
export const secretRealm: Generator<string> = grammars.secretRealm;
export const pillName: Generator<string> = grammars.pill;

const tableGeneratorIds: Readonly<Record<string, string>> = {
  sect: "sect-name",
  technique: "technique-name",
  realm: "realm",
  treasure: "treasure-name",
  nickname: "nickname",
  mountain: "mountain-name",
  secretRealm: "secret-realm",
  pill: "pill-name",
};

const tableGenerators: Readonly<Record<string, Generator<string>>> = Object.fromEntries(
  Object.entries(grammars).map(([key, gen]) => [
    `${PREFIX}/generator/${tableGeneratorIds[key] ?? `${key}-name`}`,
    gen,
  ]),
);

const tableHost: TableHost = {
  table(id: string) {
    const table = pack.tables.find((entry) => entry.id === id);
    if (!table) throw new Error(`wuxia pack: unknown table ${id}`);
    return table;
  },
  generator(id: string) {
    const gen = tableGenerators[id];
    if (!gen) throw new Error(`wuxia pack: unknown table generator ${id}`);
    return gen;
  },
  expandGrammar(id: string, template: string, ctx: Context) {
    const gen = Object.values(grammars).find((g) => g.id === id);
    if (!gen) throw new Error(`wuxia pack: unknown grammar ${id}`);
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

export const tribulationOracle: Generator<TableRoll> = oracle("tribulation");
export const jianghuOmenOracle: Generator<TableRoll> = oracle("jianghu-omen");

/** All public generators, keyed by a short facade name. */
export const generators = {
  personName,
  placeName,
  mountainName,
  sectName,
  techniqueName,
  realm,
  treasureName,
  nickname,
  secretRealm,
  pillName,
  tribulationOracle,
  jianghuOmenOracle,
} as const;

export type GeneratorKey = keyof typeof generators;

export interface WuxiaAPI {
  person(): PersonName;
  place(): GlossedName;
  mountain(): GlossedName;
  sect(): string;
  technique(): string;
  cultivationRealm(): string;
  treasure(): string;
  nickname(): string;
  secretRealm(): string;
  pill(): string;
  tribulation(): TableRoll;
  omen(): TableRoll;
  context: Context;
}

export interface WuxiaEntry {
  withSeed(seed: Seed): WuxiaAPI;
  generators: typeof generators;
  pack: PackManifestV1;
}

/** Deterministic facade: the same seed and call sequence yields the same output. */
export const wuxia: WuxiaEntry = {
  generators,
  pack,
  withSeed(seed: Seed): WuxiaAPI {
    const root = createContext({ seed });
    let counter = 0;
    const sub = (label: string) => root.child(`${label}:${counter++}`);
    return {
      person: () => personName.generate(sub("person")),
      place: () => placeName.generate(sub("place")),
      mountain: () => mountainName.generate(sub("mountain")),
      sect: () => sectName.generate(sub("sect")),
      technique: () => techniqueName.generate(sub("technique")),
      cultivationRealm: () => realm.generate(sub("realm")),
      treasure: () => treasureName.generate(sub("treasure")),
      nickname: () => nickname.generate(sub("nickname")),
      secretRealm: () => secretRealm.generate(sub("secretRealm")),
      pill: () => pillName.generate(sub("pill")),
      tribulation: () => tribulationOracle.generate(sub("tribulation")),
      omen: () => jianghuOmenOracle.generate(sub("omen")),
      context: root,
    };
  },
};
