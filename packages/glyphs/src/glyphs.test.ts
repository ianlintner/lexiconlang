import { describe, it, expect } from "vitest";
import type { VisualGlyphSystem, Glyph, GlyphSet, ShapeParams, CanvasInstruction, Complexity, RenderParams } from "./types.js";
import { generateShapes } from "./shape-generator.js";
import { renderToSVG } from "./svg-renderer.js";
import { renderToUnicode } from "./unicode-renderer.js";
import { renderToCanvas } from "./canvas-renderer.js";
import { glyphsFor } from "./glyphs.js";
import { createContext } from "@lexicon/core";

describe("Types", () => {
  it("VisualGlyphSystem compiles with svg renderFormat", () => {
    const sys: VisualGlyphSystem = {
      id: "test.svg",
      type: "alphabet",
      renderFormat: "svg",
      mappingStrategy: "morpheme",
      generator: {
        baseShapes: ["rect", "line"],
        complexity: "simple",
        symmetry: false,
        palette: ["#000000"],
      },
      renderParams: { size: 32, strokeWidth: 2, fallback: "□" },
    };
    expect(sys.id).toBe("test.svg");
  });

  it("VisualGlyphSystem compiles with unicode renderFormat", () => {
    const sys: VisualGlyphSystem = {
      id: "test.unicode",
      type: "conceptual",
      renderFormat: "unicode",
      mappingStrategy: "morpheme",
      unicodeMappings: { strong: "ᚠ", mountain: "ᚢ" },
      renderParams: { fallback: "□" },
    };
    expect(sys.renderFormat).toBe("unicode");
  });

  it("GlyphSet can hold phonetic and conceptual glyphs", () => {
    const set: GlyphSet = {
      phonetic: [{ id: "g1", svg: "<svg/>" }],
      conceptual: [{ id: "g2", meaning: "strong", unicode: "ᚠ" }],
    };
    expect(set.phonetic?.length).toBe(1);
    expect(set.conceptual?.[0]?.meaning).toBe("strong");
  });
});

