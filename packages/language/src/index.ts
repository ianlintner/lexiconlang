export type {
  GlyphSystem,
  Constraint,
  Meaning,
  WordClass,
  BuiltinWordClass,
  WordClassDefinition,
  MeaningPack,
  Lexicon,
  Culture,
  NameTemplates,
  TemplateChoices,
  NameTemplate,
  TemplatePart,
  TranslatedName,
  Glyph,
  GlyphSet,
  VisualGlyphSystem,
  RenderFormat,
  MappingStrategy,
  Gender,
  NameOptions,
  NameRole,
  NameSlot,
  NameSlotSource,
  NameStructure,
  StructuredName,
  StructuredNameComponent,
  StructuredNameInput,
} from "./types.js";
export { builtinWordClasses, defineCulture, isBuiltinWordClass } from "./types.js";
export { constraintMatches } from "./glyphs.js";
export { coreMeanings } from "./meanings.js";
export {
  buildLexicon,
  buildTokenLexicon,
  createLexiconCache,
  DEFAULT_LEXICON_CACHE_CAPACITY,
  deriveDialectFromCulture,
} from "./lexicon.js";
export { generateWord, generateWordTokenGroups, generateWordTokens } from "./phonotactics.js";
export {
  applyOrthography,
  applySoundChanges,
  adjectiveFromPlace,
  createRomanizationProfile,
  demonym,
  deriveDialect,
  genitive,
  inflect,
  languageFamily,
  parseSoundChange,
  parseSoundChangeRule,
  plural,
} from "./dialects.js";
export type {
  DialectData,
  DerivedLanguage,
  EnvironmentSlot,
  LanguageBranch,
  MorphologyRule,
  OrthographyData,
  RomanizationProfile,
  SoundChangeRule,
  TokenLexicon,
  WordRenderHint,
} from "./dialects.js";
export type { LexiconCache, LexiconCacheStats } from "./lexicon.js";
export { generateName, resolveNameTemplates, generateNameFiltered } from "./templates.js";
export { glossFor, withGlosses, localizePacks } from "./glosses.js";
export {
  BUILTIN_GLOSS_LOCALES,
  withBuiltinGlosses,
} from "./builtin-glosses.js";
export { generateStructuredName } from "./structures.js";
export { freezeCulture, isFrozenCulture } from "./freeze.js";
export { archetypes } from "./archetypes.js";

export {
  DEFAULT_BLOCKLIST,
  createBlocklist,
  foldAscii,
  blocklistMatch,
  isBlocked,
  blocklist,
} from "./filter.js";
export type { Blocklist, BlocklistMode, Filterable, BlocklistFilterOptions } from "./filter.js";
