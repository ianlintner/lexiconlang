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
import { horror } from "@lexiconlang/horror";
import { pirates } from "@lexiconlang/pirates";
import { postapoc } from "@lexiconlang/postapoc";
import { cyberpunk } from "@lexiconlang/cyberpunk";
import { historicalMedieval } from "@lexiconlang/historical-medieval";
import { steampunk } from "@lexiconlang/steampunk";
import { grimdark } from "@lexiconlang/grimdark";
import { wuxia } from "@lexiconlang/wuxia";
import { supers } from "@lexiconlang/supers";
import { weirdWest } from "@lexiconlang/weird-west";
import { espionage } from "@lexiconlang/espionage";

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

// ─── Scenario 3: a horror investigation in a small town ──────────────────
//
// The horror pack is a standalone F2 pack with a `withSeed` facade, so it
// composes with any other genre just by using a shared seed family.

const h = horror.withSeed("the-silver-cord");

console.log("\nSmall-town horror case file:");
console.log(`  Investigator: ${h.investigator("lead")}`);
console.log(`  Town:         ${h.town("setting").form}`);
console.log(`  Haunted site: ${h.hauntedLocation("site")}`);
console.log(`  Forbidden tome: ${h.forbiddenTome("evidence")}`);
console.log(`  Cult:         ${h.cult("suspects")}`);
console.log(`  Entity:       ${h.eldritchEntity("boss")} (${h.monsterTrait("tell")})`);
console.log(`  Omen:         ${h.omen("first-sign")}`);
console.log(`  Secret:       ${h.secret("backstory")}`);
// ─── Scenario 3: a pirate crew with a fantasy quartermaster ──────────────
interface PirateRoster {
  captain: string;
  ship: string;
  rank: string;
  alias: string;
}
const pirateCrew = compose<PirateRoster>({
  id: "crossgenre.pirate-crew",
  parts: {
    captain: (ctx) => pirates.generators.captainName.generate(ctx.child("captain")).full,
    ship: pirates.generators.shipName,
    rank: pirates.generators.navalRank,
    alias: (ctx) => fantasyFullName.generate(ctx.child("alias")).surname.form,
  },
});
console.log("Pirate crew manifest (pirates + fantasy):");
const crew = repeat(pirateCrew, 4).generate(ctx.child("pirate-crew"));
for (const c of crew) {
  console.log(`  ${c.rank.padEnd(20)} ${c.captain.padEnd(38)} a.k.a. "${c.alias}" aboard ${c.ship}`);
}
const voyage = pirates.withSeed("a-golden-reef");
console.log(`\nTreasure: ${voyage.treasure()}  ·  ${voyage.encounter().text}`);
// ─── Scenario 4: a wasteland scene with a fantasy-named relic ──────────

const waste = postapoc.withSeed("the-ironwake");
console.log("\nWasteland scene (post-apocalyptic + fantasy):");
console.log(`  Settlement: ${waste.settlement().form}  · raiders: ${waste.raiders().form}`);
console.log(`  Bunker:     ${waste.vault().name}`);
console.log(`  Loot:       ${waste.gear()}  ("${fantasyFullName.generate(ctx.child("relic")).surname}" brand)`);
console.log(`  Encounter:  ${waste.encounter()}`);

// ─── Scenario 5: a gaslamp inventor's filing ─────────────────────────────
// ─── Scenario 3: a cyberpunk crew with fantasy-flavored cover names ──────
//
// The cyberpunk pack is declarative JSON. `withSeed` hands back typed
// helpers; names carry an in-world form plus a plain-language translation.

const cp = cyberpunk.withSeed("neon-district-9");
console.log("\nCyberpunk crew (cyberpunk pack + fantasy cover names):");
for (let i = 0; i < 4; i++) {
  const handle = cp.handle();
  const cover = fantasyFullName.generate(ctx.child(`cover:${i}`)).surname;
  console.log(`  ${handle.form.padEnd(12)} (${handle.translation}) · cover: ${cover}`);
}
const corp = cp.faction.megacorp();
console.log(`  employer: ${corp.form} — "${corp.translation}"`);
const ware = cp.cyberware();
console.log(`  implant: ${ware.name} — ${ware.effect} [${ware.tier}]`);
console.log(`  job: ${cp.fixerJob().text}`);