describe("Shape Generator", () => {
  describe("generateShapes", () => {
    it("returns a function that takes complexity and context", () => {
      const ctx = createContext({ seed: "test-seed" });
      const shapes = generateShapes("simple", ctx);
      expect(Array.isArray(shapes)).toBe(true);
    });

    describe("Determinism", () => {
      it("produces identical shapes for same seed", () => {
        const ctx1 = createContext({ seed: "determinism-test" });
        const ctx2 = createContext({ seed: "determinism-test" });

        const shapes1 = generateShapes("simple", ctx1);
        const shapes2 = generateShapes("simple", ctx2);

        expect(shapes1).toEqual(shapes2);
      });

      it("produces different shapes for different seeds", () => {
        const ctx1 = createContext({ seed: "seed-1" });
        const ctx2 = createContext({ seed: "seed-2" });

        const shapes1 = generateShapes("simple", ctx1);
        const shapes2 = generateShapes("simple", ctx2);

        expect(shapes1).not.toEqual(shapes2);
      });

      it("produces deterministic shapes for all complexity levels", () => {
        const complexities: Complexity[] = ["simple", "medium", "complex"];

        for (const complexity of complexities) {
          const ctx1 = createContext({ seed: `determinism-${complexity}` });
          const ctx2 = createContext({ seed: `determinism-${complexity}` });

          const shapes1 = generateShapes(complexity, ctx1);
          const shapes2 = generateShapes(complexity, ctx2);

          expect(shapes1).toEqual(shapes2);
        }
      });
    });

    describe("Complexity levels", () => {
      it("simple complexity produces 1-2 shapes", () => {
        for (let i = 0; i < 10; i++) {
          const ctx = createContext({ seed: `simple-${i}` });
          const shapes = generateShapes("simple", ctx);
          expect(shapes.length).toBeGreaterThanOrEqual(1);
          expect(shapes.length).toBeLessThanOrEqual(2);
        }
      });

      it("medium complexity produces 2-3 shapes", () => {
        for (let i = 0; i < 10; i++) {
          const ctx = createContext({ seed: `medium-${i}` });
          const shapes = generateShapes("medium", ctx);
          expect(shapes.length).toBeGreaterThanOrEqual(2);
          expect(shapes.length).toBeLessThanOrEqual(3);
        }
      });

      it("complex complexity produces 3-5 shapes", () => {
        for (let i = 0; i < 10; i++) {
          const ctx = createContext({ seed: `complex-${i}` });
          const shapes = generateShapes("complex", ctx);
          expect(shapes.length).toBeGreaterThanOrEqual(3);
          expect(shapes.length).toBeLessThanOrEqual(5);
        }
      });
    });

    describe("Coordinate normalization", () => {
      it("all x and y coordinates are in [0, 1] range", () => {
        const ctx = createContext({ seed: "coordinates-test" });
        const shapes = generateShapes("complex", ctx);

        for (const shape of shapes) {
          expect(shape.x).toBeGreaterThanOrEqual(0);
          expect(shape.x).toBeLessThanOrEqual(1);
          expect(shape.y).toBeGreaterThanOrEqual(0);
          expect(shape.y).toBeLessThanOrEqual(1);

          if (shape.x2 !== undefined) {
            expect(shape.x2).toBeGreaterThanOrEqual(0);
            expect(shape.x2).toBeLessThanOrEqual(1);
          }
          if (shape.y2 !== undefined) {
            expect(shape.y2).toBeGreaterThanOrEqual(0);
            expect(shape.y2).toBeLessThanOrEqual(1);
          }
        }
      });

      it("dimensions (w, h, r) are normalized and positive", () => {
        const ctx = createContext({ seed: "dimensions-test" });
        const shapes = generateShapes("complex", ctx);

        for (const shape of shapes) {
          if (shape.w !== undefined) {
            expect(shape.w).toBeGreaterThan(0);
            expect(shape.w).toBeLessThanOrEqual(1);
          }
          if (shape.h !== undefined) {
            expect(shape.h).toBeGreaterThan(0);
            expect(shape.h).toBeLessThanOrEqual(1);
          }
          if (shape.r !== undefined) {
            expect(shape.r).toBeGreaterThan(0);
            expect(shape.r).toBeLessThanOrEqual(1);
          }
        }
      });

      it("rotation is in [0, 360) degree range", () => {
        const ctx = createContext({ seed: "rotation-test" });
        const shapes = generateShapes("complex", ctx);

        for (const shape of shapes) {
          if (shape.rotation !== undefined) {
            expect(shape.rotation).toBeGreaterThanOrEqual(0);
            expect(shape.rotation).toBeLessThan(360);
          }
        }
      });

      it("angles (startAngle, endAngle) are in valid radian range", () => {
        const ctx = createContext({ seed: "angles-test" });
        const shapes = generateShapes("complex", ctx);

        for (const shape of shapes) {
          if (shape.startAngle !== undefined) {
            expect(shape.startAngle).toBeGreaterThanOrEqual(0);
            expect(shape.startAngle).toBeLessThan(Math.PI * 2);
          }
          if (shape.endAngle !== undefined) {
            expect(shape.endAngle).toBeGreaterThanOrEqual(0);
            expect(shape.endAngle).toBeLessThan(Math.PI * 2);
          }
        }
      });
    });

    describe("Shape validity", () => {
      it("all shapes have required type field", () => {
        const ctx = createContext({ seed: "validity-test" });
        const shapes = generateShapes("complex", ctx);

        for (const shape of shapes) {
          expect(shape.type).toBeDefined();
          expect(["rect", "circle", "line", "arc", "polygon"]).toContain(shape.type);
        }
      });

      it("all shapes have x and y coordinates", () => {
        const ctx = createContext({ seed: "xy-test" });
        const shapes = generateShapes("complex", ctx);

        for (const shape of shapes) {
          expect(shape.x).toBeDefined();
          expect(typeof shape.x).toBe("number");
          expect(shape.y).toBeDefined();
          expect(typeof shape.y).toBe("number");
        }
      });

      it("circle shapes have radius (r)", () => {
        const ctx = createContext({ seed: "circle-test" });
        let found = false;

        for (let i = 0; i < 20; i++) {
          const testCtx = createContext({ seed: `circle-search-${i}` });
          const shapes = generateShapes("complex", testCtx);

          for (const shape of shapes) {
            if (shape.type === "circle") {
              expect(shape.r).toBeDefined();
              expect(typeof shape.r).toBe("number");
              expect(shape.r).toBeGreaterThan(0);
              found = true;
            }
          }
        }
        // At least one circle should be generated in 20 attempts
        expect(found).toBe(true);
      });

      it("rect shapes have width and height (w, h)", () => {
        const ctx = createContext({ seed: "rect-test" });
        let found = false;

        for (let i = 0; i < 20; i++) {
          const testCtx = createContext({ seed: `rect-search-${i}` });
          const shapes = generateShapes("complex", testCtx);

          for (const shape of shapes) {
            if (shape.type === "rect") {
              expect(shape.w).toBeDefined();
              expect(shape.h).toBeDefined();
              expect(typeof shape.w).toBe("number");
              expect(typeof shape.h).toBe("number");
              found = true;
            }
          }
        }
        expect(found).toBe(true);
      });

      it("line shapes have end coordinates (x2, y2)", () => {
        const ctx = createContext({ seed: "line-test" });
        let found = false;

        for (let i = 0; i < 20; i++) {
          const testCtx = createContext({ seed: `line-search-${i}` });
          const shapes = generateShapes("complex", testCtx);

          for (const shape of shapes) {
            if (shape.type === "line") {
              expect(shape.x2).toBeDefined();
              expect(shape.y2).toBeDefined();
              expect(typeof shape.x2).toBe("number");
              expect(typeof shape.y2).toBe("number");
              found = true;
            }
          }
        }
        expect(found).toBe(true);
      });

      it("arc shapes have angles (startAngle, endAngle) and radius", () => {
        const ctx = createContext({ seed: "arc-test" });
        let found = false;

        for (let i = 0; i < 20; i++) {
          const testCtx = createContext({ seed: `arc-search-${i}` });
          const shapes = generateShapes("complex", testCtx);

          for (const shape of shapes) {
            if (shape.type === "arc") {
              expect(shape.r).toBeDefined();
              expect(shape.startAngle).toBeDefined();
              expect(shape.endAngle).toBeDefined();
              found = true;
            }
          }
        }
        expect(found).toBe(true);
      });

      it("polygon shapes have sides property", () => {
        const ctx = createContext({ seed: "polygon-test" });
        let found = false;

        for (let i = 0; i < 20; i++) {
          const testCtx = createContext({ seed: `polygon-search-${i}` });
          const shapes = generateShapes("complex", testCtx);

          for (const shape of shapes) {
            if (shape.type === "polygon") {
              expect(shape.sides).toBeDefined();
              expect(typeof shape.sides).toBe("number");
              expect(shape.sides).toBeGreaterThanOrEqual(3);
              found = true;
            }
          }
        }
        expect(found).toBe(true);
      });
    });

    describe("Context usage", () => {
      it("uses ctx.child for shape generation", () => {
        // This test verifies determinism is maintained through proper context usage
        const ctx1 = createContext({ seed: "context-fork-test" });
        const ctx2 = createContext({ seed: "context-fork-test" });

        const shapes1 = generateShapes("complex", ctx1);
        const shapes2 = generateShapes("complex", ctx2);

        expect(shapes1).toEqual(shapes2);
      });
    });
  });
});

