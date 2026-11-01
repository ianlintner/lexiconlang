# Expansion design: open cultures, portable packs, bases and genre content

Date: 2026-10-30
Status: Proposed; normative after Ian approves and this PR merges.
Owners: S0 decides interfaces; F/B/P/T/N cards implement them.
Scope: documentation only. None of the new exports below exist merely because this file exists.

## 1. Decision summary and reading guide

1. Preserve every existing generator's output and call paths, including known quirks.
2. Open runtime name-template and word-class types without removing familiar properties.
3. Add structured names and gender through explicit options and new generator IDs.
4. Use immutable, versioned JSON data packs with no executable payloads.
5. Keep the existing core registry small; implement pack resolution in `@lexiconlang/packs`.
6. Make registry installation transactional and reject ambiguous collisions.
7. Separate dependency availability from resource inheritance; never implicitly deep-merge.
8. Keep all random selection arrays ordered and all new sub-rolls key-addressed.
9. Share JSON Schema, fixtures and seed vectors with .NET, not TypeScript source types.
10. Ship real-language-inspired bases as selective subpath imports, not genre stereotypes.
11. Put roll tables in `@lexiconlang/tables`; exporters must declare their limitations.
12. CLI and MCP use the same validated request/response service and explicit pack allowlist.

Sections 3–5 belong to F1; 6–10 to F2/N1; 11 to F3; 12 to F4;
13–14 to B1–B4; 15 to P1–P13; 16 to T1–T3; 17–19 to all implementers.
TypeScript snippets specify intended types, not a complete implementation file.
JSON snippets are examples of the proposed wire format, not claims of current loader support.
Words MUST, SHOULD and MAY express required, recommended and optional behavior respectively.

## 2. Grounding, precedence and non-goals

The implementation baseline inspected for this spec is `da0a823e275d9642731bdaed1f3006d2c9bfae74`.
The canonical planning inputs are `~/lab/lexiconlang/ROADMAP.md` and `program.yaml`.
These are operator documents, not files to import into a published package.
Existing design history is in the three May 2026 specs in this directory.
The actual `packages/*/src` code takes precedence over inaccurate historical API examples.

Observed contracts that constrain this design:

- `Culture.templates.given` is required; surname and four place kinds are optional.
- Name template weights are runtime `[NameTemplate, number]` tuples.
- `generateName` forks `template`, `lexicon`, then `render`; parts use `part:N`.
- `buildLexicon` forks `lang:<culture.id>` then `word:<meaningId>`.
- `byClass` preserves meaning-pack and meaning-array traversal order, including duplicates.
- `RNG.nextInt` has an exclusive upper bound; some current callers pass `length - 1`.
- Existing core weighted lists use Vose alias selection, not cumulative weights.
- Core `Registry.register` rejects duplicate IDs; `get<T>` is a caller assertion, not validation.
- Fantasy's human fallback uses dwarvish and full names can independently choose cultures.
- Modern data is embedded in TS; modern person composition uses specific named children.
- Some public generators have counter-generated anonymous IDs, dependent on module initialization.
- `withSeed` convenience APIs use a shared call counter; matched call sequences are contractual.
- The CLI currently implements only `build-markov` and `scaffold-pack`.
- Visual glyphs are optional; phonotactic `GlyphSystem` is distinct from visual writing systems.

The .NET mapping document was read in `lexiconlang_net` without editing that repository.
It contains illustrative placeholders and stale examples (`generateName(..., "noun", ...)`).
It is a mapping aid, not evidence that wire compatibility or RNG parity already exists.
N1 must test actual C# behavior, including UTF-16 hashing and exclusive integer bounds.

This spec supersedes the old suggestion that appending glyphs is automatically seed-stable.
Changing a sampling population can change existing outputs even when entries are append-only.
It also supersedes older allowances to regenerate existing goldens for expansion work.
No existing golden or sample test may be edited to hide changed output.

Out of scope: a community download registry, native dependencies, arbitrary JSON scripts,
a general programming language, linguistic authenticity guarantees, automated translation,
a universal cultural ontology, full sound-change implementation, and modifying .NET in S0.
No new public runtime API, npm package or changeset is delivered by S0 itself.
Implementation cards must add their docs-site pages, README sections and runnable examples.

## 3. F1: open names and word classes

Use an index signature with known properties, not a union that must be edited for every pack.
Keep mutable tuple compatibility at the existing public runtime boundary.
`defineCulture` captures literal keys for authors wanting compile-time name-kind checks.
Unannotated old `Culture` objects remain assignable; dynamically loaded cultures validate at runtime.

```ts
export type TemplateChoices = Array<[template: NameTemplate, weight: number]>;
export interface NameTemplates {
  given: TemplateChoices;
  surname?: TemplateChoices;
  settlement?: TemplateChoices;
  mountain?: TemplateChoices;
  river?: TemplateChoices;
  forest?: TemplateChoices;
  [kind: string]: TemplateChoices | undefined;
}
export type BuiltinWordClass = "noun" | "adjective" | "verb" | "particle";
export type WordClass = BuiltinWordClass | (string & {});
export interface WordClassDefinition {
  id: string;
  description: string;
}
export interface Culture<K extends string = string> {
  id: string;
  glyphs: GlyphSystem;
  meaningPacks: readonly MeaningPack[];
  templates: NameTemplates & Partial<Record<K, TemplateChoices>>;
  capitalize?: "first" | "all" | "none";
  visualGlyphSystems?: Record<string, VisualGlyphSystem>;
  wordClasses?: readonly WordClassDefinition[];
  genderTemplates?: Partial<Record<Gender, Partial<Record<K, TemplateChoices>>>>;
  nameStructures?: Readonly<Record<string, NameStructure>>;
}
export function defineCulture<const T extends Culture>(culture: T): T;
export function generateName<C extends Culture>(
  culture: C, kind: Extract<keyof C["templates"], string>, ctx: Context,
  options?: NameOptions,
): TranslatedName;
```

The existing `NameTemplate` and `TemplatePart` variants remain unchanged for F1.
Custom kinds are plain tokens such as `ship`, `tavern`, `deity`, `guild`, `title`, `epithet`.
Within a culture they are local keys, not globally registered resources.
Custom word classes in new packs use qualified IDs, e.g. `acme.sail/word-class/classifier`.
The four builtin classes stay unqualified and need no declaration.
Reject undeclared custom classes and missing/empty template lists during pack validation.
Direct runtime calls with a missing kind keep failing clearly; do not silently fall back to given.
Legacy genre wrappers retain any existing explicit fallback of their own.

New `Meaning` fields reserve gloss localization without changing `label` interpretation:

```ts
export interface Meaning {
  id: string;
  class: WordClass;
  tags: readonly string[];
  label?: string; // existing English fallback, never an RNG key
  glosses?: Readonly<Record<string, string>>; // BCP 47 locale tags
}
```

B4 resolves exact locale, then primary language, then `label`, then ID.
No locale specified preserves existing English translation behavior exactly.
Localized rendering is opt-in, uses no random draws and never changes conlang forms.
Array order remains significant; adding meanings to an existing selection pool is not seed-safe.

## 4. F1: gender and structured personal names

Gender here describes a naming convention, not biological sex or inferred identity.
`any` means no gender restriction; it is a request mode, not a fourth personal identity.
`neutral` is an explicitly authored neutral naming set, never a random male/female alias.

```ts
export type Gender = "masculine" | "feminine" | "neutral" | "any";
export interface NameOptions { gender?: Gender; locale?: string }
export type NameRole =
  | "given" | "surname" | "patronymic" | "matronymic"
  | "clan" | "honorific" | "epithet" | (string & {});
export interface NameSlot {
  key: string; // stable and unique within a structure
  role: NameRole;
  source:
    | { type: "kind"; kind: string }
    | { type: "input"; field: string };
  prefix?: string;
  suffix?: string;
  optional?: boolean;
}
export interface NameStructure {
  slots: readonly NameSlot[]; // display order, not alphabetical order
  separator: string;
  translationSeparator?: string;
}
export interface StructuredNameInput {
  structure: string;
  gender?: Gender;
  values?: Readonly<Record<string, TranslatedName>>; // keyed by NameSlot source.field
  locale?: string;
}
export interface StructuredName {
  full: TranslatedName;
  components: readonly { key: string; role: NameRole; value: TranslatedName }[];
}
export function generateStructuredName(
  culture: Culture, input: StructuredNameInput, ctx: Context,
): StructuredName;
```

