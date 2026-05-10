// 04-custom-generator — composing your own generator from primitives.
//
// You won't always want the canned `npc`. Maybe your game has "Iron Knights"
// with a name + house + sword + motto + a backstory. Build that with `compose`,
// `oneOf`, `pickOf`, `weightedList`, `repeat`, and the built-in pack pieces.
//
// The result is itself a `Generator<T>` — composable into anything else.
//
// Run: pnpm --filter examples custom-generator

import {
  type Generator,
  compose,
  createContext,
  intRange,
  oneOf,
  weightedList,
} from "@content-gen/core";
import { fullName } from "@content-gen/fantasy";

interface IronKnight {
  name: string;
  house: string;
  sword: string;
  motto: string;
  rank: "Squire" | "Knight" | "Knight-Captain" | "Lord-Marshal";
  yearsOfService: number;
}

const house = oneOf(
  "Vael", "Drachen", "Kessel", "Morain", "Strayle", "Vorden", "Halric", "Bayard",
);

const sword = oneOf(
  "Ironwill", "Last Watch", "Quietsong", "Heartbreaker", "Verdict",
  "Six Kings", "Long Vigil", "Argent",
);

const motto = oneOf(
  "Hold the line",
  "By steel and silence",
  "Fear the morning",
  "Strike first, repent later",
  "We are the second wall",
  "The crown waits",
);

// Rank distribution is weighted — most knights are knights, not Lord-Marshals.
const rank = weightedList<IronKnight["rank"]>(
  { Squire: 4, Knight: 8, "Knight-Captain": 2, "Lord-Marshal": 1 },
  { id: "ironknight.rank" },
);

// We piggy-back on the fantasy pack's `fullName` for the underlying name,
// then keep only the .full string. `map`-style transform is a 1-line lambda.
const ironKnight: Generator<IronKnight> = compose<IronKnight>({
  id: "ironknight",
  parts: {
    name: (ctx) => fullName.generate(ctx).full,
    house,
    sword,
    motto,
    rank,
    yearsOfService: intRange(1, 40),
  },
});

const ctx = createContext({ seed: "iron-watch" });

console.log("The Iron Watch, current roster:\n");
for (let i = 0; i < 10; i++) {
  const k = ironKnight.generate(ctx.child(`watch:${i}`));
  console.log(`  ${k.rank.padEnd(15)} ${k.name.padEnd(28)} of House ${k.house.padEnd(8)} — "${k.sword}"`);
  console.log(`    ${k.yearsOfService}y of service. Motto: "${k.motto}"\n`);
}
