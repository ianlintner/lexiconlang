/**
 * Expanded fantasy pack facade (P1).
 *
 * The JSON pack is the single source of truth for the expanded content:
 * two original human naming cultures plus tavern, spell, magic-item,
 * pantheon, guild, rumor and shop generators. The legacy generators in
 * index.ts are intentionally untouched so existing goldens stay byte-identical.
 */
import type { Context, Generator, Seed } from "@lexiconlang/core";
import { createWorld, definePack, validatePack, type World } from "@lexiconlang/packs";
import manifest from "./fantasy.pack.json" with { type: "json" };

/** Validated, immutable expanded pack. Throws at import time on malformed data. */
export { validatePack };
export const expandedPack = definePack(manifest as never);

export const expandedGeneratorIds = {
  humanNorthronGiven: "lexiconlang.fantasy/generator/human-northron-given",
  humanSouthronGiven: "lexiconlang.fantasy/generator/human-southron-given",
  humanNorthronSurname: "lexiconlang.fantasy/generator/human-northron-surname",
  humanSouthronSurname: "lexiconlang.fantasy/generator/human-southron-surname",
  tavernName: "lexiconlang.fantasy/generator/tavern-name",
  tavernMenu: "lexiconlang.fantasy/generator/tavern-menu",
  tavernPatron: "lexiconlang.fantasy/generator/tavern-patron",
  spellName: "lexiconlang.fantasy/generator/spell-name",
  spellSchool: "lexiconlang.fantasy/generator/spell-school",
  spellEffect: "lexiconlang.fantasy/generator/spell-effect",
  magicItemRarity: "lexiconlang.fantasy/generator/magic-item-rarity",
  magicItemForm: "lexiconlang.fantasy/generator/magic-item-form",
  magicItemProperty: "lexiconlang.fantasy/generator/magic-item-property",
  deityDomain: "lexiconlang.fantasy/generator/deity-domain",
  deityTitle: "lexiconlang.fantasy/generator/deity-title",
  guildName: "lexiconlang.fantasy/generator/guild-name",
  guildCharter: "lexiconlang.fantasy/generator/guild-charter",
  rumorHook: "lexiconlang.fantasy/generator/rumor-hook",
  shopStock: "lexiconlang.fantasy/generator/shop-stock",
  shopService: "lexiconlang.fantasy/generator/shop-service",
} as const;

export type ExpandedGeneratorId = (typeof expandedGeneratorIds)[keyof typeof expandedGeneratorIds];

/** A table roll result from the pack. */
export interface TableRollText {
  table: string;
  entry: string;
  text: string;
  children: readonly unknown[];
}

function world(seed: Seed): World {
  return createWorld({ seed }).use(expandedPack);
}

/**
 * Human naming without the legacy `human -> dwarvish` placeholder.
 * Both cultures are original and opt-in; existing generators are unchanged.
 */
export interface HumanV2 {
  northronGiven: (key?: string) => unknown;
  northronSurname: (key?: string) => unknown;
  southronGiven: (key?: string) => unknown;
  southronSurname: (key?: string) => unknown;
  northronFullName: (key?: string) => string;
  southronFullName: (key?: string) => string;
}

export interface ExpandedAPI {
  humanV2: HumanV2;
  tavern: { name: (key?: string) => string; menu: (key?: string) => TableRollText; patron: (key?: string) => TableRollText };
  spell: { name: (key?: string) => string; school: (key?: string) => TableRollText; effect: (key?: string) => TableRollText };
  magicItem: { rarity: (key?: string) => TableRollText; form: (key?: string) => TableRollText; property: (key?: string) => TableRollText; full: (key?: string) => string };
  pantheon: { domain: (key?: string) => TableRollText; title: (key?: string) => TableRollText };
  guild: { name: (key?: string) => string; charter: (key?: string) => TableRollText };
  rumor: (key?: string) => TableRollText;
  shop: { stock: (key?: string) => TableRollText; service: (key?: string) => TableRollText };
  generate: (id: ExpandedGeneratorId, key?: string) => unknown;
}

const K = "p1";

