export type { Glyph, GlyphSet, VisualGlyphSystem, RenderFormat, MappingStrategy } from "@lexicon/language";

// Glyphs-package-specific types:
export type BaseShape = "rect" | "circle" | "line" | "arc" | "polygon";
export type Complexity = "simple" | "medium" | "complex";

export interface ShapeParams {
  type: BaseShape;
  x: number;   // 0–1 normalized
  y: number;
  x2?: number;
  y2?: number;
  r?: number;
  w?: number;
  h?: number;
  sides?: number;
  startAngle?: number;
  endAngle?: number;
  rotation?: number;
}

export interface CanvasInstruction {
  type: "moveTo" | "lineTo" | "arc" | "rect" | "stroke" | "fill" | "beginPath" | "closePath";
  params: number[];
}

export interface RenderParams {
  size?: number;        // default 32
  strokeWidth?: number; // default 2
  palette?: string[];   // default ["#000000"]
  fallback?: string;    // unused in SVG renderer
}
