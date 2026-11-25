import {
  type Context,
  type Generator,
  type Seed,
  createContext,
} from "@lexiconlang/core";
import {
  freezeCulture,
  generateStructuredName,
  type Culture,
  type NameTemplate,
} from "@lexiconlang/language";
import {
  portableGrammar,
  rollTable,
  type TableData,
  type TableHost,
  type TableRoll,
} from "@lexiconlang/packs";
import {
  data,
  type CultureData,
  type GrammarDescriptor,
  type TableDescriptor,
} from "./data.js";
export { data } from "./data.js";

// ─── Pack-runtime bridge ──────────────────────────────────────────────────
//
// The facade must roll through the *same* primitives that createWorld() uses
// for a declarative pack (`portableGrammar` / `rollTable`). Re-implementing
// selection here with core RNG helpers silently produced different results
// from the JSON-loaded runtime; every generator below now delegates.

function descriptorById(id: string): GrammarDescriptor {
  const found = data.grammars.find((g) => g.id === id);
  if (!found) throw new Error(`pirates: missing grammar descriptor ${id}`);
  return found;
}

function tableById(id: string): TableDescriptor {
  const found = data.tables.find((t) => t.id === id);
  if (!found) throw new Error(`pirates: missing table descriptor ${id}`);
  return found;
}

/** No pirates grammar references an external generator; fail loudly if one appears. */
function externalGenerator(id: string): never {
  throw new Error(`pirates: unexpected external grammar reference ${id}`);
}

const grammarHost = {
  expandGrammar(id: string, template: string, ctx: Context): string {
    return portableGrammar(descriptorById(id) as never, externalGenerator).expandTemplate(template, ctx);
  },
};

const tableHost: TableHost = {
  table: (id) => tableById(id) as unknown as TableData,
  generator: (id) => {
    const found = (generators as Record<string, Generator<unknown>>)[id];
    if (!found) throw new Error(`pirates: unknown table generator ${id}`);
    return found;
  },
  expandGrammar: grammarHost.expandGrammar,
};

/** A grammar generator backed by the pack's portable interpreter. */
function fromGrammar(id: string, name: string): Generator<string> {
  const portable = portableGrammar(descriptorById(id) as never, externalGenerator);
  return { id: name, generate: (ctx) => portable.generate(ctx) };
}

/** An oracle generator backed by the pack's table roller (dice + weights). */
function fromTable(id: string, name: string): Generator<TableRoll> {
  const table = tableById(id) as unknown as TableData;
  return { id: name, generate: (ctx) => rollTable(table, ctx, tableHost) };
}

// ─── Structured captain names ─────────────────────────────────────────────

function nameTemplateOf(value: unknown): NameTemplate {
  const v = value as { kind?: string; form?: string; translation?: string };
  if (v?.kind !== "literal" || typeof v.form !== "string" || typeof v.translation !== "string") {
    throw new Error("pirates: only literal name templates are supported by the facade");
  }
  return { kind: "literal", form: v.form, translation: v.translation };
}

/** Resolve a pack culture the same way createWorld().use(definePack(data)) does. */
function resolveCulture(raw: CultureData): Culture {
  const g = raw.glyphs as {
    classes?: Record<string, readonly string[]>;
    syllables?: readonly (readonly [string, number])[];
    wordShapes?: readonly (readonly [string, number])[];
    constraints?: unknown;
    joiner?: string;
  } | undefined;
  const templates = Object.fromEntries(
    Object.entries(raw.templates).map(([kind, choices]) => [
      kind,
      choices.map((c) => [nameTemplateOf(c.value), c.weight] as const),
    ]),
  );
  return freezeCulture({
    id: raw.id,
    glyphs: {
      classes: g?.classes ?? {},
      syllables: g?.syllables ?? [],
      wordShapes: g?.wordShapes ?? [],
      ...(g?.constraints === undefined ? {} : { constraints: g.constraints }),
      ...(g?.joiner === undefined ? {} : { joiner: g.joiner }),
    },
    templates,
    nameStructures: raw.nameStructures,
    capitalize: raw.capitalize ?? "first",
    meaningPacks: [],
    wordClasses: [],
    genderTemplates: {},
  } as unknown as Culture);
}

interface CaptainRecipe {
  culture: Culture;
  structure: string;
}

const captainRecipes: readonly CaptainRecipe[] = data.generators
  .filter((g) => g.engine === "structured-name-v1" && g.tags.includes("captain"))
  .map((g) => {
    const raw = data.cultures.find((c) => c.id === g.culture);
    if (!raw) throw new Error(`pirates: captain generator ${g.id} has unknown culture ${g.culture}`);
    if (!g.structure) throw new Error(`pirates: captain generator ${g.id} has no structure`);
    return { culture: resolveCulture(raw), structure: g.structure };
  });

