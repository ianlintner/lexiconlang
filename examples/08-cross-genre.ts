// 08-cross-genre — mixing content packs.
//
// Packs aren't sealed. They expose plain `Generator<T>` values you can pull
// into any composition. Use this to make sci-fantasy crews, modern-day
// detectives with fantasy code-names, or whatever your game needs.
//
// Run: pnpm --filter examples cross-genre

import { compose, createContext, oneOf, repeat } from "@lexiconlang/core";
import { fullName as fantasyFullName, dwarvenMaleName, expandedWithSeed } from "@lexiconlang/fantasy";
import { scifi } from "@lexiconlang/scifi";
import { modern } from "@lexiconlang/modern";
import { steampunk } from "@lexiconlang/steampunk";
import { grimdark } from "@lexiconlang/grimdark";

// ─── Scenario 1: a sci-fantasy ship's crew ───────────────────────────────
//
// Imagine a Warhammer-40k-ish setting: dwarven engineers, elven pilots,
// orcish marines, on a starship.

interface SciFantasyCrew {
  name: string;
  role: string;
  ship: string;
  callsign: string;
}

const dwarfEngineer = compose<SciFantasyCrew>({
  id: "scifantasy.dwarf-engineer",
  parts: {
    name: (ctx) => {
      const given = dwarvenMaleName.generate(ctx.child("given"));
      const sur = oneOf("Ironforge", "Steelweld", "Hexbolt", "Sparkwright").generate(ctx.child("sur"));
      return `${given} ${sur}`;
    },
    role: oneOf("Chief Engineer", "Drive Engineer", "Reactor Tech", "Hull Master"),
    ship: scifi.generators.shipName,
    callsign: scifi.generators.callsign,
  },
});

console.log("Sci-fantasy ship roster:");
const ctx = createContext({ seed: "the-ironwake" });
const roster = repeat(dwarfEngineer, 6).generate(ctx.child("crew"));
for (const c of roster) {
  console.log(`  ${c.role.padEnd(16)} ${c.name.padEnd(28)} on ${c.ship} — "${c.callsign}"`);
}

// ─── Scenario 2: detective with a fantasy alias ─────────────────────────

interface ModernDetective {
  legal: string;       // "Kim Patel"
  alias: string;       // "Ravenheart"
  station: string;     // "Cedarville Precinct"
  partner: string;
}

const detective = compose<ModernDetective>({
  id: "noir.detective",
  parts: {
    legal: (ctx) => {
      const p = modern.generators.personName.generate(ctx);
      return p.full;
    },
    alias: (ctx) => fantasyFullName.generate(ctx).surname,
    station: (ctx) => `${modern.generators.cityName.generate(ctx)} Precinct`,
    partner: (ctx) => modern.generators.personName.generate(ctx).full,
  },
});

// ─── Scenario 3: expanded fantasy oracle in a mixed campaign ─────────────
//
// The P1 pack is opt-in and composes with the legacy fantasy generators.
// Every oracle draw is a function of (seed, key), so reruns are reproducible.

const world = expandedWithSeed("the-ironwake");
console.log("\nExpanded fantasy oracle:");
console.log(`  Tavern:  ${world.tavern.name()}`);
console.log(`  Spell:   ${world.spell.name()} — ${world.spell.effect().text}`);
console.log(`  Item:    ${world.magicItem.full()}`);
console.log(`  Rumor:   ${world.rumor().text}`);
console.log(`  Hero:    ${world.humanV2.northronFullName()}`);

console.log("\nDetective squad (modern + fantasy aliases):");
const sq = repeat(detective, 5).generate(ctx.child("squad"));
for (const d of sq) {
  console.log(`  Det. ${d.legal}  (a.k.a. "${d.alias}")`);
  console.log(`    station: ${d.station}  · partner: ${d.partner}\n`);
}

// ─── Scenario 3: a gaslamp inventor's filing ─────────────────────────────

const brass = steampunk.withSeed("brass-cross-genre");
console.log("Gaslamp patent filing:");
console.log(`  Inventor: ${brass.person().form}`);
console.log(`  Workshop: ${brass.district()} · ${brass.street()}`);
console.log(`  Patent:   ${brass.patent()}`);
console.log(`  Vessel:   ${brass.airship()}`);
console.log(`  Society:  ${brass.society()}`);
console.log(`  Sunday headline: ${brass.headline()}`);
console.log(`  Street omen: ${brass.omen().text}`);

// ─── Scenario 4: a grimdark muster roll ─────────────────────────────────

const dark = grimdark.withSeed("black-standard");
console.log("\nGrimdark muster roll:");
console.log(`  Warband:  ${dark.warband()}`);
console.log(`  Banner:   ${dark.banner()}`);
console.log(`  Captain:  ${dark.person().form} — ${dark.title()}`);
console.log(`  Heresy:   ${dark.heresy()}`);
console.log(`  Plague:   ${dark.plague()} — ${dark.plagueOutcome().text}`);
console.log(`  Engine:   ${dark.warMachine()}`);
console.log(`  Clan:     ${dark.clan()} under ${dark.warlord()}`);
console.log(`  Battle:   ${dark.battle()}`);
console.log(`  Omen:     ${dark.omen().text}`);
