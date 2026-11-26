/**
 * @lexiconlang/horror — original horror & cosmic-horror genre pack.
 *
 * All content lives in `src/horror.pack.json` (F2 declarative pack v1).
 * This module is a thin typed facade: `horror.withSeed(seed)` gives a stable,
 * key-based API over the portable F1/F2/F3 engines in `@lexiconlang/packs`.
 * Nothing here changes legacy fantasy/scifi/modern generator IDs or bytes.
 */
import type { Seed } from "@lexiconlang/core";
import type { TranslatedName } from "@lexiconlang/language";
import { createWorld, definePack, type TableRoll, type World } from "@lexiconlang/packs";

import { data, IDS, provenance, type HorrorGeneratorId } from "./data.js";

export { data, provenance, IDS };
export type { HorrorGeneratorId };

/** The validated, frozen F2 pack. Import this to install it into another world. */
export const pack = definePack(data);

export interface HorrorAPI {
  /** A 1920s-style investigator name, e.g. "Insp. Rosalind Silverton". */
  investigator(key?: string): string;
  /** Unpronounceable eldritch entity name, e.g. "thul-ot". */
  eldritchEntity(key?: string): string;
  /** Forbidden tome, e.g. "Folio of the Cinder Water". */
  forbiddenTome(key?: string): string;
  /** Cult or secret society, e.g. "Order of the Thorn". */
  cult(key?: string): string;
  /** Haunted site, e.g. "the old cellar beneath the bakery". */
  hauntedLocation(key?: string): string;
  /** Small-town name as a translated name from the investigator culture. */
  town(key?: string): TranslatedName;
  /** Sanity-shaking omen text from the F3 oracle table. */
  omen(key?: string): string;
  /** Small-town secret text from the F3 oracle table. */
  secret(key?: string): string;
  /** Monster trait text from the F3 weighted table. */
  monsterTrait(key?: string): string;
  /** Vague monster manifestation from the F3 weighted table. */
  monsterForm(key?: string): string;
  /** Investigator occupation from the F3 weighted table. */
  investigatorRole(key?: string): string;
  /** Raw portable generation for any advertised generator ID. */
  generate<T = unknown>(id: HorrorGeneratorId, key: string): T;
  /** The underlying world (installed pack, registry and descriptors). */
  readonly world: World;
}

export interface HorrorEntry {
  withSeed(seed: Seed): HorrorAPI;
  generators: Readonly<Record<HorrorGeneratorId, HorrorGeneratorId>>;
  readonly id: string;
  readonly version: string;
}

function tableText(roll: TableRoll): string {
  return roll.text;
}

export const horror: HorrorEntry = {
  id: data.id,
  version: data.version,
  generators: Object.fromEntries(
    Object.values(IDS)
      .filter((id) => id !== IDS.pack)
      .map((id) => [id, id]),
  ) as Readonly<Record<HorrorGeneratorId, HorrorGeneratorId>>,
  withSeed(seed: Seed): HorrorAPI {
    const world = createWorld({ seed }).use(pack);
    const generate = <T>(id: HorrorGeneratorId, key: string): T =>
      world.generate<T>(id, `horror:${key}`);
    return {
      investigator: (key = "investigator") => generate<string>(IDS.investigator, key),
      eldritchEntity: (key = "eldritch") => generate<string>(IDS.eldritchEntity, key),
      forbiddenTome: (key = "tome") => generate<string>(IDS.forbiddenTome, key),
      cult: (key = "cult") => generate<string>(IDS.cult, key),
      hauntedLocation: (key = "haunted") => generate<string>(IDS.hauntedLocation, key),
      town: (key = "town") => generate<TranslatedName>(IDS.town, key),
      omen: (key = "omen") => tableText(generate<TableRoll>(IDS.omen, key)),
      secret: (key = "secret") => tableText(generate<TableRoll>(IDS.secret, key)),
      monsterTrait: (key = "monster-trait") => tableText(generate<TableRoll>(IDS.monsterTrait, key)),
      monsterForm: (key = "monster-form") => tableText(generate<TableRoll>(IDS.monsterForm, key)),
      investigatorRole: (key = "investigator-role") => tableText(generate<TableRoll>(IDS.investigatorRole, key)),
      generate,
      world,
    };
  },
};
