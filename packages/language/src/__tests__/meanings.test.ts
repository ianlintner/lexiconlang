import { describe, it, expect } from "vitest";
import { coreMeanings } from "../meanings.js";

describe("Core Meanings", () => {
  it("has ~150 meanings", () => {
    expect(coreMeanings.meanings.length).toBeGreaterThanOrEqual(140);
    expect(coreMeanings.meanings.length).toBeLessThanOrEqual(160);
  });

  it("has unique IDs", () => {
    const ids = coreMeanings.meanings.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all meanings have a class and tags", () => {
    for (const m of coreMeanings.meanings) {
      expect(m.class).toMatch(/noun|adjective|verb|particle/);
      expect(Array.isArray(m.tags)).toBe(true);
    }
  });
});
