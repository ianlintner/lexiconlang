import { describe, it, expect } from "vitest";
import type { VisualGlyphSystem, Glyph, GlyphSet, ShapeParams, CanvasInstruction, Complexity } from "./types.js";
import { generateShapes } from "./shape-generator.js";
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
