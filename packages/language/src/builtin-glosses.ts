import type { Culture, MeaningPack } from "./types.js";
import { GLOSS_ROWS } from "./gloss-data.js";
import { withGlosses } from "./glosses.js";

/** The five B4 locale tags, in a stable order. */
export const BUILTIN_GLOSS_LOCALES = ["es", "de", "fr", "pt", "ja"] as const;

/** Built-in gloss overlay: meaning id -> { locale: translation }. */
function buildBuiltinOverlay(): Readonly<Record<string, Readonly<Record<string, string>>>> {
  const overlay: Record<string, Record<string, string>> = {};
  for (const [label, es, de, fr, pt, ja] of GLOSS_ROWS) {
    if (!label) continue;
    // English label -> meaning id is 1:1 in all shipped packs; the id is not
    // always the label (e.g. `fantasy.industrial`), so callers apply the
    // overlay by id, which is synthesized below from each pack's labels.
    overlay[`label:${label}`] = { es, de, fr, pt, ja };
  }
  return overlay;
}

const BUILTIN_BY_LABEL = buildBuiltinOverlay();

/**
 * Build an id-keyed overlay for a pack by mapping each meaning's legacy English
 * label onto the built-in translation row. Meanings without a label, or with a
 * label we have no translation for, are left untouched (English fallback).
 */
function overlayForPack(pack: MeaningPack): Readonly<Record<string, Readonly<Record<string, string>>>> {
  const result: Record<string, Readonly<Record<string, string>>> = {};
  for (const meaning of pack.meanings) {
    if (meaning.label === undefined) continue;
    const row = (BUILTIN_BY_LABEL as Record<string, Readonly<Record<string, string>>>)[
      `label:${meaning.label}`
    ];
    if (row !== undefined) result[meaning.id] = row;
  }
  return result;
}

/**
 * Return a shallow culture copy whose meaning packs carry the built-in B4
 * glosses. The original culture and packs are never mutated. When `locale` is
 * absent the original culture is returned unchanged, preserving the legacy
 * path byte-for-byte.
 */
export function withBuiltinGlosses<C extends Culture>(culture: C, locale?: string): C {
  if (locale === undefined || locale.length === 0) return culture;
  const localized = culture.meaningPacks.map((pack) => {
    const overlay = overlayForPack(pack);
    return Object.keys(overlay).length === 0 ? pack : withGlosses(pack, overlay);
  });
  // A culture may be frozen; its freeze marker is carried in the type brand at
  // compile time only, so a plain spread keeps structural compatibility.
  return { ...culture, meaningPacks: localized } as C;
}
