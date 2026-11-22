import { createContext, createRegistry, type Context, type Generator, type Registry, type Seed } from "@lexiconlang/core";
import { generateStructuredName, generateName, freezeCulture, type Culture, type Gender, type NameTemplate as LanguageNameTemplate, type TranslatedName } from "@lexiconlang/language";
import { END, START, type MarkovModelJSON } from "@lexiconlang/markov";
import { decodeUtf8 } from "./hash.js";
import { portableGrammar, portableInt, validateGrammar } from "./grammar.js";
import { rollTable, validateTable, type TableHost, type TableRoll } from "./table.js";
import { PackValidationError, type BaseData, type GeneratorData, type GeneratorDescriptor, type GenerateOptions, type Json as PackJson, type LoadedPack, type PackManifestV1, type World } from "./types.js";
import { satisfies, validatePack } from "./pack.js";
import { RESOURCE_MAX_COUNT, dedupe } from "./validate.js";

type AnyRecord = Record<string, unknown>;

interface Installation {
  pack: LoadedPack;
  resourceIds: Set<string>;
}

interface WorldState {
  registry: Registry;
  descriptors: Map<string, GeneratorDescriptor>;
  installed: Map<string, Installation>;
  cultures: Map<string, Culture>;
  bases: Map<string, BaseData>;
  grammars: Map<string, Extract<PackManifestV1["grammars"][number], { rules: unknown }>>;
  tables: Map<string, PackManifestV1["tables"][number]>;
  generators: Map<string, GeneratorData>;
  compiled: Map<string, Generator<unknown>>;
  externalString: Map<string, Generator<string>>;
  tableHost: TableHost;
}

export interface CreateWorldOptions {
  seed: Seed;
  registry?: Registry;
}

export function createWorld(options: CreateWorldOptions): World {
  const state: WorldState = {
    registry: options.registry ?? createRegistry(),
    descriptors: new Map(),
    installed: new Map(),
    cultures: new Map(),
    bases: new Map(),
    grammars: new Map(),
    tables: new Map(),
    generators: new Map(),
    compiled: new Map(),
    externalString: new Map(),
    tableHost: undefined as unknown as TableHost,
  };
  state.tableHost = {
    table: (id) => {
      const table = state.tables.get(id);
      if (!table) throw new PackValidationError([{ code: "REFERENCE", pointer: `/tables/${id}`, message: `unknown table ${id}` }]);
      return table;
    },
    generator: (id) => {
      const gen = state.compiled.get(id);
      if (!gen) throw new PackValidationError([{ code: "REFERENCE", pointer: `/generators/${id}`, message: `unknown generator ${id}` }]);
      return gen;
    },
    expandGrammar: (id, template, ctx) => {
      const grammar = state.grammars.get(id);
      if (!grammar) throw new PackValidationError([{ code: "REFERENCE", pointer: `/grammars/${id}`, message: `unknown grammar ${id}` }]);
      return portableGrammar(grammar, (ref) => state.externalString.get(ref) ?? state.compiled.get(ref) as Generator<string>).expandTemplate(template, ctx);
    },
  };

  const world: World = {
    use(pack: LoadedPack): World {
      install(state, pack);
      return world;
    },
    get registry() { return state.registry; },
    context(): Context {
      return createContext({ seed: options.seed, registry: state.registry });
    },
    generate<T = PackJson>(id: string, key: string, genOptions: GenerateOptions = {}): T {
      return generateAt(state, options.seed, id, key, genOptions, undefined) as T;
    },
    generateItem<T = PackJson>(id: string, key: string, index: number, genOptions: GenerateOptions = {}): T {
      return generateAt(state, options.seed, id, key, genOptions, index) as T;
    },
    list() { return [...state.descriptors.values()].sort((a, b) => a.id.localeCompare(b.id)); },
    describe(id: string) {
      const descriptor = state.descriptors.get(id);
      if (!descriptor) throw new PackValidationError([{ code: "REFERENCE", pointer: `/generators/${id}`, message: `unknown generator ${id}` }]);
      return descriptor;
    },
    clearCaches() { /* generation draws from fresh derived contexts; no mutable caches */ },
  };
  return world;
}

