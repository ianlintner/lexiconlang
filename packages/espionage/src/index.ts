/**
 * @lexiconlang/espionage — original espionage & military genre pack.
 *
 * All content lives in `src/espionage.pack.json` (F2 declarative pack v1).
 * This module is a thin typed facade: `espionage.withSeed(seed)` gives a stable,
 * key-based API over the portable F1/F2/F3 engines in `@lexiconlang/packs`.
 * Nothing here changes legacy generator IDs or bytes.
 */
import type { Seed } from "@lexiconlang/core";
import type { StructuredName } from "@lexiconlang/language";
import { createWorld, definePack, type TableRoll, type World } from "@lexiconlang/packs";

import { data, IDS, provenance, type EspionageGeneratorId } from "./data.js";

export { data, provenance, IDS };
export type { EspionageGeneratorId };

/** The validated, frozen F2 pack. Import this to install it into another world. */
export const pack = definePack(data);

export interface EspionageAPI {
  /** Two-word operation codename, e.g. "Operation Hollow Lantern". */
  operationCodename(key?: string): string;
  /** Radio callsign, e.g. "Quiet Heron". */
  callsign(key?: string): string;
  /** Intelligence agency, e.g. "Directorate of Special Review". */
  agencyName(key?: string): string;
  /** Military unit designation, e.g. "3rd Pathfinder Battalion". */
  militaryUnit(key?: string): string;
  /** Safehouse description, e.g. "a damp boathouse beyond the tram depot". */
  safehouse(key?: string): string;
  /** Dead-drop container, location and signal. */
  deadDrop(key?: string): string;
  /** Unit insignia motto, e.g. "Watch the dawn". */
  insigniaMotto(key?: string): string;
  /** Officer with rank and branch, e.g. "Major Silas Thorne, Air Arm". */
  officer(key?: string): string;
  /** Cover occupation and employer. */
  coverOccupation(key?: string): string;
  /** One-line mission briefing. */
  missionBriefing(key?: string): string;
  /** Mid-century cover identity (structured name). */
  coverIdentityPostwar(key?: string): StructuredName;
  /** Contemporary cover identity (structured name). */
  coverIdentityModern(key?: string): StructuredName;
  /** Agent name in the invented Meridian tongue, with translation. */
  meridianAgent(key?: string): StructuredName;
  /** Meridian place name, with translation. */
  meridianPlace(key?: string): StructuredName;
  /** Meridian faction/service name, with translation. */
  meridianFaction(key?: string): StructuredName;
  /** Military rank oracle: "<branch>: <rank>". */
  rank(key?: string): string;
  /** Field complication oracle. */
  fieldComplication(key?: string): string;
  /** d6 asset reliability grade. */
  assetReliability(key?: string): string;
  /** Raw portable generation for any advertised generator ID. */
  generate<T = unknown>(id: EspionageGeneratorId, key: string): T;
  /** The underlying world (installed pack, registry and descriptors). */
  readonly world: World;
}

export interface EspionageEntry {
  withSeed(seed: Seed): EspionageAPI;
  generators: Readonly<Record<EspionageGeneratorId, EspionageGeneratorId>>;
  readonly id: string;
  readonly version: string;
}

export const espionage: EspionageEntry = {
  id: data.id,
  version: data.version,
  generators: Object.fromEntries(
    Object.values(IDS)
      .filter((id) => id !== IDS.pack)
      .map((id) => [id, id]),
  ) as Readonly<Record<EspionageGeneratorId, EspionageGeneratorId>>,
  withSeed(seed: Seed): EspionageAPI {
    const world = createWorld({ seed }).use(pack);
    const generate = <T>(id: EspionageGeneratorId, key: string): T =>
      world.generate<T>(id, `espionage:${key}`);
    const text = (id: EspionageGeneratorId, key: string): string => generate<TableRoll>(id, key).text;
    return {
      operationCodename: (key = "operation") => generate<string>(IDS.operationCodename, key),
      callsign: (key = "callsign") => generate<string>(IDS.callsign, key),
      agencyName: (key = "agency") => generate<string>(IDS.agencyName, key),
      militaryUnit: (key = "unit") => generate<string>(IDS.militaryUnit, key),
      safehouse: (key = "safehouse") => generate<string>(IDS.safehouse, key),
      deadDrop: (key = "dead-drop") => generate<string>(IDS.deadDrop, key),
      insigniaMotto: (key = "motto") => generate<string>(IDS.insigniaMotto, key),
      officer: (key = "officer") => generate<string>(IDS.officer, key),
      coverOccupation: (key = "cover-occupation") => generate<string>(IDS.coverOccupation, key),
      missionBriefing: (key = "briefing") => generate<string>(IDS.missionBriefing, key),
      coverIdentityPostwar: (key = "cover-postwar") => generate<StructuredName>(IDS.coverIdentityPostwar, key),
      coverIdentityModern: (key = "cover-modern") => generate<StructuredName>(IDS.coverIdentityModern, key),
      meridianAgent: (key = "meridian-agent") => generate<StructuredName>(IDS.meridianAgent, key),
      meridianPlace: (key = "meridian-place") => generate<StructuredName>(IDS.meridianPlace, key),
      meridianFaction: (key = "meridian-faction") => generate<StructuredName>(IDS.meridianFaction, key),
      rank: (key = "rank") => text(IDS.rankLadder, key),
      fieldComplication: (key = "complication") => text(IDS.fieldComplication, key),
      assetReliability: (key = "asset") => text(IDS.assetReliability, key),
      generate,
      world,
    };
  },
};

export default espionage;
