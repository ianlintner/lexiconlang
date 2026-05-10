export { generateShapes } from "./shape-generator.js";
export { renderToSVG } from "./svg-renderer.js";
export { renderToUnicode, UnicodeRegistry } from "./unicode-renderer.js";
export { renderToCanvas, executeCanvasInstructions } from "./canvas-renderer.js";
export { glyphsFor } from "./glyphs.js";
export type { Complexity, ShapeParams, BaseShape, CanvasInstruction, RenderParams } from "./types.js";
export type { Glyph, GlyphSet, VisualGlyphSystem, RenderFormat, MappingStrategy } from "./types.js";
export type { UnicodeConfig } from "./unicode-renderer.js";
