/** Typed view over src/horror.pack.json — the JSON manifest is the single source of truth. */
import bundle from "./horror.pack.json" with { type: "json" };
import type { PackManifestV1 } from "@lexiconlang/packs";

export const data = bundle as unknown as PackManifestV1;
export const provenance = data.provenance;

export const IDS = {
  pack: "lexiconlang.horror",
  investigator: "lexiconlang.horror/generator/investigator",
  eldritchEntity: "lexiconlang.horror/generator/eldritch-entity",
  forbiddenTome: "lexiconlang.horror/generator/forbidden-tome",
  cult: "lexiconlang.horror/generator/cult",
  hauntedLocation: "lexiconlang.horror/generator/haunted-location",
  town: "lexiconlang.horror/generator/town",
  omen: "lexiconlang.horror/generator/omen",
  secret: "lexiconlang.horror/generator/secret",
  monsterTrait: "lexiconlang.horror/generator/monster-trait",
  monsterForm: "lexiconlang.horror/generator/monster-form",
  investigatorRole: "lexiconlang.horror/generator/investigator-role",
} as const;

export type HorrorGeneratorId = (typeof IDS)[keyof typeof IDS];