/** Seeded entry point for the expanded fantasy pack. */
export function expandedWithSeed(seed: Seed): ExpandedAPI {
  const w = world(seed);
  const gen = <T>(id: ExpandedGeneratorId, key = K): T => w.generate<T>(id, key);
  return {
    humanV2: {
      northronGiven: (key = K) => gen(expandedGeneratorIds.humanNorthronGiven, key),
      northronSurname: (key = K) => gen(expandedGeneratorIds.humanNorthronSurname, key),
      southronGiven: (key = K) => gen(expandedGeneratorIds.humanSouthronGiven, key),
      southronSurname: (key = K) => gen(expandedGeneratorIds.humanSouthronSurname, key),
      northronFullName: (key = K) => nameText(gen(expandedGeneratorIds.humanNorthronGiven, key)) + " " + nameText(gen(expandedGeneratorIds.humanNorthronSurname, key)),
      southronFullName: (key = K) => nameText(gen(expandedGeneratorIds.humanSouthronGiven, key)) + " " + nameText(gen(expandedGeneratorIds.humanSouthronSurname, key)),
    },
    tavern: {
      name: (key = K) => gen(expandedGeneratorIds.tavernName, key) as string,
      menu: (key = K) => gen<TableRollText>(expandedGeneratorIds.tavernMenu, key),
      patron: (key = K) => gen<TableRollText>(expandedGeneratorIds.tavernPatron, key),
    },
    spell: {
      name: (key = K) => gen(expandedGeneratorIds.spellName, key) as string,
      school: (key = K) => gen<TableRollText>(expandedGeneratorIds.spellSchool, key),
      effect: (key = K) => gen<TableRollText>(expandedGeneratorIds.spellEffect, key),
    },
    magicItem: {
      rarity: (key = K) => gen<TableRollText>(expandedGeneratorIds.magicItemRarity, key),
      form: (key = K) => gen<TableRollText>(expandedGeneratorIds.magicItemForm, key),
      property: (key = K) => gen<TableRollText>(expandedGeneratorIds.magicItemProperty, key),
      full: (key = K) => {
        const rarity = gen<TableRollText>(expandedGeneratorIds.magicItemRarity, key).text;
        const form = gen<TableRollText>(expandedGeneratorIds.magicItemForm, key).text;
        const prop = gen<TableRollText>(expandedGeneratorIds.magicItemProperty, key).text;
        return `${rarity} ${form} that ${prop}`;
      },
    },
    pantheon: {
      domain: (key = K) => gen<TableRollText>(expandedGeneratorIds.deityDomain, key),
      title: (key = K) => gen<TableRollText>(expandedGeneratorIds.deityTitle, key),
    },
    guild: {
      name: (key = K) => gen(expandedGeneratorIds.guildName, key) as string,
      charter: (key = K) => gen<TableRollText>(expandedGeneratorIds.guildCharter, key),
    },
    rumor: (key = K) => gen<TableRollText>(expandedGeneratorIds.rumorHook, key),
    shop: {
      stock: (key = K) => gen<TableRollText>(expandedGeneratorIds.shopStock, key),
      service: (key = K) => gen<TableRollText>(expandedGeneratorIds.shopService, key),
    },
    generate: (id, key = K) => gen(id, key),
  };
}

function nameText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const v = value as { form?: unknown; text?: unknown };
    if (typeof v.form === "string") return v.form;
    if (typeof v.text === "string") return v.text;
  }
  return String(value);
}

/** Thin Generator adapters so callers can compose expanded content with core operators.
 *  The world is derived from the supplied context's RNG under a stable child
 *  scope, so different seeds produce different content while equal seed+scope
 *  pairs stay equal. Sibling order cannot shift a draw. */
export const expandedGenerators = {
  tavernName: adapter<string>(expandedGeneratorIds.tavernName),
  spellName: adapter<string>(expandedGeneratorIds.spellName),
  guildName: adapter<string>(expandedGeneratorIds.guildName),
  rumorHook: adapter<TableRollText>(expandedGeneratorIds.rumorHook),
  tavernMenu: adapter<TableRollText>(expandedGeneratorIds.tavernMenu),
  magicItemForm: adapter<TableRollText>(expandedGeneratorIds.magicItemForm),
  deityDomain: adapter<TableRollText>(expandedGeneratorIds.deityDomain),
} as const;

function adapter<T>(id: ExpandedGeneratorId): Generator<T> {
  return {
    id: `fantasy.expanded.${id}`,
    generate(ctx: Context) {
      // Sibling-order independence: fork under a stable key rather than drawing
      // from the shared parent RNG. The forked state is a portable sfc32 Seed,
      // so the world is fully determined by ctx's seed and the adapter key.
      const derived = ctx.child(`fantasy-expanded:${id}`).rng.state();
      const w = createWorld({ seed: derived }).use(expandedPack);
      return w.generate<T>(id, ctx.scope.join("/") || K);
    },
  };
}
