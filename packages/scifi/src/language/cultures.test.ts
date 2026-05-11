import { describe, expect, it } from "vitest";
import { reptilian, hivemind, grayfolk } from "./cultures.js";
import { createContext } from "@lexiconlang/core";
import { generateName } from "@lexiconlang/language";

describe("reptilian culture", () => {
  it("has visualGlyphSystems.phonetic defined", () => {
    expect(reptilian.visualGlyphSystems?.phonetic).toBeDefined();
  });

  it("phonetic glyph system is SVG alphabet", () => {
    const g = reptilian.visualGlyphSystems!.phonetic;
    expect(g.id).toBe("reptilian.scales");
    expect(g.type).toBe("alphabet");
    expect(g.renderFormat).toBe("svg");
    expect(g.mappingStrategy).toBe("phoneme");
    expect(g.generator!.baseShapes).toContain("arc");
    expect(g.generator!.palette).toEqual(["#556B2F", "#8B7500"]);
  });

  it("generates a non-empty given name", () => {
    const ctx = createContext({ seed: "reptilian-test" });
    const name = generateName(reptilian, "given", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });

  it("generates a non-empty surname", () => {
    const ctx = createContext({ seed: "reptilian-surname" });
    const name = generateName(reptilian, "surname", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });
});

describe("hivemind culture", () => {
  it("has visualGlyphSystems.phonetic defined", () => {
    expect(hivemind.visualGlyphSystems?.phonetic).toBeDefined();
  });

  it("phonetic glyph system is SVG alphabet with mechanical palette", () => {
    const g = hivemind.visualGlyphSystems!.phonetic;
    expect(g.id).toBe("hivemind.grid");
    expect(g.type).toBe("alphabet");
    expect(g.renderFormat).toBe("svg");
    expect(g.generator!.baseShapes).toContain("rect");
    expect(g.generator!.palette).toEqual(["#00CED1", "#C0C0C0"]);
  });

  it("generates a non-empty given name", () => {
    const ctx = createContext({ seed: "hivemind-test" });
    const name = generateName(hivemind, "given", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });
});

describe("grayfolk culture", () => {
  it("has visualGlyphSystems.holistic defined", () => {
    expect(grayfolk.visualGlyphSystems?.holistic).toBeDefined();
  });

  it("holistic glyph system uses unicode conceptual mapping", () => {
    const g = grayfolk.visualGlyphSystems!.holistic;
    expect(g.id).toBe("grayfolk.observer");
    expect(g.type).toBe("conceptual");
    expect(g.renderFormat).toBe("unicode");
    expect(g.mappingStrategy).toBe("morpheme");
    expect(g.unicodeMappings!.cognition).toBe("⊙");
    expect(g.unicodeMappings!.awareness).toBe("◉");
    expect(g.unicodeMappings!.silence).toBe("◯");
    expect(g.unicodeMappings!.memory).toBe("⌬");
    expect(g.unicodeMappings!.quantum).toBe("✦");
    expect(g.renderParams!.fallback).toBe("◌");
  });

  it("generates a non-empty given name", () => {
    const ctx = createContext({ seed: "grayfolk-test" });
    const name = generateName(grayfolk, "given", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });

  it("generates a non-empty surname", () => {
    const ctx = createContext({ seed: "grayfolk-surname" });
    const name = generateName(grayfolk, "surname", ctx);
    expect(name.form.length).toBeGreaterThan(0);
  });
});
