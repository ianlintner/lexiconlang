// B4 demo: opt-in localized morpheme glosses. The conlang form and RNG scope
// are identical to the legacy path; only the human-readable translation changes.
// Run: pnpm --filter examples exec tsx 12-localized-glosses.ts

import { createContext } from "@lexiconlang/core";
import {
  BUILTIN_GLOSS_LOCALES,
  generateName,
  glossFor,
  withBuiltinGlosses,
  withGlosses,
} from "@lexiconlang/language";
import { dwarvish } from "@lexiconlang/fantasy";
import type { Meaning } from "@lexiconlang/language";

const ctx = createContext({ seed: "b4-demo" });

const legacy = generateName(dwarvish, "given", ctx.child("hero"));
console.log("legacy:", legacy.form, "→", legacy.translation);

for (const locale of BUILTIN_GLOSS_LOCALES) {
  const localized = generateName(dwarvish, "given", ctx.child("hero"), { locale });
  console.log(`${locale}: ${localized.form} → ${localized.translation}`);
  // The form never changes: locale only selects the translation.
  if (localized.form !== legacy.form) throw new Error("form changed under locale");
}

// Locale may also come from the context (e.g. a player's UI language).
const viaCtx = generateName(dwarvish, "given", createContext({ seed: "b4-demo", locale: "ja" }).child("hero"));
console.log("ja via ctx:", viaCtx.translation);

// Resolve a gloss directly: exact tag → primary subtag → English label → id.
const stone: Meaning = dwarvish.meaningPacks
  .flatMap((p) => p.meanings)
  .find((m) => m.label === "stone")!;
const localizedStone = withBuiltinGlosses(dwarvish, "es").meaningPacks
  .flatMap((p) => p.meanings)
  .find((m) => m.id === stone.id)!;
console.log("stone (es-MX):", glossFor(localizedStone, "es-MX"));
console.log("stone (es):", glossFor(localizedStone, "es"));
console.log("stone (de):", glossFor(localizedStone, "de"));
console.log("stone (legacy):", glossFor(stone));

// Pack authors can supply or override glosses without touching the source pack.
const custom = withGlosses(dwarvish.meaningPacks.find((p) => p.meanings.includes(stone))!, {
  [stone.id]: { es: "roca" },
});
console.log("custom es:", glossFor(custom.meanings.find((m) => m.id === stone.id)!, "es"));
