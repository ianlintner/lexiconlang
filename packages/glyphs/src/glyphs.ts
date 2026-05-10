import type { Context } from "@lexicon/core";
import type { TranslatedName, VisualGlyphSystem, GlyphSet, Glyph } from "@lexicon/language";
import { generateShapes } from "./shape-generator.js";
import { renderToSVG } from "./svg-renderer.js";
import { renderToUnicode } from "./unicode-renderer.js";
import { renderToCanvas } from "./canvas-renderer.js";

/**
 * Generate a GlyphSet for a TranslatedName based on mapping strategy.
 *
 * Supports three strategies:
 * - phoneme (alphabet): one glyph per 2-character unit in form
 * - morpheme (conceptual): one glyph per meaning component in translation
 * - holistic: single glyph for entire name
 *
 * @param name - TranslatedName with form and translation
 * @param system - VisualGlyphSystem configuration
 * @param ctx - Seeded Context for deterministic RNG
 * @returns GlyphSet with phonetic, conceptual, and/or holistic glyphs
 */
export function glyphsFor(
  name: TranslatedName,
  system: VisualGlyphSystem,
  ctx: Context
): GlyphSet {
  const glyphCtx = ctx.child("glyph");

  switch (system.mappingStrategy) {
    case "phoneme":
      return generatePhonemeGlyphs(name, system, glyphCtx);
    case "morpheme":
      return generateMorphemeGlyphs(name, system, glyphCtx);
    case "holistic":
      return generateHolisticGlyph(name, system, glyphCtx);
    default:
      const _exhaustive: never = system.mappingStrategy;
      throw new Error(`Unknown mapping strategy: ${_exhaustive}`);
  }
}

/**
 * Generate phoneme glyphs by splitting form into 2-character units
 */
function generatePhonemeGlyphs(
  name: TranslatedName,
  system: VisualGlyphSystem,
  ctx: Context
): GlyphSet {
  const units = splitByPairs(name.form);
  const glyphs: Glyph[] = [];

  for (let i = 0; i < units.length; i++) {
    const childCtx = ctx.child(`phoneme:${i}`);
    const glyph = createGlyph(`g${i}`, name, system, childCtx);
    glyphs.push(glyph);
  }

  return { phonetic: glyphs };
}

/**
 * Generate morpheme glyphs by splitting translation by hyphen
 */
function generateMorphemeGlyphs(
  name: TranslatedName,
  system: VisualGlyphSystem,
  ctx: Context
): GlyphSet {
  const morphemes = name.translation.split("-");
  const glyphs: Glyph[] = [];

  for (let i = 0; i < morphemes.length; i++) {
    const childCtx = ctx.child(`morpheme:${i}`);
    const meaning = morphemes[i];
    const glyph = createGlyph(`g${i}`, name, system, childCtx, meaning);
    glyphs.push(glyph);
  }

  return { conceptual: glyphs };
}

/**
 * Generate a single holistic glyph for the entire name
 */
function generateHolisticGlyph(
  name: TranslatedName,
  system: VisualGlyphSystem,
  ctx: Context
): GlyphSet {
  const glyph = createGlyph("g0", name, system, ctx);
  return { holistic: glyph };
}

/**
 * Create a single glyph with rendering based on system.renderFormat
 */
function createGlyph(
  id: string,
  name: TranslatedName,
  system: VisualGlyphSystem,
  ctx: Context,
  meaning?: string
): Glyph {
  const complexity = system.generator?.complexity ?? "simple";
  const shapes = generateShapes(complexity, ctx);
  const renderParams = system.renderParams;

  const glyph: Glyph = { id };

  if (meaning) {
    glyph.meaning = meaning;
  }

  switch (system.renderFormat) {
    case "svg":
      glyph.svg = renderToSVG(shapes, renderParams);
      break;

    case "canvas":
      glyph.canvasInstructions = renderToCanvas(shapes, renderParams);
      break;

    case "unicode":
      if (meaning) {
        glyph.unicode = renderToUnicode(meaning, {
          mappings: system.unicodeMappings,
          fallback: renderParams?.fallback,
        });
      } else {
        // For phoneme, use index as fallback
        glyph.unicode = renderToUnicode(`phoneme-${id}`, {
          mappings: system.unicodeMappings,
          fallback: renderParams?.fallback,
        });
      }
      break;
  }

  return glyph;
}

/**
 * Split a string into 2-character units (the last unit may be 1 char)
 * Example: "Drakaztum" -> ["Dr", "ak", "az", "tu", "m"]
 */
function splitByPairs(str: string): string[] {
  const pairs: string[] = [];
  for (let i = 0; i < str.length; i += 2) {
    pairs.push(str.substring(i, Math.min(i + 2, str.length)));
  }
  return pairs;
}
