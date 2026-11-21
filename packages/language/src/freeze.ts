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
 * True only when `culture` is a verified deep snapshot: the culture and every
 * object/array reachable from it are frozen.
 *
 * `Object.freeze` is shallow — a culture whose `glyphs` and `templates` are
 * frozen can still hold mutable nested arrays, which would let a cached
 * lexicon go stale. Use {@link freezeCulture} to be sure.
 */
export function isFrozenCulture(culture: Culture): boolean {
  if (verifiedDeepFrozen.has(culture)) return true;
  if (!isDeepFrozen(culture, new WeakSet())) return false;
  // Freezing is permanent, so a positive verification never goes stale.
  verifiedDeepFrozen.add(culture);
  return true;
}

const verifiedDeepFrozen = new WeakSet<object>();

function isDeepFrozen(value: unknown, seen: WeakSet<object>): boolean {
  if (value === null || typeof value !== "object") return true;
  const object = value as object;
  if (seen.has(object)) return true;
  seen.add(object);
  if (!Object.isFrozen(object)) return false;
  // Inherited properties are read through the prototype chain and a mutable
  // prototype can change them later; only plain objects/arrays are snapshots.
  const proto = Object.getPrototypeOf(object) as unknown;
  if (proto !== null && proto !== Object.prototype && proto !== Array.prototype) {
    return false;
  }
  for (const key of Reflect.ownKeys(object)) {
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    // Accessors can return different values over time; never invoke them and
    // never treat an accessor-backed object as an immutable snapshot.
    if (descriptor === undefined || !("value" in descriptor)) return false;
    if (!isDeepFrozen(descriptor.value, seen)) return false;
  }
  return true;
}

function deepFreeze<T>(value: T, seen: WeakSet<object> = new WeakSet()): T {
  if (value === null || typeof value !== "object") return value;

  const object = value as object;
  if (seen.has(object)) return value;
  seen.add(object);

  // Only plain objects/arrays are walked; anything else (typed arrays, Maps,
  // class instances, ...) is caller-owned and returned untouched.
  const proto = Object.getPrototypeOf(object) as unknown;
  if (proto !== null && proto !== Object.prototype && proto !== Array.prototype) {
    return value;
  }

  for (const key of Object.getOwnPropertyNames(object)) {
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    // Never invoke accessors: a getter may return caller-owned or changing
    // objects. Only data properties are descended into.
    if (descriptor === undefined || !("value" in descriptor)) continue;
    deepFreeze(descriptor.value, seen);
  }

  return Object.freeze(value);
}
