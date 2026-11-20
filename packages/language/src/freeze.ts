import type { Culture } from "./types.js";

/**
 * Deep-freeze a culture definition (and every plain object/array it contains)
 * so it can be treated as an immutable snapshot.
 *
 * Frozen snapshots are the contract that lets {@link generateName} share a
 * bounded lexicon cache across calls: a frozen culture cannot be mutated
 * behind the cache's back, so a memoized lexicon stays valid.
 *
 * ```ts
 * const culture = freezeCulture(defineCulture({ ...myCulture }));
 * ```
 *
 * Functions and non-plain objects are returned as-is; only own enumerable
 * properties of plain objects and arrays are walked.
 */
export function freezeCulture<C extends Culture>(culture: C): C {
  return deepFreeze(culture);
}

/**
 * True when `culture` looks like a frozen snapshot: the culture object, its
 * glyph system and its template record are all frozen.
 *
 * Note that `Object.freeze` is shallow — freezing only the culture object
 * itself leaves `glyphs` mutable. Use {@link freezeCulture} to be sure.
 */
export function isFrozenCulture(culture: Culture): boolean {
  return (
    Object.isFrozen(culture) &&
    Object.isFrozen(culture.glyphs) &&
    Object.isFrozen(culture.templates)
  );
}

function deepFreeze<T>(value: T, seen: WeakSet<object> = new WeakSet()): T {
  if (value === null || typeof value !== "object") return value;

  const object = value as object;
  if (seen.has(object)) return value;
  seen.add(object);

  for (const key of Object.getOwnPropertyNames(object)) {
    deepFreeze((object as Record<string, unknown>)[key], seen);
  }

  return Object.freeze(value);
}