function fail(diagnostics: readonly { code: "SCHEMA" | "CAPABILITY" | "DEPENDENCY" | "CYCLE" | "COLLISION" | "INTEGRITY" | "REFERENCE" | "LIMIT" | "LICENSE"; pointer: string; message: string }[]): never {
  throw new PackValidationError(dedupe(diagnostics));
}

function install(state: WorldState, pack: LoadedPack): void {
  const diagnostics = validatePack(pack.manifest);
  if (diagnostics.length > 0) fail(diagnostics);
  const prior = state.installed.get(pack.manifest.id);
  if (prior) {
    if (prior.pack.hash === pack.hash) return;
    if (prior.pack.manifest.version === pack.manifest.version) {
      fail([{ code: "INTEGRITY", pointer: "", message: `conflicting content for ${pack.manifest.id}@${pack.manifest.version}` }]);
    }
    fail([{ code: "COLLISION", pointer: "", message: `pack ${pack.manifest.id} already installed at ${prior.pack.manifest.version}` }]);
  }
  const resolvedDeps = pack.dependencies;
  // Declared dependencies must already be installed in the world. This is the
  // "install base before child" contract documented in authoring-packs.md and
  // applies equally to definePack() (which has no resolver) and loadPack().
  // When the pack carries resolver-resolved dependency hashes, verify them too.
  for (const [i, dep] of [...pack.manifest.depends, ...pack.manifest.extends].entries()) {
    const installed = state.installed.get(dep.id);
    if (!installed) {
      fail([{ code: "DEPENDENCY", pointer: `/depends/${i}`, message: `install ${dep.id}@${dep.version} before ${pack.manifest.id}` }]);
    }
    if (!satisfies(installed.pack.manifest.version, dep.version)) {
      fail([{ code: "DEPENDENCY", pointer: `/depends/${i}`, message: `${dep.id}@${installed.pack.manifest.version} does not satisfy ${dep.version}` }]);
    }
    const known = resolvedDeps.find((d) => d.manifest.id === dep.id);
    if (known && known.hash !== installed.pack.hash) {
      fail([{ code: "INTEGRITY", pointer: `/depends/${i}`, message: `installed ${dep.id} does not match the dependency hash resolved for ${pack.manifest.id}` }]);
    }
  }

  const staged = {
    cultures: new Map(state.cultures),
    bases: new Map(state.bases),
    grammars: new Map(state.grammars),
    tables: new Map(state.tables),
    generators: new Map(state.generators),
    compiled: new Map(state.compiled),
    externalString: new Map(state.externalString),
    descriptors: new Map(state.descriptors),
  };

  const claim = (id: string, pointer: string) => {
    if (staged.descriptors.has(id) || staged.cultures.has(id) || staged.bases.has(id) || staged.grammars.has(id) || staged.tables.has(id) || staged.generators.has(id)) {
      fail([{ code: "COLLISION", pointer, message: `resource id ${id} is already installed` }]);
    }
  };
  for (const [i, base] of (pack.manifest.bases ?? []).entries()) claim(base.id, `/bases/${i}/id`);
  for (const [i, culture] of pack.manifest.cultures.entries()) claim(culture.id, `/cultures/${i}/id`);
  for (const [i, grammar] of pack.manifest.grammars.entries()) claim(grammar.id, `/grammars/${i}/id`);
  for (const [i, table] of pack.manifest.tables.entries()) claim(table.id, `/tables/${i}/id`);
  for (const [i, generator] of pack.manifest.generators.entries()) claim(generator.id, `/generators/${i}/id`);
  if (state.installed.size + 1 > RESOURCE_MAX_COUNT) fail([{ code: "LIMIT", pointer: "", message: "too many packs in world" }]);

  for (const base of pack.manifest.bases ?? []) staged.bases.set(base.id, base);
  for (const grammar of pack.manifest.grammars) staged.grammars.set(grammar.id, grammar);
  for (const table of pack.manifest.tables) staged.tables.set(table.id, table);
  for (const generator of pack.manifest.generators) staged.generators.set(generator.id, generator);

  const basePointers = new Map((pack.manifest.bases ?? []).map((base, i) => [base.id, `/bases/${i}`]));
  const resolveBase = (id: string, pointer: string): BaseData => {
    const base = staged.bases.get(id) ?? state.bases.get(id);
    if (!base) fail([{ code: "REFERENCE", pointer, message: `unknown base ${id}` }]);
    return base;
  };
  /** Culture-shaped defaults from a base descriptor (glyphs + templates + structures). */
  const baseDefaults = (base: BaseData, pointer: string): AnyRecord => ({
    glyphs: toGlyphSystem(base.glyphs, `${pointer}/glyphs`),
    templates: Object.fromEntries(Object.entries(base.templates).map(([kind, choices]) => [
      kind,
      choices.map((c) => [toLanguageTemplate(c.value, `${pointer}/templates/${kind}`), c.weight] as const),
    ])),
    nameStructures: { ...base.nameStructures },
    capitalize: "first",
    meaningPacks: [],
    wordClasses: [],
    genderTemplates: {},
  });

  const resolveCulture = (id: string, pointer: string, chain: readonly string[]): Culture => {
    const existing = staged.cultures.get(id) ?? state.cultures.get(id);
    if (existing) return existing;
    if (chain.includes(id)) fail([{ code: "CYCLE", pointer, message: `culture cycle: ${[...chain, id].join(" -> ")}` }]);
    const data = pack.manifest.cultures.find((c) => c.id === id);
    if (!data) fail([{ code: "REFERENCE", pointer, message: `unknown culture ${id}` }]);
    let parentBase: string | undefined;
    let base: AnyRecord = {};
    if (data.extends) {
      const parent = resolveCulture(data.extends, `${pointer}/extends`, [...chain, id]);
      base = { ...(parent as unknown as AnyRecord) };
      parentBase = (parent as unknown as AnyRecord).base as string | undefined;
    }
    // S0: base defaults apply before parent-culture resolved fields, so a base
    // declared on an ancestor must also apply to descendants; a child cannot
    // switch to a different base (derive a new root instead).
    const baseId = data.base ?? parentBase;
    if (data.base && parentBase && data.base !== parentBase) {
      fail([{ code: "REFERENCE", pointer: `${pointer}/base`, message: `culture ${id} cannot change base from inherited parent (${parentBase})` }]);
    }
    if (baseId) {
      const resolved = resolveBase(baseId, `${pointer}/base`);
      const defaults = baseDefaults(resolved, basePointers.get(baseId) ?? `${pointer}/base`);
      // Base defaults fill only what the parent/child has not supplied. Parent
      // resolved fields and child explicit fields win over base defaults.
      base = { ...defaults, ...base };
    }
    const culture: AnyRecord = {
      ...base,
      id: data.id,
      glyphs: data.glyphs ? toGlyphSystem(data.glyphs, `${pointer}/glyphs`) : base.glyphs,
      meaningPacks: data.meaningPacks ?? base.meaningPacks ?? [],
      templates: mergeTemplates(base.templates as AnyRecord | undefined, data.templates, `${pointer}/templates`),
      wordClasses: data.wordClasses ?? base.wordClasses ?? [],
      genderTemplates: mergeNested(base.genderTemplates as AnyRecord | undefined, data.genderTemplates, `${pointer}/genderTemplates`),
      nameStructures: mergeNested(base.nameStructures as AnyRecord | undefined, data.nameStructures, `${pointer}/nameStructures`),
      capitalize: data.capitalize ?? base.capitalize ?? "first",
    };
    if (baseId) culture.base = baseId;
    if (data.visualGlyphSystems) culture.visualGlyphSystems = data.visualGlyphSystems;
    const frozen = freezeCulture(culture as unknown as Culture);
    staged.cultures.set(id, frozen);
    return frozen;
  };
  for (const [i, culture] of pack.manifest.cultures.entries()) resolveCulture(culture.id, `/cultures/${i}`, []);

  // Validate section-level references against the staged graph.
  const grammarDiagnostics = pack.manifest.grammars.flatMap((g) => validateGrammar(g, (id) => {
    const descriptor = staged.descriptors.get(id);
    return descriptor?.output === "string" ? "string" : undefined;
  }));
  if (grammarDiagnostics.length > 0) fail(grammarDiagnostics);
  const tableDiagnostics = pack.manifest.tables.flatMap((t) => validateTable(t, (id) => staged.tables.get(id)));
  if (tableDiagnostics.length > 0) fail(tableDiagnostics);

  for (const data of pack.manifest.generators) {
    const descriptor: GeneratorDescriptor = {
      id: data.id,
      pack: pack.manifest.id,
      version: pack.manifest.version,
      engine: data.engine,
      profile: "v1",
      tags: [...data.tags],
      input: "none",
      output: data.output,
      portable: true,
      description: data.description,
    };
    staged.descriptors.set(data.id, descriptor);
    const compiled = compileGenerator(state, staged, pack, data);
    staged.compiled.set(data.id, compiled);
    if (data.output === "string") staged.externalString.set(data.id, compiled as Generator<string>);
  }

  state.cultures = staged.cultures;
  state.bases = staged.bases;
  state.grammars = staged.grammars;
  state.tables = staged.tables;
  state.generators = staged.generators;
  state.compiled = staged.compiled;
  state.externalString = staged.externalString;
  state.descriptors = staged.descriptors;
  state.installed.set(pack.manifest.id, {
    pack,
    resourceIds: new Set([...staged.cultures.keys(), ...staged.bases.keys(), ...staged.grammars.keys(), ...staged.tables.keys(), ...staged.generators.keys()]),
  });
}