export interface CaptainName {
  full: string;
  translation: string;
  given: string;
  surname: string;
  epithet: string;
  culture: string;
}

/** A captain name drawn from one of the two authored cultures, with an epithet. */
export const captainName: Generator<CaptainName> = {
  id: "pirates.captainName",
  generate(ctx: Context): CaptainName {
    const idx = ctx.child("culture").rng.nextInt(0, captainRecipes.length);
    const recipe = captainRecipes[idx]!;
    const named = generateStructuredName(recipe.culture, { structure: recipe.structure }, ctx);
    const component = (role: string) => named.components.find((c) => c.role === role)?.value.form ?? "";
    return {
      full: named.form,
      translation: named.translation,
      given: component("given"),
      surname: component("surname"),
      epithet: component("epithet"),
      culture: recipe.culture.id,
    };
  },
};

// ─── Generators ───────────────────────────────────────────────────────────

export const shipName = fromGrammar("lexiconlang.pirates/grammar/ship-name", "pirates.shipName");
export const shipClass = fromGrammar("lexiconlang.pirates/grammar/ship-class", "pirates.shipClass");
export const captainEpithet = fromGrammar("lexiconlang.pirates/grammar/captain-epithet", "pirates.captainEpithet");
export const crewName = fromGrammar("lexiconlang.pirates/grammar/crew-name", "pirates.crewName");
export const portCove = fromGrammar("lexiconlang.pirates/grammar/port-cove", "pirates.portCove");
export const factionName = fromGrammar("lexiconlang.pirates/grammar/faction-name", "pirates.factionName");
export const treasure = fromGrammar("lexiconlang.pirates/grammar/treasure", "pirates.treasure");
export const mapName = fromGrammar("lexiconlang.pirates/grammar/map-name", "pirates.mapName");
export const shantyTitle = fromGrammar("lexiconlang.pirates/grammar/shanty-title", "pirates.shantyTitle");
export const navalRank = fromGrammar("lexiconlang.pirates/grammar/naval-rank", "pirates.navalRank");

/** The two authored naming styles (cultures) in the pack. */
export const cultures = data.cultures;

export const seaEncounter = fromTable("lexiconlang.pirates/table/sea-encounter", "pirates.seaEncounter");
export const weatherPortent = fromTable("lexiconlang.pirates/table/weather-portent", "pirates.weatherPortent");
export const cargoHaul = fromTable("lexiconlang.pirates/table/cargo-haul", "pirates.cargoHaul");

// Expose the pure table roller for callers that want the full TableRoll tree.
export { rollTable };

// ─── Public API ───────────────────────────────────────────────────────────

export const generators = {
  shipName,
  shipClass,
  captainName,
  captainEpithet,
  crewName,
  portCove,
  factionName,
  treasure,
  mapName,
  shantyTitle,
  navalRank,
  seaEncounter,
  weatherPortent,
  cargoHaul,
} as const;

export interface PiratesAPI {
  ship: () => string;
  shipClass: () => string;
  captain: () => CaptainName;
  epithet: () => string;
  crew: () => string;
  port: () => string;
  faction: () => string;
  treasure: () => string;
  map: () => string;
  shanty: () => string;
  rank: () => string;
  encounter: () => TableRoll;
  weather: () => TableRoll;
  cargo: () => TableRoll;
  context: Context;
}

export interface PiratesEntry {
  withSeed(seed: Seed): PiratesAPI;
  generators: typeof generators;
}

/**
 * Convenience facade. Each method uses a fixed, named child key so repeated
 * calls are deterministic without a shared counter (unlike the legacy genre
 * facades; this is intentionally a new, opt-in API).
 */
export const pirates: PiratesEntry = {
  generators,
  withSeed(seed: Seed): PiratesAPI {
    const root = createContext({ seed });
    return {
      ship: () => shipName.generate(root.child("ship")),
      shipClass: () => shipClass.generate(root.child("ship-class")),
      captain: () => captainName.generate(root.child("captain")),
      epithet: () => captainEpithet.generate(root.child("epithet")),
      crew: () => crewName.generate(root.child("crew")),
      port: () => portCove.generate(root.child("port")),
      faction: () => factionName.generate(root.child("faction")),
      treasure: () => treasure.generate(root.child("treasure")),
      map: () => mapName.generate(root.child("map")),
      shanty: () => shantyTitle.generate(root.child("shanty")),
      rank: () => navalRank.generate(root.child("rank")),
      encounter: () => seaEncounter.generate(root.child("encounter")),
      weather: () => weatherPortent.generate(root.child("weather")),
      cargo: () => cargoHaul.generate(root.child("cargo")),
      context: root,
    };
  },
};

export default pirates;