Rules:

- Absent `gender` uses `templates` unchanged, with no new child label or draw.
- Explicit gender selects `genderTemplates[gender][kind]` when supplied, else `templates[kind]`.
- `any` uses its explicitly authored pool or the base pool; it never concatenates gender pools.
- Never duplicate base entries to manufacture a fallback distribution.
- Existing `Sex = "male" | "female"`, `sex` exports and result shapes remain unchanged.
- New adapters may map explicit male→masculine and female→feminine without changing old exports.
- Do not infer gender from form, surname, culture, race, honorific or a parent name.
- Structured names render each generated slot using `ctx.child("slot:" + slot.key)`.
- Input slots consume no RNG; absent optional inputs disappear with their prefix/suffix.
- Missing required input is an error; optional does not mean a probabilistic inclusion roll.
- Parent inputs are supplied by the caller; the engine never invents a genealogy.
- Affixes in F1 are literal; B3 adds explicit morphology references under new descriptors.
- Duplicate slot keys, missing kinds and non-string affixes are validation errors.
- Full translation joins displayed component translations, including literal affixes.
- Surname is not assumed mandatory or synonymous with clan or patronymic.

Family-first plus matronymic example (a fictional convention, not an ethnographic assertion):

```json
{
  "family-first": {
    "separator": " ",
    "slots": [
      { "key": "house", "role": "clan", "source": { "type": "kind", "kind": "clan" } },
      { "key": "given", "role": "given", "source": { "type": "kind", "kind": "given" } },
      { "key": "mother", "role": "matronymic", "source": { "type": "input", "field": "mother" }, "prefix": "kin-", "optional": true },
      { "key": "epithet", "role": "epithet", "source": { "type": "kind", "kind": "epithet" }, "prefix": "the " }
    ]
  }
}
```

Honorific and patronymic use the same slots with different roles, affixes and inputs.
Order is entirely the authored slot order; no locale-dependent reorder happens behind the API.
New fantasy full-name generators select one culture and share it across slots.
They do not replace the legacy independently selected given/surname implementation.

## 5. F1: lexicon memoization without output changes

Cache construction work, never cache against culture ID alone.
Two objects can share an ID but differ in glyphs, meaning order or extensions.
Two roots can share a scope and still have different seeds.
`rng.state().origin` alone is insufficient: it is diagnostic text and can be ambiguous.

F1 adds `createLexiconCache({ maxEntries })` and an optional cache argument to `buildLexicon`.
`generateName` may use a bounded internal cache only for immutable culture snapshots.
`createWorld` owns an explicit cache with default capacity 128 lexicons and `clearCaches()`.
Standalone mutable cultures bypass shared caching unless the caller supplies a frozen snapshot.
No process-global unbounded seed→lexicon map is permitted.

Cache identity is the tuple:

1. Immutable culture object identity (resolved pack snapshots get distinct objects).
2. Fresh child-fork fingerprint derived by `ctx.child("lang:" + culture.id).rng.state()`.
3. Algorithm/profile ID and rendering-relevant context (locale only if cached results use it).

The fingerprint includes all four lanes, `algo`, origin and scope as separate encoded fields.
Use structured tuple serialization, not delimiter concatenation; never advance the caller RNG.
A fresh child state captures actual fork identity even if the supplied parent RNG was advanced.
Do not restore RNGs from diagnostic origins to compute a cache key.
The lexicon's own historical `lang:` and `word:` forks must remain exactly where they were.

Pre-index `byClass` without sorting, deduplicating or changing pack traversal order.
Memoize `formOf` per meaning ID as today; return copied/read-only arrays and maps.
Eviction affects time/memory only, never output or caller-visible collection mutation.
Tests compare cache enabled/disabled, cold/warm, same scope/different roots, same ID/different
culture snapshots, eviction, duplicate meanings, and materialization before/after name generation.
A microbenchmark reports repeated same-path and many-distinct-path costs separately.
Assert build counts/index reuse in CI; report timing, but avoid flaky wall-clock speed thresholds.
This refines F1's `(culture id, lexicon seed path)` shorthand into a collision-safe identity.

## 6. F2/N1: pack format v1, identity and schema

`*.pack.json` is UTF-8 JSON, no comments, trailing commas, duplicate object keys or executable code.
JSON Schema draft 2020-12 lives at `packages/packs/schema/pack-v1.schema.json`.
Sibling fragments: `culture-v1`, `table-v1`, `base-v1`, `dialect-v1`, `generator-v1` schemas.
Export them as `@lexiconlang/packs/schema/*.schema.json`; bundle all `$ref` targets locally.
Canonical `$id`: `https://lexiconlang.dev/schemas/pack-v1.schema.json`.
This is a schema identifier, not a promise of a hosted validation service.
Validation never needs the network; N1 vendors the exact same schema release and fixtures.
F3 owns table schema content, F2 owns embedding and schema publication.
If F3 lands first it publishes its fragment under `packages/tables/schema/table-v1.schema.json`.
F2 references that source at build time and bundles a copy; do not maintain divergent definitions.

```ts
type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type ResourceId = string; // <pack-id>/<resource-kind>/<local-id>
type PackId = string;     // e.g. lexiconlang.bases.norse or acme.sail
interface PackDependency { id: PackId; version: string }
interface Provenance {
  id: string;
  source: string; // URL or original:<author-or-project>, not a local absolute path
  title: string;
  creator: string;
  license: string;
  attribution: string;
  modifications: string;
  retrieved?: string; // YYYY-MM-DD, source acquisition only
  files: readonly string[]; // pack-relative paths, including manifest when inline
}
interface PackManifestV1 {
  $schema?: string;
  formatVersion: 1;
  id: PackId;
  version: string;
  license: string; // SPDX expression for aggregate distribution
  description: string;
  provenance: readonly Provenance[];
  depends: readonly PackDependency[];
  extends: readonly PackDependency[];
  requires: readonly string[]; // capability IDs, not npm packages
  cultures: readonly CultureData[];
  meaningPacks: readonly MeaningPackData[];
  grammars: readonly GrammarData[];
  tables: readonly TableData[];
  corpora: readonly CorpusData[];
  markovModels: readonly MarkovModelData[];
  generators: readonly GeneratorData[];
  bases?: readonly BaseData[]; // B1 capability
  dialects?: readonly DialectData[]; // B3 capability
  extensions?: Readonly<Record<string, Json>>; // namespaced, nonbehavioral metadata
}
interface WeightedData<T> { value: T; weight: number }
interface MeaningPackData {
  id: ResourceId;
  version: string;
  meanings: readonly Meaning[];
}
interface CultureData {
  id: ResourceId;
  extends?: ResourceId; // exactly one culture prototype, dependency must be declared
  glyphs?: GlyphSystem;
  meaningPacks?: readonly ResourceId[];
  templates?: Readonly<Record<string, readonly WeightedData<NameTemplate>[]>>;
  wordClasses?: readonly WordClassDefinition[];
  genderTemplates?: Partial<Record<Gender,
    Readonly<Record<string, readonly WeightedData<NameTemplate>[]>>>>;
  nameStructures?: Readonly<Record<string, NameStructure>>;
  capitalize?: "first" | "all" | "none";
  visualGlyphSystems?: Readonly<Record<string, VisualGlyphSystem>>;
  base?: ResourceId;
}
```

`CultureData` is an authoring DTO; its optional fields must resolve into a complete `Culture`.
All resources have a full ID; no implicit namespace expansion based on current import state.
Pack IDs: lowercase dot-separated tokens, each matching `[a-z][a-z0-9-]*`.
Resource kinds are fixed: `culture`, `meaning-pack`, `meaning`, `word-class`, `grammar`, `table`,
`corpus`, `markov`, `generator`, `base`, `dialect`; local IDs match `[a-z][a-z0-9-]*`.
Meaning IDs in new packs use `<pack>/meaning/<local>`; builtin legacy meaning IDs stay unchanged.
The `lexiconlang.*` prefix is reserved for maintained packages; third parties choose their namespace.
An npm package name and a pack ID are distinct; IDs never encode file paths or npm scopes.
A pack may only define resources under its own pack ID, except registered legacy adapters.
All references must be full IDs or explicitly documented legacy IDs in those adapters.
No relative ref, wildcard import, alias shadowing or first-match lookup is permitted.

