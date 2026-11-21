import { describe, expect, it } from "vitest";
import { createContext } from "@lexiconlang/core";
import {
  blocklist,
  blocklistMatch,
  createBlocklist,
  DEFAULT_BLOCKLIST,
  foldAscii,
  isBlocked,
  type Blocklist,
} from "../filter.js";
import { defineCulture, type Culture, type TranslatedName } from "../types.js";

function name(form: string, translation = form): TranslatedName {
  return { form, translation, language: "test", toString() { return this.form; } };
}

const culture: Culture = defineCulture({
  id: "test.culture",
  glyphs: { classes: { C: ["b"], V: ["a"] }, syllables: [["C V", 1]], wordShapes: [["1", 1]] },
  meaningPacks: [],
  templates: { given: [[{ kind: "literal", form: "Nice", translation: "nice" }, 1]] },
});

describe("foldAscii", () => {
  it("NFKC-folds case and accents to ASCII for comparison only", () => {
    expect(foldAscii("  FÜÑKŸ  ")).toBe("funky");
    expect(foldAscii("ＣＡＦÉ")).toBe("cafe");
    expect(foldAscii("Straße")).toBe("strasse");
  });

  it("never modifies the source word", () => {
    const original = "FÜÑKŸ";
    foldAscii(original);
    expect(original).toBe("FÜÑKŸ");
  });
});

describe("createBlocklist / isBlocked", () => {
  const list = createBlocklist({
    id: "test.list",
    terms: ["damn", "hell"],
    mode: "whole-token",
  });

  it("whole-token mode matches bounded tokens, not substrings", () => {
    expect(blocklistMatch(name("damn"), list)).toBe(true);
    expect(blocklistMatch(name("Damn!"), list)).toBe(true);
    expect(blocklistMatch(name("damnation"), list)).toBe(false);
    expect(blocklistMatch(name("shell"), list)).toBe(false);
  });

  it("substring mode matches embedded terms", () => {
    const sub = createBlocklist({ id: "test.sub", terms: ["damn"], mode: "substring" });
    expect(blocklistMatch(name("damnation"), sub)).toBe(true);
    expect(blocklistMatch(name("DÄMN"), sub)).toBe(true);
  });

  it("matches form and translation", () => {
    expect(blocklistMatch(name("Clean", "damn"), list)).toBe(true);
    expect(blocklistMatch(name("damn", "Clean"), list)).toBe(true);
  });

  it("isBlocked accepts a list of culture/pack-scoped blocklists", () => {
    expect(isBlocked(name("hell"), [list])).toBe(true);
    expect(isBlocked(name("peace"), [list])).toBe(false);
    expect(isBlocked(name("hell"), [])).toBe(false);
  });

  it("empty and malformed terms are ignored", () => {
    const empty = createBlocklist({ id: "test.empty", terms: ["", "  "], mode: "substring" });
    expect(blocklistMatch(name("anything"), empty)).toBe(false);
  });

  it("default list ships a provenance note and curated original terms", () => {
    expect(DEFAULT_BLOCKLIST.id).toBe("lexiconlang.safety.default");
    expect(DEFAULT_BLOCKLIST.provenance).toMatch(/original|CC0/i);
    expect(DEFAULT_BLOCKLIST.terms.length).toBeGreaterThan(0);
    expect(blocklistMatch(name("shit"), DEFAULT_BLOCKLIST)).toBe(true);
    expect(blocklistMatch(name("Damn"), DEFAULT_BLOCKLIST)).toBe(true);
    expect(blocklistMatch(name("brook"), DEFAULT_BLOCKLIST)).toBe(false);
  });

  it("per-culture and per-pack lists can be composed", () => {
    const custom = createBlocklist({
      id: "acme.sail/safety",
      terms: ["Mina"],
      mode: "whole-token",
    });
    const lists: readonly Blocklist[] = [DEFAULT_BLOCKLIST, custom];
    expect(isBlocked(name("Mina"), lists)).toBe(true);
    expect(isBlocked(name("Asha"), lists)).toBe(false);
  });
});

describe("filtered generation wrapper", () => {
  it("is opt-in and leaves generateName unchanged", async () => {
    const { generateNameFiltered } = await import("../templates.js");
    const { generateName: plain } = await import("../templates.js");
    const ctx = createContext({ seed: "filter-optin" });
    const leg = plain(culture, "given", ctx.child("plain"));
    expect(leg.form).toBe("Nice");
    expect(() =>
      generateNameFiltered(culture, "given", ctx.child("filtered"), {
        blocklists: [createBlocklist({ id: "test.block", terms: ["Nice"], mode: "whole-token" })],
        maxAttempts: 1,
      }),
    ).toThrow(/Constraint exhausted/);
  });

  it("retries filtered names via attempt:<i> child keys", () => {
    const scopes: string[] = [];
    const g = {
      id: "test.gen",
      generate(ctx: ReturnType<typeof createContext>) {
        scopes.push(ctx.scope.join("/"));
        return name("bad");
      },
    };
    const f = blocklist(
      g,
      [createBlocklist({ id: "test.bad", terms: ["bad"], mode: "whole-token" })],
      { id: "test.filtered", maxAttempts: 3 },
    );
    expect(() => f.generate(createContext({ seed: "k" }).child("root"))).toThrow();
    expect(scopes).toEqual(["root/attempt:0", "root/attempt:1", "root/attempt:2"]);
  });
});
