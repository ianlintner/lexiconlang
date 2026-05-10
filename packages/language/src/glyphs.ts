export type { GlyphSystem, Constraint } from "./types.js";

/** Helper: check if a constraint pattern matches a sequence of classes. */
export function constraintMatches(pattern: readonly string[], sequence: readonly string[]): boolean {
  if (pattern.length > sequence.length) return false;
  for (let i = 0; i < pattern.length; i++) {
    const p = pattern[i]!;
    if (p !== "*" && p !== sequence[i]) return false;
  }
  return true;
}
