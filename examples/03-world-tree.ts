// 03-world-tree — hierarchical, lazily-generated world content.
//
// The killer feature of content-gen's seeding model:
//
//     world  → region:N → settlement:M → npc:K
//
// Every level is just `ctx.child(label)`. The label (a string) is hashed into
// the seed deterministically, so:
//
//   1. Re-running this file produces the exact same world.
//   2. You can re-derive *any* sub-tree on demand without persisting it.
//   3. Adding a new region, or generating siblings out of order, doesn't
//      affect any other part of the tree.
//
// In a real game you'd lazily generate a settlement only when the player
// reaches it; the seed math means it's always the same settlement when they
// come back.
//
// Run: pnpm --filter examples world

import { createContext, repeat } from "@lexiconlang/core";
import {
  cityName,
  factionName,
  landmarkName,
  npc,
  settlement,
} from "@lexiconlang/fantasy";

const world = createContext({ seed: "campaign-of-iron" });

const regionNames = ["Northmarch", "Sunken Coast", "Ember Reach"];
const ruler = factionName.generate(world.child("ruling-faction"));

console.log(`World: ruled by ${ruler}`);
console.log("─".repeat(60));

for (let r = 0; r < regionNames.length; r++) {
  const region = world.child(`region:${r}`);
  const capital = cityName.generate(region.child("capital"));
  const landmark = landmarkName.generate(region.child("landmark"));

  console.log(`\n${regionNames[r]} — capital: ${capital}, landmark: ${landmark}`);

  // 2 settlements per region.
  const settlements = repeat(settlement, 2).generate(region.child("settlements"));
  for (const s of settlements) {
    console.log(`  ${s.name} (${s.kind}, pop. ${s.population.toLocaleString()})`);
    console.log(`    ruler: ${s.leader.name.full}, the ${s.leader.occupation}`);

    // 3 noteworthy NPCs per settlement.
    // Reach for them by name, not by position — the path-as-label is the seed.
    const noteworthy = ["mayor", "blacksmith", "village-elder"];
    for (const role of noteworthy) {
      const ctx = region.child(`settlement:${s.name}`).child(`npc:${role}`);
      const n = npc.generate(ctx);
      console.log(`    ${role.padEnd(15)} ${n.name.full} (${n.name.race}, ${n.age})`);
    }
  }
}

// Prove path-stability: ask for the elder of a specific settlement directly,
// from a brand-new context — no traversal needed.
const fresh = createContext({ seed: "campaign-of-iron" });
const elder = npc.generate(
  fresh.child("region:0").child("settlement:Northmarch-direct").child("npc:village-elder"),
);

console.log("\nDirect lookup (no parent traversal):");
console.log(`  region:0 → settlement:Northmarch-direct → npc:village-elder`);
console.log(`  → ${elder.name.full}, ${elder.age}`);
console.log("Same path always yields the same NPC, today, tomorrow, on any machine.");
