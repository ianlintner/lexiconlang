import { describe, expect, it } from "vitest";
import { createWorld, definePack, validatePack } from "@lexiconlang/packs";
import espionage, { data, IDS, pack, type EspionageGeneratorId } from "./index.js";

const surface = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const v = value as { text?: unknown; form?: unknown };
    if (typeof v.text === "string") return v.text;
    if (typeof v.form === "string") return v.form;
  }
  return JSON.stringify(value);
};

const GENERATOR_IDS = Object.entries(IDS).filter(([k]) => k !== "pack").map(([, v]) => v) as EspionageGeneratorId[];
const TABLE_BACKED = new Set<string>([IDS.rankLadder, IDS.fieldComplication, IDS.assetReliability]);

describe("espionage pack data", () => {
  it("validates against the declarative pack v1 schema", () => {
    expect(validatePack(data)).toEqual([]);
  });

  it("meets the genre pack quality bar", () => {
    expect(data.id).toBe("lexiconlang.espionage");
    expect(data.version).toBe("0.1.0");
    expect(data.cultures.length).toBeGreaterThanOrEqual(2);
    expect(data.generators.length).toBeGreaterThanOrEqual(6);
    expect(data.generators.map((g) => g.id).sort()).toEqual([...GENERATOR_IDS].sort());
    expect(data.license).toBe("CC0-1.0");
    expect(data.provenance[0]?.attribution).toMatch(/original/i);
  });

  it("covers the card scope with a person, place and faction generator", () => {
    const tags = new Set(data.generators.flatMap((g) => g.tags ?? []));
    for (const t of ["person", "place", "faction", "codename", "callsign", "safehouse", "dead-drop", "cover", "briefing", "rank", "motto"]) {
      expect(tags.has(t), t).toBe(true);
    }
  });
});

describe("determinism", () => {
  it("same seed and key give identical output for every generator", () => {
    const a = espionage.withSeed("det");
    const b = espionage.withSeed("det");
    for (const id of GENERATOR_IDS) {
      expect(a.generate(id, "k")).toEqual(b.generate(id, "k"));
    }
  });

  it("keys are sibling-order independent", () => {
    const a = espionage.withSeed("sib");
    const first = a.operationCodename("target");
    const b = espionage.withSeed("sib");
    b.callsign("x");
    b.safehouse("y");
    expect(b.operationCodename("target")).toBe(first);
  });

  it("different seeds diverge", () => {
    const outs = new Set(["a", "b", "c", "d", "e"].map((s) => espionage.withSeed(s).operationCodename()));
    expect(outs.size).toBeGreaterThan(1);
  });

  it("facade matches createWorld().use(pack) byte for byte", () => {
    const world = createWorld({ seed: "parity" }).use(definePack(data));
    const api = espionage.withSeed("parity");
    for (const id of GENERATOR_IDS) {
      expect(surface(api.generate(id, "p"))).toBe(surface(world.generate(id, "espionage:p")));
    }
  });
});

describe("distinctness", () => {
  for (const id of GENERATOR_IDS.filter((g) => !TABLE_BACKED.has(g))) {
    it(`${id.split("/").pop()}: 100 rolls yield >= 60% distinct results`, () => {
      const api = espionage.withSeed(`distinct-${id}`);
      const seen = new Set<string>();
      for (let i = 0; i < 100; i++) seen.add(surface(api.generate(id, `roll:${i}`)));
      expect(seen.size / 100).toBeGreaterThanOrEqual(0.6);
    });
  }

  it("oracle tables cover most of their authored entries", () => {
    for (const id of TABLE_BACKED) {
      const tableId = id.replace("/generator/", "/table/");
      const table = data.tables.find((t) => t.id === tableId)!;
      const api = espionage.withSeed(`oracle-${id}`);
      const seen = new Set<string>();
      for (let i = 0; i < 200; i++) seen.add(surface(api.generate(id, `roll:${i}`)));
      expect(seen.size).toBeGreaterThanOrEqual(Math.ceil(table.entries.length * 0.6));
    }
  });
});

describe("content", () => {
  it("meridian names carry non-trivial translations", () => {
    const api = espionage.withSeed("meridian");
    for (let i = 0; i < 20; i++) {
      for (const n of [api.meridianAgent(`a${i}`), api.meridianPlace(`p${i}`), api.meridianFaction(`f${i}`)]) {
        expect(n.form.length).toBeGreaterThan(2);
        expect(n.translation.length).toBeGreaterThan(2);
        expect(n.translation).not.toBe(n.form);
      }
    }
  });

  it("codenames are two words after the optional operation prefix", () => {
    const api = espionage.withSeed("codename");
    for (let i = 0; i < 100; i++) {
      const name = api.operationCodename(`c${i}`).replace(/^Operation /, "");
      expect(name.split(" ")).toHaveLength(2);
    }
  });

  it("emits no doubled spaces, doubled words or stray tokens", () => {
    const api = espionage.withSeed("artifacts");
    for (let i = 0; i < 100; i++) {
      for (const id of GENERATOR_IDS) {
        const text = surface(api.generate(id, `a${i}`));
        expect(text, id).not.toMatch(/ {2}|#|\b(\w+) \1\b/i);
        expect(text.trim(), id).toBe(text);
      }
    }
  });

  it("asset reliability covers all six d6 faces", () => {
    const api = espionage.withSeed("d6");
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(api.assetReliability(`r${i}`));
    expect(seen.size).toBe(6);
  });

  it("is installable alongside other packs under its own id", () => {
    expect(pack.manifest.id).toBe("lexiconlang.espionage");
  });
});
