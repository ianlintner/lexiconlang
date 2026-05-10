// 02-batch-patrons — generating a list of NPCs at once.
//
// `repeat(generator, count)` is the workhorse for "I need N of these."
// It forks a fresh RNG sub-stream per element, so the i-th element is stable
// across runs and unaffected by changes elsewhere in your code.
//
// `count` can be a fixed number or a range; the range itself is RNG-driven.
//
// Run: pnpm --filter examples tavern

import { createContext, repeat } from "@lexicon/core";
import { npc } from "@lexicon/fantasy";

const tavernSeed = createContext({ seed: "the-gilded-anchor" });

// Fixed-size party.
const partyOfSix = repeat(npc, 6).generate(tavernSeed.child("party"));

console.log("Adventuring party of six:");
for (const member of partyOfSix) {
  console.log(`  • ${member.name.full.padEnd(28)} ${member.name.race.padEnd(10)} ${member.occupation}`);
}

// Variable-size patrons (between 5 and 12 — count is itself RNG-driven).
const patrons = repeat(npc, { min: 5, max: 12 }).generate(tavernSeed.child("patrons"));

console.log(`\n${patrons.length} patrons in the tavern tonight:`);
for (const p of patrons) {
  const nickname = p.personality.quirk;
  console.log(`  • ${p.name.full.padEnd(28)} (${nickname})`);
}

// Demonstrating stability: ask for the same thing again from a fresh seed.
// You'll get byte-identical output. This is essential for save files and for
// reproducing player-reported bugs.
const partyAgain = repeat(npc, 6).generate(tavernSeed.child("party"));
const same = JSON.stringify(partyOfSix) === JSON.stringify(partyAgain);
console.log(`\nDeterministic? ${same ? "yes" : "NO — bug!"}`);