## 7. Complete minimal manifest and remaining data descriptors

This small original pack is intentionally not a production genre pack (see quality bar).
It exercises literal names and tables without requiring a corpus or another pack.

```json
{
  "$schema": "https://lexiconlang.dev/schemas/pack-v1.schema.json",
  "formatVersion": 1,
  "id": "acme.sail",
  "version": "1.0.0",
  "license": "CC0-1.0",
  "description": "Original fictional sailing names and weather oracle",
  "provenance": [
    {
      "id": "original",
      "source": "original:acme",
      "title": "Sailing demo",
      "creator": "Acme",
      "license": "CC0-1.0",
      "attribution": "Original example authored for this specification",
      "modifications": "None",
      "files": ["sail.pack.json"]
    }
  ],
  "depends": [],
  "extends": [],
  "requires": ["language-v1", "tables-v1"],
  "cultures": [
    {
      "id": "acme.sail/culture/harbor",
      "glyphs": {
        "classes": { "C": ["m", "n", "s"], "V": ["a", "i", "o"] },
        "syllables": [["C V", 1]],
        "wordShapes": [["2", 1]]
      },
      "meaningPacks": [],
      "templates": {
        "given": [{ "value": { "kind": "literal", "form": "Mina", "translation": "Mina" }, "weight": 1 }],
        "ship": [{ "value": { "kind": "literal", "form": "Quiet Wake", "translation": "Quiet Wake" }, "weight": 1 }]
      }
    }
  ],
  "meaningPacks": [],
  "grammars": [],
  "tables": [
    {
      "id": "acme.sail/table/weather",
      "mode": "dice",
      "dice": { "count": 1, "sides": 6, "modifier": 0 },
      "entries": [
        { "key": "clear", "range": [1, 4], "result": { "type": "text", "text": "Clear horizon" } },
        { "key": "fog", "range": [5, 6], "result": { "type": "text", "text": "A bank of fog" } }
      ]
    }
  ],
  "corpora": [],
  "markovModels": [],
  "generators": [
    {
      "id": "acme.sail/generator/ship",
      "engine": "name-v1",
      "culture": "acme.sail/culture/harbor",
      "kind": "ship",
      "description": "A harbor ship name",
      "tags": ["ship"],
      "output": "translated-name-v1"
    }
  ]
}
```

Other descriptors use the following portable shapes, not runtime function-bearing objects:

```ts
interface GrammarData {
  id: ResourceId;
  start: string;
  rules: readonly { key: string; choices: readonly WeightedData<string>[] }[];
  maxDepth?: number;
}
interface CorpusData {
  id: ResourceId;
  provenance: readonly string[]; // IDs in this manifest's provenance array
  entries?: readonly { word: string; weight: number }[];
  asset?: { path: string; sha256: string }; // exactly one of entries/asset
}
interface MarkovModelData {
  id: ResourceId;
  corpus: ResourceId;
  asset: { path: string; sha256: string };
  profile: "markov-json-v1";
}
interface GeneratorMetadata {
  id: ResourceId;
  description: string;
  tags: readonly string[];
  output: "string" | "translated-name-v1" | "structured-name-v1" | "table-roll-v1";
}
type GeneratorData = GeneratorMetadata & (
  | { engine: "name-v1"; culture: ResourceId; kind: string; gender?: Gender }
  | { engine: "structured-name-v1"; culture: ResourceId; structure: string }
  | { engine: "grammar-v1"; grammar: ResourceId }
  | { engine: "table-v1"; table: ResourceId }
  | { engine: "markov-v1"; model: ResourceId }
);
```

`output` must match the selected engine; schema uses discriminated `oneOf` variants.
Grammar choices use `#...#` reference tokens and builtin modifiers only.
Rule keys are unique local tokens matching `[A-Za-z_][A-Za-z0-9_-]*` (no `.`, `/`, `<` or `>`).
Grammar external refs must name string-output generators by full ID in angle brackets.
The legacy TS parser splits a reference on top-level dots (`packages/grammar/src/parser.ts`),
so a bare `#acme.sail/generator/motto#` would read as symbol `acme` plus a modifier.
The portable profile therefore defines its own reference grammar instead of reusing that split:

```text
ref      = "#" head *( "." modifier ) "#"
head     = rule-key / "<" full-id ">"
modifier = name [ "(" [ arg *( "," arg ) ] ")" ]   ; args are trimmed literal strings
```

- `#rule#`, `#rule.capitalize#`: local rule key, then modifiers split on top-level `.`.
- `#<acme.sail/generator/motto>#`, `#<acme.sail/generator/motto>.capitalize.s#`: the bracketed
  head is read verbatim up to the first `>` and must match the full `ResourceId` syntax of
  section 6; modifiers attach only after the closing `>`.
- A `/` outside brackets (e.g. bare `#acme.sail/generator/motto#`), an unterminated `<`, an
  empty head, an unknown rule key/generator or an unknown modifier name is a `REFERENCE`
  diagnostic at validation time, never a symbol-plus-modifier reinterpretation.