function mergeTemplates(base: AnyRecord | undefined, child: PackManifestV1["cultures"][number]["templates"], pointer: string): AnyRecord {
  const out: AnyRecord = { ...(base ?? {}) };
  for (const [kind, choices] of Object.entries(child ?? {})) {
    if (!Array.isArray(choices)) fail([{ code: "SCHEMA", pointer, message: `template pool ${kind} must be an array` }]);
    out[kind] = choices.map((c) => [toLanguageTemplate(c.value, `${pointer}/${kind}`), c.weight] as const);
  }
  return out;
}

function mergeNested(base: AnyRecord | undefined, child: AnyRecord | undefined, pointer: string): AnyRecord {
  const out: AnyRecord = { ...(base ?? {}) };
  for (const [key, value] of Object.entries(child ?? {})) {
    out[key] = pointer.endsWith("genderTemplates")
      ? Object.fromEntries(Object.entries(value as AnyRecord).map(([k, choices]) => [k, toChoiceTuples(choices, `${pointer}/${key}/${k}`)]))
      : value;
  }
  return out;
}

function toChoiceTuples(value: unknown, pointer: string): ReadonlyArray<readonly [LanguageNameTemplate, number]> {
  if (!Array.isArray(value)) fail([{ code: "SCHEMA", pointer, message: "template pool must be an array" }]);
  return value.map((item) => {
    const choice = item as AnyRecord;
    if (!choice || typeof choice !== "object" || !choice.value || typeof choice.weight !== "number") {
      fail([{ code: "SCHEMA", pointer, message: "invalid weighted template" }]);
    }
    return [toLanguageTemplate(choice.value as never, pointer), choice.weight] as const;
  });
}

