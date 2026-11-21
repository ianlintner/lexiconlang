/**
 * B3 orthography, sound-change and morphology engine.
 *
 * Boundaries follow the merged S0 expansion spec (section 13–14):
 * - sound changes apply to *token sequences* before orthography, never to
 *   rendered SVG or translations;
 * - rules are ordered, deterministic, nonrecursive per pass, and use no
 *   JS/.NET regex syntax;
 * - a derived language is a `TokenLexicon` with the parent's meanings, never
 *   a re-sampled lexicon.
 *
 * All APIs here are opt-in. Existing generator IDs and `buildLexicon` output
 * are unchanged.
 */
import type { Context } from "@lexiconlang/core";
import type { Lexicon, WordClass } from "./types.js";
import { generateWordTokens } from "./phonotactics.js";

// ---------------------------------------------------------------------------
// Orthography
// ---------------------------------------------------------------------------

/** Orthography/romanization renderer data (spec section 13). */
export interface OrthographyData {
  id: string;
  /** Token-to-rendered-string mappings. Longest `from` first; ties by authored order. */
  mappings: readonly { from: string; to: string }[];
  /** Explicit default for unmapped tokens in {@link applyOrthography}. */
  unknown: "preserve" | "error";
}

/** Opt-in rendering profile applied *after* sound changes. */
export interface RomanizationProfile {
  /** Drop combining diacritics and precomposed accents. Default true. */
  diacritics: boolean;
  /** Fold all remaining non-ASCII letters to ASCII (best-effort, documented table). */
  asciiFold: boolean;
  /** Replacement strings for specific rendered tokens, e.g. `{ "š": "sh" }`. */
  digraphs: Readonly<Record<string, string>>;
  /** How to treat unmapped tokens; overrides `OrthographyData.unknown` when supplied. */
  unknown?: "preserve" | "error";
  /** Optional onUnknown hook; when set, unknown handling is delegated to it. */
  onUnknown?: (token: string) => string;
}

/** Create a romanization profile with documented defaults. */
export function createRomanizationProfile(options: Partial<RomanizationProfile> = {}): RomanizationProfile {
  return {
    diacritics: options.diacritics ?? true,
    asciiFold: options.asciiFold ?? false,
    digraphs: options.digraphs ?? {},
    ...(options.unknown === undefined ? {} : { unknown: options.unknown }),
    ...(options.onUnknown === undefined ? {} : { onUnknown: options.onUnknown }),
  };
}

const COMBINING_DIACRITICS = /[\u0300-\u036f]/g;

/** A small, explicit, deterministic ASCII fold table (no locale collation). */
const ASCII_FOLD: Readonly<Record<string, string>> = {
  š: "s", ž: "z", č: "c", ć: "c", đ: "d", ł: "l", ñ: "n", ņ: "n",
  ā: "a", ă: "a", ą: "a", à: "a", á: "a", â: "a", ä: "a", å: "a",
  ē: "e", ė: "e", ę: "e", è: "e", é: "e", ê: "e", ë: "e",
  ī: "i", į: "i", ì: "i", í: "i", î: "i", ï: "i",
  ō: "o", ŏ: "o", ò: "o", ó: "o", ô: "o", ö: "o", ø: "o",
  ū: "u", ŭ: "u", ù: "u", ú: "u", û: "u", ü: "u",
  ȳ: "y", ý: "y", ÿ: "y",
  þ: "th", ð: "dh", æ: "ae", œ: "oe", ß: "ss",
  ş: "s", ț: "t", ű: "u", ő: "o",
};

function foldToAscii(input: string): string {
  let out = input.normalize("NFD").replace(COMBINING_DIACRITICS, "");
  // Some letters do not decompose; use the explicit table.
  out = out.replace(/[^\x00-\x7F]/g, (char) => ASCII_FOLD[char] ?? char);
  return out;
}

/**
 * Render a token sequence through an orthography.
 *
 * Matching is longest-`from`-first, ties broken by authored array order,
 * using one left-to-right scan over the token sequence (no re-scan of output).
 */
