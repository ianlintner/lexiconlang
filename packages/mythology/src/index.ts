/**
 * @lexiconlang/mythology — declarative mythology & pantheons genre pack.
 *
 * All content lives in `data/mythology.pack.json`; this module is a thin typed
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
import packJson from "../data/mythology.pack.json" with { type: "json" };

/** The validated pack manifest (also available as `@lexiconlang/mythology/pack.json`). */
export const pack = packJson as unknown as PackManifestV1;

const PREFIX = "lexiconlang.mythology";

function requireGrammar(suffix: string): Grammar {
  const id = `${PREFIX}/grammar/${suffix}`;
  const descriptor = pack.grammars.find((g) => g.id === id);
  if (!descriptor) throw new Error(`mythology pack: missing grammar ${id}`);
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
  if (!table) throw new Error(`mythology pack: missing table ${id}`);
  return table;
}

const grammars = {
  deity: requireGrammar("deity"),
  pantheon: requireGrammar("pantheon"),
  myth: requireGrammar("myth"),
  "holy-site": requireGrammar("holy-site"),
  artifact: requireGrammar("artifact"),
  monster: requireGrammar("monster"),
  faction: requireGrammar("faction"),
  epithet: requireGrammar("epithet"),
} as const;

/** A name form together with a plain-English gloss of its invented elements. */
export interface GlossedName {
  form: string;
  translation: string;
}

/** A personal name in one of the pack's five naming styles. */
export interface PersonName extends GlossedName {
  cultureId: string;
  given: GlossedName;
  surname: GlossedName;
}

const cultures = pack.cultures.filter((c) => !c.id.endsWith("/pan-mythic"));
const culturePicker: Generator<(typeof cultures)[number]> = oneOf(...cultures);