function toLanguageTemplate(template: { kind: "literal" | "compose"; form?: string; translation?: string; parts?: readonly unknown[]; sep?: string; transSep?: string }, pointer: string): LanguageNameTemplate {
  if (template.kind === "literal") {
    if (typeof template.form !== "string" || typeof template.translation !== "string") {
      fail([{ code: "SCHEMA", pointer, message: "literal template needs form and translation" }]);
    }
    return { kind: "literal", form: template.form, translation: template.translation };
  }
  const parts = (template.parts ?? []).map((part) => {
    const p = part as AnyRecord;
    if (typeof p.literal === "string") return { literal: p.literal, translation: typeof p.translation === "string" ? p.translation : undefined };
    if (typeof p.pick === "string") return { pick: p.pick as never, tag: typeof p.tag === "string" ? p.tag : undefined, capitalize: p.capitalize === true };
    fail([{ code: "SCHEMA", pointer, message: "invalid template part" }]);
  });
  return { kind: "compose", parts, sep: template.sep, transSep: template.transSep };
}

function toGlyphSystem(glyphs: NonNullable<PackManifestV1["cultures"][number]["glyphs"]>, pointer: string): AnyRecord {
  const classes: Record<string, readonly string[]> = {};
  for (const [name, letters] of Object.entries(glyphs.classes)) {
    if (!Array.isArray(letters) || letters.some((s) => typeof s !== "string")) {
      fail([{ code: "SCHEMA", pointer: `${pointer}/classes/${name}`, message: "glyph class must be string array" }]);
    }
    classes[name] = letters;
  }
  const toPairs = (items: readonly (readonly [string, number])[]) => items.map(([pattern, weight]) => [pattern, weight] as const);
  return {
    classes,
    syllables: toPairs(glyphs.syllables),
    wordShapes: toPairs(glyphs.wordShapes),
    ...(glyphs.constraints ? { constraints: glyphs.constraints } : {}),
    ...(glyphs.joiner ? { joiner: glyphs.joiner } : {}),
  };
}

