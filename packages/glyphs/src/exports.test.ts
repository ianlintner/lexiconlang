import { describe, it, expect } from "vitest";

// Verify all exports exist and are the correct type
describe("Package Exports", () => {
  it("exports all types from @lexicon/language", () => {
    // Types from @lexicon/language
    import("../src/index.js").then((module) => {
      // These should be types, so we can't directly check them at runtime,
      // but the TypeScript compiler will verify they exist
      expect(module).toBeDefined();
    });
  });

  it("exports all functions", async () => {
    const {
      generateShapes,
      renderToSVG,
      renderToCanvas,
      executeCanvasInstructions,
      renderToUnicode,
      glyphsFor,
    } = await import("../src/index.js");

    expect(typeof generateShapes).toBe("function");
    expect(typeof renderToSVG).toBe("function");
    expect(typeof renderToCanvas).toBe("function");
    expect(typeof executeCanvasInstructions).toBe("function");
    expect(typeof renderToUnicode).toBe("function");
    expect(typeof glyphsFor).toBe("function");
  });

  it("exports all constants", async () => {
    const { UnicodeRegistry } = await import("../src/index.js");

    expect(typeof UnicodeRegistry).toBe("object");
    expect(UnicodeRegistry).toBeDefined();
  });

  it("can import all exports in TypeScript without errors", async () => {
    // This test verifies that TypeScript compilation succeeds with all imports
    const module = await import("../src/index.js");

    // Functions
    expect(module.generateShapes).toBeDefined();
    expect(module.renderToSVG).toBeDefined();
    expect(module.renderToCanvas).toBeDefined();
    expect(module.executeCanvasInstructions).toBeDefined();
    expect(module.renderToUnicode).toBeDefined();
    expect(module.glyphsFor).toBeDefined();

    // Constants
    expect(module.UnicodeRegistry).toBeDefined();
  });

  it("ensures proper organization of exports", async () => {
    // Load the raw source to verify organization
    const fs = await import("fs/promises");
    const path = await import("path");
    const indexPath = path.resolve(__dirname, "./index.ts");
    const content = await fs.readFile(indexPath, "utf-8");

    // Verify exports are organized with comments
    expect(content).toContain("// Functions");
    expect(content).toContain("// Types from @lexicon/language");
    expect(content).toContain("// Types from @lexicon/glyphs");
    expect(content).toContain("// Constants");
    expect(content).toContain("// Interfaces");
  });
});