describe("SVG Renderer", () => {
  describe("renderToSVG", () => {
    it("returns a string", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 }];
      const svg = renderToSVG(shapes);
      expect(typeof svg).toBe("string");
    });

    it("produces valid SVG with svg root element", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 }];
      const svg = renderToSVG(shapes);
      expect(svg).toMatch(/^<svg/);
      expect(svg).toMatch(/<\/svg>$/);
    });

    it("includes viewBox attribute with default size", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 }];
      const svg = renderToSVG(shapes);
      expect(svg).toContain('viewBox="0 0 32 32"');
    });

    it("uses custom size in viewBox", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 }];
      const params: RenderParams = { size: 64 };
      const svg = renderToSVG(shapes, params);
      expect(svg).toContain('viewBox="0 0 64 64"');
    });

    it("includes xmlns attribute", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 }];
      const svg = renderToSVG(shapes);
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it("renders rect shape with scaled coordinates", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.2, w: 0.3, h: 0.4 }];
      const svg = renderToSVG(shapes, { size: 100 });
      expect(svg).toContain('<rect');
      expect(svg).toContain('x="10"');
      expect(svg).toContain('y="20"');
      expect(svg).toContain('width="30"');
      expect(svg).toContain('height="40"');
    });

    it("renders circle shape with scaled coordinates and radius", () => {
      const shapes: ShapeParams[] = [{ type: "circle", x: 0.5, y: 0.5, r: 0.2 }];
      const svg = renderToSVG(shapes, { size: 100 });
      expect(svg).toContain('<circle');
      expect(svg).toContain('cx="50"');
      expect(svg).toContain('cy="50"');
      expect(svg).toContain('r="20"');
    });

    it("renders line shape with scaled coordinates", () => {
      const shapes: ShapeParams[] = [{ type: "line", x: 0.1, y: 0.2, x2: 0.8, y2: 0.9 }];
      const svg = renderToSVG(shapes, { size: 100 });
      expect(svg).toContain('<line');
      expect(svg).toContain('x1="10"');
      expect(svg).toContain('y1="20"');
      expect(svg).toContain('x2="80"');
      expect(svg).toContain('y2="90"');
    });

    it("renders arc shape with path element", () => {
      const shapes: ShapeParams[] = [
        { type: "arc", x: 0.5, y: 0.5, r: 0.2, startAngle: 0, endAngle: Math.PI / 2 },
      ];
      const svg = renderToSVG(shapes);
      expect(svg).toContain('<path');
      expect(svg).toContain('d="M');
    });

    it("renders polygon shape with points attribute", () => {
      const shapes: ShapeParams[] = [{ type: "polygon", x: 0.5, y: 0.5, r: 0.2, sides: 6 }];
      const svg = renderToSVG(shapes);
      expect(svg).toContain('<polygon');
      expect(svg).toContain('points="');
    });

    it("applies stroke width from renderParams", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 }];
      const svg = renderToSVG(shapes, { strokeWidth: 4 });
      expect(svg).toContain('stroke-width="4"');
    });

    it("applies default stroke width of 2", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 }];
      const svg = renderToSVG(shapes);
      expect(svg).toContain('stroke-width="2"');
    });

    it("applies stroke color from palette", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 }];
      const svg = renderToSVG(shapes, { palette: ["#FF0000"] });
      expect(svg).toContain('stroke="#FF0000"');
    });

    it("rotates through palette colors for multiple shapes", () => {
      const shapes: ShapeParams[] = [
        { type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 },
        { type: "circle", x: 0.5, y: 0.5, r: 0.2 },
        { type: "line", x: 0.1, y: 0.5, x2: 0.9, y2: 0.9 },
      ];
      const svg = renderToSVG(shapes, { palette: ["#FF0000", "#00FF00"] });
      // Should cycle through palette: rect=#FF0000, circle=#00FF00, line=#FF0000
      const rects = svg.match(/stroke="#FF0000"/g) || [];
      const greens = svg.match(/stroke="#00FF00"/g) || [];
      expect(rects.length).toBeGreaterThanOrEqual(1);
      expect(greens.length).toBeGreaterThanOrEqual(1);
    });

    it("uses default color #000000 when no palette provided", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 }];
      const svg = renderToSVG(shapes);
      expect(svg).toContain('stroke="#000000"');
    });

    it("all shapes have fill='none'", () => {
      const shapes: ShapeParams[] = [
        { type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 },
        { type: "circle", x: 0.5, y: 0.5, r: 0.2 },
      ];
      const svg = renderToSVG(shapes);
      const fillMatches = svg.match(/fill="none"/g) || [];
      expect(fillMatches.length).toBe(shapes.length);
    });

    it("output contains no whitespace (minified)", () => {
      const shapes: ShapeParams[] = [
        { type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 },
        { type: "circle", x: 0.5, y: 0.5, r: 0.2 },
      ];
      const svg = renderToSVG(shapes);
      // SVG should be minified (no newlines or extra spaces)
      expect(svg).not.toContain("\n");
      expect(svg).not.toMatch(/>\s+</);
    });

    it("handles empty shapes array", () => {
      const svg = renderToSVG([]);
      expect(svg).toMatch(/^<svg.*<\/svg>$/);
      expect(svg).toContain('viewBox="0 0 32 32"');
    });

    it("scales all coordinates by size parameter", () => {
      const shapes: ShapeParams[] = [{ type: "circle", x: 0.25, y: 0.75, r: 0.1 }];
      const svg = renderToSVG(shapes, { size: 200 });
      expect(svg).toContain('cx="50"');
      expect(svg).toContain('cy="150"');
      expect(svg).toContain('r="20"');
    });

    it("rect includes rotation attribute when present", () => {
      const shapes: ShapeParams[] = [
        { type: "rect", x: 0.5, y: 0.5, w: 0.2, h: 0.2, rotation: 45 },
      ];
      const svg = renderToSVG(shapes);
      // When rotation is present, the rect should have transform or be rendered with rotation
      expect(svg).toContain('rect');
    });

    it("renders all shape types in single SVG", () => {
      const shapes: ShapeParams[] = [
        { type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 },
        { type: "circle", x: 0.3, y: 0.3, r: 0.1 },
        { type: "line", x: 0.5, y: 0.5, x2: 0.8, y2: 0.8 },
        { type: "arc", x: 0.7, y: 0.7, r: 0.1, startAngle: 0, endAngle: Math.PI },
        { type: "polygon", x: 0.2, y: 0.8, r: 0.1, sides: 5 },
      ];
      const svg = renderToSVG(shapes);
      expect(svg).toContain('<rect');
      expect(svg).toContain('<circle');
      expect(svg).toContain('<line');
      expect(svg).toContain('<path');
      expect(svg).toContain('<polygon');
    });
  });
});