interface StagedState {
  cultures: Map<string, Culture>;
  bases: Map<string, BaseData>;
  grammars: Map<string, PackManifestV1["grammars"][number]>;
  tables: Map<string, PackManifestV1["tables"][number]>;
  generators: Map<string, GeneratorData>;
  compiled: Map<string, Generator<unknown>>;
  externalString: Map<string, Generator<string>>;
  descriptors: Map<string, GeneratorDescriptor>;
}

function compileGenerator(state: WorldState, staged: StagedState, pack: LoadedPack, data: GeneratorData): Generator<unknown> {
  const id = data.id;
  const gen: Generator<unknown> = {
    id,
    describe: () => ({ id, description: data.description, tags: [...data.tags] }),
    generate(ctx: Context) {
      try {
        return invoke(state, staged, pack, data, ctx);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        fail([{ code: "SCHEMA", pointer: `/generators/${id}`, message }]);
      }
    },
  };
  return gen;
}

function invoke(state: WorldState, staged: StagedState, pack: LoadedPack, data: GeneratorData, ctx: Context): unknown {
  switch (data.engine) {
    case "name-v1": {
      const culture = staged.cultures.get(data.culture) ?? state.cultures.get(data.culture);
      if (!culture) fail([{ code: "REFERENCE", pointer: `/generators/${data.id}/culture`, message: `unknown culture ${data.culture}` }]);
      const name = generateName(culture, data.kind as Extract<keyof Culture["templates"], string>, ctx, data.gender ? { gender: data.gender as Gender } : undefined);
      return plainName(name);
    }
    case "structured-name-v1": {
      const culture = staged.cultures.get(data.culture) ?? state.cultures.get(data.culture);
      if (!culture) fail([{ code: "REFERENCE", pointer: `/generators/${data.id}/culture`, message: `unknown culture ${data.culture}` }]);
      return plainName(generateStructuredName(culture, {
        structure: data.structure,
        ...(ctx.data && typeof ctx.data === "object" ? ctx.data as AnyRecord : {}),
      } as never, ctx));
    }
    case "grammar-v1": {
      const grammar = staged.grammars.get(data.grammar) ?? state.grammars.get(data.grammar);
      if (!grammar) fail([{ code: "REFERENCE", pointer: `/generators/${data.id}/grammar`, message: `unknown grammar ${data.grammar}` }]);
      const external = (ref: string) => staged.externalString.get(ref) ?? state.externalString.get(ref) ?? staged.compiled.get(ref) ?? state.compiled.get(ref);
      return portableGrammar(grammar, (ref) => {
        const found = external(ref);
        if (!found) fail([{ code: "REFERENCE", pointer: `/generators/${data.id}/grammar`, message: `unknown external generator ${ref}` }]);
        return found as Generator<string>;
      }).generate(ctx);
    }
    case "table-v1": {
      const table = staged.tables.get(data.table) ?? state.tables.get(data.table);
      if (!table) fail([{ code: "REFERENCE", pointer: `/generators/${data.id}/table`, message: `unknown table ${data.table}` }]);
      return rollTable(table, ctx, state.tableHost);
    }
    case "markov-v1": {
      const model = pack.manifest.markovModels.find((m) => m.id === data.model);
      if (!model) fail([{ code: "REFERENCE", pointer: `/generators/${data.id}/model`, message: `unknown model ${data.model}` }]);
      const asset = pack.assets.get(model.asset.path);
      if (!asset) fail([{ code: "INTEGRITY", pointer: `/generators/${data.id}/model`, message: `missing verified asset ${model.asset.path}` }]);
      const json = JSON.parse(decodeUtf8(asset.bytes)) as MarkovModelJSON;
      return samplePortableMarkov(json, ctx);
    }
  }
}

