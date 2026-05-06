import { describe, expect, it } from "vitest";
import { createRng, Sfc32 } from "./rng.js";

describe("Sfc32", () => {
  it("is deterministic from a string seed", () => {
    const a = createRng("hello");
    const b = createRng("hello");
    for (let i = 0; i < 100; i++) {
      expect(a.nextU32()).toBe(b.nextU32());
    }
  });

  it("differs across distinct seeds", () => {
    const a = createRng("hello").nextU32();
    const b = createRng("world").nextU32();
    expect(a).not.toBe(b);
  });

  it("fork(label) is deterministic", () => {
    const a = createRng("seed").fork("region:1");
    const b = createRng("seed").fork("region:1");
    for (let i = 0; i < 50; i++) expect(a.nextU32()).toBe(b.nextU32());
  });

  it("fork() does not consume parent stream — sibling order independence", () => {
    // This is the critical property: forking 'a' then 'b' must yield the same
    // child streams regardless of order, and regardless of intervening parent calls.
    const parent1 = createRng("seed");
    const childA1 = parent1.fork("a");
    const childB1 = parent1.fork("b");

    const parent2 = createRng("seed");
    const childB2 = parent2.fork("b");
    parent2.nextU32(); // sibling call should not affect anything
    parent2.nextU32();
    const childA2 = parent2.fork("a");

    expect(childA1.nextU32()).toBe(childA2.nextU32());
    expect(childB1.nextU32()).toBe(childB2.nextU32());
  });

  it("state() round-trips", () => {
    const a = createRng("roundtrip");
    for (let i = 0; i < 17; i++) a.nextU32();
    const snap = a.state();
    const b = new Sfc32(snap);
    for (let i = 0; i < 50; i++) {
      expect(a.nextU32()).toBe(b.nextU32());
    }
  });

  it("next() stays in [0, 1)", () => {
    const r = createRng("range");
    for (let i = 0; i < 1000; i++) {
      const x = r.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it("nextInt produces values in [min, max)", () => {
    const r = createRng("intRange");
    for (let i = 0; i < 1000; i++) {
      const x = r.nextInt(5, 10);
      expect(x).toBeGreaterThanOrEqual(5);
      expect(x).toBeLessThan(10);
    }
  });
});
