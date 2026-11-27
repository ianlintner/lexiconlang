/** Typed view over src/espionage.pack.json — the JSON manifest is the single source of truth. */
import bundle from "./espionage.pack.json" with { type: "json" };
import type { PackManifestV1 } from "@lexiconlang/packs";

export const data = bundle as unknown as PackManifestV1;
export const provenance = data.provenance;

export const IDS = {
  pack: "lexiconlang.espionage",
  operationCodename: "lexiconlang.espionage/generator/operation-codename",
  callsign: "lexiconlang.espionage/generator/callsign",
  agencyName: "lexiconlang.espionage/generator/agency-name",
  militaryUnit: "lexiconlang.espionage/generator/military-unit",
  safehouse: "lexiconlang.espionage/generator/safehouse",
  deadDrop: "lexiconlang.espionage/generator/dead-drop",
  insigniaMotto: "lexiconlang.espionage/generator/insignia-motto",
  officer: "lexiconlang.espionage/generator/officer",
  coverOccupation: "lexiconlang.espionage/generator/cover-occupation",
  missionBriefing: "lexiconlang.espionage/generator/mission-briefing",
  coverIdentityPostwar: "lexiconlang.espionage/generator/cover-identity-postwar",
  coverIdentityModern: "lexiconlang.espionage/generator/cover-identity-modern",
  meridianAgent: "lexiconlang.espionage/generator/meridian-agent",
  meridianPlace: "lexiconlang.espionage/generator/meridian-place",
  meridianFaction: "lexiconlang.espionage/generator/meridian-faction",
  rankLadder: "lexiconlang.espionage/generator/rank-ladder",
  fieldComplication: "lexiconlang.espionage/generator/field-complication",
  assetReliability: "lexiconlang.espionage/generator/asset-reliability",
} as const;

export type EspionageGeneratorId = (typeof IDS)[keyof typeof IDS];
