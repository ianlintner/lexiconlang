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
