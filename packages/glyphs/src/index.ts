// Functions
export { generateShapes } from "./shape-generator.js";
export { renderToSVG } from "./svg-renderer.js";
export { renderToUnicode } from "./unicode-renderer.js";
export { renderToCanvas, executeCanvasInstructions } from "./canvas-renderer.js";
export { glyphsFor } from "./glyphs.js";

// Types from @lexicon/language
export type { Glyph, GlyphSet, VisualGlyphSystem, RenderFormat, MappingStrategy, TranslatedName } from "./types.js";

// Types from @lexicon/glyphs
export type { BaseShape, Complexity, ShapeParams, CanvasInstruction, RenderParams } from "./types.js";

// Constants
export { UnicodeRegistry } from "./unicode-renderer.js";

// Interfaces
export type { UnicodeConfig } from "./unicode-renderer.js";
