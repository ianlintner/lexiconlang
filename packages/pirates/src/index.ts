import {
  type Context,
  type Generator,
  type Seed,
  createContext,
  oneOf,
} from "@lexiconlang/core";
import { grammar, type GrammarRules } from "@lexiconlang/grammar";
import { rollTable, type TableRoll } from "@lexiconlang/packs";
import { data, type CultureData, type GrammarDescriptor, type TableDescriptor } from "./data.js";
export { data } from "./data.js";

// ─── Helpers ─────────────────────────────────────────────────────────────

function descriptorById(id: string): GrammarDescriptor {
  const found = data.grammars.find((g) => g.id === id);
  if (!found) throw new Error(`pirates: missing grammar descriptor ${id}`);
  return found;
}

/** Convert a portable pack grammar descriptor into typed grammar rules. */
function rulesOf(descriptor: GrammarDescriptor): GrammarRules {
  const rules: Record<string, unknown> = {};
  for (const rule of descriptor.rules) {
    // Grammar's portable weighted-object form is not supported by all hosts;
    // the record form is byte-identical and universally portable.
    const weights: Record<string, number> = {};
    for (const choice of rule.choices) {
      weights[choice.value] = (weights[choice.value] ?? 0) + choice.weight;
    }
    rules[rule.key] = weights;
  }
  return rules as GrammarRules;
}

function fromGrammar(id: string, name: string): Generator<string> {
  const descriptor = descriptorById(id);
  return grammar(rulesOf(descriptor), { id: name, start: descriptor.start });
}

function tableById(id: string): TableDescriptor {
  const found = data.tables.find((t) => t.id === id);
  if (!found) throw new Error(`pirates: missing table descriptor ${id}`);
  return found;
}

/**
 * Oracle generator: selects a literal table entry through a stable child key.
 * The pack's weighted/dice ranges are sampled without consuming the parent RNG.
 */
function fromTable(id: string, name: string): Generator<TableRoll> {
  const table = tableById(id);
  return {
    id: name,
    generate(ctx: Context): TableRoll {
      const rollCtx = ctx.child("select");
      let index: number;
      if (table.mode === "dice") {
        const die = 1 + rollCtx.child("die:0").rng.nextInt(0, 6);
        const entryIndex = table.entries.findIndex((e) => {
          const range = e.range;
          return range !== undefined && die >= range[0] && die <= range[1];
        });
        index = entryIndex < 0 ? 0 : entryIndex;
        const chosen = table.entries[index]!;
        return {
          table: table.id,
          entry: chosen.key,
          total: die,
          dice: [die],
          text: chosen.result.text ?? "",
          children: [],
        };
      }
      const weights = table.entries.map((e) => e.weight ?? 1);
      const total = weights.reduce((a, b) => a + b, 0);
      let ticket = rollCtx.rng.nextInt(0, total);
      index = weights.length - 1;
      for (let i = 0; i < weights.length; i++) {
        const w = weights[i]!;
        if (ticket < w) { index = i; break; }
        ticket -= w;
      }
      const chosen = table.entries[index]!;
      return { table: table.id, entry: chosen.key, text: chosen.result.text ?? "", children: [] };
    },
  };
}

// ─── Generators ──────────────────────────────────────────────────────────

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

export interface CaptainName {
  full: string;
  translation: string;
  given: string;
  surname: string;
  epithet: string;
  culture: string;
}

interface LiteralTemplate { form: string; translation?: string }
/** Extract the literal forms + translations for one slot from a pack culture. */
function slotChoices(culture: CultureData, slot: string): readonly LiteralTemplate[] {
  return (culture.templates[slot] ?? [])
    .map((t) => t.value as { kind?: string; form?: string; translation?: string })
    .filter((v): v is { kind: string; form: string; translation: string } => v?.kind === "literal" && typeof v.form === "string")
    .map((v) => ({ form: v.form, translation: v.translation ?? v.form }));
}

/** A captain name drawn from one of the two cultures, with an epithet. */
export const captainName: Generator<CaptainName> = {
  id: "pirates.captainName",
  generate(ctx: Context): CaptainName {
    const cultureIdx = ctx.child("culture").rng.nextInt(0, cultures.length);
    const culture = cultures[cultureIdx]!;
    const given = oneOf(...slotChoices(culture, "given")).generate(ctx.child("given"));
    const surname = oneOf(...slotChoices(culture, "surname")).generate(ctx.child("surname"));
    const epithet = oneOf(...slotChoices(culture, "epithet")).generate(ctx.child("epithet"));
    return {
      full: `${given.form} ${surname.form} ${epithet.form}`,
      translation: `${given.translation} ${surname.translation} ${epithet.translation}`,
      given: given.form,
      surname: surname.form,
      epithet: epithet.form,
      culture: culture.id,
    };
  },
};

export const seaEncounter = fromTable("lexiconlang.pirates/table/sea-encounter", "pirates.seaEncounter");
export const weatherPortent = fromTable("lexiconlang.pirates/table/weather-portent", "pirates.weatherPortent");
export const cargoHaul = fromTable("lexiconlang.pirates/table/cargo-haul", "pirates.cargoHaul");

// Expose the pure table roller for callers that want the full TableRoll tree.
export { rollTable };

// ─── Public API ──────────────────────────────────────────────────────────

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
