import { where } from "@lexiconlang/core";
import type { Context } from "@lexiconlang/core";
import type {
  Culture,
  Gender,
  NameOptions,
  NameTemplate,
  NameTemplates,
  TemplateChoices,
  TranslatedName,
  TemplatePart,
} from "./types.js";
import { buildLexicon, createLexiconCache, DEFAULT_LEXICON_CACHE_CAPACITY } from "./lexicon.js";
import { isFrozenCulture } from "./freeze.js";
import { isBlocked, type Blocklist } from "./filter.js";

/**
 * Shared, bounded lexicon memo used by {@link generateName} for frozen culture
 * snapshots. Mutable cultures are never shared: a caller who mutates a culture
 * in place would otherwise see stale forms.
 */
const sharedLexiconCache = createLexiconCache({
  maxEntries: DEFAULT_LEXICON_CACHE_CAPACITY,
});

/**
 * Generate a name from a template for a given culture.
 *
 * `nameKind` is an open key into `culture.templates`, so any pack-declared kind
 * (`ship`, `tavern`, `deity`, `guild`, `epithet`, `title`, ...) works exactly
 * like the built-in `given` / `surname` / `settlement` kinds.
 *
 * Passing `options.gender` switches to the culture's opt-in
 * `genderTemplates[gender]` pool for that kind, falling back to
 * `templates[kind]` when the gender declares no pool of its own. Omitting the
 * option leaves the RNG path — and therefore the output — untouched.
 */
export function generateName<C extends Culture>(
  culture: C,
  nameKind: Extract<keyof C["templates"], string>,
  ctx: Context,
  options?: NameOptions,
): TranslatedName {
  const templates = resolveNameTemplates(culture, nameKind, options?.gender);

  if (!templates || templates.length === 0) {
    throw new Error(`No templates for ${String(nameKind)} in culture ${culture.id}`);
  }

  // Pick a template
  const template = pickWeighted(templates, ctx.child("template"));

  // Build lexicon (memoized only for immutable culture snapshots)
  const lexicon = buildLexicon(
    culture,
    ctx.child("lexicon"),
    isFrozenCulture(culture) ? sharedLexiconCache : undefined,
  );

  // Render name from template
  const rendered = renderTemplate(template, culture, lexicon, ctx.child("render"));

  const translatedName: TranslatedName = {
    form: rendered.form,
    translation: rendered.translation,
    language: culture.id,
    parts: rendered.parts,
    toString() {
      return this.form;
    },
  };

  return translatedName;
}

/**
 * Resolve the template pool for a kind.
 *
 * - no gender → `templates[kind]` (unchanged legacy path)
 * - gender with its own pool → that pool
 * - gender without a pool → the base pool (never a concatenation)
 */
export function resolveNameTemplates(
  culture: Culture,
  nameKind: string,
  gender?: Gender,
): TemplateChoices | undefined {
  const base = ownValue(culture.templates as NameTemplates, nameKind);
  if (gender === undefined) return base;

  const genderPool = ownValue(culture.genderTemplates, gender);
  const gendered = genderPool === undefined ? undefined : ownValue(genderPool, nameKind);
  if (gendered !== undefined && gendered.length > 0) return gendered;
  return base;
}

/** Own-property lookup so keys like "constructor" never hit Object.prototype. */
export function ownValue<T>(
  record: { readonly [key: string]: T | undefined } | undefined,
  key: string,
): T | undefined {
  if (record === undefined || !Object.prototype.hasOwnProperty.call(record, key)) {
    return undefined;
  }
  return record[key];
}

function renderTemplate(
  template: NameTemplate,
  culture: Culture,
  lexicon: ReturnType<typeof buildLexicon>,
  ctx: Context,
): { form: string; translation: string; parts: Array<{ form: string; meaning: string }> } {
  if (template.kind === "literal") {
    return {
      form: template.form,
      translation: template.translation,
      parts: [{ form: template.form, meaning: template.translation }],
    };
  }

  // kind === "compose"
  const parts: Array<{ form: string; meaning: string }> = [];
  const forms: string[] = [];
  const translations: string[] = [];

  for (let i = 0; i < template.parts.length; i++) {
    const part = template.parts[i]!;
    const partCtx = ctx.child(`part:${i}`);

    if ("literal" in part && part.literal !== undefined) {
      forms.push(part.literal);
      translations.push(part.translation ?? "");
      parts.push({ form: part.literal, meaning: part.translation ?? "" });
    } else if ("pick" in part) {
      // Pick a meaning matching class + tag
      const candidates = lexicon.byClass(part.pick, part.tag);
      if (candidates.length === 0) {
        throw new Error(`No meanings for class ${part.pick} tag ${part.tag} in ${culture.id}`);
      }
      const meaning = candidates[partCtx.rng.nextInt(0, candidates.length - 1)]!;
      const form = lexicon.formOf(meaning.id);
      const morpheme = part.capitalize ? capitalize(form) : form;
      forms.push(morpheme);
      translations.push(meaning.label ?? meaning.id);
      parts.push({ form: morpheme, meaning: meaning.label ?? meaning.id });
    }
  }

  const form = forms.join(template.sep ?? "");
  const translation = translations.join(template.transSep ?? "-");

  return { form, translation, parts };
}

function capitalize(s: string): string {
  if (s.length === 0) return s;
  return s[0]!.toUpperCase() + s.slice(1);
}

/**
 * Opt-in filtered name generation (F4). Unlike `generateName`, this wrapper
 * rejects values matching any supplied blocklist and retries under
 * `ctx.child("attempt:<i>")`. It never changes an existing generator ID or
 * the legacy call path; filtered generation uses its own deterministic path.
 */
export function generateNameFiltered<C extends Culture>(
  culture: C,
  nameKind: Extract<keyof C["templates"], string>,
  ctx: Context,
  options: NameOptions & {
    /** Blocklists to apply, e.g. `[DEFAULT_BLOCKLIST]`. Must be nonempty. */
    blocklists: readonly Blocklist[];
    /** Attempt count including the first; default 32, bound 1000. */
    maxAttempts?: number;
  },
): TranslatedName {
  const lists = options.blocklists;
  if (lists.length === 0) {
    throw new TypeError("generateNameFiltered: blocklists must not be empty");
  }
  const generatorId = `filtered-name:${culture.id}:${String(nameKind)}`;
  const inner = {
    id: generatorId,
    generate: (attemptCtx: Context) =>
      generateName(culture, nameKind, attemptCtx, options),
  };
  return where(
    inner,
    (value) => !isBlocked(value, lists),
    {
      id: `where:${generatorId}`,
      ...(options.maxAttempts === undefined ? {} : { maxAttempts: options.maxAttempts }),
    },
  ).generate(ctx);
}

function pickWeighted<T>(items: Array<[T, number]>, ctx: Context): T {
  const totalWeight = items.reduce((sum, [, w]) => sum + w, 0);
  let roll = ctx.rng.nextInt(0, totalWeight - 1);
  for (const [item, weight] of items) {
    if (roll < weight) return item;
    roll -= weight;
  }
  return items[items.length - 1]![0];
}
