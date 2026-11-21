/**
 * B3: sound changes, orthography and language families.
 *
 * Run: pnpm --filter examples dialects
 *
 * The demo uses an original, synthetic proto-lexicon: no corpus, no external
 * data, no network. Same seed -> identical output every run.
 */
import { createContext } from "@lexiconlang/core";
import {
  applyOrthography,
  createRomanizationProfile,
  demonym,
  deriveDialect,
  languageFamily,
  parseSoundChange,
  plural,
  type OrthographyData,
  type TokenLexicon,
} from "@lexiconlang/language";

const orthography: OrthographyData = {
  id: "demo.latin",
  mappings: [
    { from: "t", to: "t" },
    { from: "k", to: "k" },
    { from: "s", to: "s" },
    { from: "š", to: "š" },
    { from: "a", to: "a" },
    { from: "e", to: "e" },
    { from: "i", to: "i" },
    { from: "l", to: "l" },
    { from: "n", to: "n" },
    { from: "p", to: "p" },
    { from: "r", to: "r" },
  ],
  unknown: "preserve",
};

// A hand-authored proto-language. Tokens are atomic glyphs; orthography is a
// separate late layer, exactly as in generated cultures.
const protoTokens: Record<string, string[]> = {
  "m:star": ["t", "a", "l", "a"],
  "m:stone": ["k", "a", "t", "a"],
  "m:river": ["s", "e", "l", "u"],
};

const proto: TokenLexicon = {
  cultureId: "demo.proto",
  orthography,
  tokensOf: (id) => [...(protoTokens[id] ?? [])],
  byClass: () => [],
  materialize() {
    return new Map(Object.keys(protoTokens).map((id) => [id, this.formOf(id)]));
  },
  formOf(id) {
    const form = applyOrthography(this.tokensOf(id), orthography);
    return form.length > 0 ? form[0]!.toUpperCase() + form.slice(1) : form;
  },
};

const ctx = createContext({ seed: "b3-dialects" });

const northern = deriveDialect(
  proto,
  {
    id: "demo.northern",
    parent: "demo.proto",
    soundChanges: [
      parseSoundChange("a > e / _ #"), // final a -> e
      parseSoundChange("{k,p} > {t,b} / # _"), // initial k -> t, p -> b
    ],
  },
  ctx.child("northern"),
);

const southern = deriveDialect(
  proto,
  { id: "demo.southern", parent: "demo.proto", soundChanges: [parseSoundChange("k > š / # _")] },
  ctx.child("southern"),
);

console.log("Proto:", [...proto.materialize()]);
console.log("Northern:", [...northern.materialize()]);
console.log("Southern:", [...southern.materialize()]);
console.log("Cognate for m:stone?", northern.cognatesWith(southern, "m:stone"));

const family = languageFamily(
  proto,
  [{ id: "demo.hill", soundChanges: [parseSoundChange("t > š / _ #")] }],
  ctx.child("family"),
);
console.log("Daughter languages:", family.map((d) => d.cultureId));

const romanized = createRomanizationProfile({ diacritics: false, digraphs: { š: "sh" } });
console.log("Romanized southern:", applyOrthography(southern.tokensOf("m:stone"), orthography, romanized));

const place = "Velmar";
console.log(`Plural: ${plural(place)}, demonym: ${demonym(place)}`);
