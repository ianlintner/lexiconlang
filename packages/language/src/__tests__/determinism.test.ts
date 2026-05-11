import { describe, it, expect } from "vitest";
import { createContext } from "@lexiconlang/core";
import type { Culture } from "../types.js";
import { buildLexicon } from "../lexicon.js";
import * as fantasyModule from "@lexiconlang/fantasy";
import * as scifiModule from "@lexiconlang/scifi";

const { dwarvish, elvish, orcish, halfling, draconic } = fantasyModule.language;
const { humanoid, insectoid, aquatic, synth } = scifiModule.language;

const cultures: readonly Culture[] = [
  dwarvish,
  elvish,
  orcish,
  halfling,
  draconic,
  humanoid,
  insectoid,
  aquatic,
  synth,
];

describe("Determinism Snapshots", () => {
  for (const culture of cultures) {
    it(`${culture.id} lexicon is stable`, () => {
      const ctx = createContext({ seed: "test-determinism-1" });
      const lexicon = buildLexicon(culture, ctx);
      const glossary = lexicon.materialize();
      expect(glossary).toMatchSnapshot();
    });
  }

  it("Meaning ID set is stable per culture", () => {
    const ctx = createContext({ seed: "test-determinism-1" });
    for (const culture of cultures) {
      const lexicon = buildLexicon(culture, ctx);
      const ids = lexicon
        .byClass("noun")
        .map((m) => m.id)
        .sort();
      expect(ids).toMatchSnapshot(`${culture.id}:noun-ids`);
    }
  });
});
