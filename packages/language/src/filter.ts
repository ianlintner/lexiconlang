/**
 * Content blocklist filtering (F4, spec §12).
 *
 * Filtering is a *host capability* (`filter-v1`): it is opt-in, compares only
 * normalized copies of generated values, and never changes the generator or
 * the emitted string. No legacy generator ID activates a filter.
 *
 * Normalization policy (pinned for portable filtered profiles):
 *   1. Unicode NFKC normalization;
 *   2. lowercase via locale-insensitive folding (`toLowerCase` plus the
 *      common German ß → ss fold) — no locale collation;
 *   3. ASCII transliteration of accented Latin letters and related symbols used
 *      for comparison only. U+ data version: whatever the host ECMAScript
 *      implementation provides (documented, not promised byte-identical
 *      across Unicode releases). Never applied to generator output.
 */
import { where, type Generator, type GeneratorLike, type WhereOptions } from "@lexiconlang/core";
import type { TranslatedName } from "./types.js";

/** How blocklist terms match a generated value. */
export type BlocklistMode = "whole-token" | "substring";

export interface Blocklist {
  readonly id: string;
  readonly terms: readonly string[];
  readonly mode: BlocklistMode;
  readonly provenance?: string;
}

/** Normalize a comparison copy. Generated output is never mutated. */
export function foldAscii(input: string): string {
  return input
    .trim()
    .normalize("NFKC")
    .replace(/ß/gu, "ss")
    .replace(/æ/gu, "ae")
    .replace(/œ/gu, "oe")
    .replace(/ø/gu, "o")
    .replace(/đ/gu, "d")
    .replace(/ł/gu, "l")
    .replace(/ð/gu, "d")
    .replace(/þ/gu, "th")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase();
}

function tokens(folded: string): readonly string[] {
  return folded.split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 0);
}

/**
 * Curated original default list. Terms are deliberately few, plain-language
 * and chosen only to catch accidental collisions in generated conlang forms.
 * This is a defense layer, not a claim of exhaustive profanity coverage.
 *
 * Provenance: original:lexiconlang-project, CC0-1.0. No third-party corpora,
 * scraped lists or copyrighted material. Terms are not printed in docs.
 */
export const DEFAULT_BLOCKLIST: Blocklist = Object.freeze({
  id: "lexiconlang.safety.default",
  mode: "whole-token",
  provenance:
    "Original: lexiconlang project; CC0-1.0; curated short list of common English profanity and accidental real-word collisions. No third-party sources.",
  terms: Object.freeze([
    "shit", "shite", "fuck", "fucked", "fucker", "fucking",
    "bitch", "bastard", "cunt", "dick", "prick", "piss", "pissed",
    "slut", "whore", "wanker", "twat", "nigger", "faggot", "retard",
    "damn", "hell", "crap",
    // accidental real-word collisions that read as intentional English
    "ass", "tit", "cum", "sex", "porn", "rape",
  ]),
});

/** Create a frozen blocklist with validated terms. */
export function createBlocklist(input: {
  id: string;
  terms: readonly string[];
  mode: BlocklistMode;
  provenance?: string;
}): Blocklist {
  if (input.mode !== "whole-token" && input.mode !== "substring") {
    throw new TypeError(`Unknown blocklist mode: ${String(input.mode)}`);
  }
  const terms = input.terms
    .map((term) => foldAscii(term))
    .filter((term) => term.length > 0);
  return Object.freeze({
    id: input.id,
    terms: Object.freeze([...new Set(terms)]),
    mode: input.mode,
    ...(input.provenance === undefined ? {} : { provenance: input.provenance }),
  });
}

/** Values the filter can inspect: plain strings or translated names. */
export type Filterable = string | TranslatedName;

function comparable(value: Filterable): readonly string[] {
  if (typeof value === "string") return [value];
  return [value.form, value.translation];
}

/** True when `value` hits any term in `list` (form and translation included). */
export function blocklistMatch(value: Filterable, list: Blocklist): boolean {
  const foldedTerms = list.terms;
  if (foldedTerms.length === 0) return false;
  for (const part of comparable(value)) {
    const folded = foldAscii(part);
    if (list.mode === "whole-token") {
      if (tokens(folded).some((t) => foldedTerms.includes(t))) return true;
    } else if (foldedTerms.some((t) => folded.length > 0 && folded.includes(t))) {
      return true;
    }
  }
  return false;
}

/** True when `value` hits any of the supplied lists. */
export function isBlocked(value: Filterable, lists: readonly Blocklist[]): boolean {
  return lists.some((list) => blocklistMatch(value, list));
}

export interface BlocklistFilterOptions extends WhereOptions {}

/**
 * Wrap a generator with a blocklist filter. Retries use `ctx.child("attempt:i")`
 * and exhaustion is a typed core error — no partial success.
 */
export function blocklist<T extends Filterable, C = unknown>(
  gen: GeneratorLike<T, C>,
  lists: readonly Blocklist[],
  options: BlocklistFilterOptions = {},
): Generator<T, C> {
  return where(gen, (value) => !isBlocked(value, lists), options);
}