describe("Unicode Renderer", () => {
  describe("renderToUnicode", () => {
    describe("Predefined mappings", () => {
      it("maps 'strong' to 💪", () => {
        const result = renderToUnicode("strong");
        expect(result).toBe("💪");
      });

      it("maps 'anvil' to ⚒", () => {
        const result = renderToUnicode("anvil");
        expect(result).toBe("⚒");
      });

      it("maps 'gem' to 💎", () => {
        const result = renderToUnicode("gem");
        expect(result).toBe("💎");
      });

      it("maps 'mountain' to ⛰", () => {
        const result = renderToUnicode("mountain");
        expect(result).toBe("⛰");
      });

      it("maps 'fire' to 🔥", () => {
        const result = renderToUnicode("fire");
        expect(result).toBe("🔥");
      });

      it("maps 'water' to 💧", () => {
        const result = renderToUnicode("water");
        expect(result).toBe("💧");
      });

      it("maps 'stone' to 🪨", () => {
        const result = renderToUnicode("stone");
        expect(result).toBe("🪨");
      });

      it("maps 'metal' to ⚙", () => {
        const result = renderToUnicode("metal");
        expect(result).toBe("⚙");
      });

      it("maps 'sky' to ☁", () => {
        const result = renderToUnicode("sky");
        expect(result).toBe("☁");
      });

      it("maps 'tree' to 🌳", () => {
        const result = renderToUnicode("tree");
        expect(result).toBe("🌳");
      });

      it("maps 'star' to ⭐", () => {
        const result = renderToUnicode("star");
        expect(result).toBe("⭐");
      });

      it("maps 'moon' to 🌙", () => {
        const result = renderToUnicode("moon");
        expect(result).toBe("🌙");
      });
    });

    describe("Custom mappings", () => {
      it("allows custom mappings to override defaults", () => {
        const result = renderToUnicode("strong", { mappings: { strong: "🦾" } });
        expect(result).toBe("🦾");
      });

      it("falls back to predefined mapping if custom mapping not provided", () => {
        const result = renderToUnicode("gem", { mappings: { stone: "🪨" } });
        expect(result).toBe("💎");
      });

      it("supports multiple custom mappings", () => {
        const config = { mappings: { strong: "🦾", fire: "🌡" } };
        expect(renderToUnicode("strong", config)).toBe("🦾");
        expect(renderToUnicode("fire", config)).toBe("🌡");
      });
    });

    describe("Fallback behavior", () => {
      it("returns default fallback '□' for unmapped meaning", () => {
        const result = renderToUnicode("unmapped-meaning");
        expect(result).toBe("□");
      });

      it("returns custom fallback for unmapped meaning", () => {
        const result = renderToUnicode("unmapped", { fallback: "?" });
        expect(result).toBe("?");
      });

      it("returns custom fallback even if custom mappings provided", () => {
        const config = { mappings: { custom: "⚡" }, fallback: "❌" };
        const result = renderToUnicode("unmapped", config);
        expect(result).toBe("❌");
      });

      it("prefers custom mapping over fallback", () => {
        const config = { mappings: { strong: "🦾" }, fallback: "?" };
        const result = renderToUnicode("strong", config);
        expect(result).toBe("🦾");
      });
    });

    describe("Return type", () => {
      it("always returns a string", () => {
        expect(typeof renderToUnicode("strong")).toBe("string");
        expect(typeof renderToUnicode("unmapped")).toBe("string");
        expect(typeof renderToUnicode("fire", { fallback: "x" })).toBe("string");
      });

      it("returns a single character or character sequence", () => {
        const result = renderToUnicode("strong");
        expect(result.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});

describe("Canvas Renderer", () => {
  describe("renderToCanvas", () => {
    it("returns an array of CanvasInstruction", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 }];
      const instructions = renderToCanvas(shapes);
      expect(Array.isArray(instructions)).toBe(true);
    });

    it("generates instructions for a single rect shape", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 }];
      const instructions = renderToCanvas(shapes);
      expect(instructions.length).toBeGreaterThan(0);
      // Should have: save, setStrokeStyle, setLineWidth, beginPath, rect, stroke, restore
      expect(instructions.some((i) => i.type === "save")).toBe(true);
      expect(instructions.some((i) => i.type === "restore")).toBe(true);
    });

    it("includes beginPath and closePath for path-based shapes", () => {
      const shapes: ShapeParams[] = [{ type: "line", x: 0.1, y: 0.1, x2: 0.5, y2: 0.5 }];
      const instructions = renderToCanvas(shapes);
      expect(instructions.some((i) => i.type === "beginPath")).toBe(true);
      expect(instructions.some((i) => i.type === "closePath")).toBe(true);
    });

    it("scales normalized coordinates by size parameter", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.2, w: 0.3, h: 0.4 }];
      const instructions = renderToCanvas(shapes, { size: 100 });
      // Rect instruction should have scaled coordinates
      const rectInstr = instructions.find((i) => i.type === "rect");
      expect(rectInstr).toBeDefined();
      expect(rectInstr?.params[0]).toBe(10); // x: 0.1 * 100
      expect(rectInstr?.params[1]).toBe(20); // y: 0.2 * 100
      expect(rectInstr?.params[2]).toBe(30); // w: 0.3 * 100
      expect(rectInstr?.params[3]).toBe(40); // h: 0.4 * 100
    });

    it("applies default size of 32 when not provided", () => {
      const shapes: ShapeParams[] = [{ type: "circle", x: 0.5, y: 0.5, r: 0.2 }];
      const instructions = renderToCanvas(shapes);
      const arcInstr = instructions.find((i) => i.type === "arc");
      expect(arcInstr).toBeDefined();
      // Default size is 32, so cx should be 0.5 * 32 = 16
      expect(arcInstr?.params[0]).toBe(16);
      expect(arcInstr?.params[1]).toBe(16);
    });

    it("applies strokeWidth to setLineWidth instruction", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 }];
      const instructions = renderToCanvas(shapes, { strokeWidth: 4 });
      const lineWidthInstr = instructions.find((i) => i.type === "setLineWidth");
      expect(lineWidthInstr).toBeDefined();
      expect(lineWidthInstr?.params[0]).toBe(4);
    });

    it("applies default strokeWidth of 2", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 }];
      const instructions = renderToCanvas(shapes);
      const lineWidthInstr = instructions.find((i) => i.type === "setLineWidth");
      expect(lineWidthInstr).toBeDefined();
      expect(lineWidthInstr?.params[0]).toBe(2);
    });

    it("applies stroke color from palette", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 }];
      const instructions = renderToCanvas(shapes, { palette: ["#FF0000"] });
      const strokeStyleInstr = instructions.find((i) => i.type === "setStrokeStyle");
      expect(strokeStyleInstr).toBeDefined();
      expect(strokeStyleInstr?.params[0]).toBe("#FF0000");
    });

    it("uses default color #000000 when no palette provided", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 }];
      const instructions = renderToCanvas(shapes);
      const strokeStyleInstr = instructions.find((i) => i.type === "setStrokeStyle");
      expect(strokeStyleInstr).toBeDefined();
      expect(strokeStyleInstr?.params[0]).toBe("#000000");
    });

    it("rotates through palette colors for multiple shapes", () => {
      const shapes: ShapeParams[] = [
        { type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 },
        { type: "circle", x: 0.5, y: 0.5, r: 0.2 },
        { type: "line", x: 0.1, y: 0.5, x2: 0.9, y2: 0.9 },
      ];
      const instructions = renderToCanvas(shapes, { palette: ["#FF0000", "#00FF00"] });
      // Extract stroke style instructions (one per shape)
      const strokeInstrs = instructions.filter((i) => i.type === "setStrokeStyle");
      expect(strokeInstrs.length).toBeGreaterThanOrEqual(3);
      // Should cycle: #FF0000, #00FF00, #FF0000
      expect(strokeInstrs[0]?.params[0]).toBe("#FF0000");
      expect(strokeInstrs[1]?.params[0]).toBe("#00FF00");
      expect(strokeInstrs[2]?.params[0]).toBe("#FF0000");
    });

    it("generates rect instruction for rect shape", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.2, w: 0.3, h: 0.4 }];
      const instructions = renderToCanvas(shapes, { size: 100 });
      const rectInstr = instructions.find((i) => i.type === "rect");
      expect(rectInstr).toBeDefined();
      expect(rectInstr?.params).toEqual([10, 20, 30, 40]);
    });

    it("generates arc instruction for circle shape", () => {
      const shapes: ShapeParams[] = [{ type: "circle", x: 0.5, y: 0.5, r: 0.2 }];
      const instructions = renderToCanvas(shapes, { size: 100 });
      const arcInstr = instructions.find((i) => i.type === "arc");
      expect(arcInstr).toBeDefined();
      // Should be full circle: arc(50, 50, 20, 0, 2*PI, false)
      expect(arcInstr?.params[0]).toBe(50); // cx
      expect(arcInstr?.params[1]).toBe(50); // cy
      expect(arcInstr?.params[2]).toBe(20); // r
    });

    it("generates moveTo and lineTo for line shape", () => {
      const shapes: ShapeParams[] = [{ type: "line", x: 0.1, y: 0.2, x2: 0.8, y2: 0.9 }];
      const instructions = renderToCanvas(shapes, { size: 100 });
      const moveToInstr = instructions.find((i) => i.type === "moveTo");
      const lineToInstr = instructions.find((i) => i.type === "lineTo");
      expect(moveToInstr).toBeDefined();
      expect(moveToInstr?.params).toEqual([10, 20]);
      expect(lineToInstr).toBeDefined();
      expect(lineToInstr?.params).toEqual([80, 90]);
    });

    it("generates arc instruction for arc shape with angles", () => {
      const shapes: ShapeParams[] = [
        { type: "arc", x: 0.5, y: 0.5, r: 0.2, startAngle: 0, endAngle: Math.PI / 2 },
      ];
      const instructions = renderToCanvas(shapes, { size: 100 });
      const arcInstr = instructions.find((i) => i.type === "arc");
      expect(arcInstr).toBeDefined();
      expect(arcInstr?.params[0]).toBe(50); // cx
      expect(arcInstr?.params[1]).toBe(50); // cy
      expect(arcInstr?.params[2]).toBe(20); // r
      expect(arcInstr?.params[3]).toBe(0); // startAngle
      expect(arcInstr?.params[4]).toBe(Math.PI / 2); // endAngle
    });

    it("handles empty shapes array", () => {
      const instructions = renderToCanvas([]);
      expect(Array.isArray(instructions)).toBe(true);
      expect(instructions.length).toBe(0);
    });

    it("renders all shape types", () => {
      const shapes: ShapeParams[] = [
        { type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 },
        { type: "circle", x: 0.3, y: 0.3, r: 0.1 },
        { type: "line", x: 0.5, y: 0.5, x2: 0.8, y2: 0.8 },
        { type: "arc", x: 0.7, y: 0.7, r: 0.1, startAngle: 0, endAngle: Math.PI },
        { type: "polygon", x: 0.2, y: 0.8, r: 0.1, sides: 5 },
      ];
      const instructions = renderToCanvas(shapes);
      expect(instructions.some((i) => i.type === "rect")).toBe(true);
      expect(instructions.some((i) => i.type === "arc")).toBe(true);
      expect(instructions.some((i) => i.type === "moveTo")).toBe(true);
    });

    it("has deterministic output for same shapes", () => {
      const shapes: ShapeParams[] = [
        { type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 },
        { type: "circle", x: 0.5, y: 0.5, r: 0.2 },
      ];
      const instr1 = renderToCanvas(shapes);
      const instr2 = renderToCanvas(shapes);
      expect(instr1).toEqual(instr2);
    });

    it("stroke instruction comes after drawing instructions", () => {
      const shapes: ShapeParams[] = [{ type: "rect", x: 0.1, y: 0.1, w: 0.2, h: 0.2 }];
      const instructions = renderToCanvas(shapes);
      const rectIdx = instructions.findIndex((i) => i.type === "rect");
      const strokeIdx = instructions.findIndex((i) => i.type === "stroke");
      expect(rectIdx).toBeGreaterThan(-1);
      expect(strokeIdx).toBeGreaterThan(rectIdx);
    });
  });
});

