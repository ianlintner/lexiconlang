import type { Culture, GlyphSystem, VisualGlyphSystem } from "@lexiconlang/language";
import { archetypes, coreMeanings } from "@lexiconlang/language";
import { fantasyIndustrial } from "./meanings.js";

export const dwarvish: Culture = {
  id: "fantasy.dwarvish",
  glyphs: {
    ...archetypes.guttural,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, fantasyIndustrial],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "strength", capitalize: true },
            { pick: "noun", tag: "industry" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    surname: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "earth", capitalize: true },
            { pick: "noun", tag: "industry" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    settlement: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "nature" },
            { pick: "noun", tag: "fortification" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
  visualGlyphSystems: {
    phonetic: {
      id: "dwarvish.runes",
      type: "alphabet",
      renderFormat: "svg",
      mappingStrategy: "phoneme",
      generator: {
        baseShapes: ["rect", "line", "arc"],
        complexity: "medium",
        symmetry: false,
        palette: ["#8B4513", "#D2691E"],
      },
      renderParams: {
        size: 28,
        strokeWidth: 2.5,
      },
    },
  },
};

export const elvish: Culture = {
  id: "fantasy.elvish",
  glyphs: {
    ...archetypes.flowing,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, fantasyIndustrial],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "nature", capitalize: true },
            { pick: "noun", tag: "nature" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    surname: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "nature" },
            { pick: "noun", tag: "celestial" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    settlement: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "nature", capitalize: true },
            { pick: "noun", tag: "nature" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
  visualGlyphSystems: {
    conceptual: {
      id: "elvish.ideograms",
      type: "conceptual",
      renderFormat: "unicode",
      mappingStrategy: "morpheme",
      unicodeMappings: {
        // Adjectives that lead elvish given names
        wild: "🌿",
        fierce: "⚡",
        verdant: "🍃",
        thorned: "🌵",
        ancient: "📜",
        // Nature nouns that appear as second morphemes
        leaf: "🍃",
        vine: "🌿",
        bloom: "🌸",
        blossom: "🌺",
        root: "🪵",
        seed: "🌱",
        sprout: "🌱",
        stem: "🌾",
        plant: "🌱",
        wildwood: "🌳",
        forest: "🌳",
        grove: "🌳",
        // Celestial morphemes for surnames
        moon: "🌙",
        moonlight: "🌙",
        star: "⭐",
        starlight: "⭐",
        sun: "☀",
        sky: "☁",
        silver: "🪙",
        light: "✨",
        wisdom: "🧠",
        song: "🎵",
        grace: "✨",
      },
      renderParams: {
        fallback: "◆",
      },
    },
  },
};

export const orcish: Culture = {
  id: "fantasy.orcish",
  glyphs: {
    ...archetypes.guttural,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, fantasyIndustrial],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "war", capitalize: true },
            { pick: "noun", tag: "war" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    surname: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "war" },
            { pick: "noun", tag: "strength" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
};

export const halfling: Culture = {
  id: "fantasy.halfling",
  glyphs: {
    ...archetypes.clipped,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, fantasyIndustrial],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "nature", capitalize: true },
            { pick: "noun", tag: "small" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    surname: [
      [
        {
          kind: "compose",
          parts: [{ pick: "noun", tag: "nature", capitalize: true }, { pick: "noun", tag: "society" }],
          sep: "",
        },
        1,
      ],
    ],
  },
};

export const draconic: Culture = {
  id: "fantasy.draconic",
  glyphs: {
    ...archetypes.sibilant,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, fantasyIndustrial],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "power", capitalize: true },
            { pick: "noun", tag: "fire" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    surname: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "power" },
            { pick: "adjective", tag: "eternal" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
};

export const plantoid: Culture = {
  id: "fantasy.plantoid",
  glyphs: {
    ...archetypes.flowing,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, fantasyIndustrial],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "nature", capitalize: true },
            { pick: "verb", tag: "life" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    surname: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "nature", capitalize: true },
            { pick: "noun", tag: "nature" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
};

export const mycanoids: Culture = {
  id: "fantasy.mycanoids",
  glyphs: {
    ...archetypes.flowing,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, fantasyIndustrial],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "fungal", capitalize: true },
            { pick: "noun", tag: "cycle" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    surname: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "fungal", capitalize: true },
            { pick: "adjective", tag: "fungal" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
};

export const celestial: Culture = {
  id: "fantasy.celestial",
  glyphs: {
    ...archetypes.resonant,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, fantasyIndustrial],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "light", capitalize: true },
            { pick: "noun", tag: "divine" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    surname: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "celestial", capitalize: true },
            { pick: "noun", tag: "grace" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    settlement: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "divine", capitalize: true },
            { pick: "noun", tag: "structure" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
  visualGlyphSystems: {
    conceptual: {
      id: "celestial.radiance",
      type: "conceptual",
      renderFormat: "unicode",
      mappingStrategy: "morpheme",
      unicodeMappings: {
        light: "✨",
        radiant: "✨",
        bright: "✨",
        dawn: "☀",
        sunlight: "☀",
        sun: "☀",
        star: "🌟",
        seraph: "🌟",
        halo: "⚜",
        crown: "⚜",
        grace: "⚜",
        wing: "🪶",
        feather: "🪶",
        sacred: "✝",
        divine: "✝",
        holy: "✝",
        song: "🎵",
        blessed: "🌙",
        moon: "🌙",
      },
      renderParams: {
        fallback: "◇",
      },
    },
  },
};

export const fey: Culture = {
  id: "fantasy.fey",
  glyphs: {
    ...archetypes.sibilant,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, fantasyIndustrial],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "fey", capitalize: true },
            { pick: "noun", tag: "fey" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    surname: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "nature", capitalize: true },
            { pick: "noun", tag: "fey" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
  visualGlyphSystems: {
    phonetic: {
      id: "fey.sylvan",
      type: "alphabet",
      renderFormat: "svg",
      mappingStrategy: "phoneme",
      generator: {
        baseShapes: ["arc", "line"],
        complexity: "medium",
        symmetry: false,
        palette: ["#556B2F", "#9370DB"],
      },
      renderParams: {
        size: 26,
        strokeWidth: 1.5,
      },
    },
  },
};

export const tiefling: Culture = {
  id: "fantasy.tiefling",
  glyphs: {
    ...archetypes.guttural,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, fantasyIndustrial],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "fire", capitalize: true },
            { pick: "noun", tag: "infernal" },
          ],
          sep: "",
        },
        1,
      ],
    ],
    surname: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "fire", capitalize: true },
            { pick: "noun", tag: "contract" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
  visualGlyphSystems: {
    phonetic: {
      id: "tiefling.infernal",
      type: "alphabet",
      renderFormat: "svg",
      mappingStrategy: "phoneme",
      generator: {
        baseShapes: ["polygon", "line"],
        complexity: "complex",
        symmetry: false,
        palette: ["#8B0000", "#2F2F2F"],
      },
      renderParams: {
        size: 28,
        strokeWidth: 2,
      },
    },
  },
};
