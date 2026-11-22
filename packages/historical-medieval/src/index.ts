import {
  type Context,
  type Generator,
  type Seed,
  createContext,
  intRange,
  oneOf,
} from "@lexiconlang/core";
import { grammar, type GrammarRules } from "@lexiconlang/grammar";

import {
  cultures,
  grammarRules,
  historicalMedievalPack,
  resourceIds,
  tableTexts,
  type CultureId,
  type NamingCulture,
  type TranslatedName,
} from "./pack.js";

export { cultures, historicalMedievalPack, resourceIds } from "./pack.js";
export type { CultureId, NamingCulture, TranslatedName } from "./pack.js";

// ─── Pointer helpers ─────────────────────────────────────────────────────

function cultureById(id: CultureId): NamingCulture {
  const found = cultures.find((c) => c.id === id);
  if (!found) throw new Error(`unknown medieval culture ${id}`);
  return found;
}

function pickName(ctx: Context, pool: readonly TranslatedName[]): TranslatedName {
  const entry = ctx.rng.pick(pool);
  if (!entry) throw new Error("empty medieval name pool");
  return entry;
}

// ─── Person names ────────────────────────────────────────────────────────

export interface MedievalPersonName {
  given: string;
  byname: string;
  full: string;
  culture: CultureId;
  translation: string;
}

/** Selects a naming culture from the four declared medieval styles. */
export const culture: Generator<CultureId> = oneOf<CultureId>(
  ...cultures.map((c) => c.id as CultureId),
);

export function givenNameFor(cultureId: CultureId): Generator<TranslatedName> {
  return {
    id: `medieval.given.${cultureId}`,
    generate(ctx: Context) {
      return pickName(ctx, cultureById(cultureId).given);
    },
  };
}

export function bynameFor(cultureId: CultureId): Generator<TranslatedName> {
  return {
    id: `medieval.byname.${cultureId}`,
    generate(ctx: Context) {
      return pickName(ctx, cultureById(cultureId).byname);
    },
  };
}

export interface PersonNameOptions {
  culture?: CultureId;
}

export function personNameGenerator(options: PersonNameOptions = {}): Generator<MedievalPersonName> {
  return {
    id: options.culture ? `medieval.person.${options.culture}` : "medieval.person",
    generate(ctx: Context) {
      const c = options.culture ?? culture.generate(ctx.child("culture"));
      const given = givenNameFor(c).generate(ctx.child("given"));
      const byname = bynameFor(c).generate(ctx.child("byname"));
      return {
        given: given.form,
        byname: byname.form,
        full: `${given.form} ${byname.form}`,
        culture: c,
        translation: `${given.translation} ${byname.translation}`.trim(),
      };
    },
  };
}

export const personName: Generator<MedievalPersonName> = personNameGenerator();

// ─── Places and organizations (grammar-backed) ───────────────────────────

export const manorName: Generator<string> = grammar(grammarRules(resourceIds.manorGrammar), {
  id: "medieval.manor",
});

export const guildName: Generator<string> = grammar(grammarRules(resourceIds.guildGrammar), {
  id: "medieval.guild",
});

export const monasteryName: Generator<string> = grammar(grammarRules(resourceIds.monasteryGrammar), {
  id: "medieval.monastery",
});

// ─── Tables (weighted pools sourced directly from the pack) ──────────────

export const feudalTitle: Generator<string> = oneOf(...tableTexts(resourceIds.feudalTitleTable));
export const marketGood: Generator<string> = oneOf(...tableTexts(resourceIds.marketGoodTable));
export const domainEvent: Generator<string> = oneOf(...tableTexts(resourceIds.domainEventTable));

export interface MarketListing {
  good: string;
  price: number;
  unit: "penny" | "shilling" | "pound";
}

const marketUnits: readonly MarketListing["unit"][] = ["penny", "shilling", "pound"];
export const marketUnit: Generator<MarketListing["unit"]> = oneOf(...marketUnits);

export const marketListing: Generator<MarketListing> = {
  id: "medieval.marketListing",
  generate(ctx: Context) {
    const good = marketGood.generate(ctx.child("good"));
    const unit = marketUnit.generate(ctx.child("unit"));
    const scale = unit === "penny" ? [1, 12] : unit === "shilling" ? [1, 20] : [1, 12];
    const price = intRange(scale[0] ?? 1, scale[1] ?? 12).generate(ctx.child("price"));
    return { good, price, unit };
  },
};

// ─── Heraldry ────────────────────────────────────────────────────────────

export type Tincture =
  | "Or"
  | "Argent"
  | "Azure"
  | "Gules"
  | "Sable"
  | "Vert"
  | "Purpure";

export type Attitude =
  | "rampant"
  | "passant"
  | "statant"
  | "displayed"
  | "salient"
  | "segreant";

export interface HeraldicDevice {
  field: Tincture;
  charge: string;
  chargeTincture: Tincture;
  attitude: Attitude;
  blazon: string;
}

const tinctures: readonly Tincture[] = ["Or", "Argent", "Azure", "Gules", "Sable", "Vert", "Purpure"];
const attitudes: readonly Attitude[] = ["rampant", "passant", "statant", "displayed", "salient", "segreant"];
const chargeAttitudes: readonly string[] = ["lion", "eagle", "griffin", "dragon", "stag", "wolf", "bear", "horse", "boar", "bull", "falcon", "raven", "serpent", "hound"];

const hexByTincture: Record<Tincture, string> = {
  Or: "#d4af37",
  Argent: "#e8e8e8",
  Azure: "#1f5fa8",
  Gules: "#a3202b",
  Sable: "#252525",
  Vert: "#2e6b3f",
  Purpure: "#6b3a73",
};

