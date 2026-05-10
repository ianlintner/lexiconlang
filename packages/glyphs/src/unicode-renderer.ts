/**
 * Unicode Renderer for the Glyph System
 *
 * Maps glyph meanings to Unicode characters (including emoji).
 * Provides fast lookups with optional custom mappings and fallback support.
 */

/**
 * Mapping from meaning strings to Unicode character(s)
 */
interface UnicodeMapping {
  [meaning: string]: string;
}

/**
 * Configuration for Unicode rendering
 */
export interface UnicodeConfig {
  /** Custom mappings that override the predefined registry */
  mappings?: UnicodeMapping;
  /** Fallback character(s) if meaning is not found. Default: "□" */
  fallback?: string;
}

/**
 * Predefined Unicode registry with common fantasy/scifi meanings
 */
export const UnicodeRegistry: UnicodeMapping = {
  strong: "💪",
  anvil: "⚒",
  gem: "💎",
  mountain: "⛰",
  fire: "🔥",
  water: "💧",
  stone: "🪨",
  metal: "⚙",
  sky: "☁",
  tree: "🌳",
  star: "⭐",
  moon: "🌙",
};

/**
 * Renders a glyph meaning to a Unicode character
 *
 * Provides fast lookup from meaning strings to Unicode characters.
 * Supports custom mappings and configurable fallback.
 *
 * @param meaning - The glyph meaning to look up
 * @param config - Optional configuration for custom mappings and fallback
 * @returns A single Unicode character or character sequence
 *
 * @example
 * renderToUnicode("strong") // returns "💪"
 * renderToUnicode("custom", { mappings: { custom: "⚡" } }) // returns "⚡"
 * renderToUnicode("unknown") // returns "□" (default fallback)
 */
export function renderToUnicode(meaning: string, config?: UnicodeConfig): string {
  const fallback = config?.fallback ?? "□";

  // Check custom mappings first if provided
  if (config?.mappings && meaning in config.mappings) {
    return config.mappings[meaning];
  }

  // Check predefined registry
  if (meaning in UnicodeRegistry) {
    return UnicodeRegistry[meaning];
  }

  // Return fallback for unmapped meanings
  return fallback;
}
