// F4 demo: constrained + unique generation and opt-in content blocklists.
// Run: pnpm --filter examples exec tsx 11-constraints-blocklist.ts

import {
  ConstraintExhaustedError,
  UniquenessSession,
  createContext,
  oneOf,
  sampleUnique,
  syllableCount,
  unique,
  where,
} from "@lexiconlang/core";
import {
  DEFAULT_BLOCKLIST,
  blocklistMatch,
  createBlocklist,
  foldAscii,
  generateNameFiltered,
  isBlocked,
} from "@lexiconlang/language";
import { dwarvish } from "@lexiconlang/fantasy";

const ctx = createContext({ seed: "f4-demo" });

// 1. where(): retry with stable attempt:<i> child keys.
const shortPlaces = where(
  oneOf("Rivendell", "Gondor", "Mirkwood", "Dale"),
  (place) => syllableCount(place) <= 2,
  { id: "demo.short-places", maxAttempts: 8 },
);
console.log("short place:", shortPlaces.generate(ctx.child("places:0")));

// 2. unique() with a caller-owned session + sampleUnique() batch.
const session = new UniquenessSession<string>();
const uniqueGem = unique(oneOf("ruby", "ember", "opal"), {
  session,
  id: "demo.unique-gem",
  maxAttempts: 4,
});
console.log("unique gem:", uniqueGem.generate(ctx.child("gem:0")));

const party = sampleUnique(oneOf("Ash", "Birch", "Cedar", "Dusk"), 3, {
  seed: "party",
  id: "demo.party",
});
console.log("unique party:", party.join(", "));

// 3. Opt-in blocklist: folded comparison, legacy path unchanged.
const custom = createBlocklist({
  id: "demo.dwarvish/safety",
  terms: ["Grim", "Stash"],
  mode: "whole-token",
});
const safeName = generateNameFiltered(dwarvish, "given", ctx.child("name"), {
  blocklists: [DEFAULT_BLOCKLIST, custom],
});
console.log("filtered name:", safeName.form);

console.log("folded 'FÜÑKŸ':", foldAscii("FÜÑKŸ"));
console.log("blocked 'Grim!':", isBlocked("Grim!", [custom]));
console.log(
  "matches translation:",
  blocklistMatch({ form: "Clean", translation: "grim", language: "en" }, custom),
);

try {
  where(oneOf("x"), () => false, { id: "demo.impossible", maxAttempts: 2 }).generate(
    ctx.child("impossible"),
  );
} catch (err) {
  console.log("typed failure:", err instanceof ConstraintExhaustedError, err.message);
}