- `\` escapes the next character as in the current parser; `<`, `>` need no escape outside refs.
- Modifier args are literal text only; refs inside args are not expanded in portable v1.
- F2 commits a shared parse fixture (template → normalized AST JSON or diagnostic code) covering
  local refs, bracketed full IDs with dotted pack IDs, chained modifiers with args, escapes and
  each rejection case; N1 asserts the same fixture rather than porting the TS split.

Unknown symbols/modifiers fail validation rather than leaking `((symbol))` placeholders.
Portable grammar choice sampling uses the v1 integer cumulative algorithm in section 10.
This is a new interpreter profile; never substitute it for existing TS grammar selection.
The root expansion uses `ctx.child("rule:" + start)`; each rule chooses at `child("select")`.
Within the selected text, nonliteral symbol occurrences use `child("slot:" + index)` then
`child("rule:" + symbol)`; index counts symbol occurrences only, starting at zero.
A nested rule repeats this procedure under its own context; literal text and modifiers draw nothing.
External string-generator refs use the slot child then `child("generator:" + fullId)`;
`fullId` is the bracket content without `<`/`>`, and modifiers draw nothing.
Portable v1 excludes assignment/actions and inline weighted-expression syntax; use named rules instead.
Builtin modifiers are the existing pure TS modifier functions, with no locale-sensitive variants;
N1 must match their behavior in fixtures or reject the capability, not silently approximate.
F2 freezes these labels in executable vectors, including recursion and modifier cases.
No inline functions, arbitrary modifiers, eval, module specifiers or dynamic imports occur in JSON.
Complex NPC objects remain typed TS composition in v1, not a speculative general-purpose IR.
A typed facade may expose both portable descriptors and separately registered trusted TS generators.
A host-only generator is explicitly marked nonportable in discovery and rejected by .NET if required.

Corpus assets are JSON arrays of `{word, weight}`; weights are positive safe integers.
Models use the existing `MarkovModelJSON` shape: `v:1`, order, min/maxLength, transitions,
optional forbidden and metadata. END remains JSON-escaped `\u0000`; never a literal NUL in JSON.
The portable profile sorts transition keys by ordinal UTF-16 code units before sampling.
Legacy TS models/samplers keep their historical enumeration order and algorithm.
N1 must assert portable model behavior against emitted TS vectors, not re-train on load.
Training options, source hash and trainer version belong in model metadata/provenance.
Build-time training is allowed; wall-clock timestamps and absolute source paths are not.

## 8. Dependencies, inheritance, collision rules and versions

`depends` makes resources available; it does not copy or modify any resources.
`extends` also makes packs available and authorizes explicit per-resource `extends` references.
It does not mean overlay every matching local ID or merge every field.
A dependency ID may appear in only one of the two lists.
Version constraints are deliberately limited to exact `x.y.z` or caret `^x.y.z`.
Caret follows SemVer, including the narrower `0.y.z` and `0.0.z` rules.
No tags, git URLs, workspace protocols, prereleases or arbitrary npm range expressions in v1.
Only one resolved version of a pack ID may exist per world; conflicts are errors.
Hosts provide exact installed packs; loaders do not fetch missing dependencies.
Persist a lock snapshot of pack IDs, exact versions, content hashes and capability versions.

Culture inheritance supports a single parent (which may itself extend another parent).
A complete child culture is registered under a NEW ID owned by the child pack.
Rules, applied after resolving the parent chain:

- Missing fields inherit; present `glyphs`, `meaningPacks`, `wordClasses` and visual systems replace.
- `templates` merges by name-kind key; a present choice array replaces that entire kind.
- `genderTemplates` merges by gender then kind; arrays replace, never concatenate implicitly.
- `nameStructures` merges by structure key; a present structure replaces the full structure.
- `capitalize` and `base` replace as scalar values.
- Empty optional arrays are allowed only where the resolved schema allows them.
- No null tombstones, deletion operators, JSON Pointer patches or implicit array append in v1.
- No resource inheritance for grammars, meanings or tables in v1: author a new full descriptor.

To extend vocabulary, publish a new meaning pack and explicitly list parent and child packs
in the new culture's replacement `meaningPacks` array. Ordering is intentional and visible.
Duplicate meaning IDs in resolved new cultures are rejected, not last-write-wins.
Legacy adapters alone preserve old duplicate/traversal semantics to avoid output drift.
All inheritance/dependency cycles fail at load time with the complete reference chain.

Duplicate resource IDs fail even if their values look identical.
`world.use` is idempotent only for the same pack ID, version AND verified content hash.
Same ID/version with different canonical content is an integrity error; never silently replace it.
Different versions of one pack ID conflict; construct another world to use another version.
No API globally overrides a previously registered generator under an existing ID.
A local customization gets a new pack/resource ID and explicit routing in the caller.
This keeps core registry duplicate rejection and makes registration order irrelevant.

`formatVersion` changes only for incompatible wire semantics; v1 remains readable indefinitely.
Unknown behavior fields and unknown capabilities fail closed, not best-effort execution.
`extensions` may carry ignored, namespaced metadata and MUST NOT influence generation.
Optional future fields need schema release plus explicit capability if they affect behavior.
New capabilities may be added under format 1; old loaders reject rather than misinterpret them.

Pack SemVer is separate from format and engine profile versions:

- Patch: docs, attribution corrections, nonbehavioral metadata only.
- Minor: new independent resource IDs, locales, kinds not read by existing generators.
- Major: changed existing output, order, weights, filters, glyphs, defaults or dependencies affecting output.
- Even a pack major MUST NOT repoint a legacy generator ID; publish a new generator ID.
- New output variants use local IDs such as `person-v2`; IDs never implicitly select latest behavior.
- Dependency range satisfaction alone is not replay evidence; save the exact lock snapshot.

## 9. F2: loader, registry and world API

Pack services sit above the existing core registry; core never imports packs or Node APIs.
Separate parsing/resolution from filesystem I/O so browser bundles remain tree-shakeable.

```ts
interface PackDiagnostic { code: string; pointer: string; message: string }
interface LoadedPack {
  readonly manifest: Readonly<PackManifestV1>;
  readonly hash: string;
  readonly dependencies: readonly LoadedPack[];
}
interface PackResolver {
  resolve(id: PackId, version: string): Promise<LoadedPack>;
  readAsset(pack: PackId, path: string): Promise<Uint8Array>;
}
interface LoadPackOptions { resolver?: PackResolver; maxBytes?: number }
export function definePack(manifest: PackManifestV1): LoadedPack;
export function loadPack(
  input: unknown, options?: LoadPackOptions,
): Promise<LoadedPack>;
export function validatePack(input: unknown): readonly PackDiagnostic[];
interface World {
  use(pack: LoadedPack): this;
  readonly registry: Registry;
  context(): Context;
  generate<T = Json>(id: string, key: string, options?: GenerateOptions): T; // section 16
  generateItem<T = Json>(id: string, key: string, index: number, options?: GenerateOptions): T;
  list(): readonly GeneratorDescriptor[];
  describe(id: string): GeneratorDescriptor;
  clearCaches(): void;
}
export function createWorld(options: { seed: Seed; locale?: string }): World;
```

`definePack` validates synchronously and freezes/copies an inline, asset-free manifest.
It permits unresolved resource references for subsequent `world.use` graph validation.
It rejects asset-backed descriptors; `loadPack` is the async path for those.
`loadPack` accepts a parsed object or JSON text, NOT an overloaded filesystem-path string.
`@lexiconlang/packs/node` adds `loadPackFile(path, options)` with an explicit trusted root.
A caller-provided resolver supplies dependencies and assets; default resolver refuses both.
`LoadedPack` includes normalized resources and verified asset bytes internally, not just metadata.
`world.use` walks its dependency graph (or reuses exact compatible packs already installed),
checks capabilities, resolves references and compiles into a temporary registry before committing
anything to the world. A `definePack` with unresolved dependencies requires those packs to be
installed first; a `loadPack` result carries the resolver-supplied closure.
On any error no partial generators, cultures, cache entries or pack locks become visible.
Concurrent I/O completion order must not affect compilation or selection arrays.
World inventory lists sorted IDs; data sampling follows authored array order.

`World.generate(id,key)` uses `context().child("generator:" + id).child("key:" + key)`.
There is no hidden counter; repeating the same ID, key and options yields the same result.
`World.generateItem(id,key,i,options)` uses that same path followed by `.child("item:" + i)`.
Its index is an integer 0–999, serialized in base 10 without padding; never encode `/item:` in key.
Both methods share validation/dispatch; `options` adds no child label and carries structured slots.
The tooling service calls `generateItem` for each batch item, including count 1; `generate` is
the unbatched library API, not an alias for item 0. Prefix and direct-library parity are tested.
`context()` supplies the world's seed/locale and registry without advancing a shared RNG.
Raw `registry.get(id).generate(ctx)` remains available and does not add world labels implicitly.
Discovery descriptors contain ID, pack/version, engine/profile, tags, input/output schema and portability.
Caller generic `T` is only a TS convenience; tool outputs are validated against the descriptor schema.
No global singleton world or auto-registration side effect on module import.

Proposed usage after F2 (not a runnable current-release example):

```ts
import { createWorld, loadPack } from "@lexiconlang/packs";
const world = createWorld({ seed: "campaign-7" });
const pack = await loadPack(jsonText);
world.use(pack);
const ship = world.generate("acme.sail/generator/ship", "harbor-1");
```

Security defaults: maximum manifest 5 MiB, total asset bytes 25 MiB, dependency depth 32,
resource count 10,000 per graph, and individual text/output length 64 KiB.
Enforce limits before expensive allocation; a trusted host may lower or explicitly raise them.
For assets reject absolute paths, `..`, backslashes, URL schemes and symlink escape from root.
Allow only regular JSON files beneath the trusted root; verify lowercase SHA-256 hex digests.
Reject prototype-pollution keys (`__proto__`, `prototype`, `constructor`) in keyed dictionaries.
Use own-property lookups or null-prototype maps; never assign parsed objects onto class instances.
No network, module execution, archive extraction, shell or arbitrary file-write capability in loaders.
Diagnostic codes include `SCHEMA`, `CAPABILITY`, `DEPENDENCY`, `CYCLE`, `COLLISION`, `INTEGRITY`,
`REFERENCE`, `LIMIT` and `LICENSE`; diagnostics carry JSON Pointers and deterministic ordering.

## 10. Portable deterministic profile and modern migration

Portable v1 uses the current Sfc32 transition and 12-step warmup, with uint32 wrapping.
Seeds on CLI/MCP and in portable fixtures are strings; `"42"` is not the numeric seed `42`.
Hash strings using current TS `fnv1a64` over UTF-16 code units, NOT UTF-8 FNV:
for each unit hash its low byte, and hash its high byte only when the unit exceeds 255.
Mix uses current SplitMix64 with modulo-2^64 arithmetic and current constants.
Fork derives from the parent's immutable numeric origin, never the parent's advanced lanes.
N1 must not parse diagnostic `origin` labels back into seed values to derive forks.
Wire RNG state import is excluded from portable v1 until origin round-trip parity is specified.
In-process TS `Seed`/`RngState` APIs remain available unchanged.

New portable integer weights are positive integers whose total is at most `2^32` (4294967296).
Current `Sfc32.nextInt` scales ONE uint32 draw (`packages/core/src/rng.ts`), so a larger total
(e.g. weights `[8589934591, 1]`, total `2^33`) cannot reach every roll; such totals are a
`LIMIT` diagnostic at validation, not a silently biased sampler. No multi-draw sampler in v1.
Portable bounded integers use `portableInt(n) = floor(nextU32() * n / 2^32)` evaluated in exact
integer arithmetic (64-bit unsigned product or BigInt), for `1 <= n <= 2^32`; every value in
`[0, n)` is reachable because the step `n / 2^32` is at most 1.
For `n <= 2^21` the binary64 product in `nextInt(0, n)` is exact, so TS may call `nextInt` there;
above `2^21` it must use the exact integer form. N1 implements only the exact integer form.
Selection: `roll = portableInt(total)` on the child RNG; take the first cumulative upper bound > roll.
Dice use `1 + portableInt(sides)`; arrays use `portableInt(length)` (both far below `2^21`).
F2 vectors include totals `2^21`, `2^21 + 1`, `2^32 - 1` and `2^32`, plus a rejected `2^32 + 1`.
No locale collation, floating weights, platform hash codes or unordered map sampling.
Strings are preserved as provided; no invisible Unicode normalization during loading or seeding.
Portable model transition sorting and JSON canonical hashing use ordinal UTF-16 key order.
Canonical content hashing sorts object keys, preserves arrays, and emits compact JSON with
JSON string escaping and finite safe-integer numeric values for behavioral data.
F2 must freeze canonical byte fixtures (including escapes and non-ASCII) before N1 copies them.
Hash covers normalized manifest plus verified asset hashes; `$schema` and `extensions` remain covered.
SHA-256 is integrity tooling, never a random seed or replacement for existing fork hashing.

F2's modern migration moves authored lists/grammar content to JSON but retains TS algorithms.
Expose a `modern.pack.json` resource bundle and a thin TS adapter, preserving array/object order.
The existing `personName`, phone, address and person composers stay trusted TS.
Do NOT claim that their outputs are reconstructible from the v1 generator descriptor union.
Portable modern descriptors may expose new IDs; legacy exports continue calling existing TS glue.
Legacy weighted grammar records must be reconstructed in identical iteration order for alias sampling.
Preserve every child label, string case transform, slice bound and exclusive-bound quirk.
Do not reorder anonymous-generator creation: module initialization order can affect chosen-ID forks.
Capture the full old export ID inventory and sample artifact before migrating, then compare bytes.
If synchronous JSON consumption is awkward in ESM, generate checked-in TS constants at build time
from JSON with a drift check; no runtime fs import and no duplicated hand-edited source of truth.

## 11. F3: tables, nested oracles and export boundaries

Tables are static resources; rolling them returns structured evidence as well as display text.
Oracle is a table with tags/usage description, not a separate probabilistic engine.

```ts
interface DiceSpec { count: number; sides: number; modifier: number }
type TableResult =
  | { type: "text"; text: string }
  | { type: "table"; table: ResourceId }
  | { type: "generator"; generator: ResourceId; field?: "form" | "translation" }
  | { type: "grammar"; grammar: ResourceId; template: string }
  | { type: "sequence"; parts: readonly { key: string; result: TableResult }[]; separator: string }
  | { type: "roll"; table: ResourceId; count: number; duplicates: "allow" | "reroll" };
