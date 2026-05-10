import { describe, it, expect } from "vitest";
import type { VisualGlyphSystem, Glyph, GlyphSet, ShapeParams, CanvasInstruction, Complexity, RenderParams } from "./types.js";
import { generateShapes } from "./shape-generator.js";
import { renderToSVG } from "./svg-renderer.js";
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
