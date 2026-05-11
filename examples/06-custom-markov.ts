// 06-custom-markov — train a Markov chain on your own corpus.
//
// Use this when you want names that *feel* like a particular linguistic style
// without enumerating thousands of examples. Provide a seed corpus of 30-50
// names and the trainer learns the n-gram structure.
//
// Tips:
//   - order=2 is loose (more variety, more nonsense).
//   - order=3 is the sweet spot for most fantasy/proper-noun corpora.
//   - rejectSubstringsOfLength prevents emitting training words verbatim —
//     important for originality and any rights/attribution concerns.
//   - For production you'd usually run the trainer offline via the CLI:
//
//       content-gen build-markov ./corpus.json --out ./model.json --order 3
//
//     and ship the JSON model with your game so loading is instant.
//
// Run: pnpm --filter examples custom-markov

import { createContext, repeat } from "@lexiconlang/core";
import { markov, train } from "@lexiconlang/markov";

// Welsh-ish town names — a small inline corpus to demonstrate training.
const corpus = [
  "aberffraw", "betws-y-coed", "caernarfon", "cricieth", "dolgellau",
  "ffestiniog", "harlech", "llanberis", "llanfair", "llanrwst", "machynlleth",
  "penmaenmawr", "porthmadog", "pwllheli", "rhyl", "tywyn", "abergele",
  "barmouth", "bangor", "conwy", "criccieth", "denbigh", "holyhead",
  "menai", "newtown", "prestatyn", "ruthin", "tregaron", "wrexham",
];

const model = train(corpus, {
  order: 3,
  minLength: 5,
  maxLength: 12,
  rejectSubstringsOfLength: 6, // refuse to emit any 6+ char training entry
});

console.log("Model summary:");
console.log(`  contexts: ${Object.keys(model.transitions).length}`);
console.log(`  forbidden (no-verbatim): ${model.forbidden?.length ?? 0} entries\n`);

const townName = markov(model, { id: "welsh.town" });
const ctx = createContext({ seed: "cymru" });

console.log("20 generated town names:");
const names = repeat(townName, 20).generate(ctx);
for (const n of names) console.log(`  • ${n}`);

// Can be used inside grammars too: register `townName` on the registry and
// call it via   "#town.cap#"   in any grammar rule. See the registry docs.

// To verify originality:
const generated = new Set(names.map((n) => n.toLowerCase()));
const overlap = corpus.filter((c) => generated.has(c));
console.log(`\nOverlap with training corpus: ${overlap.length} entries (should be 0).`);
