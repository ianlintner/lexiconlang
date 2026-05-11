# Visual glyph systems

::: tip New in v0.3
The `@lexiconlang/glyphs` package adds **deterministic visual writing systems**
alongside conlang text. Same seed → byte-identical glyphs across machines.
:::

A glyph system is a per-culture recipe for rendering names as **SVG runes**,
**Unicode ideograms**, or **Canvas drawing instructions**. Each glyph is
derived from the seeded RNG the same way the conlang form is, so a player
viewing the dwarvish surname "Ironforge" in your game sees the same seven
runes that anyone else with the same campaign seed sees.

## The three renderers

| Format    | Output                         | Use when                                                    |
| --------- | ------------------------------ | ----------------------------------------------------------- |
| `svg`     | Compact inline `<svg>...</svg>` | You want crisp, scalable glyphs in HTML/React/Vue.          |
| `unicode` | Single Unicode character(s)    | You want text-native rendering, terminals, minimal payload. |
| `canvas`  | Array of drawing instructions  | You're drawing to a `<canvas>` (game UI, image export).     |

## The three mapping strategies

How does a name map to glyphs?

| Strategy   | Granularity                              | Example                                |
| ---------- | ---------------------------------------- | -------------------------------------- |
| `phoneme`  | One glyph per 2-character unit in form   | `Drakaztum` → 5 glyphs                 |
| `morpheme` | One glyph per meaning component          | `strong-anvil` → 2 glyphs              |
| `holistic` | A single glyph for the whole name        | `NgirangingaLangange` → 1 glyph        |

## Generating glyphs

```ts
import { createContext } from "@lexiconlang/core";
import { generateName } from "@lexiconlang/language";
import { glyphsFor } from "@lexiconlang/glyphs";
import { elvish } from "@lexiconlang/fantasy";

const ctx = createContext({ seed: "campaign-1" });
const name = generateName(elvish, "given", ctx.child("hero"));
// → { form: "WaeYia", translation: "wild-vine", language: "fantasy.elvish" }

const glyphs = glyphsFor(name, elvish.visualGlyphSystems!.conceptual!, ctx.child("hero"));
// → { conceptual: [
//       { id: "g0", meaning: "wild", unicode: "🌿" },
//       { id: "g1", meaning: "vine", unicode: "🌿" }
//     ] }
```

Render to the DOM:

```ts
glyphs.conceptual?.forEach((g) => {
  const span = document.createElement("span");
  span.textContent = g.unicode;
  span.title = g.meaning;
  container.appendChild(span);
});
```

Or for SVG cultures, drop the inline `<svg>` strings directly:

```ts
const dwarfGlyphs = glyphsFor(name, dwarvish.visualGlyphSystems!.phonetic!, ctx);
dwarfGlyphs.phonetic?.forEach((g) => {
  const div = document.createElement("div");
  div.innerHTML = g.svg!;
  container.appendChild(div);
});
```

## Defining a glyph system on your own culture

Glyphs are opt-in. Add a `visualGlyphSystems` field to any `Culture`:

```ts
import type { Culture, VisualGlyphSystem } from "@lexiconlang/language";

const myCulture: Culture = {
  // ... id, glyphs (phonotactics), meaningPacks, templates ...
  visualGlyphSystems: {
    phonetic: {
      id: "myculture.runes",
      type: "alphabet",
      renderFormat: "svg",
      mappingStrategy: "phoneme",
      generator: {
        baseShapes: ["rect", "line", "arc"],
        complexity: "medium",
        symmetry: false,
        palette: ["#8B4513", "#D2691E"],
      },
      renderParams: { size: 28, strokeWidth: 2.5 },
    },
  },
};
```

For `unicode` glyphs, supply a `unicodeMappings` table from morpheme names to
Unicode characters:

```ts
unicodeMappings: {
  fire:  "🔥",
  water: "💧",
  stone: "🪨",
  // ...
},
renderParams: { fallback: "◆" },  // used when a morpheme has no mapping
```

## Performance

| Renderer | Per-glyph cost | 20-glyph page |
| -------- | -------------- | ------------- |
| Unicode  | <0.1 ms        | <2 ms         |
| Canvas   | ~1–2 ms        | ~20–40 ms     |
| SVG      | ~2–5 ms        | ~40–100 ms    |

Comfortably under the 200 ms target. Glyphs are pure data — cache them in
memory or IndexedDB if you're rendering thousands.

## See also

- [Runnable example](https://github.com/ianlintner/content-gen/blob/main/examples/09-glyphs.ts) — walks all three formats with output.
- [Package reference](/packages/glyphs) — full API.
