import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { validatePack } from "@lexiconlang/packs";
import { PACK_ID, createWeirdWestWorld, generatorIds, weirdWest, weirdWestPack } from "./index.js";

const STRING_KEYS = ["town", "outlaw", "gang", "saloon", "mine", "ranch", "brand"] as const;
const ROLL_KEYS = ["wantedPoster", "bounty", "encounter", "relic", "rumor", "anomaly"] as const;
const FAMILIES = [...STRING_KEYS, ...ROLL_KEYS] as const;
type Family = (typeof FAMILIES)[number];
// bounty is a deliberately small 2d6 table (9 outcomes); exempt from the distinctness bar.
const DISTINCT_FAMILIES = FAMILIES.filter((f) => f !== "bounty");

function sample(seed: string, family: Family, n: number): string[] {
  const api = weirdWest.withSeed(seed);
  return Array.from({ length: n }, () => (api as unknown as Record<Family, () => string>)[family]());
}

describe("weird-west pack JSON", () => {
  const raw = JSON.parse(readFileSync(fileURLToPath(new URL("../data/weird-west.pack.json", import.meta.url)), "utf8"));

  it("validates against the F2 schema with no diagnostics", () => {
    expect(validatePack(raw)).toEqual([]);
    expect(raw.id).toBe("lexiconlang.weird-west");
    expect(raw.version).toBe("0.1.0");
    expect(raw.depends).toEqual([]);
  });

  it("has unique ids, non-empty pools and >= 20 alternatives per primary family", () => {
    const ids = [...raw.cultures, ...raw.grammars, ...raw.tables, ...raw.generators].map((r: { id: string }) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const gr of raw.grammars) {
      for (const rule of gr.rules) {
        expect(rule.choices.length).toBeGreaterThan(0);
        for (const c of rule.choices) expect(c.value.trim().length).toBeGreaterThan(0);
      }
      const total = gr.rules.reduce((n: number, r: { choices: unknown[] }) => n + r.choices.length, 0);
      expect(total).toBeGreaterThanOrEqual(20);
    }
    for (const t of raw.tables) expect(t.entries.length).toBeGreaterThan(0);
    for (const slug of ["crime", "entity", "behavior", "omen", "relic-power", "relic-cost", "rumor-hook", "rumor-source", "anomaly-phenomenon", "anomaly-place", "anomaly-effect"]) {
      expect(raw.tables.find((t: { id: string }) => t.id.endsWith(`/table/${slug}`)).entries.length).toBeGreaterThanOrEqual(20);
    }
    expect(raw.cultures.length).toBeGreaterThanOrEqual(2);
    expect(raw.generators.length).toBeGreaterThanOrEqual(6);
  });

  it("has no unresolved references (a world installs the pack)", () => {
    expect(() => createWeirdWestWorld("refs")).not.toThrow();
    expect(weirdWestPack.manifest.id).toBe(PACK_ID);
  });
});

