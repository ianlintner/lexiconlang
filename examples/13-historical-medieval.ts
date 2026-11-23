// P13 demo: deterministic historical-medieval pack with heraldry.
// Run: pnpm --filter examples exec tsx 13-historical-medieval.ts

import { historicalMedieval } from "@lexiconlang/historical-medieval";

const hm = historicalMedieval.withSeed("p13-demo");

console.log("person:", hm.name().full);
console.log("manor:", hm.manor());
console.log("guild:", hm.guild());
console.log("monastery:", hm.monastery());
console.log("title:", hm.title());
console.log("market:", hm.listing());
console.log("event:", hm.event());

const arms = hm.arms();
console.log("blazon:", arms.blazon);
console.log("shield:", hm.shield().slice(0, 80) + "…");
