import type { ShapeParams, RenderParams } from "./types.js";

/**
 * Render ShapeParams to a compact (minified) SVG string.
 *
 * @param shapes - Array of shape parameters with normalized [0, 1] coordinates
 * @param renderParams - Optional rendering parameters (size, strokeWidth, palette)
 * @returns Minified SVG string with no whitespace
 */
export function renderToSVG(shapes: ShapeParams[], renderParams?: RenderParams): string {
  const size = renderParams?.size ?? 32;
  const strokeWidth = renderParams?.strokeWidth ?? 2;
  const palette = renderParams?.palette ?? ["#000000"];

  let svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;

  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i]!;
    const color = palette[i % palette.length];
    const attrs = `stroke="${color}" stroke-width="${strokeWidth}" fill="none"`;

    switch (shape.type) {
      case "rect":
        svg += renderRect(shape, size, attrs);
        break;
      case "circle":
        svg += renderCircle(shape, size, attrs);
        break;
      case "line":
        svg += renderLine(shape, size, attrs);
        break;
      case "arc":
        svg += renderArc(shape, size, attrs);
        break;
      case "polygon":
        svg += renderPolygon(shape, size, attrs);
        break;
    }
  }

  svg += "</svg>";
  return svg;
}

/**
 * Render a rect shape to SVG element string.
 * Normalized coordinates are scaled by size.
 */
function renderRect(shape: ShapeParams, size: number, attrs: string): string {
  const x = shape.x * size;
  const y = shape.y * size;
  const width = (shape.w ?? 0) * size;
  const height = (shape.h ?? 0) * size;

  let element = `<rect x="${x}" y="${y}" width="${width}" height="${height}" ${attrs}`;

  // Add rotation transform if present
  if (shape.rotation !== undefined && shape.rotation !== 0) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    element += ` transform="rotate(${shape.rotation} ${cx} ${cy})"`;
  }

  element += "/>";
  return element;
}

/**
 * Render a circle shape to SVG element string.
 */
function renderCircle(shape: ShapeParams, size: number, attrs: string): string {
  const cx = shape.x * size;
  const cy = shape.y * size;
  const r = (shape.r ?? 0) * size;

  return `<circle cx="${cx}" cy="${cy}" r="${r}" ${attrs}/>`;
}

/**
 * Render a line shape to SVG element string.
 */
function renderLine(shape: ShapeParams, size: number, attrs: string): string {
  const x1 = shape.x * size;
  const y1 = shape.y * size;
  const x2 = (shape.x2 ?? 0) * size;
  const y2 = (shape.y2 ?? 0) * size;

  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs}/>`;
}

/**
 * Render an arc shape to SVG path element string.
 * Uses SVG arc command syntax.
 */
function renderArc(shape: ShapeParams, size: number, attrs: string): string {
  const cx = shape.x * size;
  const cy = shape.y * size;
  const r = (shape.r ?? 0) * size;
  const startAngle = shape.startAngle ?? 0;
  const endAngle = shape.endAngle ?? 0;

  // Calculate start and end points on the arc
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);

  // Determine if arc is large (> 180 degrees)
  const angleDiff = endAngle - startAngle;
  const normalizedDiff = ((angleDiff % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const largeArc = normalizedDiff > Math.PI ? 1 : 0;

  // SVG arc sweep: 1 for clockwise, 0 for counter-clockwise
  const sweep = 1;

  const pathData = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
  return `<path d="${pathData}" ${attrs}/>`;
}

/**
 * Render a polygon shape to SVG polygon element string.
 * Generates regular polygon with given number of sides.
 */
function renderPolygon(shape: ShapeParams, size: number, attrs: string): string {
  const cx = shape.x * size;
  const cy = shape.y * size;
  const r = (shape.r ?? 0) * size;
  const sides = shape.sides ?? 3;
  const rotation = (shape.rotation ?? 0) * (Math.PI / 180); // Convert degrees to radians

  const points: string[] = [];

  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 + rotation;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    points.push(`${px},${py}`);
  }

  const pointsStr = points.join(" ");
  return `<polygon points="${pointsStr}" ${attrs}/>`;
}
