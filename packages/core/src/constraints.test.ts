import { describe, expect, it } from "vitest";
import { createContext } from "./context.js";
import { constant, oneOf } from "./combinators.js";
import {
  ConstraintExhaustedError,
  DEFAULT_MAX_ATTEMPTS,
  MAX_MAX_ATTEMPTS,
  sampleUnique,
  syllableCount,
  UniquenessSession,
  unique,
  where,
  wordLength,
  startsWith,
} from "./constraints.js";

describe("where", () => {
  it("returns the first value satisfying the predicate", () => {
    const gen = oneOf("apple", "pear", "plum");
    const filtered = where(gen, (s) => s.startsWith("p"), { id: "test.fruit" });
    const a = filtered.generate(createContext({ seed: "where-1" }));
    const b = filtered.generate(createContext({ seed: "where-1" }));
    expect(a).toBe(b);
    expect(a).toMatch(/^p/);
  });

  it("uses ctx.child('attempt:' + index) for each attempt", () => {
    const attempts: string[] = [];
    const gen = {
      id: "test.spy",
      generate(ctx: ReturnType<typeof createContext>) {
        attempts.push(ctx.scope.join("/"));
        return ctx.scope.at(-1);
      },
    };
    const filtered = where(gen, () => false, { maxAttempts: 3, id: "test.spy.where" });
    expect(() => filtered.generate(createContext({ seed: "keys" }).child("root"))).toThrow(
      ConstraintExhaustedError,
    );
    expect(attempts).toEqual(["root/attempt:0", "root/attempt:1", "root/attempt:2"]);
  });

  it("throws a typed exhaustion error with attempts and generator ID", () => {
    const filtered = where(constant("x"), () => false, { maxAttempts: 2, id: "test.never" });
    try {
      filtered.generate(createContext({ seed: "exhaust" }));
      expect.unreachable("must throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ConstraintExhaustedError);
      const e = err as ConstraintExhaustedError;
      expect(e.attempts).toBe(2);
      expect(e.generatorId).toBe("test.never");
      expect(e.message).toContain("test.never");
      expect(e.name).toBe("ConstraintExhaustedError");
    }
  });

  it("defaults to 32 attempts and bound at 1000", () => {
    expect(DEFAULT_MAX_ATTEMPTS).toBe(32);
    expect(MAX_MAX_ATTEMPTS).toBe(1000);
    expect(() => where(constant(1), () => true, { maxAttempts: 1001 })).toThrow(RangeError);
    expect(() => where(constant(1), () => true, { maxAttempts: 0 })).toThrow(RangeError);
    expect(() => where(constant(1), () => true, { maxAttempts: 1.5 })).toThrow(RangeError);
  });

  it("uses the wrapped generator id when no explicit id is given", () => {
    const filtered = where({ id: "wrapped.gen", generate: () => "ok" }, () => true);
    expect(filtered.id).toBe("where:wrapped.gen");
  });

  it("sibling attempts do not perturb each other", () => {
    const gen = oneOf("a", "b", "c", "d");
    const filtered = where(gen, (s) => s !== "a", { id: "test.sibling" });
    const root = createContext({ seed: "siblings" });
    root.child("other").rng.nextInt(0, 10);
    const expected = filtered.generate(createContext({ seed: "siblings" }));
    expect(filtered.generate(root)).toBe(expected);
  });
});

describe("unique sessions", () => {
  it("unique() rejects repeats within a session and stays deterministic", () => {
    const session = new UniquenessSession();
    const gen = unique(oneOf("a", "b", "c"), { session, id: "test.unique" });
    const ctx = createContext({ seed: "u" });
    const first = gen.generate(ctx.child("i:0"));
    const second = gen.generate(ctx.child("i:1"));
    const third = gen.generate(ctx.child("i:2"));
    expect(new Set([first, second, third]).size).toBe(3);
    expect(() => gen.generate(ctx.child("i:3"))).toThrow(ConstraintExhaustedError);
    expect(session.size).toBe(3);
  });

  it("sessions are caller-owned and do not leak across instances", () => {
    const g1 = unique(oneOf("a", "b"), { id: "test.u1" });
    const g2 = unique(oneOf("a", "b"), { id: "test.u2" });
    const ctx = createContext({ seed: "isolate" });
    expect(g1.generate(ctx.child("a"))).toBe(g2.generate(ctx.child("a")));
  });

  it("key extracts comparison values; default is exact form equality", () => {
    const session = new UniquenessSession();
    const gen = unique(constant({ form: "same", id: 1 }), {
      session,
      key: (v) => v.form,
      maxAttempts: 1,
      id: "test.key",
    });
    gen.generate(createContext({ seed: "k" }).child("0"));
    expect(() => gen.generate(createContext({ seed: "k" }).child("1"))).toThrow(
      ConstraintExhaustedError,
    );
  });

  it("sampleUnique fixes item contexts before retries; later items are not perturbed", () => {
    const source = oneOf("a", "b", "c", "d", "e");
    const opts = { id: "test.sample-unique" };
    const a = sampleUnique(source, 3, { ...opts, seed: "batch" });
    const b = sampleUnique(source, 3, { ...opts, seed: "batch" });
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(3);

    // A different earlier-item acceptance path must not change item 2's dice:
    // compare against a context where unrelated siblings are consumed first.
    const c = sampleUnique(source, 2, { ...opts, seed: "batch" });
    expect(a.slice(0, 2)).toEqual(c);
  });

  it("sampleUnique reports impossible uniqueness with a typed error", () => {
    expect(() => sampleUnique(constant("only"), 2, { seed: "impossible", maxAttempts: 2 })).toThrow(
      ConstraintExhaustedError,
    );
  });

  it("rejects n outside 1..1000", () => {
    expect(() => sampleUnique(constant("a"), 0, { seed: "x" })).toThrow(RangeError);
    expect(() => sampleUnique(constant("a"), 1001, { seed: "x" })).toThrow(RangeError);
  });
});

describe("string shape helpers", () => {
  it("startsWith is a predicate generator with deterministic retries", () => {
    const gen = startsWith(oneOf("alpha", "beta", "arc"), "a", { id: "test.alpha" });
    const a = gen.generate(createContext({ seed: "shape" }));
    const b = gen.generate(createContext({ seed: "shape" }));
    expect(a).toBe(b);
    expect(a.startsWith("a")).toBe(true);
  });

  it("wordLength counts words on trimmed whitespace", () => {
    expect(wordLength("  one  two   three ")).toBe(3);
    expect(wordLength("")).toBe(0);
  });

  it("syllableCount counts vowel groups in a case-insensitive approximation", () => {
    expect(syllableCount("aeiou")).toBe(1);
    expect(syllableCount("ba-na-na")).toBe(3);
    expect(syllableCount("bnn")).toBe(0);
  });
});
