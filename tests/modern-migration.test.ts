// Byte-for-byte replay guard for the F2 modern.pack.json migration.
// This fixture was captured from the pre-migration TypeScript data before
// any source was moved; it must never be regenerated to make a change pass.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createContext, repeat } from "@lexiconlang/core";
import { describe, expect, it } from "vitest";
import { generators, modern, person } from "../packages/modern/src/index.js";
import { data, provenance } from "../packages/modern/src/data.js";

const baseline = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "modern-baseline.json"), "utf8"),
) as Record<string, unknown>;

describe("modern.pack.json migration parity", () => {
  it("loads all authored data from the JSON bundle with provenance", () => {
    expect(data.formatVersion).toBe(1);
    expect(data.id).toBe("lexiconlang.modern");
    expect(data.givenMale.length).toBeGreaterThan(30);
    expect(data.grammars.city.rules.start).toHaveProperty("#prefix##suffix#");
    expect(provenance[0]?.license).toBe("CC0-1.0");
  });

  it("exports the unchanged generator ID inventory", () => {
    expect(Object.keys(generators)).toEqual([
      "personName", "surname", "givenMaleName", "givenFemaleName", "sex",
      "cityName", "streetName", "companyName", "domainName", "phoneNumber",
      "address", "person", "occupation", "bandName", "songTitle", "bookTitle",
    ]);
  });

  for (const seed of Object.keys(baseline)) {
    it(`replays all modern generators byte-identically for seed ${JSON.stringify(seed)}`, () => {
      const ctx = createContext({ seed });
      const direct: Record<string, unknown> = {};
      for (const [name, gen] of Object.entries(generators)) {
        direct[name] = repeat(gen, 5).generate(ctx.child(`direct:${name}`));
      }
      direct["person"] = repeat(person, 5).generate(ctx.child("direct:person"));
      const api = modern.withSeed(seed);
      const apiOut: Record<string, unknown> = {
        person: [api.person, api.person, api.person],
        name: [api.name(), api.name(), api.name()],
        city: [api.city(), api.city()],
        street: [api.street(), api.street()],
        address: [api.address(), api.address()],
        company: [api.company(), api.company()],
        domain: [api.domain(), api.domain()],
        phone: [api.phone(), api.phone()],
        band: [api.band(), api.band()],
        song: [api.song(), api.song()],
        book: [api.book(), api.book()],
      };
      expect({ direct, api: apiOut }).toEqual((baseline[seed] as { direct: unknown; api: unknown }));
    });
  }
});
