// 05-custom-grammar — authoring your own Tracery-style grammar.
//
// Two equivalent ways to write the same rules:
//   (a) JSON object, the source-of-truth format  — easy to load from a file
//   (b) tagged-template `t\`...\``               — type-checked, terse in TS
//
// Both compile to the same AST. Symbol references look like  #symbol#  and
// modifiers chain with dots:  #symbol.cap.s#.
//
// Run: pnpm --filter examples custom-grammar

import { createContext } from "@content-gen/core";
import { grammar, t } from "@content-gen/grammar";

// ─── (a) JSON form ───────────────────────────────────────────────────────

const spellName = grammar({
  start: {
    "#prefix.cap# #element.cap# #form.cap#": 5,
    "#name.cap#'s #element.cap# #form.cap#": 3,
    "the #adj.cap# #form.cap#": 2,
  },
  prefix: ["lesser", "greater", "true", "binding", "shattering", "whispering"],
  element: ["fire", "frost", "shadow", "sun", "echo", "thorn", "iron"],
  form: ["bolt", "ward", "veil", "lash", "stride", "gaze", "chord"],
  adj: ["unsleeping", "patient", "errant", "violet", "broken"],
  name: ["aelior", "varian", "morwen", "thessaly"],
});

console.log("Spells (JSON grammar form):");
const ctx = createContext({ seed: "spellbook-1" });
for (let i = 0; i < 8; i++) {
  console.log(`  • ${spellName.generate(ctx.child(`s:${i}`))}`);
}

// ─── (b) Tagged-template form — type-safe, fully equivalent ──────────────

const taunt = grammar({
  // `t\`...\`` is just sugar for the JSON string  "Your #adj# #noun.cap# ..."
  start: t`Your ${"adj"} ${"noun.cap"} ${"verb"} like ${"thing.a"}!`,
  adj: ["wretched", "cowardly", "boastful", "sniveling", "ill-bred"],
  noun: ["uncle", "father", "horse", "dog", "cousin"],
  verb: ["fights", "smells", "writes", "swims", "bargains"],
  thing: ["badger", "alchemist", "broken pot", "tax-collector", "embarrassed cat"],
});

console.log("\nBattlefield insults (tagged-template form):");
for (let i = 0; i < 6; i++) {
  console.log(`  • ${taunt.generate(ctx.child(`taunt:${i}`))}`);
}

// ─── Plug a custom modifier in ───────────────────────────────────────────

// Modifiers are pure (string) → string functions. Register them per-grammar
// or globally on the registry. Here's a "shouty" modifier:

const royalDecree = grammar(
  {
    start: t`THE KING DECREES: ${"verb.upper"} THE ${"noun.upper"}!`,
    verb: ["destroy", "praise", "tax", "ennoble", "behead"],
    noun: ["heretic", "minstrel", "innkeeper", "playwright", "tax-collector"],
  },
  {
    // The built-in `upper` is already there, but you can add your own:
    modifiers: {
      shouty: (s) => s.toUpperCase().split("").join(" "),
    },
  },
);

console.log("\nRoyal decrees:");
for (let i = 0; i < 4; i++) {
  console.log(`  • ${royalDecree.generate(ctx.child(`decree:${i}`))}`);
}
