// 09-glyphs — visual writing systems alongside conlang text.
//
// Each culture can declare a `visualGlyphSystem` — a deterministic recipe for
// rendering names as glyphs. Same seed → byte-identical SVG / Unicode / Canvas
// output across machines.
//
// This example walks three cultures, each using a different render format:
//   - dwarvish:  SVG runes, one glyph per 2-character phoneme
//   - elvish:    Unicode ideograms, one glyph per morpheme
//   - humanoid:  Canvas instructions, a single holistic glyph
//
// Run: pnpm --filter examples glyphs

import { createContext } from "@lexicon/core";
import { generateName } from "@lexicon/language";
import { glyphsFor } from "@lexicon/glyphs";
import { dwarvish, elvish } from "@lexicon/fantasy";
import { humanoid } from "@lexicon/scifi";

const ctx = createContext({ seed: "glyph-demo" });

// --- Dwarvish: SVG runes, phonemic ---------------------------------------
const dwarfName = generateName(dwarvish, "given", ctx.child("dwarf"));
const dwarfGlyphs = glyphsFor(
  dwarfName,
  dwarvish.visualGlyphSystems!.phonetic!,
  ctx.child("dwarf"),
);

console.log(`Dwarvish — ${dwarfName.form} (${dwarfName.translation})`);
console.log(`  ${dwarfGlyphs.phonetic?.length} runes, one per phoneme pair`);
dwarfGlyphs.phonetic?.forEach((g, i) => {
  // Each glyph.svg is a compact inline <svg>...</svg> string, ready to
  // drop into innerHTML or write to a .svg file.
  console.log(`  [${i}] ${g.svg?.slice(0, 70)}…`);
});

// --- Elvish: Unicode ideograms, morphemic --------------------------------
const elfName = generateName(elvish, "given", ctx.child("elf"));
const elfGlyphs = glyphsFor(
  elfName,
  elvish.visualGlyphSystems!.conceptual!,
  ctx.child("elf"),
);

console.log(`\nElvish — ${elfName.form} (${elfName.translation})`);
elfGlyphs.conceptual?.forEach((g) => {
  console.log(`  ${g.unicode}  ← "${g.meaning}"`);
});
console.log(
  `  one-line render: ${elfGlyphs.conceptual?.map((g) => g.unicode).join("")}`,
);

// --- Humanoid: Canvas, holistic ------------------------------------------
const humanName = generateName(humanoid, "given", ctx.child("human"));
const humanGlyphs = glyphsFor(
  humanName,
  humanoid.visualGlyphSystems!.holistic!,
  ctx.child("human"),
);

console.log(`\nHumanoid — ${humanName.form} (${humanName.translation})`);
console.log(
  `  holistic glyph: ${humanGlyphs.holistic?.canvasInstructions?.length} canvas ops`,
);
console.log(
  `  first few ops: ${humanGlyphs.holistic?.canvasInstructions
    ?.slice(0, 4)
    .map((op) => op.type)
    .join(" → ")}…`,
);

// --- Determinism check ---------------------------------------------------
// Re-running with the same seed produces the same glyphs, every time.
const replay = glyphsFor(
  dwarfName,
  dwarvish.visualGlyphSystems!.phonetic!,
  createContext({ seed: "glyph-demo" }).child("dwarf"),
);
const same = replay.phonetic?.[0]?.svg === dwarfGlyphs.phonetic?.[0]?.svg;
console.log(`\nDeterminism: same seed → identical SVG? ${same}`);