export function applyOrthography(
  tokens: readonly string[],
  orthography: OrthographyData,
  profile?: RomanizationProfile | { onUnknown: (token: string) => string },
): string {
  const effectiveUnknown = profile && "unknown" in profile && profile.unknown !== undefined
    ? profile.unknown
    : orthography.unknown;
  const onUnknown = profile?.onUnknown;

  const renderToken = (token: string): string => {
    const mapped = longestMatch(token, orthography.mappings);
    if (mapped === undefined) {
      if (onUnknown !== undefined) return onUnknown(token);
      if (effectiveUnknown === "error") throw new Error(`unknown token: ${JSON.stringify(token)}`);
      return token;
    }
    return mapped;
  };

  // Build a token-to-rendered map once; digraph substitution applies to the
  // rendered unit, never to already-joined output.
  const rendered: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    let piece = renderToken(token);
    if (profile !== undefined && "digraphs" in profile) {
      const replacement = profile.digraphs?.[piece];
      if (replacement !== undefined) piece = replacement;
    }
    if (profile !== undefined && "asciiFold" in profile && profile.asciiFold) {
      piece = foldToAscii(piece);
    } else if (profile !== undefined && "diacritics" in profile && profile.diacritics) {
      piece = piece.normalize("NFD").replace(COMBINING_DIACRITICS, "");
    }
    rendered.push(piece);
  }
  return rendered.join("");
}

/** Longest match by `from.length`, then earliest authored index. Input tokens are literal strings. */
/** Capitalize the first Unicode code point of a rendered form, if any. */
function capitalizeForm(form: string): string {
  if (form.length === 0) return form;
  const first = form[0]!;
  const upper = first.toUpperCase();
  return upper.length === 1 ? upper + form.slice(1) : form;
}

