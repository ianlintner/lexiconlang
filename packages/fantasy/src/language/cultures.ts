import type { Culture, GlyphSystem } from "@content-gen/language";
import { archetypes, coreMeanings } from "@content-gen/language";
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
            { pick: "noun", tag: "blood" },
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
