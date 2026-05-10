// 01-quickstart — the smallest possible useful program.
//
// Pin a seed, ask for content. Same seed → same content, every time, on every
// machine. Re-run this file and the output won't change.
//
// Run: pnpm --filter examples quickstart

import { fantasy } from "@content-gen/fantasy";

const game = fantasy.withSeed("hello-world");

console.log("A random NPC:");
const innkeeper = game.npc;
console.log(`  ${innkeeper.name.full}, ${innkeeper.age} — ${innkeeper.occupation}`);
console.log(`  ${innkeeper.personality.trait}, but ${innkeeper.personality.flaw}.`);
console.log(`  Quirk: ${innkeeper.personality.quirk}`);

console.log("\nThe inn they run:");
console.log(`  ${game.place.tavern()} — in ${game.place.city()}`);

console.log("\nA nearby landmark, a faction, a quest hook:");
console.log(`  ${game.place.landmark()}`);
console.log(`  ${game.faction.order()}`);
console.log(`  ${game.quest()}`);
