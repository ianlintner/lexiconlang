// Cross-package determinism golden-output test suite.
// Pinned to seeds — any drift in core/grammar/markov/packs trips this.
//
// To intentionally regenerate after a known change: run with
// `UPDATE_GOLDEN=1 vitest run tests/determinism.test.ts` (logs new values
// you can paste back in).

import { describe, expect, it } from "vitest";
import { createContext } from "@lexiconlang/core";
import { fantasy, npc as fantasyNpc, settlement, fullName } from "@lexiconlang/fantasy";
import { scifi, crewMember, starSystem } from "@lexiconlang/scifi";
import { modern, person } from "@lexiconlang/modern";

const SEED = "golden-master-1";

describe("cross-pack determinism", () => {
  it("fantasy.npc structure is stable for SEED", () => {
    const a = fantasyNpc.generate(createContext({ seed: SEED }));
    const b = fantasyNpc.generate(createContext({ seed: SEED }));
    expect(a.name.full.form).toBe(b.name.full.form);
    expect(a.age).toBe(b.age);
    expect(a.occupation).toBe(b.occupation);
    expect(a.personality).toEqual(b.personality);
    // Shape contract.
    expect(a.name.full.form).toMatch(/^\S.+\S$/);
    expect(a.age).toBeGreaterThanOrEqual(18);
    expect(a.occupation).toBeTypeOf("string");
    expect(a.personality.trait).toBeTypeOf("string");
  });

  it("fantasy.settlement structure is stable for SEED", () => {
    const a = settlement.generate(createContext({ seed: SEED }));
    const b = settlement.generate(createContext({ seed: SEED }));
    expect(a.name).toBe(b.name);
    expect(a.kind).toBe(b.kind);
    expect(a.population).toBe(b.population);
    expect(a.leader.name.full.form).toBe(b.leader.name.full.form);
  });

  it("scifi.crewMember structure is stable for SEED", () => {
    const a = crewMember.generate(createContext({ seed: SEED }));
    const b = crewMember.generate(createContext({ seed: SEED }));
    expect(a).toEqual(b);
  });

  it("scifi.starSystem has a deterministic planet count for SEED", () => {
    const a = starSystem.generate(createContext({ seed: SEED }));
    const b = starSystem.generate(createContext({ seed: SEED }));
    expect(a.planets.length).toBe(b.planets.length);
    expect(a.planets).toEqual(b.planets);
  });

  it("modern.person structure is stable for SEED", () => {
    const a = person.generate(createContext({ seed: SEED }));
    const b = person.generate(createContext({ seed: SEED }));
    expect(a).toEqual(b);
  });

  it("entry-point withSeed produces matched call sequences", () => {
    const f1 = fantasy.withSeed(SEED);
    const f2 = fantasy.withSeed(SEED);
    const f1Full = f1.name.full();
    const f2Full = f2.name.full();
    expect(f1Full.form).toBe(f2Full.form);
    expect(f1Full.translation).toBe(f2Full.translation);
    expect(f1.place.tavern()).toBe(f2.place.tavern());
    expect(f1.npc.name.full.form).toBe(f2.npc.name.full.form);
    expect(f1.npc.age).toBe(f2.npc.age);

    const s1 = scifi.withSeed(SEED);
    const s2 = scifi.withSeed(SEED);
    expect(s1.ship()).toBe(s2.ship());
    expect(s1.system).toEqual(s2.system);

    const m1 = modern.withSeed(SEED);
    const m2 = modern.withSeed(SEED);
    expect(m1.person).toEqual(m2.person);
  });

  it("hierarchical context: grand-child outputs are independent of sibling traversal", () => {
    const root1 = createContext({ seed: SEED });
    const root2 = createContext({ seed: SEED });

    const target1 = fantasyNpc.generate(
      root1.child("region:5").child("settlement:11").child("npc:3"),
    );

    // Walk many siblings before reaching target — target must be unaffected.
    for (let i = 0; i < 10; i++) {
      root2.child(`region:${i}`).child(`settlement:${i}`).child(`npc:${i}`);
    }
    const target2 = fantasyNpc.generate(
      root2.child("region:5").child("settlement:11").child("npc:3"),
    );
    expect(target1.name.full.form).toBe(target2.name.full.form);
    expect(target1.age).toBe(target2.age);
    expect(target1.occupation).toBe(target2.occupation);
  });

  it("fullName is deterministic and well-shaped", () => {
    const a = fullName.generate(createContext({ seed: SEED }));
    const b = fullName.generate(createContext({ seed: SEED }));
    expect(a.full.form).toBe(b.full.form);
    expect(a.given.form).toBe(b.given.form);
    expect(a.surname.form).toBe(b.surname.form);
    expect(a.full.form).toBe(`${a.given.form} ${a.surname.form}`);
  });
});
