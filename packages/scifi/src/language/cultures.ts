import type { Culture, GlyphSystem, VisualGlyphSystem } from "@lexiconlang/language";
import { archetypes, coreMeanings } from "@lexiconlang/language";
import { scifiMeanings } from "./meanings.js";

export const humanoid: Culture = {
  id: "scifi.humanoid",
  glyphs: {
    ...archetypes.resonant,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "technology", capitalize: true },
            { pick: "verb", tag: "action" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
  visualGlyphSystems: {
    holistic: {
      id: "humanoid.geometric",
      type: "conceptual",
      renderFormat: "canvas",
      mappingStrategy: "holistic",
      generator: {
        baseShapes: ["rect", "circle", "polygon"],
        complexity: "medium",
        symmetry: true,
        palette: ["#00BFFF", "#1E90FF"],
      },
      renderParams: {
        size: 48,
        strokeWidth: 3,
      },
    },
  },
};

export const insectoid: Culture = {
  id: "scifi.insectoid",
  glyphs: {
    ...archetypes.guttural,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "collective", capitalize: true },
            { pick: "noun", tag: "collective" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
  visualGlyphSystems: {
    phonetic: {
      id: "insectoid.chitin",
      type: "alphabet",
      renderFormat: "svg",
      mappingStrategy: "phoneme",
      generator: {
        baseShapes: ["line", "arc", "polygon"],
        complexity: "complex",
        symmetry: false,
        palette: ["#2F4F4F", "#696969"],
      },
      renderParams: {
        size: 32,
        strokeWidth: 1.5,
      },
    },
  },
};

export const aquatic: Culture = {
  id: "scifi.aquatic",
  glyphs: {
    ...archetypes.flowing,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "biology", capitalize: true },
            { pick: "adjective", tag: "biology" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
};

export const synth: Culture = {
  id: "scifi.synth",
  glyphs: {
    ...archetypes.clipped,
    joiner: "-",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "technology", capitalize: true },
            { literal: "0", translation: "zero" },
          ],
          sep: "-",
        },
        1,
      ],
    ],
  },
};

export const birdpeople: Culture = {
  id: "scifi.birdpeople",
  glyphs: {
    ...archetypes.sibilant,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "flight", capitalize: true },
            { pick: "noun", tag: "sound" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
};

export const rockpeople: Culture = {
  id: "scifi.rockpeople",
  glyphs: {
    ...archetypes.guttural,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "geology", capitalize: true },
            { pick: "adjective", tag: "geology" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
};

export const mycoids: Culture = {
  id: "scifi.mycoids",
  glyphs: {
    ...archetypes.flowing,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "biology", capitalize: true },
            { pick: "verb", tag: "growth" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
};

export const mammalian: Culture = {
  id: "scifi.mammalian",
  glyphs: {
    ...archetypes.resonant,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "nature", capitalize: true },
            { pick: "adjective", tag: "nature" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
};

export const plantoid: Culture = {
  id: "scifi.plantoid",
  glyphs: {
    ...archetypes.flowing,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "nature", capitalize: true },
            { pick: "verb", tag: "growth" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
};

export const reptilian: Culture = {
  id: "scifi.reptilian",
  glyphs: {
    ...archetypes.sibilant,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "predator", capitalize: true },
            { pick: "noun", tag: "predator" },
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
            { pick: "noun", tag: "geology", capitalize: true },
            { pick: "noun", tag: "predator" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
  visualGlyphSystems: {
    phonetic: {
      id: "reptilian.scales",
      type: "alphabet",
      renderFormat: "svg",
      mappingStrategy: "phoneme",
      generator: {
        baseShapes: ["arc", "line", "polygon"],
        complexity: "complex",
        symmetry: false,
        palette: ["#556B2F", "#8B7500"],
      },
      renderParams: {
        size: 30,
        strokeWidth: 1.5,
      },
    },
  },
};

export const hivemind: Culture = {
  id: "scifi.hivemind",
  glyphs: {
    ...archetypes.clipped,
    joiner: ".",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "hivemind", capitalize: true },
            { literal: "7", translation: "index" },
          ],
          sep: ".",
        },
        1,
      ],
      [
        {
          kind: "compose",
          parts: [
            { pick: "noun", tag: "network", capitalize: true },
            { pick: "noun", tag: "hivemind" },
          ],
          sep: ".",
        },
        1,
      ],
    ],
  },
  visualGlyphSystems: {
    phonetic: {
      id: "hivemind.grid",
      type: "alphabet",
      renderFormat: "svg",
      mappingStrategy: "phoneme",
      generator: {
        baseShapes: ["rect", "line"],
        complexity: "medium",
        symmetry: false,
        palette: ["#00CED1", "#C0C0C0"],
      },
      renderParams: {
        size: 26,
        strokeWidth: 1,
      },
    },
  },
};

export const grayfolk: Culture = {
  id: "scifi.grayfolk",
  glyphs: {
    ...archetypes.resonant,
    joiner: "",
  } as GlyphSystem,
  meaningPacks: [coreMeanings, scifiMeanings],
  templates: {
    given: [
      [
        {
          kind: "compose",
          parts: [
            { pick: "adjective", tag: "grayfolk", capitalize: true },
            { pick: "noun", tag: "mind" },
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
            { pick: "noun", tag: "knowledge", capitalize: true },
            { pick: "noun", tag: "grayfolk" },
          ],
          sep: "",
        },
        1,
      ],
    ],
  },
  visualGlyphSystems: {
    holistic: {
      id: "grayfolk.observer",
      type: "conceptual",
      renderFormat: "unicode",
      mappingStrategy: "morpheme",
      unicodeMappings: {
        awareness: "◉",
        perception: "◉",
        eye: "◉",
        orb: "◉",
        cognition: "⊙",
        consciousness: "⊙",
        mind: "⊙",
        intelligence: "⊙",
        silence: "◯",
        still: "◯",
        void: "◯",
        archive: "⌬",
        memory: "⌬",
        knowledge: "⌬",
        quantum: "✦",
        anomaly: "✦",
        enigma: "✦",
        observer: "◌",
        watcher: "◌",
        telepathy: "≋",
        psionic: "≋",
      },
      renderParams: {
        fallback: "◌",
      },
    },
  },
};
