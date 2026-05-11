import { describe, expect, it } from "vitest";
import { createContext } from "@lexiconlang/core";
import { grammar } from "./grammar.js";
import { t } from "./template.js";

describe("grammar", () => {
  it("expands simple #symbol# refs", () => {
    const g = grammar({
      start: "Hello, #name#!",
      name: "world",
    });
    expect(g.generate(createContext({ seed: "x" }))).toBe("Hello, world!");
  });

  it("picks deterministically from arrays", () => {
    const g = grammar({
      start: "#color#",
      color: ["red", "green", "blue"],
    });
    const a = g.generate(createContext({ seed: "x" }));
    const b = g.generate(createContext({ seed: "x" }));
    expect(a).toBe(b);
    expect(["red", "green", "blue"]).toContain(a);
  });

  it("applies modifiers", () => {
    const g = grammar({
      start: "#word.cap#",
      word: ["foo"],
    });
    expect(g.generate(createContext({ seed: "x" }))).toBe("Foo");
  });

  it("chains modifiers", () => {
    const g = grammar({
      start: "#word.cap.s#",
      word: ["dog"],
    });
    expect(g.generate(createContext({ seed: "x" }))).toBe("Dogs");
  });

  it("a/an modifier", () => {
    const g = grammar({
      start: "#word.a#",
      word: ["apple"],
    });
    expect(g.generate(createContext({ seed: "x" }))).toBe("an apple");
  });

  it("nested refs", () => {
    const g = grammar({
      start: "The #thing# is here.",
      thing: "#size# #color# #noun#",
      size: ["big", "small"],
      color: ["red", "blue"],
      noun: ["box", "ball"],
    });
    const out = g.generate(createContext({ seed: "nested" }));
    expect(out).toMatch(/^The (big|small) (red|blue) (box|ball) is here\.$/);
  });

  it("tagged template integrates", () => {
    const g = grammar({
      start: t`The ${"adjective.cap"} ${"noun.cap"}`,
      adjective: ["drunken", "gilded"],
      noun: ["anchor", "dragon"],
    });
    const out = g.generate(createContext({ seed: "tav" }));
    expect(out).toMatch(/^The (Drunken|Gilded) (Anchor|Dragon)$/);
  });

  it("weighted rule (record form)", () => {
    const g = grammar({
      start: "#x#",
      x: { common: 100, rare: 1 },
    });
    const ctx = createContext({ seed: "stats" });
    let common = 0;
    for (let i = 0; i < 1000; i++) {
      if (g.generate(ctx.child(`i:${i}`)) === "common") common++;
    }
    expect(common).toBeGreaterThan(900);
  });

  it("unknown symbol falls back to ((symbol))", () => {
    const g = grammar({ start: "Hi #missing#" });
    expect(g.generate(createContext({ seed: "x" }))).toBe("Hi ((missing))");
  });

  it("escapes # and [ via backslash", () => {
    const g = grammar({ start: "literal \\# and \\[" });
    expect(g.generate(createContext({ seed: "x" }))).toBe("literal # and [");
  });
});