function longestMatch(token: string, mappings: OrthographyData["mappings"]): string | undefined {
  let best: string | undefined;
  let bestLength = -1;
  let bestIndex = Infinity;
  for (let i = 0; i < mappings.length; i++) {
    const mapping = mappings[i]!;
    if (mapping.from !== token) continue;
    if (mapping.from.length > bestLength || (mapping.from.length === bestLength && i < bestIndex)) {
      best = mapping.to;
      bestLength = mapping.from.length;
      bestIndex = i;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Sound-change rules
// ---------------------------------------------------------------------------

/** A SCA²-style rule. `from`/`to` are token sequences or category member lists. */
export interface SoundChangeRule {
  key: string;
  /** Nonempty list of literal tokens, or members of a `{a,b}` category. */
  from: readonly string[];
  /** Empty array expresses deletion. Same arity as `from` for categories, else one output. */
  to: readonly string[];
  /** Environment before the target; `#` matches the token-sequence boundary. */
  before?: readonly string[];
  /** Environment after the target; `#` matches the token-sequence boundary. */
  after?: readonly string[];
}

/**
 * Parse a rule DSL line: `from > to / before _ after`, with `{a,b}` categories,
 * `0` for deletion and `_` marking the target position in the environment.
 *
 * Examples: `t > s / _ #`, `{k,p} > {b,d} / # _`, `e > 0 / _ #`.
 */
export function parseSoundChange(line: string): SoundChangeRule {
  const trimmed = line.trim();
  const slash = trimmed.split("/");
  if (slash.length > 2) throw new Error(`invalid environment in rule: ${JSON.stringify(line)}`);
  const [change, environment] = slash as [string, string?];
  const arrow = change!.split(">");
  if (arrow.length !== 2) throw new Error(`invalid rule (expected '>'): ${JSON.stringify(line)}`);
  const from = parseCategory(arrow[0]!);
  const to = arrow[1]!.trim() === "0" ? [] : parseCategory(arrow[1]!);

  let before: string[] | undefined;
  let after: string[] | undefined;
  if (environment !== undefined) {
    const env = environment.trim();
    if (!env.includes("_")) throw new Error(`environment must contain '_': ${JSON.stringify(line)}`);
    const [left, right] = env.split("_") as [string, string];
    if (left.trim() !== "") before = parseCategory(left);
    if (right.trim() !== "") after = parseCategory(right);
  }

  return compact({
    key: trimmed,
    from,
    to,
    ...(before === undefined ? {} : { before }),
    ...(after === undefined ? {} : { after }),
  });
}

/** Normalize/validate a JSON-form rule. Returns the same object when valid. */
export function parseSoundChangeRule(rule: SoundChangeRule): SoundChangeRule {
  if (!Array.isArray(rule.from) || rule.from.length === 0) {
    throw new Error(`rule ${JSON.stringify(rule.key)}: empty from is forbidden`);
  }
  if (!Array.isArray(rule.to)) throw new Error(`rule ${JSON.stringify(rule.key)}: to must be an array`);
  if (rule.from.length > 1 && rule.to.length > 1 && rule.from.length !== rule.to.length) {
    throw new Error(`rule ${JSON.stringify(rule.key)}: category arity mismatch`);
  }
  return rule;
}

/** Parse a category expression: `{a,b}` expands to members; a bare token is one member. */
function parseCategory(expr: string): string[] {
  const trimmed = expr.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed.slice(1, -1).split(",").map((t) => t.trim()).filter((t) => t.length > 0);
  }
  return trimmed.length > 0 ? [trimmed] : [];
}

function compact<T extends object>(value: T): T {
  return value;
}

/**
 * Apply ordered sound changes to a token sequence.
 *
 * Scan direction: one left-to-right pass per rule, longest `from` sequence
 * first at each position. A rule fires at most once per position and its
 * output is never re-scanned by the same rule (nonrecursive per pass). Rules
 * are applied in authored order, so a later rule may act on earlier output.
 */
export function applySoundChanges(
  tokens: readonly string[],
  rules: readonly SoundChangeRule[],
): string[] {
  let current = [...tokens];
  for (const rawRule of rules) {
    const rule = parseSoundChangeRule(rawRule);
    const output: string[] = [];
    let i = 0;
    while (i < current.length) {
      const match = matchRule(current, i, rule);
      if (match !== undefined) {
        const replacement = rule.to.length === 0
          ? []
          : rule.from.length > 1 && rule.to.length > 1
            ? [rule.to[rule.from.indexOf(match.token)] ?? rule.to[0]!]
            : rule.to;
        output.push(...replacement);
        i += match.width;
      } else {
        output.push(current[i]!);
        i++;
      }
    }
    current = output;
  }
  return current;
}

function matchRule(
  tokens: readonly string[],
  position: number,
  rule: SoundChangeRule,
): { token: string; width: number } | undefined {
  for (const token of rule.from) {
    if (tokens[position] !== token) continue;
    if (rule.before !== undefined && !matchesEnvironment(tokens, position, rule.before, "before")) continue;
    if (rule.after !== undefined && !matchesEnvironment(tokens, position + 1, rule.after, "after")) continue;
    return { token, width: 1 };
  }
  return undefined;
}

function matchesEnvironment(
  tokens: readonly string[],
  position: number,
  env: readonly string[],
  side: "before" | "after",
): boolean {
  if (env.length === 1 && env[0] === "#") {
    return side === "before" ? position === 0 : position === tokens.length;
  }
  // Literal token sequence immediately adjacent to the target.
  const start = side === "before" ? position - env.length : position;
  if (start < 0 || start + env.length > tokens.length) return false;
  for (let i = 0; i < env.length; i++) {
    if (tokens[start + i] !== env[i]) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Morphology
// ---------------------------------------------------------------------------

/** A prefix/suffix inflection rule over rendered strings. */
export interface MorphologyRule {
  key: string;
  operation: "prefix" | "suffix";
  /** Literal affix pieces, joined with no separator. */
  tokens: readonly string[];
}

/** Apply a single morphology rule to a surface form. */
export function inflect(form: string, rule: MorphologyRule): string {
  const affix = rule.tokens.join("");
  return rule.operation === "prefix" ? affix + form : form + affix;
}

/** Basic plural: `-i` after a consonant-final form, `-ar` otherwise. */
export function plural(form: string): string {
  if (form.length === 0) return form;
  const last = form[form.length - 1]!;
  return /[aeiou]/i.test(last) ? `${form}ar` : `${form}i`;
}

/** Basic genitive/possessive: append `-is`. */
export function genitive(form: string): string {
  return `${form}is`;
}

/** Basic demonym: same productive `-i` suffix used by place generators. */
export function demonym(place: string): string {
  return `${place}i`;
}

/** Basic adjective-from-place: append `-ic`. */
export function adjectiveFromPlace(place: string): string {
  return `${place}ic`;
}

// ---------------------------------------------------------------------------
// Token lexicons and dialect derivation
// ---------------------------------------------------------------------------

/** Lexicon that retains the token sequence behind each form (spec section 14). */
export interface TokenLexicon extends Lexicon {
  tokensOf(meaningId: string): readonly string[];
  /** Resolved, immutable renderer data, including fallback. */
  readonly orthography: OrthographyData;
}

/** A dialect with identity/provenance and local morphology (spec section 14). */
export interface DerivedLanguage extends TokenLexicon {
  readonly id: string;
  readonly parent: string;
  inflect(form: string, ruleKey: string): string;
  /** True when both languages share tokens for `meaningId` after their changes. */
  cognatesWith(other: TokenLexicon, meaningId: string): boolean;
}

/** Portable dialect descriptor. `parent` names the base or previous dialect ID. */
export interface DialectData {
  id: string;
  parent: string;
  soundChanges: readonly SoundChangeRule[];
  orthography?: OrthographyData;
  morphology?: readonly MorphologyRule[];
}

/** Branch descriptor for {@link languageFamily}. */
export interface LanguageBranch {
  id: string;
  soundChanges: readonly SoundChangeRule[];
  orthography?: OrthographyData;
  morphology?: readonly MorphologyRule[];
}

function assertTokenLexicon(parent: TokenLexicon, expectedParent: string): void {
  if (typeof parent.tokensOf !== "function" || parent.orthography === undefined) {
    throw new Error(`deriveDialect: parent must be a TokenLexicon (got ${JSON.stringify(parent.cultureId)})`);
  }
  if (expectedParent !== parent.cultureId && expectedParent !== (parent as DerivedLanguage).id) {
    // Mismatch is allowed only when a world resolves a chain by ID; keep the
    // check strict enough to catch accidental self-cycles.
    // (No throw: dialect IDs may be resource IDs while cultureId is the local ID.)
  }
}

/**
 * Derive a daughter language by applying sound changes to the parent's tokens.
 * Draws no randomness; `ctx` supplies identity/provenance and future opt-in
 * variants. Forms are rendered through the inherited or overridden orthography.
 */
export function deriveDialect(
  parent: TokenLexicon,
  data: DialectData,
  ctx: Context,
): DerivedLanguage {
  assertTokenLexicon(parent, data.parent);
  if ((parent as DerivedLanguage).id === data.id) {
    throw new Error(`deriveDialect: dialect cycle at ${JSON.stringify(data.id)}`);
  }
  const orthography = data.orthography ?? parent.orthography;
  const morphology = new Map((data.morphology ?? []).map((rule) => [rule.key, rule]));
  // `ctx` is intentionally not sampled: rewriting is deterministic and must
  // never perturb sibling rolls. The fork exists for future opt-in profiles.
  void ctx.child(`dialect:${data.id}`);

  const tokensOf = (meaningId: string): readonly string[] =>
    applySoundChanges(parent.tokensOf(meaningId), data.soundChanges);

  return {
    cultureId: data.id,
    id: data.id,
    parent: data.parent,
    orthography,
    tokensOf,
    byClass(c: WordClass, tag?: string) {
      return parent.byClass(c, tag);
    },
    materialize() {
      const result = new Map<string, string>();
      // Parent iteration order is authoritative (spec section 14).
      for (const meaningId of parent.materialize().keys()) {
        result.set(meaningId, this.formOf(meaningId));
      }
      return result;
    },
    formOf(meaningId: string): string {
      return capitalizeForm(applyOrthography(tokensOf(meaningId), orthography));
    },
    inflect(form: string, ruleKey: string): string {
      const rule = morphology.get(ruleKey);
      if (rule === undefined) throw new Error(`unknown morphology rule: ${JSON.stringify(ruleKey)}`);
      return inflect(form, rule);
    },
    cognatesWith(other: TokenLexicon, meaningId: string): boolean {
      const mine = tokensOf(meaningId);
      const theirs = other.tokensOf(meaningId);
      return mine.length === theirs.length && mine.every((token, i) => token === theirs[i]);
    },
  };
}

/**
 * Create daughter languages from one proto lexicon. Shared meanings yield
 * cognates: the daughter forms are related precisely because they derive
 * from the same parent token sequences.
 */
export function languageFamily(
  proto: TokenLexicon,
  branches: readonly LanguageBranch[],
  ctx: Context,
): readonly DerivedLanguage[] {
  return branches.map((branch) =>
    deriveDialect(
      proto,
      {
        id: branch.id,
        parent: proto.cultureId,
        soundChanges: branch.soundChanges,
        ...(branch.orthography === undefined ? {} : { orthography: branch.orthography }),
        ...(branch.morphology === undefined ? {} : { morphology: branch.morphology }),
      },
      ctx.child(`branch:${branch.id}`),
    ),
  );
}
