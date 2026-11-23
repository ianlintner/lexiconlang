import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_BLOCKLIST, isBlocked } from "@lexiconlang/language";
import { loadPack, validatePack, createWorld } from "@lexiconlang/packs";
import { GENERATOR_IDS, cyberpunk, manifest, pack, type GeneratorKey } from "./index.js";

const dataPath = new URL("../data/cyberpunk.pack.json", import.meta.url);
const KEYS = Object.keys(GENERATOR_IDS) as GeneratorKey[];

/** Comparable text for any generator output (name object, string or table roll). */
function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  const v = value as { form?: string; text?: string };
  return v.text ?? v.form ?? "";
}

// Fixed seed vectors: seed "vector-seed", keys alpha/bravo/charlie. Authored for new IDs only.
const VECTORS: Record<GeneratorKey, string[]> = {
  "personCorp": [
    "Sabine Sinclair",
    "Mireille Castellan",
    "Ulric Drummond"
  ],
  "personStreet": [
    "Blaze \"Soot\" Kang",
    "Pike \"Grit\" Tanaka-Wu",
    "Roxy \"Mold\" Duarte"
  ],
  "megacorp": [
    "Ostrel Group",
    "Eidolon Aerospace",
    "Tessaract Ventures"
  ],
  "gang": [
    "Hollow Kings",
    "Velvet Knives",
    "Black Wolves"
  ],
  "handle": [
    "Skrapjaw",
    "Wirefang",
    "Bitmoth"
  ],
  "district": [
    "Brine Yards",
    "Rustbelt Warren",
    "Brine Underpass"
  ],
  "arcology": [
    "Copperline Commons",
    "Ember Row Spire",
    "Quicksilver Plaza"
  ],
  "ai": [
    "PalimpsestCore",
    "MoiraiMind",
    "Cantor-Prime"
  ],
  "product": [
    "Prism Nano",
    "Apex X",
    "Apex Series 7"
  ],
  "drugName": [
    "Cold Shine",
    "Velvet Mist",
    "Slow Honey"
  ],
  "faction": [
    "Harbor Row Key Council",
    "The Circuit Cooperative",
    "Gate and Salt Order"
  ],
  "cyberware": [
    "Redfin Reflex Rig Gen 2 | Auto-balance in zero-grip falls, with an audible whirr | Street (100 to 1,000 cred)",
    "Vanta Weave Mk II | Subdermal armor against knives, with glitches during storms | Mid-market (1,000 to 10,000 cred)",
    "Ikon Halo Rig v3.1 | Language and dialect translation overlay, with a habit of leaking fluid | Mid-market (1,000 to 10,000 cred)"
  ],
  "streetDrug": [
    "Hush Smoke | Dull ache muffled away for half a night, then a craving that gnaws | Safe enough from a clean source, rare as a result",
    "Hush Tabs | Vivid waking dreams for most of a day, then shaking hands and a foul mood | Habit-forming after a few uses",
    "Thorn Bloom | Dull ache muffled away for a few hours, then a craving that gnaws | Rumored to carry a tracking dye"
  ],
  "fixerJob": [
    "Rescue a stranger from a customs warehouse for a nervous junior exec, tonight, no extensions. Complication: half the crew wakes up with their implants locked. Pay is decent and half up front.",
    "Steal a sealed case of prototype implants from a laundromat that fronts for a gang on behalf of a data broker with a grudge, before the shift change. Complication: a second crew wants the same prize. Pay is a clean ID and a clear conscience.",
    "Hire out your crew as muscle at a half-built tower for an arcology residents' committee, before the shift change. Complication: the client's name is on a corp blacklist. Pay is poor but the favor is worth more."
  ],
  "streetEncounter": [
    "A neon sign sputters out. A gang scout dragging a sealed crate through the rain.",
    "A street medic offering a rumor for a drink; They are bait for something worse.",
    "A gang scout selling forged ration cards. They know a way into a sealed block."
  ]
};

describe("cyberpunk pack data", () => {
  it("validates against the pack-v1 schema with no diagnostics", () => {
    expect(validatePack(JSON.parse(readFileSync(dataPath, "utf8")))).toEqual([]);
  });

  it("declares id, version, license and provenance", () => {
    expect(manifest.id).toBe("lexiconlang.cyberpunk");
    expect(manifest.version).toBe("0.1.0");
    expect(manifest.license).toBe("CC0-1.0");
    expect(manifest.provenance.length).toBeGreaterThan(0);
  });

  it("has two cultures, 6+ content generators, no duplicate IDs", () => {
    expect(manifest.cultures.length).toBeGreaterThanOrEqual(2);
    expect(manifest.generators.length).toBeGreaterThanOrEqual(6);
    const ids = [...manifest.cultures, ...manifest.grammars, ...manifest.tables, ...manifest.generators].map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(manifest.generators.map((g) => g.id).sort()).toEqual(Object.values(GENERATOR_IDS).sort());
  });

  it("has 20+ authored alternatives per primary name pool", () => {
    for (const culture of manifest.cultures) {
      for (const [kind, pool] of Object.entries(culture.templates ?? {})) {
        expect(pool.length, `${culture.id} ${kind}`).toBeGreaterThanOrEqual(15);
      }
    }
    const pools = manifest.cultures.flatMap((c) => Object.values(c.templates ?? {}));
    expect(pools.filter((p) => p.length >= 20).length).toBeGreaterThanOrEqual(pools.length - 3);
  });

  it("round-trips through loadPack with a stable hash (portable data)", async () => {
    const loaded = await loadPack(readFileSync(dataPath, "utf8"));
    expect(loaded.hash).toBe(pack.hash);
  });

  it("generates identical output from the raw JSON file and the typed facade", async () => {
    const loaded = await loadPack(readFileSync(dataPath, "utf8"));
    const raw = createWorld({ seed: "vector-seed" }).use(loaded);
    const typed = cyberpunk.createWorld("vector-seed");
    for (const id of Object.values(GENERATOR_IDS)) {
      expect(raw.generate(id, "alpha")).toEqual(typed.generate(id, "alpha"));
    }
  });
});