describe("weird-west facade", () => {
  it("is deterministic: same seed, same call sequence, same output", () => {
    const run = (seed: string) => {
      const w = weirdWest.withSeed(seed);
      return [w.town(), w.outlaw(), w.gang(), w.saloon(), w.mine(), w.ranch(), w.brand(), w.wantedPoster(), w.encounter(), w.relic(), w.rumor(), w.anomaly(), w.name("dustborn", "given"), w.name("saltmarch", "town")];
    };
    expect(run("same")).toEqual(run("same"));
    expect(run("same")).not.toEqual(run("other"));
  });

  it("matches fixed seed vectors", () => {
    const a = weirdWest.withSeed("alpha");
    expect(a.town()).toBe("Coyote Spring");
    expect(a.outlaw()).toBe('Zeb "Bone Dice" Pike');
    expect(a.gang()).toBe("Voss's Posse");
    expect(a.saloon()).toBe("The Last Bell");
    expect(a.mine()).toBe("The Copper Strike");
    expect(a.ranch()).toBe("The Wickham Homestead");
    expect(a.brand()).toBe("Crescent Moon chained to Quarter Moon");
    expect(a.wantedPoster()).toMatch(/^WANTED · .* · for .* · Known by .* · Last seen near .*, .* · REWARD: \$/);
    const b = weirdWest.withSeed("beta");
    expect(b.town()).toBe("Last Flats");
    expect(b.outlaw()).toBe('"Three-Finger" Ashby');
    expect(b.gang()).toBe("The Lantern Scarecrows");
    expect(b.saloon()).toBe("The Lantern Parlor");
    expect(b.mine()).toBe("Marlowe Mine");
    expect(b.ranch()).toBe("The Fairweather Stockyard");
    expect(b.brand()).toBe("Lightning Bolt over Half Circle");
    const c = weirdWest.withSeed("gamma");
    expect(c.town()).toBe("Brimstone Canyon");
    expect(c.outlaw()).toBe('Pearl "Calamity Jr." Morrow');
    expect(c.gang()).toBe("The Thorned Hounds");
    expect(c.saloon()).toBe("The Coyote & Ghost");
  });

  it("matches fixed vectors for table generators", () => {
    const vec = (seed: string) => {
      const w = createWeirdWestWorld(seed);
      return [generatorIds.occultEncounter, generatorIds.relic, generatorIds.rumor, generatorIds.anomaly, generatorIds.bounty]
        .map((id) => w.generate<{ text: string }>(id, "vec").text);
    };
    expect(vec("alpha")).toEqual([
      "a sundial that tells midnight — offers a deal written in rust — A dust devil spells a name.",
      "The Fevered Spyglass, summons a sudden sandstorm, but it takes the bearer's name by degrees",
      "a child who shouldn't know says strangers pay in coins no mint ever struck — the talk is out of Dry Mercy",
      "a standing storm that has not moved in years — beside the abandoned rail spur — Metal turns warm to the touch.",
      "$1,500",
    ]);
    expect(vec("beta")).toEqual([
      "the Hollow Marshal, a lawman who is not there — counts every coin in the party's purse — Shadows lean the wrong way.",
      "The Cold Pickaxe of Quiet Reckoning, always returns to its owner's hand, but it demands a burial every winter",
      "a preacher between hymns claims the founders signed in blood and ash — the talk is out of Brimstone Spring",
      "a pool of water that is warm and untouched by the sun — in the shadow of the lantern ridge — Matches burn green.",
      "$800",
    ]);
    expect(vec("gamma")).toEqual([
      "a coyote in a waistcoat that walks upright — lingers until dawn without moving — Crows gather in perfect rows.",
      "the Tinker's Burnt Locket, breaks any lock once, but it demands a burial every winter",
      "a saloon singer after midnight whispers that the mayor sold the town's shadows — the talk is out of Pale Hollow",
      "a stand of dead trees that lean toward the nearest liar — just inside the territory line — Metal turns warm to the touch.",
      "$2,000 alive only",
    ]);
  });

  it("names carry real English translations in both cultures", () => {
    const w = weirdWest.withSeed("names");
    for (const culture of ["dustborn", "saltmarch"] as const) {
      for (const kind of ["given", "moniker", "town"] as const) {
        const n = w.name(culture, kind);
        expect(n.form.length).toBeGreaterThan(0);
        expect(n.translation.length).toBeGreaterThan(0);
        expect(n.translation).not.toBe(n.form);
        expect(n.language).toBe(`${PACK_ID}/culture/${culture}`);
      }
    }
  });

  it("wanted poster rolls expose the dice bounty child", () => {
    const roll = weirdWest.withSeed("poster").wantedPosterRoll();
    const bounty = roll.children.find((c) => c.table.endsWith("/table/bounty"));
    expect(bounty?.dice?.length).toBe(2);
    expect(roll.text).toContain(bounty?.text ?? "never");
  });
});

describe("weird-west quality", () => {
  it.each(DISTINCT_FAMILIES)("%s: 100 rolls on one seed are at least 60 percent distinct", (family) => {
    for (const seed of ["fam-a", "fam-b"]) {
      const out = sample(seed, family, 100);
      expect(new Set(out).size).toBeGreaterThanOrEqual(60);
    }
  });

  it.each(FAMILIES)("%s: 1000-key sample is non-empty, resolved, and low-repeat", (family) => {
    const out = sample("quality", family, 1000);
    for (const text of out) {
      expect(text.trim().length).toBeGreaterThan(3);
      expect(text).not.toMatch(/#|undefined|\[object|\{|\}/);
      expect(text).not.toMatch(/\s{2,}/);
    }
    const dup = 1 - new Set(out).size / out.length;
    if (family !== "bounty") expect(dup).toBeLessThan(0.6);
  });

  it("culture names are distinct across 100 draws", () => {
    for (const culture of ["dustborn", "saltmarch"] as const) {
      const w = weirdWest.withSeed(`culture-${culture}`);
      const forms = Array.from({ length: 100 }, () => w.name(culture, "moniker").form);
      expect(new Set(forms).size).toBeGreaterThanOrEqual(60);
    }
  });
});