// ─── Scenario 3: a medieval fair in a modern city ────────────────────────
// The declarative medieval pack composes with other genres like any generator.

const hm = historicalMedieval.withSeed("the-ironwake");
console.log("Medieval fair in a modern city:");
for (let i = 0; i < 3; i++) {
  const guild = historicalMedieval.generators.guildName.generate(ctx.child(`guild:${i}`));
  const listing = hm.listing();
  console.log(`  ${guild} at ${modern.generators.cityName.generate(ctx.child(`city:${i}`))}: ${listing.good} (${listing.price} ${listing.unit})`);
}
console.log("  heraldry:", hm.arms().blazon);

// ─── Scenario 4: a gaslamp inventor's filing ─────────────────────────────

const brass = steampunk.withSeed("brass-cross-genre");
console.log("\nGaslamp patent filing:");
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

// ─── Scenario 5: a gaslamp expedition into a cultivation secret realm ────

const jianghu = wuxia.withSeed("brass-and-jade");
console.log("\nGaslamp expedition into a hidden realm:");
console.log(`  Wanderer:   ${jianghu.person().form} — \"${jianghu.nickname()}\"`);
console.log(`  Sect:       ${jianghu.sect()}`);
console.log(`  Technique:  ${jianghu.technique()}`);
console.log(`  Realm:      ${jianghu.cultivationRealm()}`);
console.log(`  Mountain:   ${jianghu.mountain().form}`);
console.log(`  Destination: ${jianghu.secretRealm()}`);
console.log(`  Treasure:   ${jianghu.treasure()}`);
console.log(`  Trial:      ${jianghu.tribulation().text}`);

// ─── Scenario 6: a supers dossier in a shared city ───────────────────────

const masked = supers.withSeed("masked-cross-genre");
const dossier = masked.dossier();
console.log("\nSupers dossier:");
console.log(`  Codename: ${dossier.codename} (${dossier.alignment})`);
console.log(`  Secret:   ${dossier.secretIdentity.form} of ${dossier.hometown.form}`);
console.log(`  Power:    ${dossier.powers.ability} — ${dossier.powers.limit}`);
console.log(`  Team:     ${dossier.team} · Base: ${dossier.lair}`);
console.log(`  Motto:    ${dossier.motto}`);
console.log(`  Headline: ${dossier.headline}`);
console.log(`  Incident: ${masked.incident().text}`);

// ─── Scenario 6: a weird-west wanted poster with a fantasy alias ─────────

const frontier = weirdWest.withSeed("high-noon");
console.log("\nWeird-west bounty board (+ fantasy aliases):");
for (let i = 0; i < 3; i++) {
  const alias = fantasyFullName.generate(ctx.child(`wanted:${i}`)).surname;
  console.log(`  ${frontier.wantedPoster()}`);
  console.log(`    also known in the old country as "${alias}" · hideout: ${frontier.mine()}\n`);
}

// ─── Scenario 7: a spy-thriller briefing with a fantasy-named informant ──

const spy = espionage.withSeed("cold-harbor");
console.log("\nEspionage briefing (+ fantasy informant):");
console.log(`  ${spy.operationCodename("op")} — ${spy.agencyName("home")}`);
console.log(`  Cover:     ${spy.coverIdentityModern("cover").form}, ${spy.coverOccupation("cover-job")}`);
console.log(`  Informant: ${fantasyFullName.generate(ctx.child("informant")).surname} (${spy.assetReliability("informant")})`);
console.log(`  Safehouse: ${spy.safehouse("hide")}`);
console.log(`  Dead-drop: ${spy.deadDrop("drop")}`);
console.log(`  Tasking:   ${spy.missionBriefing("tasking")}`);
console.log(`  Snag:      ${spy.fieldComplication("snag")}`);
