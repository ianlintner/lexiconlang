// 07-seed-and-reroll — save/load via seeds, and partial rerolls.
//
// The whole library is built so you never need to persist generated content.
// Persist *only the seed*, re-derive everything on load.
//
// For "the player rerolls one settlement but keeps the rest of the world",
// you don't mutate state — you switch which child label the settlement uses.
// The rest of the tree is unaffected because every other node derives from a
// path you didn't touch.
//
// Run: pnpm --filter examples reroll

import { createContext } from "@lexiconlang/core";
import { settlement } from "@lexiconlang/fantasy";

// ─── Save game = world seed (a single string) ────────────────────────────

interface Save {
  worldSeed: string;
  // For partial rerolls: which "version" of each path the player has accepted.
  // Default 0 = original. Bump to reroll while keeping everything else.
  rerolls: Record<string, number>;
}

function loadWorld(save: Save) {
  const root = createContext({ seed: save.worldSeed });
  return {
    settlement(path: string) {
      const v = save.rerolls[path] ?? 0;
      const ctx = root.child(path).child(`v:${v}`);
      return settlement.generate(ctx);
    },
  };
}

// ─── Tiny "session" simulating two players sharing a save ───────────────

const save: Save = { worldSeed: "shared-realm", rerolls: {} };

const session1 = loadWorld(save);
const session2 = loadWorld(save);

const a = session1.settlement("region:0/settlement:0");
const b = session2.settlement("region:0/settlement:0");

console.log("Two devices, same save → same settlement?");
console.log(`  device 1: ${a.name} (pop. ${a.population})`);
console.log(`  device 2: ${b.name} (pop. ${b.population})`);
console.log(`  match: ${a.name === b.name && a.population === b.population ? "yes" : "NO"}`);

// ─── Generating the rest of the world ──────────────────────────────────

console.log("\nThree settlements in the same region:");
for (let i = 0; i < 3; i++) {
  const s = session1.settlement(`region:0/settlement:${i}`);
  console.log(`  region:0/settlement:${i}  →  ${s.name} (${s.kind}, pop. ${s.population})`);
}

// ─── Player rerolls ONE settlement, everything else stays ──────────────

console.log("\nPlayer doesn't like settlement:1. They reroll it.");
save.rerolls["region:0/settlement:1"] = 1;

const after = loadWorld(save);
for (let i = 0; i < 3; i++) {
  const s = after.settlement(`region:0/settlement:${i}`);
  const note = i === 1 ? "  ← REROLLED" : "";
  console.log(`  region:0/settlement:${i}  →  ${s.name} (${s.kind}, pop. ${s.population})${note}`);
}

console.log("\nThe other two are byte-identical to before. Only the rerolled");
console.log("entry changed — and only because we passed v:1 instead of v:0.");
