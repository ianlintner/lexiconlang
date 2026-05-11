// Integration test that produces a deterministic batch of generated content
// and writes it to tests/__artifacts__/samples.txt for human review and CI
// upload. The artifact is regenerated on every run; because all generators
// are deterministic from the SEED below, the file's contents only change
// when the underlying generator output changes.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createContext, repeat } from "@lexiconlang/core";
import {
  fantasy,
  fullName as fantasyFullName,
  npc as fantasyNpc,
  settlement,
} from "@lexiconlang/fantasy";
import {
  scifi,
  crewMember,
  starSystem,
} from "@lexiconlang/scifi";
import { modern, person } from "@lexiconlang/modern";
import { describe, expect, it } from "vitest";

const SEED = "samples-v1";

const here = dirname(fileURLToPath(import.meta.url));
const ARTIFACT_PATH = resolve(here, "__artifacts__", "samples.txt");

function header(title: string): string {
  const line = "─".repeat(title.length + 4);
  return `\n${line}\n  ${title}\n${line}\n`;
}

function bullet(items: readonly string[]): string {
  return items.map((s) => `  • ${s}`).join("\n") + "\n";
}

describe("sample-output integration", () => {
  it("produces a deterministic samples.txt artifact", () => {
    const ctx = createContext({ seed: SEED });
    const out: string[] = [];

    out.push(`content-gen sample output\n`);
    out.push(`seed: ${SEED}\n`);
    out.push(`generated: deterministic — re-running this test must produce identical content\n`);

    // ─── Fantasy ──────────────────────────────────────────────────────────
    out.push(header("FANTASY · 30 NPCs"));
    const npcs = repeat(fantasyNpc, 30).generate(ctx.child("fantasy.npcs"));
    out.push(
      bullet(
        npcs.map(
          (n) =>
            `${n.name.full.toString().padEnd(28)}  ${n.name.race.padEnd(10)} ${String(n.age).padStart(3)}y  ${n.occupation.padEnd(16)} — ${n.personality.trait}, but ${n.personality.flaw}; ${n.personality.quirk}`,
        ),
      ),
    );

    out.push(header("FANTASY · 50 race-tagged given names"));
    const fantasyNames = repeat(fantasyFullName, 50).generate(ctx.child("fantasy.names"));
    out.push(
      bullet(
        fantasyNames.map(
          (n) => `${n.full.toString().padEnd(30)}  (${n.race}, ${n.sex})`,
        ),
      ),
    );

    out.push(header("FANTASY · 30 taverns"));
    const taverns = repeat(fantasy.generators.tavernName, 30).generate(ctx.child("fantasy.taverns"));
    out.push(bullet(taverns));

    out.push(header("FANTASY · 20 cities"));
    const cities = repeat(fantasy.generators.cityName, 20).generate(ctx.child("fantasy.cities"));
    out.push(bullet(cities));

    out.push(header("FANTASY · 15 villages"));
    const villages = repeat(fantasy.generators.villageName, 15).generate(ctx.child("fantasy.villages"));
    out.push(bullet(villages));

    out.push(header("FANTASY · 15 settlements (composite)"));
    const settlements = repeat(settlement, 15).generate(ctx.child("fantasy.settlements"));
    for (const s of settlements) {
      out.push(
        `  • ${s.name} (${s.kind}, pop. ${s.population.toLocaleString()})\n` +
          `      leader: ${s.leader.name.full.toString()}, ${s.leader.occupation}\n` +
          `      taverns: ${s.notableLocations.join("; ")}\n`,
      );
    }

    out.push(header("FANTASY · 20 factions / orders"));
    const factions = repeat(fantasy.generators.factionName, 20).generate(ctx.child("fantasy.factions"));
    out.push(bullet(factions));

    out.push(header("FANTASY · 10 cults"));
    const cults = repeat(fantasy.generators.cultName, 10).generate(ctx.child("fantasy.cults"));
    out.push(bullet(cults));

    out.push(header("FANTASY · 15 mountains / forests / rivers"));
    const landmarks = repeat(fantasy.generators.landmarkName, 15).generate(ctx.child("fantasy.landmarks"));
    out.push(bullet(landmarks));

    out.push(header("FANTASY · 15 weapons + 10 armor"));
    const weapons = repeat(fantasy.generators.weaponName, 15).generate(ctx.child("fantasy.weapons"));
    const armor = repeat(fantasy.generators.armorName, 10).generate(ctx.child("fantasy.armor"));
    out.push(bullet([...weapons, ...armor]));

    out.push(header("FANTASY · 15 dragons"));
    const dragons = repeat(fantasy.generators.dragon, 15).generate(ctx.child("fantasy.dragons"));
    out.push(bullet(dragons));

    out.push(header("FANTASY · 10 quest hooks"));
    const hooks = repeat(fantasy.generators.questHook, 10).generate(ctx.child("fantasy.hooks"));
    out.push(bullet(hooks));

    // ─── Sci-fi ───────────────────────────────────────────────────────────
    out.push(header("SCI-FI · 30 crew members"));
    const crew = repeat(crewMember, 30).generate(ctx.child("scifi.crew"));
    out.push(
      bullet(
        crew.map(
          (c) =>
            `${c.name.padEnd(22)}  ${c.species.padEnd(10)} ${c.role.padEnd(16)} "${c.callsign}"  · ${c.homeworld}`,
        ),
      ),
    );

    out.push(header("SCI-FI · 20 ships"));
    const ships = repeat(scifi.generators.shipName, 20).generate(ctx.child("scifi.ships"));
    out.push(bullet(ships));

    out.push(header("SCI-FI · 15 star systems"));
    const systems = repeat(starSystem, 15).generate(ctx.child("scifi.systems"));
    for (const s of systems) {
      out.push(
        `  • ${s.star} — faction: ${s.faction}\n` +
          `      planets: ${s.planets.map((p) => `${p.name} (${p.type})`).join(", ")}\n`,
      );
    }

    out.push(header("SCI-FI · 15 megacorps"));
    const corps = repeat(scifi.generators.megacorpName, 15).generate(ctx.child("scifi.corps"));
    out.push(bullet(corps));

    out.push(header("SCI-FI · 10 weapons"));
    const scifiWeapons = repeat(scifi.generators.weaponName, 10).generate(ctx.child("scifi.weapons"));
    out.push(bullet(scifiWeapons));

    // ─── Modern ───────────────────────────────────────────────────────────
    out.push(header("MODERN · 25 people"));
    const people = repeat(person, 25).generate(ctx.child("modern.people"));
    out.push(
      bullet(
        people.map(
          (p) =>
            `${p.name.full.padEnd(26)}  ${String(p.age).padStart(3)}y  ${p.occupation.padEnd(20)} ${p.email}`,
        ),
      ),
    );

    out.push(header("MODERN · 20 cities"));
    const mCities = repeat(modern.generators.cityName, 20).generate(ctx.child("modern.cities"));
    out.push(bullet(mCities));

    out.push(header("MODERN · 20 streets"));
    const streets = repeat(modern.generators.streetName, 20).generate(ctx.child("modern.streets"));
    out.push(bullet(streets));

    out.push(header("MODERN · 20 companies"));
    const companies = repeat(modern.generators.companyName, 20).generate(ctx.child("modern.companies"));
    out.push(bullet(companies));

    out.push(header("MODERN · 15 bands + 15 songs + 15 books"));
    const bands = repeat(modern.generators.bandName, 15).generate(ctx.child("modern.bands"));
    const songs = repeat(modern.generators.songTitle, 15).generate(ctx.child("modern.songs"));
    const books = repeat(modern.generators.bookTitle, 15).generate(ctx.child("modern.books"));
    out.push("Bands:\n" + bullet(bands));
    out.push("Songs:\n" + bullet(songs));
    out.push("Books:\n" + bullet(books));

    const text = out.join("");

    mkdirSync(dirname(ARTIFACT_PATH), { recursive: true });
    writeFileSync(ARTIFACT_PATH, text, "utf8");

    // Sanity assertions — proves we actually produced a meaningful artifact.
    expect(text.length).toBeGreaterThan(10_000);
    expect(text).toContain("FANTASY");
    expect(text).toContain("SCI-FI");
    expect(text).toContain("MODERN");
    expect(npcs).toHaveLength(30);
    expect(crew).toHaveLength(30);
    expect(people).toHaveLength(25);
  });

  it("re-running with the same seed produces identical text", () => {
    // The first `it` already wrote the file. Re-running the generation here
    // must produce byte-identical content — proving the artifact is reproducible.
    const ctx1 = createContext({ seed: SEED });
    const ctx2 = createContext({ seed: SEED });
    const a = repeat(fantasyNpc, 5).generate(ctx1.child("fantasy.npcs"));
    const b = repeat(fantasyNpc, 5).generate(ctx2.child("fantasy.npcs"));
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) {
      expect(a[i]!.name.full.form).toBe(b[i]!.name.full.form);
      expect(a[i]!.age).toBe(b[i]!.age);
      expect(a[i]!.occupation).toBe(b[i]!.occupation);
    }
  });
});
