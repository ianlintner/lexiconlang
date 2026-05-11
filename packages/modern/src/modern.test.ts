import { describe, expect, it } from "vitest";
import { createContext } from "@lexiconlang/core";
import { modern, person, address } from "./index.js";

describe("modern pack", () => {
  it("withSeed is deterministic for matching call sequences", () => {
    const a = modern.withSeed("city-x");
    const b = modern.withSeed("city-x");
    expect(a.name()).toEqual(b.name());
    expect(a.city()).toBe(b.city());
  });

  it("person has all fields", () => {
    const p = person.generate(createContext({ seed: "p" }));
    expect(p.name.full).toBeTypeOf("string");
    expect(p.email).toMatch(/^.+@.+\..+$/);
    expect(p.phone).toMatch(/^\(\d{3}\) \d{3}-\d{4}$/);
    expect(p.address.zip).toMatch(/^\d{5}$/);
    expect(p.age).toBeGreaterThanOrEqual(18);
  });

  it("address is plausibly shaped", () => {
    const a = address.generate(createContext({ seed: "a" }));
    expect(a.number).toBeGreaterThan(0);
    expect(a.street).toBeTypeOf("string");
    expect(a.city).toBeTypeOf("string");
  });

  it("exports >= 15 generators", () => {
    expect(Object.keys(modern.generators).length).toBeGreaterThanOrEqual(15);
  });
});
