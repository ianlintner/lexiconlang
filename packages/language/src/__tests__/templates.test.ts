import { describe, it, expect } from "vitest";
import { createContext } from "@content-gen/core";
import type { Culture } from "../types.js";
import { generateName } from "../templates.js";
import { coreMeanings } from "../meanings.js";
import { archetypes } from "../archetypes.js";

describe("generateName", () => {
  const testCulture: Culture = {
    id: "test.dwarvish",
    glyphs: {
      ...archetypes.guttural,
      joiner: "",
    },
    meaningPacks: [coreMeanings],
    templates: {
      given: [
        [
          {
            kind: "compose",
            parts: [
              { pick: "adjective", tag: "strength", capitalize: true },
              { pick: "noun", tag: "industry" },
            ],
            sep: "",
          },
          1,
        ],
      ],
      surname: [
        [
          {
            kind: "compose",
            parts: [{ pick: "noun", tag: "earth" }, { pick: "noun", tag: "nature" }],
            sep: "",
          },
          1,
        ],
      ],
    },
  };

  it("generates a name with form and translation", () => {
    const ctx = createContext({ seed: "test-1" });
    const name = generateName(testCulture, "given", ctx);
    expect(name.form).toBeTruthy();
    expect(name.translation).toBeTruthy();
    expect(name.language).toBe("test.dwarvish");
    expect(typeof name.toString()).toBe("string");
  });

  it("toString() returns the form", () => {
    const ctx = createContext({ seed: "test-1" });
    const name = generateName(testCulture, "given", ctx);
    expect(String(name)).toBe(name.form);
  });

  it("is deterministic", () => {
    const ctx1 = createContext({ seed: "test-1" });
    const name1 = generateName(testCulture, "given", ctx1);

    const ctx2 = createContext({ seed: "test-1" });
    const name2 = generateName(testCulture, "given", ctx2);

    expect(name1.form).toBe(name2.form);
    expect(name1.translation).toBe(name2.translation);
  });

  it("composes multiple meanings", () => {
    const ctx = createContext({ seed: "test-1" });
    const name = generateName(testCulture, "surname", ctx);
    // Should have at least 2 morphemes (2 nouns)
    expect(name.parts?.length || 0).toBeGreaterThanOrEqual(2);
  });

  it("respects capitalization", () => {
    const ctx = createContext({ seed: "test-1" });
    const name = generateName(testCulture, "given", ctx);
    // First character should be uppercase (from capitalize: true on adjective)
    expect(name.form[0]!.toUpperCase()).toBe(name.form[0]);
  });
});
