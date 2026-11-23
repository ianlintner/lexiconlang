import type { Seed } from "@lexiconlang/core";
import { createWorld, definePack, type LoadedPack, type PackManifestV1, type World } from "@lexiconlang/packs";
import bundle from "../data/cyberpunk.pack.json" with { type: "json" };

/**
 * @lexiconlang/cyberpunk — declarative pack (`data/cyberpunk.pack.json`) plus a
 * thin typed facade. Everything here is portable data: any host that loads the
 * pack JSON through `@lexiconlang/packs` gets the same output for the same
 * seed and key.
 */

export const PACK_ID = "lexiconlang.cyberpunk";

/** Fully qualified generator IDs, keyed by short name. */
export const GENERATOR_IDS = {
  personCorp: `${PACK_ID}/generator/person-name-corp`,
  personStreet: `${PACK_ID}/generator/person-name-street`,
  megacorp: `${PACK_ID}/generator/megacorp-name`,
  gang: `${PACK_ID}/generator/gang-name`,
  handle: `${PACK_ID}/generator/handle`,
  district: `${PACK_ID}/generator/district-name`,
  arcology: `${PACK_ID}/generator/arcology-name`,
  ai: `${PACK_ID}/generator/ai-name`,
  product: `${PACK_ID}/generator/product-name`,
  drugName: `${PACK_ID}/generator/drug-name`,
  faction: `${PACK_ID}/generator/faction-name`,
  cyberware: `${PACK_ID}/generator/cyberware`,
  streetDrug: `${PACK_ID}/generator/street-drug`,
  fixerJob: `${PACK_ID}/generator/fixer-job`,
  streetEncounter: `${PACK_ID}/generator/street-encounter`,
} as const;

export type GeneratorKey = keyof typeof GENERATOR_IDS;

/** A generated name: the in-world form and its plain-language translation. */
export interface CyberpunkName {
  form: string;
  translation: string;
  /** Culture ID that produced the name. */
  language: string;
}

export interface Cyberware {
  slot: string;
  name: string;
  effect: string;
  /** Street price tier, e.g. "Mid-market (1,000 to 10,000 cred)". */
  tier: string;
}

export interface StreetDrug {
  name: string;
  effect: string;
  risk: string;
}

export interface OracleRoll {
  /** Table entry key that was selected (e.g. `job-07`). */
  entry: string;
  /** Dice total for dice-mode oracles. */
  total?: number;
  text: string;
}

export interface CyberpunkAPI {
  person: { corp: () => CyberpunkName; street: () => CyberpunkName };
  handle: () => CyberpunkName;
  faction: { megacorp: () => CyberpunkName; gang: () => CyberpunkName; org: () => string };
  place: { district: () => CyberpunkName; arcology: () => CyberpunkName };
  ai: () => CyberpunkName;
  product: () => CyberpunkName;
  drug: () => StreetDrug;
  cyberware: () => Cyberware;
  fixerJob: () => OracleRoll;
  encounter: () => OracleRoll;
  world: World;
}

export interface CyberpunkEntry {
  /** The frozen, validated pack. */
  pack: LoadedPack;
  /** Raw pack manifest (JSON). */
  manifest: Readonly<PackManifestV1>;
  generatorIds: typeof GENERATOR_IDS;
  /** Create a world and typed helpers; every call draws from a fresh `key:index` path. */
  withSeed(seed: Seed): CyberpunkAPI;
  /** Create a world with the pack installed, for direct `world.generate(id, key)` use. */
  createWorld(seed: Seed): World;
}

export const manifest = bundle as unknown as PackManifestV1;
export const pack: LoadedPack = definePack(manifest);

export function createCyberpunkWorld(seed: Seed): World {
  return createWorld({ seed }).use(pack);
}

interface RawName { form: string; translation: string; language: string }
interface RawRoll { entry: string; total?: number; text: string }

const toName = (raw: RawName): CyberpunkName => ({ form: raw.form, translation: raw.translation, language: raw.language });

function toOracle(raw: RawRoll): OracleRoll {
  return { entry: raw.entry, ...(raw.total === undefined ? {} : { total: raw.total }), text: raw.text };
}

function split(text: string, count: number): string[] {
  const parts = text.split(" | ");
  if (parts.length !== count) throw new Error(`cyberpunk: expected ${count} parts, got ${parts.length}: ${text}`);
  return parts;
}

export const cyberpunk: CyberpunkEntry = {
  pack,
  manifest,
  generatorIds: GENERATOR_IDS,
  createWorld: createCyberpunkWorld,
  withSeed(seed: Seed): CyberpunkAPI {
    const world = createCyberpunkWorld(seed);
    let counter = 0;
    const key = (label: string) => `${label}:${counter++}`;
    const name = (id: GeneratorKey, label: string): CyberpunkName => toName(world.generate<RawName>(GENERATOR_IDS[id], key(label)));
    const roll = (id: GeneratorKey, label: string): RawRoll => world.generate<RawRoll>(GENERATOR_IDS[id], key(label));
    return {
      person: { corp: () => name("personCorp", "person.corp"), street: () => name("personStreet", "person.street") },
      handle: () => name("handle", "handle"),
      faction: {
        megacorp: () => name("megacorp", "megacorp"),
        gang: () => name("gang", "gang"),
        org: () => world.generate<string>(GENERATOR_IDS.faction, key("org")),
      },
      place: { district: () => name("district", "district"), arcology: () => name("arcology", "arcology") },
      ai: () => name("ai", "ai"),
      product: () => name("product", "product"),
      drug: () => {
        const r = roll("streetDrug", "drug");
        const [n, effect, risk] = split(r.text, 3) as [string, string, string];
        return { name: n, effect, risk };
      },
      cyberware: () => {
        const r = roll("cyberware", "cyberware");
        const [n, effect, tier] = split(r.text, 3) as [string, string, string];
        return { slot: r.entry, name: n, effect, tier };
      },
      fixerJob: () => toOracle(roll("fixerJob", "job")),
      encounter: () => toOracle(roll("streetEncounter", "encounter")),
      world,
    };
  },
};
