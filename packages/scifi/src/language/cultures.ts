import type { Culture, GlyphSystem } from "@content-gen/language";
import { archetypes, coreMeanings } from "@content-gen/language";
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
            { pick: "noun", tag: "water", capitalize: true },
            { pick: "adjective", tag: "life" },
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
