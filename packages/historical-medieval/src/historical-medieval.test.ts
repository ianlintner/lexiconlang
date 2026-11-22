import { describe, expect, it } from "vitest";
import { createContext } from "@lexiconlang/core";
import { createWorld, definePack, validatePack } from "@lexiconlang/packs";
import {
  historicalMedieval,
  historicalMedievalPack,
  personName,
  manorName,
  guildName,
  monasteryName,
  feudalTitle,
  marketGood,
  domainEvent,
  marketListing,
  heraldry,
  shieldSvg,
  blazon,
  hasHeraldicContrast,
  cultures,
  type CultureId,
} from "./index.js";

const seed = "medieval-test-family";
const historicPackId = historicalMedievalPack.id;

describe("historical-medieval pack", () => {
  it("validates against the declarative pack v1 schema", () => {
    expect(validatePack(historicalMedievalPack)).toEqual([]);
    expect(() => definePack(historicalMedievalPack)).not.toThrow();
  });

  it("declares four naming cultures with translated names", () => {
    expect(cultures.map((c) => c.id)).toEqual([
      "lexiconlang.historical-medieval/culture/latin",
      "lexiconlang.historical-medieval/culture/oldenglish",
      "lexiconlang.historical-medieval/culture/celtic",
      "lexiconlang.historical-medieval/culture/norse",
    ]);
    for (const culture of cultures) {
      expect(culture.given.length).toBeGreaterThanOrEqual(20);
      expect(culture.byname.length).toBeGreaterThanOrEqual(10);
      expect(culture.given.every((n) => n.form.length > 0 && n.translation.length > 0)).toBe(true);
    }
  });

  it("exposes all generator families and matching pack descriptors", () => {
    expect(Object.keys(historicalMedieval.generators)).toHaveLength(11);
    expect(historicalMedievalPack.generators).toHaveLength(8);
    // Declarative descriptors and the TS facade must agree on which resource each uses.
    const byId = new Map(historicalMedievalPack.generators.map((g) => [g.id, g]));
    const expectedResources: Record<string, string> = {
      "person-name": `${historicPackId}/grammar/person-name`,
      manor: `${historicPackId}/grammar/manor`,
      guild: `${historicPackId}/grammar/guild`,
      monastery: `${historicPackId}/grammar/monastery`,
      "feudal-title": `${historicPackId}/table/feudaltitle`,
      "market-good": `${historicPackId}/table/marketgood`,
      "domain-event": `${historicPackId}/table/domainevent`,
      heraldry: `${historicPackId}/grammar/heraldry`,
    };
    for (const [suffix, resource] of Object.entries(expectedResources)) {
      const descriptor = byId.get(`${historicPackId}/generator/${suffix}`);
      expect(descriptor, `missing generator descriptor ${suffix}`).toBeDefined();
      const target = "grammar" in descriptor! ? descriptor!.grammar : "table" in descriptor! ? descriptor!.table : "";
      expect(target, `descriptor ${suffix} points at the wrong resource`).toBe(resource);
    }
  });

  it("runs declarative descriptors through createWorld with the right resources", () => {
    const world = createWorld({ seed: "declarative-family" }).use(definePack(historicalMedievalPack));
    const id = (suffix: string) => `${historicPackId}/generator/${suffix}`;
    // person-name must not return a manor name (the original descriptor bug).
    const person = String(world.generate(id("person-name"), "p"));
    const manor = String(world.generate(id("manor"), "p"));
    expect(person).not.toBe(manor);
    expect(person.split(/\s+/)).toHaveLength(2);
    // The declarative heraldry grammar also follows the contrast convention.
    const blazonText = String(world.generate(id("heraldry"), "h"));
    const [field, chargeAndTincture] = blazonText.split(", ");
    const tincture = chargeAndTincture?.split(" ").at(-1);
    const tinctures = ["Or", "Argent", "Azure", "Gules", "Sable", "Vert", "Purpure"];
    const metals = ["Or", "Argent"];
    expect(tinctures).toContain(field);
    expect(tinctures).toContain(tincture);
    expect(metals.includes(field!)).not.toBe(metals.includes(tincture!));
  });

  it("is deterministic for the same seed and call sequence", () => {
    const a = historicalMedieval.withSeed(seed);
    const b = historicalMedieval.withSeed(seed);
    expect(a.name()).toEqual(b.name());
    expect(a.manor()).toBe(b.manor());
    expect(a.guild()).toBe(b.guild());
    expect(a.monastery()).toBe(b.monastery());
    expect(a.title()).toBe(b.title());
    expect(a.listing()).toEqual(b.listing());
    expect(a.event()).toBe(b.event());
    expect(a.arms()).toEqual(b.arms());
  });

  const families = [
    ["personName", personName, (v: { full: string }) => v.full],
    ["manorName", manorName, (v: string) => v],
    ["guildName", guildName, (v: string) => v],
    ["monasteryName", monasteryName, (v: string) => v],
    ["feudalTitle", feudalTitle, (v: string) => v],
    ["marketGood", marketGood, (v: string) => v],
    ["domainEvent", domainEvent, (v: string) => v],
    ["marketListing", marketListing, (v: { good: string; price: number; unit: string }) => `${v.good}/${v.price}/${v.unit}`],
    ["heraldry", heraldry, (v: { blazon: string }) => v.blazon],
  ] as const;

  for (const [label, generator, project] of families) {
    it(`${label}: 100 rolls on one seed family give >= 60% distinct results`, () => {
      const ctx = createContext({ seed }).child(label);
      const seen = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const value = generator.generate(ctx.child(`item:${i}`));
        seen.add(project(value as never));
      }
      expect(seen.size / 100).toBeGreaterThanOrEqual(0.6);
    });
  }

  it("emits a valid blazon string and a simple SVG shield", () => {
    const ctx = createContext({ seed }).child("heraldry-shape");
    const arms = heraldry.generate(ctx);
    expect(arms.blazon).toMatch(/^(Or|Argent|Azure|Gules|Sable|Vert|Purpure), (a|an) .+ (rampant|passant|statant|displayed|salient|segreant)? ?(Or|Argent|Azure|Gules|Sable|Vert|Purpure)$/);
    const { blazon: _ignored, ...base } = arms;
    expect(blazon(base)).toBe(arms.blazon);
    const svg = shieldSvg(arms);
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).toContain(arms.field);
    expect(svg).toContain("</svg>");
  });

  it("enforces metal-on-colour contrast on every generated device", () => {
    const ctx = createContext({ seed: "contrast-audit" }).child("heraldry");
    for (let i = 0; i < 1000; i++) {
      const arms = heraldry.generate(ctx.child(`sample:${i}`));
      expect(hasHeraldicContrast(arms.field, arms.chargeTincture)).toBe(true);
      expect(arms.blazon).toContain(` ${arms.chargeTincture}`);
      expect(arms.chargeTincture).not.toBe(arms.field);
    }
    expect(hasHeraldicContrast("Or", "Argent")).toBe(false);
    expect(hasHeraldicContrast("Or", "Or")).toBe(false);
    expect(hasHeraldicContrast("Azure", "Or")).toBe(true);
  });

  it("uses each naming culture, including opt-in culture selection", () => {
    const api = historicalMedieval.withSeed(seed);
    const ids: CultureId[] = cultures.map((c) => c.id as CultureId);
    for (const id of ids) {
      const name = api.name({ culture: id });
      expect(name.culture).toBe(id);
      expect(name.full).toContain(name.given);
      expect(name.translation.length).toBeGreaterThan(0);
    }
  });

  it("keeps existing generator outputs byte-identical across runs", () => {
    const a = createContext({ seed }).child("fixed");
    const b = createContext({ seed }).child("fixed");
    expect(manorName.generate(a)).toBe(manorName.generate(b));
    expect(guildName.generate(a.child("g"))).toBe(guildName.generate(b.child("g")));
  });

  it("matches three recorded fixed seed vectors", () => {
    const expected: Record<string, string[]> = {
      "vector-a": ["Mearc of Wōd", "St. Eanswythe's Lang Village", "Worshipful Company of Tanners", "Augustinian House of Malmesbury", "Knight", '{"good":"Fresh fish","price":13,"unit":"shilling"}', "the stone bridge was completed", "Sable, an eagle segreant Argent"],
      "vector-b": ["Tiernan mac Aodha", "Raven Ridge", "Worshipful Company of Silversmiths", "Abbey of St. Swithun", "High Knight", '{"good":"Fine wool","price":9,"unit":"penny"}', "in the south a winter frost killed the vine cuttings", "Purpure, a boar passant Or"],
      "vector-c": ["Ragnhildr með Saxi", "Holt Village", "Worshipful Company of Dyers", "Franciscan House of Jarrow", "Chaplain", '{"good":"grain","price":13,"unit":"shilling"}', "a foal was born in the stable", "Purpure, a harp Argent"],
    };
    for (const [seed, vector] of Object.entries(expected)) {
      const api = historicalMedieval.withSeed(seed);
      expect([
        api.name().full, api.manor(), api.guild(), api.monastery(), api.title(),
        JSON.stringify(api.listing()), api.event(), api.arms().blazon,
      ]).toEqual(vector);
    }
  });

  it("keeps duplicate rate low across 1,000-key samples per family", () => {
    for (const [label, generator, project] of families) {
      const ctx = createContext({ seed: `quality-${label}` }).child(label);
      const seen = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        seen.add(project(generator.generate(ctx.child(`sample:${i}`)) as never));
      }
      const duplicateRate = 1 - seen.size / 1000;
      console.info(`duplicate-rate ${label}: ${duplicateRate.toFixed(3)}`);
      // Finite pools cap distinct values (e.g. 170 table entries => >= 0.83
      // duplicates at 1,000 draws). A 0.90 ceiling still catches a broken
      // generator that collapses onto a tiny subset of its declared pool.
      expect(duplicateRate, `${label} duplicate rate ${duplicateRate}`).toBeLessThan(0.90);
    }
  });
});
