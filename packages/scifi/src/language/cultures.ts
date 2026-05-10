import type { Culture, GlyphSystem, VisualGlyphSystem } from "@lexicon/language";
import { archetypes, coreMeanings } from "@lexicon/language";
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