interface TableEntry {
  key: string;
  weight?: number;
  range?: readonly [minInclusive: number, maxInclusive: number];
  result: TableResult;
}
interface TableData {
  id: ResourceId;
  description?: string;
  tags?: readonly string[];
  mode: "weighted" | "dice";
  dice?: DiceSpec;
  entries: readonly TableEntry[];
  maxDepth?: number;
  maxAttempts?: number;
}
interface TableRoll {
  table: ResourceId;
  entry: string;
  total?: number;
  dice?: readonly number[];
  text: string;
  children: readonly TableRoll[];
}
export function rollTable(table: TableData, ctx: Context): TableRoll;
```

Validation couples mode to fields (the implementation schema uses `oneOf`):
weighted mode requires positive integer weights, forbids ranges and dice;
dice mode requires dice and ranges, forbids weights.
Counts are 1–100, sides 2–1000, modifiers -1000–1000; results cover the entire attainable interval.
Ranges are inclusive, nonoverlapping, within bounds, with neither gaps nor duplicate entry keys.
`2d6` rolls two independent dice and sums them; ranges are not treated as uniform weights.
Standard d4/d6/d8/d10/d12/d20/d100 are shorthand accepted by CLI/importers, not manifest strings.
Every new dice sub-roll uses `ctx.child("die:" + index)`.
Weighted choice uses `ctx.child("select")`; entry rendering uses `ctx.child("entry:" + key)`.
Nested refs add `child("table:" + tableId)`; sequences use stable `part:<key>` children.
Repeated rolls use `roll:<index>` then `attempt:<retry>`; no shared parent RNG consumption.
Duplicate suppression compares `(table ID, selected entry key)`, not display text.
Retry count includes the first attempt; default 32, allowed 1–1000, exhaustion is explicit error.
Roll count is 1–100; nested expansion defaults to depth 16, hard host ceiling 64.
Static reference cycles are rejected; runtime depth/total-work limits still protect generated graphs.
A roll-twice entry targets a separate table (no self-cycle); sequence can also combine two refs.
No unbounded reroll, implicit missing-ref fallback or silent duplicate acceptance.
All generator/grammar nested calls share the same world registry and work budget.
Text is literal; interpolation occurs only in a `grammar` result, never by scanning every string.
Object generators need an explicit supported string field; invalid projections fail at validation.

```json
{
  "id": "acme.sail/table/encounter",
  "mode": "weighted",
  "entries": [
    { "key": "weather", "weight": 3, "result": { "type": "table", "table": "acme.sail/table/weather" } },
    { "key": "two-signs", "weight": 1, "result": { "type": "roll", "table": "acme.sail/table/weather", "count": 2, "duplicates": "reroll" } }
  ]
}
```

Exports are pure functions; serialization never consumes generation RNG.
`exportTable(table,{format:"markdown"|"csv"|"foundry",...})` returns text plus warnings.
Markdown/CSV use range or weight, key, text and a JSON result column for nonliteral payloads.
CSV uses UTF-8, RFC 4180 quoting, deterministic LF and guards spreadsheet formula injection
in display columns; the JSON result column preserves original data for lossless round trips.
Import accepts the documented emitted CSV/Markdown subset, not arbitrary prose/HTML tables.
Markdown escapes pipes/backslashes/newlines; unsupported input returns row-number diagnostics.

Foundry target is core RollTable JSON for Foundry v12; write a versioned exporter fixture.
Map name, formula, replacement, displayRoll and results with text/type/weight/range/drawn.
V1 default exports only static literal tables; dice formulas preserve NdM+K semantics.
Weighted tables use `1d<sum>` and contiguous ranges; reject sums outside target support.
Foundry does not execute LexiconLang grammar, generator refs or reroll semantics.
For dynamic tables either return `UNSUPPORTED_EXPORT` or require explicit seed-bound materialization.
Materialization records seed, pack lock and warnings; never pretend it is the original live oracle.
Do not invent Foundry document UUIDs; nested refs need an explicit host-provided UUID mapping.
Golden import/export fixtures must verify field shapes against the declared Foundry version.

## 12. F4: constraints, uniqueness and blocklists

`where(generator,predicate,{maxAttempts})` is a trusted TS helper; JSON gets no predicate code.
Each attempt uses `ctx.child("attempt:" + index)`; default 32, hard bound 1000.
Failure returns/throws a typed exhaustion error with attempts and generator ID, never a partial success.
`unique(generator,{key,maxAttempts})` keeps seen values in a caller-owned session, not globally.
Document whether uniqueness compares forms or full JSON; default string/form exact equality.
A batch's item contexts are fixed before retrying; retries for item 2 do not perturb item 3.
JSON blocklists are literal terms plus match policy (whole-token or substring), never regex code.
Normalize only filter comparisons (NFKC plus documented case folding), never generated output.
Pin normalization/case-fold policy and its Unicode data version for portable filtered profiles.
Before that parity exists, blocklist filtering is host capability `filter-v1`, not promised by N1 core.
No filter activates for legacy IDs; publish filtered variants or an explicit opt-in wrapper.
New published real-culture-inspired content must run the maintained safety blocklist in CI.
A blocklist is a defense layer, not proof of cultural safety or exhaustive profanity detection.

## 13. B1/B2: what a base is and where it lives

A base is a documented phonotactic/naming inspiration, not a nationality or a complete language.
It contains phoneme/glyph classes, weighted syllables/shapes, constraints, rendering conventions,
name structures and optional original/licensed corpus/model references.
It must work without a corpus; corpora must never be harvested from living people's records.
No base fixes alignment, intelligence, personality, occupation, moral character or race.

```ts
interface OrthographyData {
  id: string;
  mappings: readonly { from: string; to: string }[];
  unknown: "preserve" | "error";
}
interface BaseData {
  id: ResourceId;
  inspiredBy: string;
  scope: string; // region/period/style and deliberate simplifications
  glyphs: GlyphSystem;
  orthography: OrthographyData;
  romanization?: OrthographyData;
  templates: Readonly<Record<string, readonly WeightedData<NameTemplate>[]>>;
  nameStructures: Readonly<Record<string, NameStructure>>;
  corpus?: ResourceId;
  provenance: readonly string[];
  sensitivity: { framing: string; exclusions: readonly string[]; review: string };
}
```

Orthography maps token strings, longest match first, ties by authored array order.
Unknown defaults must be explicit; rendering has no random component.
`CultureData.base` supplies base defaults before culture inheritance overrides them.
Resolution order: base defaults → parent culture resolved fields → child explicit fields.
A culture must not specify a different base from its inherited parent in v1; derive a new root instead.
Base defaults do not inject genre meanings; the culture lists those explicitly.

One maintained npm package `@lexiconlang/bases`, with independently importable/data-exported bases:

```text
packages/bases/
  src/index.ts                 types/registry helpers only, no eager import of every base
  src/norse.ts                 typed facade for one base pack
  data/norse/norse.pack.json
  data/norse/PROVENANCE.md
  data/norse/LICENSES/          attribution/license evidence for included assets
  data/norse/corpora/           optional, never fetched at runtime
  schema/                      base schema source consumed by F2 bundling
  README.md
