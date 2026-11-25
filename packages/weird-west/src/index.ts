import type { Seed } from "@lexiconlang/core";
import { createWorld, definePack, type LoadedPack, type PackManifestV1, type TableRoll, type World } from "@lexiconlang/packs";
import packJson from "../data/weird-west.pack.json" with { type: "json" };

/** Pack id and the stable generator ids published by `@lexiconlang/weird-west`. */
export const PACK_ID = "lexiconlang.weird-west" as const;
const g = (name: string) => `${PACK_ID}/generator/${name}` as const;

export const generatorIds = {
  town: g("town"),
  outlawAlias: g("outlaw-alias"),
  gang: g("gang"),
  saloon: g("saloon"),
  mine: g("mine"),
  ranch: g("ranch"),
  brand: g("brand"),
  wantedPoster: g("wanted-poster"),
  bounty: g("bounty"),
  occultEncounter: g("occult-encounter"),
  relic: g("relic"),
  rumor: g("rumor"),
  anomaly: g("anomaly"),
  dustbornGiven: g("dustborn-given"),
  dustbornMoniker: g("dustborn-moniker"),
  dustbornTown: g("dustborn-town"),
  saltmarchGiven: g("saltmarch-given"),
  saltmarchMoniker: g("saltmarch-moniker"),
  saltmarchTown: g("saltmarch-town"),
} as const;

export type WeirdWestCulture = "dustborn" | "saltmarch";
export type WeirdWestNameKind = "given" | "moniker" | "town";

/** A translated name from one of the pack's two invented frontier tongues. */
export interface WeirdWestName {
  form: string;
  translation: string;
  language: string;
}

/** The validated, frozen F2 pack (portable JSON: `data/weird-west.pack.json`). */
export const weirdWestPack: LoadedPack = definePack(packJson as unknown as PackManifestV1);

/** Create a World with the pack installed. */
export function createWeirdWestWorld(seed: Seed): World {
  return createWorld({ seed }).use(weirdWestPack);
}

export interface WeirdWestAPI {
  town(): string;
  outlaw(): string;
  gang(): string;
  saloon(): string;
  mine(): string;
  ranch(): string;
  brand(): string;
  wantedPoster(): string;
  /** Full table roll (dice, entry keys, child rolls) for a wanted poster. */
  wantedPosterRoll(): TableRoll;
  bounty(): string;
  encounter(): string;
  relic(): string;
  rumor(): string;
  anomaly(): string;
  name(culture: WeirdWestCulture, kind: WeirdWestNameKind): WeirdWestName;
  world: World;
}

export interface WeirdWestEntry {
  id: typeof PACK_ID;
  pack: LoadedPack;
  generators: typeof generatorIds;
  withSeed(seed: Seed): WeirdWestAPI;
}

export const weirdWest: WeirdWestEntry = {
  id: PACK_ID,
  pack: weirdWestPack,
  generators: generatorIds,
  withSeed(seed: Seed): WeirdWestAPI {
    const world = createWeirdWestWorld(seed);
    // Each call draws from a fresh stable key: "<label>:<n>".
    let counter = 0;
    const key = (label: string) => `${label}:${counter++}`;
    const str = (id: string, label: string) => world.generate<string>(id, key(label));
    const roll = (id: string, label: string) => world.generate<TableRoll>(id, key(label));
    return {
      town: () => str(generatorIds.town, "town"),
      outlaw: () => str(generatorIds.outlawAlias, "outlaw"),
      gang: () => str(generatorIds.gang, "gang"),
      saloon: () => str(generatorIds.saloon, "saloon"),
      mine: () => str(generatorIds.mine, "mine"),
      ranch: () => str(generatorIds.ranch, "ranch"),
      brand: () => str(generatorIds.brand, "brand"),
      wantedPoster: () => roll(generatorIds.wantedPoster, "poster").text,
      wantedPosterRoll: () => roll(generatorIds.wantedPoster, "poster"),
      bounty: () => roll(generatorIds.bounty, "bounty").text,
      encounter: () => roll(generatorIds.occultEncounter, "encounter").text,
      relic: () => roll(generatorIds.relic, "relic").text,
      rumor: () => roll(generatorIds.rumor, "rumor").text,
      anomaly: () => roll(generatorIds.anomaly, "anomaly").text,
      name: (culture, kind) => {
        const id = g(`${culture}-${kind}`);
        const n = world.generate<WeirdWestName>(id, key(`name-${culture}-${kind}`));
        return { form: n.form, translation: n.translation, language: n.language };
      },
      world,
    };
  },
};