function plainName(name: TranslatedName): PackJson {
  const out: AnyRecord = {
    form: name.form,
    translation: name.translation,
    language: name.language,
  };
  if (name.parts) out.parts = name.parts.map((p) => ({ form: p.form, meaning: p.meaning }));
  if (name.glyphs) out.glyphs = name.glyphs as unknown as PackJson;
  if ("structure" in name) {
    const structured = name as unknown as AnyRecord;
    out.structure = structured.structure;
    out.components = (structured.components as readonly AnyRecord[]).map((c) => ({
      key: c.key, role: c.role, value: plainName(c.value as TranslatedName),
    }));
  }
  return out as PackJson;
}

/** Portable v1: sorted transition keys, exact integer cumulative selection, per-step children. */
function samplePortableMarkov(json: MarkovModelJSON, ctx: Context): string {
  if (json.v !== 1 || !Number.isSafeInteger(json.order) || json.order < 1) {
    fail([{ code: "SCHEMA", pointer: "/markovModels", message: "unsupported markov-json-v1 asset" }]);
  }
  const transitions = new Map<string, Array<readonly [string, number]>>();
  for (const [key, row] of Object.entries(json.transitions)) {
    const entries = Object.keys(row).sort().map((k) => [k, row[k] as number] as const);
    transitions.set(key, entries);
  }
  let out = "";
  let context = START;
  for (let step = 0; step <= json.maxLength; step++) {
    let row = transitions.get(context);
    if (!row && context.length > 0) row = transitions.get(context.slice(1));
    if (!row) break;
    const total = row.reduce((sum, [, weight]) => sum + weight, 0);
    if (total <= 0 || total > 0x1_0000_0000) fail([{ code: "LIMIT", pointer: "/markovModels", message: "invalid markov transition weight total" }]);
    const roll = portableInt(total, ctx.child(`markov:${step}`).rng);
    let cumulative = 0;
    let chosen = "";
    for (const [key, weight] of row) {
      cumulative += weight;
      if (roll < cumulative) { chosen = key; break; }
    }
    if (chosen === END || chosen === "") break;
    if (json.forbidden?.some((f) => out.includes(f))) break;
    out += chosen;
    context = (context + out.slice(-1)).slice(-json.order);
    if (out.length >= json.maxLength) break;
  }
  return out.length >= json.minLength ? out : "";
}

function generateAt(state: WorldState, seed: Seed, id: string, key: string, options: GenerateOptions, index: number | undefined): unknown {
  const gen = state.compiled.get(id) ?? (state.registry.has(id) ? state.registry.get(id) : undefined);
  if (!gen) fail([{ code: "REFERENCE", pointer: `/generators/${id}`, message: `unknown generator ${id}` }]);
  let ctx = createContext({ seed, registry: state.registry })
    .child(`generator:${id}`)
    .child(`key:${key}`);
  if (index !== undefined) ctx = ctx.child(`item:${index}`);
  const values = options.values ? Object.fromEntries(Object.entries(options.values).map(([k, v]) => [k, asTranslatedName(v)])) : undefined;
  ctx = ctx.withData({ gender: options.gender, values, locale: options.locale } as never);
  if (options.locale) ctx = ctx.child("locale", { locale: options.locale });
  return gen.generate(ctx);
}

function asTranslatedName(value: unknown): TranslatedName {
  if (typeof value === "string") return { form: value, translation: value, language: "input", toString() { return this.form; } };
  if (value && typeof value === "object" && typeof (value as AnyRecord).form === "string") {
    const v = value as AnyRecord;
    return {
      form: v.form as string,
      translation: typeof v.translation === "string" ? v.translation : v.form as string,
      language: typeof v.language === "string" ? v.language : "input",
      ...(Array.isArray(v.parts) ? { parts: v.parts as never } : {}),
      toString() { return this.form; },
    };
  }
  fail([{ code: "SCHEMA", pointer: "/values", message: "input slot values must be strings or translated-name objects" }]);
}