```

`@lexiconlang/bases/norse` exports the loaded inline pack/factory; `@lexiconlang/bases/data/norse`
exports the raw JSON. Corpus-backed facades load assets only through explicit async loaders.
Do not import the aggregate index from genre packages to reach a single base.
Pack IDs are `lexiconlang.bases.<slug>`; base IDs append `/base/default`.
A base's default `given` literal/templates are required, but surnames are not universal.
A fictional culture instantiates a base with new meaning packs and its own ID, preserving source notes.

B1 slugs: `norse`, `celtic`, `latin`, `greek`, `japanese`, `arabic`.
B2 slugs: `slavic`, `old-english`, `persian`, `sanskrit`, `mandarin`, `nahuatl`, `yoruba`,
`polynesian`, `ancient-egyptian`, `finnish`.
Broad roadmap labels are package-discovery categories, not claims of cultural uniformity.
Each broad base must choose a narrow scope before shipping, e.g. Celtic: Old Irish-inspired;
Slavic: Old East Slavic-inspired; Polynesian: a documented Māori-inspired fictional sound palette.
Old English is not a generic Germanic blend; Sanskrit is not all Indic languages.
Do not synthesize a pan-cultural naming convention from the broad label.
If adequate sources/review are unavailable, ship an explicitly fictional base or block that base,
not an unsourced claim of authenticity; changing the promised real-inspired scope needs Ian's decision.

Licensing decision: code facades MIT; new original pack data SHOULD be CC0-1.0.
Data MAY be public domain, CC0 or CC-BY-4.0 with source-specific attribution and evidence.
This explicitly broadens ROADMAP's PD/CC0-only base-corpus sentence to the card's CC-BY allowance.
No NC, ND, incompatible share-alike, unknown-license scraped lists or “found online” provenance.
Public-domain assertions record jurisdiction/basis; accessible old scans are not automatically PD.
Every shipped file maps to provenance; derived models retain corpus attribution and modification notes.
A compiled model does not wash away source restrictions; attribution ships in npm and .NET distributions.
Preserve license texts, source title/creator/URL, acquisition date and changes for CC-BY assets.
Do not redistribute a source merely because its phonology was described in a copyrighted book.

Sensitivity requirements:

- Describe content as “inspired by …; fictional, simplified; not a linguistic reference”.
- Do not map a living ethnicity to a monstrous species or assign cultural moral stereotypes.
- Exclude sacred/restricted names, ceremonial material and ethnic slurs from shipped data.
- Use fictional deity/pantheon content by default; public-domain mythology still needs contextual review.
- Maintain explicit exclusions and a reviewed blocklist; never print offensive examples in docs.
- Record review scope and limitations honestly; do not invent community endorsement or consultation.
- Provide a report/removal route and provenance corrections; output-changing fixes get new profile IDs.
- A necessary safety takedown may withdraw a pack version; never silently mutate published artifacts.

## 14. B3/B4: dialect derivation interface, not an engine implementation

B3 owns matching/rewriting internals; this section freezes data boundaries only.
Sound changes apply to token sequences before orthography; never to rendered SVG or translations.
Rules are ordered, deterministic, nonrecursive per pass, and contain no JS/.NET regex syntax.

```ts
interface SoundChangeRule {
  key: string;
  from: readonly string[];
  to: readonly string[];
  before?: readonly string[];
  after?: readonly string[];
}
interface MorphologyRule {
  key: string;
  operation: "prefix" | "suffix";
  tokens: readonly string[];
}
interface DialectData {
  id: ResourceId;
  parent: ResourceId; // base or dialect, acyclic
  soundChanges: readonly SoundChangeRule[];
  orthography?: OrthographyData;
  morphology?: readonly MorphologyRule[];
}
/** Lexicon that retains the token sequence behind each form (B3 adds it to base lexicons). */
interface TokenLexicon extends Lexicon {
  tokensOf(meaningId: string): readonly string[];
  readonly orthography: OrthographyData; // resolved, immutable renderer data, including fallback
}
interface DerivedLanguage extends TokenLexicon {
  readonly id: ResourceId;     // the dialect's ID; also returned as cultureId
  readonly parent: ResourceId; // base or dialect ID it was derived from
  inflect(form: string, ruleKey: string): string;
}
export function deriveDialect(
  parent: TokenLexicon, data: DialectData, ctx: Context,
): DerivedLanguage;
```

`DerivedLanguage` satisfies the current `Lexicon` interface (`cultureId`, `formOf`, `byClass`,
`materialize`) plus `tokensOf`, so a derived dialect can be passed back to `deriveDialect`.
This is what makes `DialectData.parent` naming another dialect typable: the world resolves the
chain root-first (base lexicon, then each dialect in order) and passes each result as the next
`parent`. Members of a derived language:

- `cultureId` equals the dialect `id`, so caches and provenance never conflate it with its parent.
- `tokensOf(m)` applies this dialect's sound changes to `parent.tokensOf(m)`; changes compose in
  chain order and never re-sample or re-split romanized strings.
- `orthography` is `data.orthography ?? parent.orthography`; base/synthetic parents supply it too.
- `formOf(m)` renders `tokensOf(m)` with this resolved mapping under section 13's matching rules.
- `byClass` returns the parent's meanings, same set and order; dialects never add or drop meanings.
- `materialize()` maps the same meaning IDs, in the parent's iteration order, to derived forms.
- `inflect` applies this dialect's `morphology` rules only; parent rules are not inherited in v1.

A plain `Lexicon` without tokens/orthography is not a valid parent; B3 tests cover a two-level
chain, a rejected cycle, and changed tokens rendered through inherited versus overridden mappings.

Initial rules match literal tokens; richer class/boundary notation requires a later explicit capability.
Empty `from` is forbidden; empty `to` expresses deletion; absent context matches anywhere.
B3 must document scan direction/overlap behavior and freeze vectors before declaring its capability ready.
A dialect derives the parent's same world/meaning forms, not a newly sampled unrelated lexicon.
`ctx` supplies identity/provenance and future opt-in variants; initial rewriting draws no randomness.
Lexicons need internal token retention for derivation; don't guess phonemes by splitting romanized strings.
B1 does not depend on B3: ship identity/basic literal orthography first, no promised sound-change engine.
B3 does not depend on the base catalog: tests use synthetic token lexicons.
B4 is additive gloss data plus explicit locale rendering as defined in section 3.
Locale pack dependencies do not alter `meaning.id`, candidate order or phonotactics.

## 15. P1–P13: genre package template and quality bar

Existing `@lexiconlang/fantasy`, `@lexiconlang/scifi`, `@lexiconlang/modern` stay named as they are.
New packages use `@lexiconlang/<genre-slug>` and packs `lexiconlang.<genre-slug>`.
No package per individual generator and no universal umbrella importing all genres.
A genre `depends` on specific base pack IDs only when it actually references those resources.
Reusable engines remain in foundation packages; genre content is JSON plus a thin typed TS facade.
TS-only composites remain visibly nonportable until a later descriptor format supports them.

```text
packages/<genre>/
  data/<genre>.pack.json
  data/PROVENANCE.md
  data/LICENSES/
  src/index.ts                 selective exports and typed composition
  src/<genre>.test.ts
  README.md
