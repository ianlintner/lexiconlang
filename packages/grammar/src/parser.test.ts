import { describe, expect, it } from "vitest";
import { parse } from "./parser.js";

describe("parser", () => {
  it("parses plain text", () => {
    expect(parse("hello world")).toEqual([{ type: "text", value: "hello world" }]);
  });

  it("parses simple ref", () => {
    const ast = parse("#name#");
    expect(ast).toHaveLength(1);
    const n = ast[0];
    expect(n).toBeDefined();
    expect(n!.type).toBe("ref");
    if (n!.type === "ref") {
      expect(n!.symbol).toBe("name");
      expect(n!.mods).toEqual([]);
    }
  });

  it("parses ref with modifiers", () => {
    const ast = parse("#name.cap.s#");
    const n = ast[0];
    expect(n).toBeDefined();
    if (n!.type === "ref") {
      expect(n!.symbol).toBe("name");
      expect(n!.mods.map((m) => m.name)).toEqual(["cap", "s"]);
    }
  });

  it("parses modifier with args", () => {
    const ast = parse("#x.replace(a,b)#");
    const n = ast[0];
    expect(n).toBeDefined();
    if (n!.type === "ref") {
      expect(n!.mods).toEqual([{ name: "replace", args: ["a", "b"] }]);
    }
  });

  it("parses mixed text and refs", () => {
    const ast = parse("Hello, #name#!");
    expect(ast).toHaveLength(3);
  });

  it("parses plugin-namespace ref like #markov:elvish#", () => {
    const ast = parse("#markov:elvish#");
    const n = ast[0];
    if (n!.type === "ref") {
      expect(n!.symbol).toBe("markov:elvish");
    }
  });
});
