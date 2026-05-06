import { describe, expect, it } from "vitest";
import { createContext } from "./context.js";
import { compose, intRange, oneOf, repeat, weightedList } from "./combinators.js";

describe("combinators", () => {
  it("oneOf is deterministic", () => {
    const g = oneOf("a", "b", "c", "d");
    const ctx1 = createContext({ seed: "k" });
    const ctx2 = createContext({ seed: "k" });
    expect(g.generate(ctx1)).toBe(g.generate(ctx2));
  });

  it("weightedList honors weights (statistical)", () => {
    const g = weightedList({ a: 1, b: 9 });
    const ctx = createContext({ seed: "stats" });
    let aCount = 0;
    const N = 5000;
    for (let i = 0; i < N; i++) {
      if (g.generate(ctx.child(`i:${i}`)) === "a") aCount++;
    }
    // Expect ~10% a's. Loose bound.
    expect(aCount / N).toBeGreaterThan(0.06);
    expect(aCount / N).toBeLessThan(0.16);
  });

  it("compose: same seed → same output", () => {
    const npc = compose<{ name: string; age: number }>({
      id: "test.npc",
      parts: {
        name: oneOf("Alice", "Bob", "Carol"),
        age: intRange(20, 60),
      },
    });
    const a = npc.generate(createContext({ seed: "world-1" }));
    const b = npc.generate(createContext({ seed: "world-1" }));
    expect(a).toEqual(b);
  });

  it("compose: field reorder does not change per-field output", () => {
    const orderA = compose<{ name: string; age: number }>({
      id: "t1",
      parts: { name: oneOf("X", "Y", "Z"), age: intRange(1, 100) },
    });
    const orderB = compose<{ age: number; name: string }>({
      id: "t1",
      parts: { age: intRange(1, 100), name: oneOf("X", "Y", "Z") },
    });
    const ctx = createContext({ seed: "reorder" });
    const a = orderA.generate(ctx);
    const b = orderB.generate(ctx);
    expect(a.name).toBe(b.name);
    expect(a.age).toBe(b.age);
  });

  it("repeat: same seed → same array", () => {
    const g = repeat(oneOf("a", "b", "c"), 5);
    const a = g.generate(createContext({ seed: "rep" }));
    const b = g.generate(createContext({ seed: "rep" }));
    expect(a).toEqual(b);
    expect(a).toHaveLength(5);
  });

  it("repeat with range: same seed → same array (varies length deterministically)", () => {
    const g = repeat(oneOf("a", "b"), { min: 3, max: 7 });
    const a = g.generate(createContext({ seed: "rep-range" }));
    const b = g.generate(createContext({ seed: "rep-range" }));
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThanOrEqual(3);
    expect(a.length).toBeLessThanOrEqual(7);
  });

  it("hierarchical context: same path → same output regardless of parent traversal order", () => {
    const g = oneOf("a", "b", "c", "d", "e");
    const root1 = createContext({ seed: "world" });
    const root2 = createContext({ seed: "world" });

    const path1 = g.generate(root1.child("region:1").child("settlement:5").child("npc:7"));

    // Walk a different sibling first; should not affect target.
    root2.child("region:99").child("settlement:0");
    const path2 = g.generate(root2.child("region:1").child("settlement:5").child("npc:7"));

    expect(path1).toBe(path2);
  });
});