examples/<genre>.ts            executable seed/key-based example
 docs-site/packages/<genre>.md  (without the leading space in the actual path)
```

| Card | Slug / existing package | Required content focus | Required bases |
| --- | --- | --- | --- |
| P1 | fantasy | human culture variants, taverns, spells, rarity-bearing items, pantheons, guilds, rumors, oracles | selected B1 bases |
| P2 | cyberpunk | handles, corps, gangs, implants, jobs and street encounters | none by default |
| P3 | horror | investigators, locations, entities, omens and cosmic mysteries | none by default |
| P4 | post-apocalyptic | survivors, settlements, scavenged gear, factions and hazards | none by default |
| P5 | mythology | fictional deities, domains, pantheons, relics and myth hooks | selected B1/B2 bases |
| P6 | wuxia | names, sects, techniques, treasures and cultivation hooks | B2 mandarin |
| P7 | steampunk | inventors, engines, societies, districts and gaslamp hooks | none by default |
| P8 | pirates | ships, crews, ports, cargo and sea encounters | none by default |
| P9 | weird-west | settlements, aliases, relics, rumors and frontier anomalies | none by default |
| P10 | grimdark | warbands, heresies, plagues, ratfolk clans and grim omens | none by default |
| P11 | supers | heroes, villains, powers, origins and incidents | none by default |
| P12 | espionage | codenames, callsigns, agencies, operations and mission hooks | none by default |
| P13 | historical-medieval | people, manors, heraldic blazons and domain events | selected B1 bases |

Packages without B dependencies use original fictional phonotactics or existing declared content;
they must not covertly import a base just to avoid declaring the graph dependency.
Adding base-dependent content to P2/P3/etc. explicitly amends that card's prerequisites first.
P5/P6 must not present invented language strings as accurate historical/religious terminology.
Weird West must avoid Indigenous caricatures; horror must not equate disability with monstrosity.
P10's fictional plagues and heresies must not target living ethnic/religious communities.
P13 blazons expose structured fields and document supported heraldic rules; no universal accuracy claim.

Minimum release bar for each genre card:

1. At least five distinct useful generator families and two tables/oracles covering its promised scope.
2. Every advertised focus in the table is implemented or explicitly deferred with Ian's approval.
3. At least 20 authored alternatives per primary family (or a justified smaller structured domain).
4. No empty pools, unresolved refs, duplicate IDs, accidental copied corpus text or unbounded recursion.
5. At least three fixed seed vectors per public generator plus a 1,000-key quality sample per family.
6. Samples checked for empty/garbled output, unwanted repeats, blocklist hits and genre coherence.
7. Quantify duplicate rate; don't impose a universal uniqueness target on tiny intentional vocabularies.
8. Structured item rarity and other distributions use documented weights, not claimed game balance.
9. A runnable example, package README and docs-site page show imports, seed/key, output shape and license.
10. JSON Schema validation, provenance inventory, package export checks, tree-shaking smoke test and changeset.
11. All inherited legacy IDs retain byte-identical output; new behavior has new IDs.
12. Explain portability limits and include shared-data fixtures for supported portable generators.

P1 fixes the human placeholder only through new IDs such as `lexiconlang.fantasy/generator/human-name-v2`.
Keep old `fantasy.givenName`, `fantasy.fullName`, NPC and settlement descendants unchanged.
Do not silently fix the independent-race inconsistency in existing full names either.
New structured-name generators choose a culture once, then pass it to all components.
Old exports may be documented as legacy; no removal, alias repointing or sample regeneration in this program.

## 16. T1/T2/T3: CLI, shared tooling service and MCP

T1 adds `validate-pack`, `generate`, `list`, `describe`, `roll`; keep existing commands working.
F2 owns `validate-pack` first; T1 must reuse, not reimplement it.
Use repeated `--pack <trusted-path>` inputs (parser must explicitly support repeats).
No automatic npm install, remote URL packs, working-directory scan or arbitrary module execution.
Bundled builtins are an explicit allowlist; hosts may opt in additional local packs.

```text
lexiconlang validate-pack ./sail.pack.json --json
lexiconlang list --pack ./sail.pack.json --json
lexiconlang describe acme.sail/generator/ship --pack ./sail.pack.json --json
lexiconlang generate acme.sail/generator/ship --pack ./sail.pack.json --seed campaign-7 --count 3 --json
lexiconlang roll acme.sail/table/weather --pack ./sail.pack.json --seed campaign-7 --count 2
lexiconlang roll acme.sail/table/weather --pack ./sail.pack.json --format foundry
```

With `--format foundry`, roll exports the static table definition, not sampled results.
Markdown/CSV export modes likewise distinguish definition exports from generation result rendering.
`--json` means one versioned machine response, not log lines mixed with JSON.
`--format json|md|csv` renders result batches; conflicting `--json`/non-JSON format is an error.
Default text output is human-facing, not a stable parsing API.
Explicit seed is required for generate/roll sampling; count defaults 1, allowed 1–1000.
Optional `--key` defaults `batch`; item i uses `key:<key>/item:<i>` as separate child labels.
Batch prefix stability: count 10's first three items equal count 3's first three items.
Tooling does not call the counter-based legacy convenience API to generate batches.
Exit codes: 0 success, 1 I/O/internal error, 2 invalid request/schema/ref, 3 bounded exhaustion.
Errors go to stderr (machine JSON if requested); no partial stdout batch on failure.

```ts
/** JSON-safe caller value for a structured-name `input` slot; no functions or glyphs. */
interface NameValueData {
  form: string;
  translation: string;
  language?: string; // defaults to the generator's culture ID
  parts?: readonly { form: string; meaning: string }[];
}
interface GenerateOptions {
  gender?: Gender;
  structure?: string;
  values?: Readonly<Record<string, NameValueData>>; // keyed by NameSlot source.field
}
interface GenerateRequest {
  id: string;
  seed: string;
  key?: string;
  count?: number;
  locale?: string | null; // omitted inherits host default; null explicitly disables it
  options?: GenerateOptions;
}
interface GenerateResponse {
  version: 1;
  generator: string;
  seed: string;
  key: string;
  locale: string | null; // effective requested/world locale; null = legacy English fallback
  options: GenerateOptions; // normalized echo, {} when absent
  packLock: readonly { id: string; version: string; hash: string }[];
  items: readonly Json[];
  warnings: readonly string[];
}
interface ToolError {
  version: 1;
  code: string;
  message: string;
  diagnostics?: readonly PackDiagnostic[];
}
```

All request options are checked against the generator's input schema; unknown options are errors.
A `structured-name-v1` descriptor's input schema lists `options.values` with one property per
`input` slot `field` of its structure: required for non-optional slots, optional otherwise,
`additionalProperties: false`. Other engines declare no `values`, so supplying it is an error.
The service converts each `NameValueData` to a `TranslatedName` (adds `toString`, defaults
`language`) and passes it as `StructuredNameInput.values`; missing required values exit 2.
Values consume no RNG and do not alter child labels; one request's values apply to every item.
CLI: `--values-json '<object>'` or `--values-file <trusted-path>` (mutually exclusive), parsed
as `options.values`. MCP `generate` takes the same `options.values` object in its arguments.
Each value string obeys the 64 KiB text limit; the object has at most one entry per input field.
The service uses explicit request locale (null disables it), else host default, else legacy English.
It constructs the request world with that locale; both library dispatch methods inherit its context.
`GenerateResponse.locale` echoes this effective selection, not a per-meaning fallback language.
Replay uses it explicitly (null means no locale, ignoring host defaults), plus options and pack lock.
CLI `--locale` maps to request locale. B4 tests defaulted/explicit locales and mixed-gloss fallback replay.
Tooling response serialization omits `toString` functions and preserves form/translation/parts.
Object key order is canonical for byte fixtures; no timestamps or machine paths in deterministic output.
T1 locates shared service code in `@lexiconlang/packs/tooling` (no process/stdout imports).
CLI and MCP are adapters, not two generator registries or independent sampling implementations.

T2 publishes `@lexiconlang/mcp`, stdio transport initially, separate opt-in package.
Tool names: `list_packs`, `list_generators`, `describe`, `generate`, `roll_table`, `build_language`.
`generate` uses the same request and response schemas as T1; `roll_table` returns table-roll items.
List/describe use stable pagination with sorted full IDs and a bounded limit (default 100, max 1000).
`build_language` takes base/culture ID, string seed and a bounded list of meaning IDs;
it returns a materialized glossary and metadata, not executable code, filesystem writes or training.
An arbitrary caller-supplied pack path is not an MCP argument; server startup owns the allowlist.
Output schemas live in `packages/packs/schema/tooling-v1.schema.json`, reused by CLI and MCP.
Enforce request byte, count, expansion-depth and total-work limits; emit progress only on stderr.
MCP protocol errors and generation errors use documented separate envelopes with machine-readable codes.
The MCP SDK is justified only in the MCP package; never add it to core or every genre package.
T3 authoring docs/playground use the same schema and inline loader; no Node fs in browser bundles.

## 17. Compatibility checklist and executable verification requirements

Existing IDs are permanent behavior identifiers, not “best current implementation” aliases.
Bug fixes that change their bytes require a new ID or explicit opt-in profile.
Compatibility includes translation, array order, object fields, child labels and convenience call sequence.
Do not insert gender, filtering, base selection, normalization or extra nesting into old paths.
Sibling independence means every NEW independent sub-roll gets a stable `ctx.child` key.
This does not authorize rewriting old positional/counter-based APIs and changing their results.

Every foundation PR runs the unmodified root install/typecheck/build/test commands.
The current root determinism suite compares repeated executions; it is not by itself a complete
cross-release golden oracle. The sample suite writes artifacts, not a universal no-drift assertion.
Therefore implementers must also compare baseline vs branch samples and add separate legacy fixtures.
Never use `UPDATE_GOLDEN` or regenerate existing expectations to make expansion pass.
Add new profile goldens in new fixtures, with provenance explaining their version and input locks.

Required targeted fixture groups:

- F1 compile tests for known/custom kinds, typo failures for captured literal cultures, old assignability.
- Legacy cold/warm cache equivalence and input immutability; structured input/gender fallback cases.
- F2 valid/invalid manifests, unknown fields/capabilities, duplicate JSON keys, unsafe keys/paths.
- F2 dependency conflicts/cycles, resource cycles, atomic rollback and pack installation order.
- F2 modern before/after export IDs, name/person results and complete sample artifact byte comparison.
- F3 all dice-range boundaries, 2d6 frequency weighting, retries, nested budgets and exporter round trips.
- F4 attempt path stability, impossible uniqueness, opt-in filtering and no cross-session state leaks.
- B1/B2 provenance coverage, scope disclaimer, no-corpus generation and authored structure examples.
- B3 synthetic token changes, orthography overlap vectors and parent/dialect form relationship.
- B4 locale fallback and invariant conlang forms/meaning selection.
- T1/T2 identical JSON response for identical service requests; batch-prefix and concurrency independence.
- N1 same packs/assets, schema acceptance/rejection and canonical output bytes on TS and .NET.

N1 vectors include empty/ASCII/accented/supplementary-plane seed strings, nested forks after parent
advancement, boundary dice, cumulative choices, grammar recursion/modifiers, Unicode names and models.
Include intermediate uint32 draws and form/translation outputs to localize parity failures.
Vectors record engine profile, exact packs/hashes, seed, path label array, inputs and expected JSON.
TS emits reviewed, committed vectors; .NET asserts them. Do not make each side emit its own expected values.
No assertion of full legacy TS/.NET parity is made until those paths have actual matching vectors.
Unsupported engine capabilities must fail explicitly in C#, never substitute an approximate generator.

## 18. Ordered implementation sequence and program.yaml alignment

All prerequisite PRs must be MERGED, not merely published, before dependent work is released.
The board coordinator owns those releases; S0 does not edit external program files.
The following order respects current `program.yaml`; independent rows may run concurrently.

| Stage | Cards | Prerequisites / ownership boundary |
| --- | --- | --- |
| 0 | M1, S0 | maintenance is independent; S0 establishes this contract |
| 1 | F1, F3 | both after S0; F3 owns standalone table schema, avoids F1 files |
| 2 | F2, F4, B3 | after F1; F2 bundles F3 schema when available; B3 uses synthetic bases |
| 3 | B1, B4, N1 | B1 after F1+F2; B4 and N1 after F2 |
| 4 | B2 | after B1 |
| 5 | P1, P13 | after F2+F3+B1 |
| 5 | P2/P3/P4/P7/P8/P9/P10/P11/P12 | after F2+F3, original content needs no base prerequisite |
| 6 | P5, P6 | P5 after F2+F3+B1+B2; P6 after F2+F3+B2 |
| 3+ | T1, T3 | after F2+F3, no genre dependency; use synthetic or modern demo pack |
| 4+ | T2 | after T1; consumes the same packs/tooling service |

No mandatory graph edge is added by this spec.
If F2 merges before F3, reserve `tables-v1` but reject nonempty tables without that capability;
its schema build bundles the agreed fragment once F3 lands, before genre/T1 release.
F3 can test standalone tables with a supplied registry without depending on F2's runtime.
N1 after F2 covers installed capabilities; add F3/B3 vectors later without falsely claiming initial parity.
B3 after F1 delivers interfaces/engine against synthetic data; B1 does not wait for its catalog integration.

Explicit refinements/amendments to card shorthand:

1. F1 cache key includes immutable snapshot and fork fingerprint, not just culture ID/scope string.
2. F2 modern proof is shared JSON DATA plus unchanged TS glue, not every modern composite in JSON.
3. B1/B2 permit properly attributed CC-BY-4.0 corpora as allowed by the hard card license constraint.
4. P1 human “fix” is new opt-in IDs; legacy placeholder behavior stays frozen.
5. F3 dynamic Foundry export is explicit materialization/unsupported error, not lossless live execution.
6. N1 parity starts with shared portable capabilities and vectors, not an untested whole-port guarantee.
7. S0 is docs-only: no published package/API changed, so no package changeset or implemented-API guide
   is appropriate here; implementation cards own those release artifacts and runnable new-API examples.

## 19. Acceptance and change control

S0 acceptance: this spec plus root architecture map, local full suite green, documentation-only diff,
App-authored PR, exact-head CI, substantive Copilot review (or Ian-approved explicit exception),
then Ian's exact-head approval and verified merge before releasing foundation cards.
Proposed signatures and examples remain visibly future-facing until their implementation lands.
No new runtime dependency is authorized solely by listing a package here.
F2 should justify a standards-compliant validator choice in its PR; hand-written partial validation
must not masquerade as JSON Schema 2020-12 compliance. Keep schema/validation tooling separable.

Any implementation discovering incompatible requirements updates this spec in the SAME PR,
identifies affected cards and migration impact, and obtains architectural review before relying on it.
Do not let sibling cards silently choose different manifest fields, namespaces, matching semantics,
seed paths or schema locations. File ownership hotspots belong in board comments and handoffs.
Behavioral additions require fixture evidence; review discussion alone is not a determinism test.
