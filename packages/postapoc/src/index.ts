import { type Seed } from "@lexiconlang/core";
import { createWorld, definePack, type LoadedPack, type World } from "@lexiconlang/packs";
import manifest from "./postapoc.pack.json" with { type: "json" };

/** Stable pack id and generator ids (resource ids from `postapoc.pack.json`). */
export const PACK_ID = "lexiconlang.postapoc";

const gid = (name: string) => `${PACK_ID}/generator/${name}`;

/** Every generator id the pack exposes, keyed by short name. */
export const generatorIds = {
  personScrapper: gid("person-scrapper"),
  personTechcult: gid("person-techcult"),
  personVaultborn: gid("person-vaultborn"),
  settlementScrapper: gid("settlement-scrapper"),
  settlementTechcult: gid("settlement-techcult"),
  raiderBand: gid("raider-band"),
  techcultFaction: gid("techcult-faction"),
  vaultName: gid("vault-name"),
  vaultDetail: gid("vault-detail"),
  mutation: gid("mutation"),
  gear: gid("gear"),
  vehicle: gid("vehicle"),
  tradeGoods: gid("trade-goods"),
  encounter: gid("encounter"),
} as const;

/** The validated, frozen pack. Install into a world with `world.use(pack)`. */
export const pack: LoadedPack = definePack(manifest as never);

/** A generated name: `form` is the in-world rendering, `translation` the plain-English gloss. */
export interface PostapocName {
  form: string;
  translation: string;
  language: string;
}

/** Result of a table-backed generator (mutation, gear, vehicle, ...). */
export interface PostapocRoll {
  table: string;
  entry: string;
  text: string;
}

export type Culture = "scrapper" | "techcult" | "vaultborn";

export interface Vault {
  name: string;
  detail: string;
}

export interface PostapocAPI {
  /** Person name; `culture` defaults to "scrapper" (degraded English). */
  person(culture?: Culture): PostapocName;
  /** Settlement name; vaultborn has no settlements, use `vault()`. */
  settlement(culture?: "scrapper" | "techcult"): PostapocName;
  /** Raider band / tribe name. */
  raiders(): PostapocName;
  /** Tech-cult order name. */
  techcult(): PostapocName;
  /** Vault/bunker designation plus its current state and secret. */
  vault(): Vault;
  mutation(): string;
  /** Scavenged gear with a condition grade and distinguishing mark. */
  gear(): string;
  vehicle(): string;
  tradeGoods(): string;
  /** Wasteland encounter from a 2d6 oracle. */
  encounter(): string;
  world: World;
}

export interface PostapocEntry {
  pack: LoadedPack;
  generatorIds: typeof generatorIds;
  /** Install the pack into an existing world (idempotent for identical content). */
  install(world: World): World;
  withSeed(seed: Seed): PostapocAPI;
}

function textOf(roll: PostapocRoll): string {
  return roll.text;
}

export const postapoc: PostapocEntry = {
  pack,
  generatorIds,
  install(world: World): World {
    return world.use(pack);
  },
  withSeed(seed: Seed): PostapocAPI {
    const world = createWorld({ seed }).use(pack);
    let counter = 0;
    // Each call derives its own key, so results never depend on sibling order beyond the call counter.
    const key = (label: string) => `${label}:${counter++}`;
    const name = (id: string, label: string): PostapocName => {
      const n = world.generate<PostapocName>(id, key(label));
      return { form: n.form, translation: n.translation, language: n.language };
    };
    const roll = (id: string, label: string) => textOf(world.generate<PostapocRoll>(id, key(label)));
    return {
      world,
      person: (culture = "scrapper") =>
        name(culture === "techcult" ? generatorIds.personTechcult : culture === "vaultborn" ? generatorIds.personVaultborn : generatorIds.personScrapper, "person"),
      settlement: (culture = "scrapper") =>
        name(culture === "techcult" ? generatorIds.settlementTechcult : generatorIds.settlementScrapper, "settlement"),
      raiders: () => name(generatorIds.raiderBand, "raiders"),
      techcult: () => name(generatorIds.techcultFaction, "techcult"),
      vault: () => ({
        name: world.generate<string>(generatorIds.vaultName, key("vault-name")),
        detail: roll(generatorIds.vaultDetail, "vault-detail"),
      }),
      mutation: () => roll(generatorIds.mutation, "mutation"),
      gear: () => roll(generatorIds.gear, "gear"),
      vehicle: () => roll(generatorIds.vehicle, "vehicle"),
      tradeGoods: () => roll(generatorIds.tradeGoods, "trade"),
      encounter: () => roll(generatorIds.encounter, "encounter"),
    };
  },
};

export default postapoc;
