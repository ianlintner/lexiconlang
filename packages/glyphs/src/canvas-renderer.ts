/// <reference lib="dom" />
import type { ShapeParams, RenderParams, CanvasInstruction } from "./types.js";

/**
 * Render ShapeParams to Canvas drawing instructions.
 * Converts normalized [0, 1] coordinates to canvas pixel coordinates.
 * Returns a list of CanvasInstruction objects that can be replayed on a Canvas 2D context.
 *
 * @param shapes - Array of shape parameters with normalized [0, 1] coordinates
 * @param renderParams - Optional rendering parameters (size, strokeWidth, palette)
 * @returns Array of CanvasInstruction objects
 */
export function renderToCanvas(
  shapes: ShapeParams[],
  renderParams?: RenderParams
): CanvasInstruction[] {
  const size = renderParams?.size ?? 32;
  const strokeWidth = renderParams?.strokeWidth ?? 2;
  const palette = renderParams?.palette ?? ["#000000"];

  const instructions: CanvasInstruction[] = [];

  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i]!;
    const color = palette[i % palette.length] ?? "#000000";

    // Start shape context: save, set color and width
    instructions.push({ type: "save", params: [] });
    instructions.push({ type: "setStrokeStyle", params: [color] });
    instructions.push({ type: "setLineWidth", params: [strokeWidth] });

    // Generate shape-specific instructions
    switch (shape.type) {
      case "rect":
        renderRectShape(shape, size, instructions);
        break;
      case "circle":
        renderCircleShape(shape, size, instructions);
        break;
      case "line":
        renderLineShape(shape, size, instructions);
        break;
      case "arc":
        renderArcShape(shape, size, instructions);
        break;
      case "polygon":
        renderPolygonShape(shape, size, instructions);
        break;
    }

    // Stroke and restore context
    instructions.push({ type: "stroke", params: [] });
    instructions.push({ type: "restore", params: [] });
  }

  return instructions;
}

/**
 * Generate canvas instructions for a rect shape.
 */
function renderRectShape(
  shape: ShapeParams,
  size: number,
  instructions: CanvasInstruction[]
): void {
  const x = shape.x * size;
  const y = shape.y * size;
  const width = (shape.w ?? 0) * size;
  const height = (shape.h ?? 0) * size;

  instructions.push({ type: "beginPath", params: [] });
  instructions.push({ type: "rect", params: [x, y, width, height] });
  instructions.push({ type: "closePath", params: [] });
}

/**
 * Generate canvas instructions for a circle shape (rendered as full arc).
 */
function renderCircleShape(
  shape: ShapeParams,
  size: number,
  instructions: CanvasInstruction[]
): void {
  const cx = shape.x * size;
  const cy = shape.y * size;
  const r = (shape.r ?? 0) * size;

  instructions.push({ type: "beginPath", params: [] });
  instructions.push({
    type: "arc",
    params: [cx, cy, r, 0, Math.PI * 2],
  });
  instructions.push({ type: "closePath", params: [] });
}

/**
 * Generate canvas instructions for a line shape.
 */
function renderLineShape(
  shape: ShapeParams,
  size: number,
  instructions: CanvasInstruction[]
): void {
  const x1 = shape.x * size;
  const y1 = shape.y * size;
  const x2 = (shape.x2 ?? 0) * size;
  const y2 = (shape.y2 ?? 0) * size;

  instructions.push({ type: "beginPath", params: [] });
  instructions.push({ type: "moveTo", params: [x1, y1] });
  instructions.push({ type: "lineTo", params: [x2, y2] });
  instructions.push({ type: "closePath", params: [] });
}

/**
 * Generate canvas instructions for an arc shape.
 */
function renderArcShape(
  shape: ShapeParams,
  size: number,
  instructions: CanvasInstruction[]
): void {
  const cx = shape.x * size;
  const cy = shape.y * size;
  const r = (shape.r ?? 0) * size;
  const startAngle = shape.startAngle ?? 0;
  const endAngle = shape.endAngle ?? 0;

  instructions.push({ type: "beginPath", params: [] });
  instructions.push({
    type: "arc",
    params: [cx, cy, r, startAngle, endAngle],
  });
  instructions.push({ type: "closePath", params: [] });
}

/**
 * Generate canvas instructions for a polygon shape.
 * Generates a regular polygon with the specified number of sides.
 */
function renderPolygonShape(
  shape: ShapeParams,
  size: number,
  instructions: CanvasInstruction[]
): void {
  const cx = shape.x * size;
  const cy = shape.y * size;
  const r = (shape.r ?? 0) * size;
  const sides = shape.sides ?? 3;
  const rotation = (shape.rotation ?? 0) * (Math.PI / 180); // Convert degrees to radians

  instructions.push({ type: "beginPath", params: [] });

  // Generate points for the polygon
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 + rotation;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);

    if (i === 0) {
      instructions.push({ type: "moveTo", params: [px, py] });
    } else {
      instructions.push({ type: "lineTo", params: [px, py] });
    }
  }

  instructions.push({ type: "closePath", params: [] });
}

/**
 * Helper function to execute canvas instructions on a real Canvas context.
 * Useful for verification and testing.
 *
 * @param ctx - Canvas 2D rendering context
 * @param instructions - Array of CanvasInstruction objects to execute
 */
export function executeCanvasInstructions(
  ctx: CanvasRenderingContext2D,
  instructions: CanvasInstruction[]
): void {
  for (const instruction of instructions) {
    switch (instruction.type) {
      case "save":
        ctx.save();
        break;
      case "restore":
        ctx.restore();
        break;
      case "beginPath":
        ctx.beginPath();
        break;
      case "closePath":
        ctx.closePath();
        break;
      case "moveTo":
        ctx.moveTo(instruction.params[0] as number, instruction.params[1] as number);
        break;
      case "lineTo":
        ctx.lineTo(instruction.params[0] as number, instruction.params[1] as number);
        break;
      case "rect":
        ctx.rect(
          instruction.params[0] as number,
          instruction.params[1] as number,
          instruction.params[2] as number,
          instruction.params[3] as number
        );
        break;
      case "arc":
        ctx.arc(
          instruction.params[0] as number,
          instruction.params[1] as number,
          instruction.params[2] as number,
          instruction.params[3] as number,
          instruction.params[4] as number,
          false
        );
        break;
      case "stroke":
        ctx.stroke();
        break;
      case "fill":
        ctx.fill();
        break;
      case "setStrokeStyle":
        ctx.strokeStyle = instruction.params[0] as string;
        break;
      case "setLineWidth":
        ctx.lineWidth = instruction.params[0] as number;
        break;
      case "setFillStyle":
        ctx.fillStyle = instruction.params[0] as string;
        break;
    }
  }
}