const metals = new Set<Tincture>(["Or", "Argent"]);

/** True when field and charge tincture follow the documented metal/colour convention. */
export function hasHeraldicContrast(field: Tincture, chargeTincture: Tincture): boolean {
  if (field === chargeTincture) return false;
  return metals.has(field) !== metals.has(chargeTincture);
}

/**
 * A conservative, documented subset of heraldic blazon: one field, one charge.
 * `blazon()` renders the supplied device verbatim; `heraldry.generate()` is the
 * generator that enforces `hasHeraldicContrast`.
 */
export function blazon(device: Omit<HeraldicDevice, "blazon">): string {
  const article = /^[aeiou]/i.test(device.charge) ? "an" : "a";
  if (!chargeAttitudes.includes(device.charge)) {
    return `${device.field}, ${article} ${device.charge} ${device.chargeTincture}`;
  }
  return `${device.field}, ${article} ${device.charge} ${device.attitude} ${device.chargeTincture}`;
}

/** Simple, deterministic SVG shield rendering of a one-charge device. */
export function shieldSvg(device: HeraldicDevice): string {
  const field = hexByTincture[device.field] ?? "#888888";
  const charge = hexByTincture[device.chargeTincture] ?? "#888888";
  const glyph = chargeGlyph(device.charge);
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" role="img"',
    ` aria-label="${escapeXml(device.blazon)}">`,
    '<path d="M5 5 H95 V65 Q95 100 50 115 Q5 100 5 65 Z"',
    ` fill="${field}" stroke="#111" stroke-width="3"/>`,
    `<text x="50" y="72" text-anchor="middle" font-size="40" fill="${charge}">${escapeXml(glyph)}</text>`,
    "</svg>",
  ].join("");
}

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[ch] ?? ch);
}

/** A tiny glyph map keeps the SVG renderer dependency-free and deterministic. */
function chargeGlyph(charge: string): string {
  if (charge.includes("lion")) return "♞";
  if (charge.includes("eagle") || charge.includes("falcon") || charge.includes("raven") || charge.includes("griffin") || charge.includes("dragon")) return "◆";
  if (charge.includes("cross")) return "✚";
  if (charge.includes("crown")) return "♛";
  if (charge.includes("sword") || charge.includes("key") || charge.includes("anchor")) return "†";
  if (charge.includes("star") || charge.includes("moon") || charge.includes("sun")) return "✦";
  if (charge.includes("tree") || charge.includes("oak") || charge.includes("fleur")) return "❀";
  return "●";
}

export const heraldry: Generator<HeraldicDevice> = {
  id: "medieval.heraldry",
  generate(ctx: Context) {
    const field = oneOf(...tinctures).generate(ctx.child("field"));
    const charge = oneOf(...tableTexts(resourceIds.heraldicChargeTable)).generate(ctx.child("charge"));
    const attitude = oneOf(...attitudes).generate(ctx.child("attitude"));
    // Enforce the documented contrast convention with bounded, key-scoped rerolls.
    // Each attempt derives from a stable child key, so sibling order is irrelevant.
    let chargeTincture: Tincture | undefined;
    for (let attempt = 0; attempt < 8; attempt++) {
      const candidate = oneOf(...tinctures).generate(ctx.child(`chargeTincture:${attempt}`));
      if (hasHeraldicContrast(field, candidate)) {
        chargeTincture = candidate;
        break;
      }
    }
    // The tincture pool always contains the opposite category, so 8 attempts
    // cannot realistically fail; fall back to a deterministic complement.
    const chosen = chargeTincture ?? (metals.has(field) ? "Azure" : "Or");
    const base = { field, charge, chargeTincture: chosen, attitude };
    return { ...base, blazon: blazon(base) };
  },
};

// ─── Public API ──────────────────────────────────────────────────────────

export const generators = {
  culture,
  personName,
  manorName,
  guildName,
  monasteryName,
  feudalTitle,
  marketGood,
  marketUnit,
  marketListing,
  domainEvent,
  heraldry,
} as const;

export interface HistoricalMedievalAPI {
  name: (options?: PersonNameOptions) => MedievalPersonName;
  manor: () => string;
  guild: () => string;
  monastery: () => string;
  title: () => string;
  good: () => string;
  listing: () => MarketListing;
  event: () => string;
  arms: () => HeraldicDevice;
  shield: () => string;
  context: Context;
}

export interface HistoricalMedievalEntry {
  withSeed(seed: Seed): HistoricalMedievalAPI;
  generators: typeof generators;
  cultures: readonly NamingCulture[];
}

export const historicalMedieval: HistoricalMedievalEntry = {
  generators,
  cultures,
  withSeed(seed: Seed): HistoricalMedievalAPI {
    const root = createContext({ seed });
    let counter = 0;
    const sub = (label: string) => root.child(`${label}:${counter++}`);
    return {
      name: (options) => personNameGenerator(options).generate(sub("name")),
      manor: () => manorName.generate(sub("manor")),
      guild: () => guildName.generate(sub("guild")),
      monastery: () => monasteryName.generate(sub("monastery")),
      title: () => feudalTitle.generate(sub("title")),
      good: () => marketGood.generate(sub("good")),
      listing: () => marketListing.generate(sub("listing")),
      event: () => domainEvent.generate(sub("event")),
      arms: () => heraldry.generate(sub("arms")),
      shield: () => shieldSvg(heraldry.generate(sub("shield"))),
      context: root,
    };
  },
};

export default historicalMedieval;