describe("cyberpunk determinism", () => {
  it("same seed gives the same output; different seed differs", () => {
    const a = cyberpunk.withSeed("neon-1");
    const b = cyberpunk.withSeed("neon-1");
    const c = cyberpunk.withSeed("neon-2");
    expect(a.handle()).toEqual(b.handle());
    expect(a.faction.megacorp()).toEqual(b.faction.megacorp());
    expect(a.cyberware()).toEqual(b.cyberware());
    expect(a.fixerJob()).toEqual(b.fixerJob());
    expect(a.person.street()).toEqual(b.person.street());
    const runA = Array.from({ length: 10 }, () => a.drug().name);
    const runC = Array.from({ length: 10 }, () => c.drug().name);
    expect(runA).not.toEqual(runC);
  });

  it("sibling-order independent: a key's output ignores other keys generated first", () => {
    const first = cyberpunk.createWorld("order");
    const second = cyberpunk.createWorld("order");
    second.generate(GENERATOR_IDS.handle, "other");
    second.generate(GENERATOR_IDS.cyberware, "other");
    for (const id of Object.values(GENERATOR_IDS)) {
      expect(second.generate(id, "k")).toEqual(first.generate(id, "k"));
    }
  });

  it.each(KEYS)("fixed seed vectors: %s", (key) => {
    const w = cyberpunk.createWorld("vector-seed");
    const got = ["alpha", "bravo", "charlie"].map((k) => textOf(w.generate(GENERATOR_IDS[key], k)));
    expect(got).toEqual(VECTORS[key]);
  });
});

describe("cyberpunk quality", () => {
  it.each(KEYS)("100 rolls on one seed family are >= 60%% distinct: %s", (key) => {
    const w = cyberpunk.createWorld("distinct-family");
    const seen = new Set(Array.from({ length: 100 }, (_, i) => textOf(w.generate(GENERATOR_IDS[key], `roll-${i}`))));
    expect(seen.size).toBeGreaterThanOrEqual(60);
  });

  it.each(KEYS)("1000-key sample is non-empty, clean and low-duplicate: %s", (key) => {
    const w = cyberpunk.createWorld("quality-sample");
    const outputs = Array.from({ length: 1000 }, (_, i) => textOf(w.generate(GENERATOR_IDS[key], `q-${i}`)));
    for (const text of outputs) {
      expect(text.trim().length).toBeGreaterThan(2);
      expect(text).not.toMatch(/undefined|\[object|NaN|#|\{|\}|\s{2,}/);
      expect(isBlocked(text, [DEFAULT_BLOCKLIST])).toBe(false);
    }
    const duplicateRate = 1 - new Set(outputs).size / outputs.length;
    // Duplicate rate is quantified, not zeroed: 1000 draws from a ~500-combination space collide by the birthday bound (~0.55-0.65).
    expect(duplicateRate).toBeLessThan(0.75);
  });

  it("culture names carry real translations distinct from the form", () => {
    const api = cyberpunk.withSeed("translations");
    for (let i = 0; i < 25; i++) {
      for (const n of [api.faction.megacorp(), api.faction.gang(), api.handle(), api.ai(), api.person.corp()]) {
        expect(n.translation.length).toBeGreaterThan(0);
        expect(n.language).toMatch(/^lexiconlang\.cyberpunk\/culture\/(corp-speak|street-slang)$/);
      }
    }
    const names = Array.from({ length: 30 }, () => api.faction.megacorp());
    expect(names.filter((n) => n.form !== n.translation).length).toBeGreaterThan(25);
  });

  it("typed table helpers return structured fields", () => {
    const api = cyberpunk.withSeed("tables");
    const ware = api.cyberware();
    expect(ware.slot).toMatch(/^[a-z]+$/);
    expect(ware.tier).toMatch(/cred/);
    const drug = api.drug();
    expect(drug.name && drug.effect && drug.risk).toBeTruthy();
    const job = api.fixerJob();
    expect(job.entry).toMatch(/^job-\d{2}$/);
    expect(job.total).toBeGreaterThanOrEqual(1);
    expect(job.total).toBeLessThanOrEqual(20);
  });
});
