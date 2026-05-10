import type { Context } from "@lexicon/core";
import type { Complexity, ShapeParams, BaseShape } from "./types.js";

/**
 * Generate an array of shape parameters from a seeded random context.
 * Same seed produces identical shapes (deterministic).
 *
 * @param complexity - Determines shape count: simple (1-2), medium (2-3), complex (3-5)
 * @param ctx - Seeded context for deterministic RNG
 * @returns Array of ShapeParams
 */
export function generateShapes(complexity: Complexity, ctx: Context): ShapeParams[] {
  const shapeCtx = ctx.child("shapes");
  const rng = shapeCtx.rng;

  // Determine count based on complexity
  const countRanges: Record<Complexity, [number, number]> = {
    simple: [1, 2],
    medium: [2, 3],
    complex: [3, 5],
  };

  const [minCount, maxCount] = countRanges[complexity];
  const count = rng.nextInt(minCount, maxCount + 1);

  const shapes: ShapeParams[] = [];
  const baseShapes: BaseShape[] = ["rect", "circle", "line", "arc", "polygon"];

  for (let i = 0; i < count; i++) {
    const shapeType = rng.pick(baseShapes);
    const shape = generateShape(shapeType, rng);
    shapes.push(shape);
  }

  return shapes;
}

/**
 * Generate a single shape with normalized coordinates [0, 1]
 */
function generateShape(type: BaseShape, rng: any): ShapeParams {
  const x = rng.next(); // [0, 1)
  const y = rng.next(); // [0, 1)

  const baseShape: ShapeParams = { type, x, y };

  switch (type) {
    case "rect":
      baseShape.w = rng.next() * 0.5 + 0.1; // [0.1, 0.6]
      baseShape.h = rng.next() * 0.5 + 0.1; // [0.1, 0.6]
      baseShape.rotation = rng.nextRange(0, 360);
      break;

    case "circle":
      baseShape.r = rng.next() * 0.3 + 0.05; // [0.05, 0.35]
      break;

    case "line":
      baseShape.x2 = rng.next();
      baseShape.y2 = rng.next();
      baseShape.rotation = rng.nextRange(0, 360);
      break;

    case "arc":
      baseShape.r = rng.next() * 0.3 + 0.05; // [0.05, 0.35]
      baseShape.startAngle = rng.nextRange(0, Math.PI * 2);
      baseShape.endAngle = rng.nextRange(0, Math.PI * 2);
      break;

    case "polygon":
      baseShape.sides = rng.nextInt(3, 9); // [3, 8] sides
      baseShape.r = rng.next() * 0.3 + 0.05; // [0.05, 0.35]
      baseShape.rotation = rng.nextRange(0, 360);
      break;
  }

  return baseShape;
}