function literalPicker(
  culture: (typeof cultures)[number],
  kind: string,
  key: string,
): Generator<GlossedName> {
  const choices = culture.templates?.[kind];
  if (!choices || choices.length === 0) {
    throw new Error(`mythology pack: culture ${culture.id} has no ${kind} templates`);
  }
  const literalChoices = choices.map((choice) => {
    const template = choice.value;
    if (template.kind !== "literal") {
      throw new Error(`mythology pack: ${kind} templates must be literal`);
    }
    return {
      value: {
        form: template.form ?? "",
        translation: template.translation ?? "",
      },
      weight: choice.weight,
    };
  });
  const picker = weightedList<GlossedName>(literalChoices);
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

/** A glossed form from a culture-specific template bank. */
function culturalForm(kind: string, key: string, id: string): Generator<GlossedName> {
  return {
    id,
    generate(ctx: Context) {
      const culture = culturePicker.generate(ctx.child("culture"));
      return literalPicker(culture, kind, key).generate(ctx.child(key));
    },
  };
}

/** Invented divine name drawn from a naming style's deity bank. */
export const culturalDeityName = culturalForm("deity", "deity", `${PREFIX}/generator/cultural-deity-name`);
/** Divine epithet drawn from a naming style's epithet bank. */
export const culturalEpithet = culturalForm("epithet", "epithet", `${PREFIX}/generator/cultural-epithet`);

// ─── Public generators ───────────────────────────────────────────────────

export const deityName: Generator<string> = grammars.deity;
export const pantheonName: Generator<string> = grammars.pantheon;
export const epithet: Generator<string> = grammars.epithet;
export const mythTitle: Generator<string> = grammars.myth;
export const holySiteName: Generator<string> = grammars["holy-site"];
export const artifactName: Generator<string> = grammars.artifact;
export const monsterName: Generator<string> = grammars.monster;
export const factionName: Generator<string> = grammars.faction;

const tableGenerators: Readonly<Record<string, Generator<string>>> = {
  [`${PREFIX}/generator/pantheon`]: grammars.pantheon,
  [`${PREFIX}/generator/myth-title`]: grammars.myth,
  [`${PREFIX}/generator/holy-site`]: grammars["holy-site"],
  [`${PREFIX}/generator/artifact`]: grammars.artifact,
  [`${PREFIX}/generator/monster`]: grammars.monster,
  [`${PREFIX}/generator/faction`]: grammars.faction,
};

const tableHost: TableHost = {
  table(id: string) {
    const table = pack.tables.find((entry) => entry.id === id);
    if (!table) throw new Error(`mythology pack: unknown table ${id}`);
    return table;
  },
  generator(id: string) {
    const gen = tableGenerators[id];
    if (!gen) throw new Error(`mythology pack: unknown table generator ${id}`);
    return gen;
  },
  expandGrammar(id: string, template: string, ctx: Context) {
    const gen = Object.values(grammars).find((g) => g.id === id);
    if (!gen) throw new Error(`mythology pack: unknown grammar ${id}`);
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

export const mythHookOracle: Generator<TableRoll> = oracle("myth-hook");
export const sacredRiteOracle: Generator<TableRoll> = oracle("sacred-rite");
export const relicPowerOracle: Generator<TableRoll> = oracle("relic-power");
export const divineOmenOracle: Generator<TableRoll> = oracle("divine-omen");

/** All public generators, keyed by a short facade name. */
export const generators = {
  personName,
  placeName,
  deityName,
  culturalDeityName,
  pantheonName,
  epithet,
  culturalEpithet,
  mythTitle,
  holySiteName,
  artifactName,
  monsterName,
  factionName,
  mythHookOracle,
  sacredRiteOracle,
  relicPowerOracle,
  divineOmenOracle,
} as const;

export type GeneratorKey = keyof typeof generators;

export interface MythologyAPI {
  person(): PersonName;
  place(): GlossedName;
  deity(): string;
  culturalDeity(): GlossedName;
  pantheon(): string;
  epithet(): string;
  culturalEpithet(): GlossedName;
  myth(): string;
  holySite(): string;
  artifact(): string;
  monster(): string;
  faction(): string;
  mythHook(): TableRoll;
  rite(): TableRoll;
  relicPower(): TableRoll;
  omen(): TableRoll;
  context: Context;
}

export interface MythologyEntry {
  withSeed(seed: Seed): MythologyAPI;
  generators: typeof generators;
  pack: PackManifestV1;
}

/** Deterministic facade: the same seed and call sequence yields the same output. */
export const mythology: MythologyEntry = {
  generators,
  pack,
  withSeed(seed: Seed): MythologyAPI {
    const root = createContext({ seed });
    const counts = new Map<string, number>();
    // Per-method counters: one generator's calls never shift another's stream.
    const sub = (label: string) => {
      const n = counts.get(label) ?? 0;
      counts.set(label, n + 1);
      return root.child(`${label}:${n}`);
    };
    return {
      person: () => personName.generate(sub("person")),
      place: () => placeName.generate(sub("place")),
      deity: () => deityName.generate(sub("deity")),
      culturalDeity: () => culturalDeityName.generate(sub("cultural-deity")),
      pantheon: () => pantheonName.generate(sub("pantheon")),
      epithet: () => epithet.generate(sub("epithet")),
      culturalEpithet: () => culturalEpithet.generate(sub("cultural-epithet")),
      myth: () => mythTitle.generate(sub("myth")),
      holySite: () => holySiteName.generate(sub("holy-site")),
      artifact: () => artifactName.generate(sub("artifact")),
      monster: () => monsterName.generate(sub("monster")),
      faction: () => factionName.generate(sub("faction")),
      mythHook: () => mythHookOracle.generate(sub("myth-hook")),
      rite: () => sacredRiteOracle.generate(sub("rite")),
      relicPower: () => relicPowerOracle.generate(sub("relic-power")),
      omen: () => divineOmenOracle.generate(sub("omen")),
      context: root,
    };
  },
};
