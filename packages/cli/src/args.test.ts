import { describe, expect, it } from "vitest";
import { parseArgs } from "./args.js";

describe("parseArgs", () => {
  it("parses command + positional", () => {
    expect(parseArgs(["build-markov", "input.json"])).toEqual({
      command: "build-markov",
      positional: ["input.json"],
      options: {},
    });
  });

  it("parses --key value", () => {
    const r = parseArgs(["x", "--out", "model.json"]);
    expect(r.options["out"]).toBe("model.json");
  });

  it("parses --key=value", () => {
    const r = parseArgs(["x", "--out=model.json"]);
    expect(r.options["out"]).toBe("model.json");
  });

  it("parses bare --flag as boolean true", () => {
    const r = parseArgs(["x", "--verbose"]);
    expect(r.options["verbose"]).toBe(true);
  });

  it("parses --no-foo as foo=false", () => {
    const r = parseArgs(["x", "--no-lowercase"]);
    expect(r.options["lowercase"]).toBe(false);
  });

  it("parses integer flag values", () => {
    const r = parseArgs(["x", "--order", "3"]);
    expect(r.options["order"]).toBe("3");
  });
});
