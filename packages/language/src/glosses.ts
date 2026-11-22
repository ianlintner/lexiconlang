import type { Meaning, MeaningPack } from "./types.js";

/** Own-property lookup; keys like `constructor` never reach Object.prototype. */
function own<T>(record: Readonly<Record<string, T>> | undefined, key: string): T | undefined {
  if (record === undefined || !Object.prototype.hasOwnProperty.call(record, key)) return undefined;
  return record[key];
}

/**
 * Resolve a meaning's human-readable gloss for a requested locale.
 *
 * Resolution order (spec §3, card B4):
 * 1. exact BCP 47 tag (`zh-Hant`, `es-MX`);
 * 2. primary language subtag (`zh`, `es`), matched case-insensitively;
 * 3. legacy English `label`;
 * 4. the stable meaning `id`.
 *
 * The resolver is pure: it reads no RNG and never alters a conlang form.
 * With no locale (the legacy path) it returns `label ?? id` byte-for-byte.
 */
export function glossFor(meaning: Meaning, locale?: string): string {
  const fallback = meaning.label ?? meaning.id;
  if (locale === undefined || locale.length === 0) return fallback;
  const glosses = meaning.glosses;
  if (glosses === undefined) return fallback;

  const exact = own(glosses, locale);
  if (exact !== undefined && exact.length > 0) return exact;

  // BCP 47 primary subtag: case-insensitive lookup that preserves the key's
  // authored casing. Scans in insertion order, so the result is deterministic.
  const primary = locale.split("-")[0]!.toLowerCase();
  for (const key of Object.keys(glosses)) {
    if (key.toLowerCase() === primary) {
      const value = glosses[key]!;
      if (value.length > 0) return value;
    }
  }
  return fallback;
}

/**
 * Apply a locale-gloss overlay to a meaning pack. The overlay maps a meaning
 * id to its localized glosses. Explicit glosses already present on a meaning
 * take precedence over the overlay; the overlay only fills missing locales.
 * Unknown ids are ignored, so an overlay may be layered over several packs
 * safely. The returned pack is a shallow copy: the original pack and its
 * meanings are never mutated.
 */
export function withGlosses(
  pack: MeaningPack,
  overlays: Readonly<Record<string, Readonly<Record<string, string>>>>,
): MeaningPack {
  return {
    id: pack.id,
    version: pack.version,
    meanings: pack.meanings.map((meaning) => {
      const extra = own(overlays, meaning.id);
      if (extra === undefined) return meaning;
      return { ...meaning, glosses: { ...extra, ...(meaning.glosses ?? {}) } };
    }),
  };
}

/**
 * Merge writable locale overlays (e.g. loaded from pack JSON) into the given
 * meaning packs, returning new packs without mutating the inputs.
 */
export function localizePacks(
  packs: readonly MeaningPack[],
  overlays: Readonly<Record<string, Readonly<Record<string, string>>>>,
): readonly MeaningPack[] {
  return packs.map((pack) => withGlosses(pack, overlays));
}
