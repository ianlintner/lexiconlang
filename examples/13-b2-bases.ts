// 13-b2-bases — B1 + B2 base languages with opt-in tone-mark rendering.
//
// The ten B2 bases use the unchanged B1 framework. Existing generator IDs and
// goldens are untouched: a base is selected explicitly via `cultureFor`.
//
// Run: npx tsx examples/13-b2-bases.ts

import { createContext } from "@lexiconlang/core";
import { coreMeanings, generateName, generateStructuredName } from "@lexiconlang/language";
import { BASE_SLUGS, cultureFor, renderOrthography, type BaseData } from "@lexiconlang/bases";
import { slavic } from "@lexiconlang/bases/slavic";
import { mandarin } from "@lexiconlang/bases/mandarin";
import { polynesian } from "@lexiconlang/bases/polynesian";
import { yoruba } from "@lexiconlang/bases/yoruba";

console.log("all base slugs:", BASE_SLUGS.join(", "));

const picks: [string, BaseData][] = [["slavic", slavic], ["mandarin", mandarin], ["polynesian", polynesian], ["yoruba", yoruba]];
for (const [label, base] of picks) {
  const culture = cultureFor(base, [coreMeanings]);
  for (let i = 0; i < 3; i++) {
    const name = generateName(culture, "given", createContext({ seed: `b2-demo-${base.id}-${i}` }));
    console.log(`${label}: ${name.form}`);
  }
}

const mandarinCulture = cultureFor(mandarin, [coreMeanings]);
const familyFirst = generateStructuredName(
  mandarinCulture,
  { structure: "mandarin.family-first" },
  createContext({ seed: "b2-demo-structured" }),
);
console.log("mandarin family-first:", familyFirst.form);

// Diacritics are opt-in; ASCII pinyin/vowels remain the authored default.
console.log("tone marks:", renderOrthography("la", mandarin.orthography));
console.log("ascii fallback:", renderOrthography("lā", mandarin.romanization));
console.log("yoruba tone:", renderOrthography("to", yoruba.orthography));
console.log("polynesian long vowel:", renderOrthography("ngaa", polynesian.orthography));
