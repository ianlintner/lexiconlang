// 10-open-schema — custom name kinds, structured names, gender, lexicon cache.
//
// Cultures declare any name kind (ship, tavern, deity, ...), opt in to
// structured names (house + given + patronymic + epithet), opt in to gendered
// template pools, and can share a bounded lexicon cache.
//
// Run: pnpm --filter examples open-schema

import { createContext } from "@lexiconlang/core";
import {
  archetypes,
  coreMeanings,
  createLexiconCache,
  defineCulture,
  freezeCulture,
  generateName,
  generateStructuredName,
  type GlyphSystem,
} from "@lexiconlang/language";
import { dwarvish } from "@lexiconlang/fantasy";

const ctx = createContext({ seed: "open-schema-demo" });

// --- 1. Custom kinds on a built-in culture -------------------------------
const clan = generateName(dwarvish, "clan", ctx.child("clan"));
console.log(`Dwarvish clan  — ${clan.form} (${clan.translation})`);

// --- 2. A structured name (house, given, optional patronymic, epithet) ---
const formal = generateStructuredName(
  dwarvish,
  {
    structure: "dwarvish.house-name",
    values: {
      patronymic: { form: "Borin", translation: "Borin", language: "fantasy.dwarvish" },
    },
  },
  ctx.child("formal"),
);
console.log(`Formal name    — ${formal.form} (${formal.translation})`);
console.log(`Components     — ${formal.components.map((c) => c.role).join(", ")}`);

// --- 3. A culture with opt-in gender pools --------------------------------
const harbor = freezeCulture(
  defineCulture({
    id: "demo.harbor",
    glyphs: { ...archetypes.flowing, joiner: "" } as GlyphSystem,
    meaningPacks: [coreMeanings],
    templates: {
      given: [[{ kind: "literal", form: "Mina", translation: "mina" }, 1]],
      ship: [[{ kind: "literal", form: "Quiet Wake", translation: "quiet wake" }, 1]],
    },
    genderTemplates: {
      masculine: {
        given: [[{ kind: "literal", form: "Tarro", translation: "tarro" }, 1]],
      },
    },
  }),
);

console.log(`Harbor ship    — ${generateName(harbor, "ship", ctx.child("ship")).form}`);
console.log(`Harbor given   — ${generateName(harbor, "given", ctx.child("g")).form}`);
console.log(
  `Harbor (masc.) — ${generateName(harbor, "given", ctx.child("g"), { gender: "masculine" }).form}`,
);

// --- 4. Lexicon cache ------------------------------------------------------
// Frozen cultures share a bounded memo automatically; you can also own one.
const cache = createLexiconCache({ maxEntries: 16 });
console.log(`Cache          — ${cache.size} entries, ${cache.stats.hits} hits`);