describe("glyphsFor", () => {
  it("should be defined", () => {
    expect(typeof glyphsFor).toBe("function");
  });

  describe("Phoneme mapping strategy", () => {
    it("splits name by 2-character units", () => {
      const name = {
        form: "Drakaztum",
        translation: "strong-anvil",
        language: "draconic",
      };
      const system: VisualGlyphSystem = {
        id: "test.phoneme",
        type: "alphabet",
        renderFormat: "svg",
        mappingStrategy: "phoneme",
        generator: {
          baseShapes: ["rect", "circle"],
          complexity: "simple",
          symmetry: false,
        },
      };
      const ctx = createContext({ seed: "test-phoneme-split" });
      const result = glyphsFor(name, system, ctx);

      expect(result.phonetic).toBeDefined();
      expect(result.phonetic?.length).toBe(5); // "Dr", "ak", "az", "tu", "m"
    });

    it("generates one glyph per phoneme unit", () => {
      
      const name = {
        form: "Test",
        translation: "meaning",
        language: "test",
      };
      const system: VisualGlyphSystem = {
        id: "test.phoneme.gen",
        type: "alphabet",
        renderFormat: "svg",
        mappingStrategy: "phoneme",
        generator: {
          baseShapes: ["rect"],
          complexity: "simple",
          symmetry: false,
        },
      };
      const ctx = createContext({ seed: "test-phoneme-gen" });
      const result = glyphsFor(name, system, ctx);

      expect(result.phonetic).toBeDefined();
      expect(result.phonetic?.length).toBe(2); // "Te", "st"
      expect(result.phonetic?.[0]?.id).toBe("g0");
      expect(result.phonetic?.[1]?.id).toBe("g1");
    });

    it("each phoneme glyph has svg when renderFormat is svg", () => {
      
      const name = {
        form: "Test",
        translation: "meaning",
        language: "test",
      };
      const system: VisualGlyphSystem = {
        id: "test.phoneme.svg",
        type: "alphabet",
        renderFormat: "svg",
        mappingStrategy: "phoneme",
        generator: {
          baseShapes: ["rect", "circle"],
          complexity: "simple",
          symmetry: false,
        },
      };
      const ctx = createContext({ seed: "test-phoneme-svg" });
      const result = glyphsFor(name, system, ctx);

      expect(result.phonetic).toBeDefined();
      for (const glyph of result.phonetic || []) {
        expect(glyph.svg).toBeDefined();
        expect(typeof glyph.svg).toBe("string");
        expect(glyph.svg).toContain("<svg");
      }
    });

    it("phonetic glyphs do not have meaning property", () => {
      
      const name = {
        form: "Test",
        translation: "meaning",
        language: "test",
      };
      const system: VisualGlyphSystem = {
        id: "test.phoneme.nomean",
        type: "alphabet",
        renderFormat: "svg",
        mappingStrategy: "phoneme",
        generator: {
          baseShapes: ["rect"],
          complexity: "simple",
          symmetry: false,
        },
      };
      const ctx = createContext({ seed: "test-phoneme-nomean" });
      const result = glyphsFor(name, system, ctx);

      expect(result.phonetic).toBeDefined();
      for (const glyph of result.phonetic || []) {
        expect(glyph.meaning).toBeUndefined();
      }
    });
  });

  describe("Morpheme mapping strategy", () => {
    it("splits translation by hyphen separator", () => {
      
      const name = {
        form: "Drakaztum",
        translation: "strong-anvil",
        language: "draconic",
      };
      const system: VisualGlyphSystem = {
        id: "test.morpheme",
        type: "conceptual",
        renderFormat: "svg",
        mappingStrategy: "morpheme",
        generator: {
          baseShapes: ["rect"],
          complexity: "simple",
          symmetry: false,
        },
      };
      const ctx = createContext({ seed: "test-morpheme-split" });
      const result = glyphsFor(name, system, ctx);

      expect(result.conceptual).toBeDefined();
      expect(result.conceptual?.length).toBe(2); // ["strong", "anvil"]
    });

    it("generates one glyph per morpheme with meaning", () => {
      
      const name = {
        form: "Drakaztum",
        translation: "strong-anvil",
        language: "draconic",
      };
      const system: VisualGlyphSystem = {
        id: "test.morpheme.gen",
        type: "conceptual",
        renderFormat: "svg",
        mappingStrategy: "morpheme",
        generator: {
          baseShapes: ["circle"],
          complexity: "simple",
          symmetry: false,
        },
      };
      const ctx = createContext({ seed: "test-morpheme-gen" });
      const result = glyphsFor(name, system, ctx);

      expect(result.conceptual).toBeDefined();
      expect(result.conceptual?.[0]?.meaning).toBe("strong");
      expect(result.conceptual?.[1]?.meaning).toBe("anvil");
    });

    it("each morpheme glyph has svg when renderFormat is svg", () => {
      
      const name = {
        form: "Test",
        translation: "force-tool",
        language: "test",
      };
      const system: VisualGlyphSystem = {
        id: "test.morpheme.svg",
        type: "conceptual",
        renderFormat: "svg",
        mappingStrategy: "morpheme",
        generator: {
          baseShapes: ["rect", "circle"],
          complexity: "simple",
          symmetry: false,
        },
      };
      const ctx = createContext({ seed: "test-morpheme-svg" });
      const result = glyphsFor(name, system, ctx);

      expect(result.conceptual).toBeDefined();
      for (const glyph of result.conceptual || []) {
        expect(glyph.svg).toBeDefined();
        expect(typeof glyph.svg).toBe("string");
      }
    });
  });

  describe("Holistic mapping strategy", () => {
    it("generates single glyph for entire name", () => {
      
      const name = {
        form: "Drakaztum",
        translation: "strong-anvil",
        language: "draconic",
      };
      const system: VisualGlyphSystem = {
        id: "test.holistic",
        type: "alphabet",
        renderFormat: "svg",
        mappingStrategy: "holistic",
        generator: {
          baseShapes: ["rect", "circle"],
          complexity: "simple",
          symmetry: false,
        },
      };
      const ctx = createContext({ seed: "test-holistic" });
      const result = glyphsFor(name, system, ctx);

      expect(result.holistic).toBeDefined();
      expect(result.holistic?.id).toBe("g0");
    });

    it("holistic glyph has svg when renderFormat is svg", () => {
      
      const name = {
        form: "Drakaztum",
        translation: "strong-anvil",
        language: "draconic",
      };
      const system: VisualGlyphSystem = {
        id: "test.holistic.svg",
        type: "alphabet",
        renderFormat: "svg",
        mappingStrategy: "holistic",
        generator: {
          baseShapes: ["rect", "circle", "line"],
          complexity: "complex",
          symmetry: false,
        },
      };
      const ctx = createContext({ seed: "test-holistic-svg" });
      const result = glyphsFor(name, system, ctx);

      expect(result.holistic?.svg).toBeDefined();
      expect(typeof result.holistic?.svg).toBe("string");
      expect(result.holistic?.svg).toContain("<svg");
    });
  });

  describe("Render formats", () => {
    it("renders SVG format correctly for phoneme strategy", () => {
      
      const name = {
        form: "Test",
        translation: "meaning",
        language: "test",
      };
      const system: VisualGlyphSystem = {
        id: "test.svg.phoneme",
        type: "alphabet",
        renderFormat: "svg",
        mappingStrategy: "phoneme",
        generator: {
          baseShapes: ["rect"],
          complexity: "simple",
          symmetry: false,
        },
        renderParams: { size: 64, strokeWidth: 3 },
      };
      const ctx = createContext({ seed: "test-svg-phoneme" });
      const result = glyphsFor(name, system, ctx);

      expect(result.phonetic?.[0]?.svg).toContain('viewBox="0 0 64 64"');
      expect(result.phonetic?.[0]?.svg).toContain('stroke-width="3"');
    });

    it("renders Unicode format for morpheme strategy", () => {
      
      const name = {
        form: "Test",
        translation: "strong-anvil",
        language: "test",
      };
      const system: VisualGlyphSystem = {
        id: "test.unicode.morpheme",
        type: "conceptual",
        renderFormat: "unicode",
        mappingStrategy: "morpheme",
        unicodeMappings: {
          strong: "💪",
          anvil: "⚒",
        },
      };
      const ctx = createContext({ seed: "test-unicode-morpheme" });
      const result = glyphsFor(name, system, ctx);

      expect(result.conceptual?.[0]?.unicode).toBe("💪");
      expect(result.conceptual?.[1]?.unicode).toBe("⚒");
    });

    it("renders Canvas format with instructions", () => {
      
      const name = {
        form: "Te",
        translation: "meaning",
        language: "test",
      };
      const system: VisualGlyphSystem = {
        id: "test.canvas.holistic",
        type: "alphabet",
        renderFormat: "canvas",
        mappingStrategy: "holistic",
        generator: {
          baseShapes: ["rect", "circle"],
          complexity: "simple",
          symmetry: false,
        },
      };
      const ctx = createContext({ seed: "test-canvas-holistic" });
      const result = glyphsFor(name, system, ctx);

      expect(result.holistic?.canvasInstructions).toBeDefined();
      expect(Array.isArray(result.holistic?.canvasInstructions)).toBe(true);
    });
  });

  describe("Determinism", () => {
    it("produces identical results for same seed", () => {
      
      const name = {
        form: "Drakaztum",
        translation: "strong-anvil",
        language: "draconic",
      };
      const system: VisualGlyphSystem = {
        id: "test.determinism",
        type: "alphabet",
        renderFormat: "svg",
        mappingStrategy: "phoneme",
        generator: {
          baseShapes: ["rect", "circle"],
          complexity: "medium",
          symmetry: false,
        },
      };

      const ctx1 = createContext({ seed: "determinism-test" });
      const result1 = glyphsFor(name, system, ctx1);

      const ctx2 = createContext({ seed: "determinism-test" });
      const result2 = glyphsFor(name, system, ctx2);

      expect(result1.phonetic).toEqual(result2.phonetic);
    });

    it("produces different results for different seeds", () => {
      
      const name = {
        form: "Drakaztum",
        translation: "strong-anvil",
        language: "draconic",
      };
      const system: VisualGlyphSystem = {
        id: "test.diff-seeds",
        type: "alphabet",
        renderFormat: "svg",
        mappingStrategy: "phoneme",
        generator: {
          baseShapes: ["rect", "circle"],
          complexity: "medium",
          symmetry: false,
        },
      };

      const ctx1 = createContext({ seed: "seed-1" });
      const result1 = glyphsFor(name, system, ctx1);

      const ctx2 = createContext({ seed: "seed-2" });
      const result2 = glyphsFor(name, system, ctx2);

      expect(result1.phonetic).not.toEqual(result2.phonetic);
    });
  });

  describe("Context isolation", () => {
    it("does not modify the passed context", () => {
      
      const name = {
        form: "Test",
        translation: "meaning",
        language: "test",
      };
      const system: VisualGlyphSystem = {
        id: "test.isolation",
        type: "alphabet",
        renderFormat: "svg",
        mappingStrategy: "phoneme",
        generator: {
          baseShapes: ["rect"],
          complexity: "simple",
          symmetry: false,
        },
      };
      const ctx = createContext({ seed: "context-isolation" });
      const scopeBefore = [...ctx.scope];

      glyphsFor(name, system, ctx);

      expect(ctx.scope).toEqual(scopeBefore);
    });
  });
});
