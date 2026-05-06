import { END, START, type MarkovModel } from "./model.js";

export interface TrainOptions {
  /** Markov order (n-gram length of context). Default 3. */
  order?: number;
  /** Minimum length of generated output. Default 3. */
  minLength?: number;
  /** Maximum length of generated output. Default 14. */
  maxLength?: number;
  /**
   * Refuse to emit any substring of training data of length >= this.
   * Set to a length close to the median training entry to prevent verbatim
   * regurgitation. Default: undefined (no protection).
   */
  rejectSubstringsOfLength?: number;
  /**
   * Optional minimum count for a transition to be retained. Useful to prune
   * noise from large corpora. Default 1.
   */
  pruneBelow?: number;
  /** Lowercase corpus before training. Default true. */
  lowercase?: boolean;
  /** Optional metadata to embed in the model. */
  meta?: Record<string, unknown>;
}

export interface TrainEntry {
  word: string;
  weight?: number;
}

export type Corpus = readonly string[] | readonly TrainEntry[];

function isEntry(x: unknown): x is TrainEntry {
  return typeof x === "object" && x !== null && "word" in (x as object);
}

export function train(corpus: Corpus, options: TrainOptions = {}): MarkovModel {
  const order = options.order ?? 3;
  const minLength = options.minLength ?? 3;
  const maxLength = options.maxLength ?? 14;
  const lowercase = options.lowercase ?? true;
  const pruneBelow = options.pruneBelow ?? 1;

  const entries: { word: string; weight: number }[] = [];
  for (const e of corpus) {
    const word = isEntry(e) ? e.word : (e as string);
    if (typeof word !== "string" || word.length === 0) continue;
    const w = isEntry(e) && typeof e.weight === "number" ? e.weight : 1;
    entries.push({ word: lowercase ? word.toLowerCase() : word, weight: w });
  }
  if (entries.length === 0) throw new Error("markov.train: empty corpus");

  const transitions: Record<string, Record<string, number>> = {};

  const bump = (ctx: string, ch: string, w: number) => {
    let row = transitions[ctx];
    if (!row) {
      row = {};
      transitions[ctx] = row;
    }
    row[ch] = (row[ch] ?? 0) + w;
  };

  for (const { word, weight } of entries) {
    // Each word contributes (n - START_PREFIX) edges plus the END edge.
    // Use progressively longer context up to `order`.
    for (let i = 0; i < word.length; i++) {
      const ctx = i === 0 ? START : word.slice(Math.max(0, i - order), i);
      bump(ctx, word[i] as string, weight);
    }
    const tailCtx = word.slice(Math.max(0, word.length - order));
    bump(tailCtx, END, weight);
  }

  // Prune low counts.
  if (pruneBelow > 1) {
    for (const ctx of Object.keys(transitions)) {
      const row = transitions[ctx] as Record<string, number>;
      for (const ch of Object.keys(row)) {
        if ((row[ch] ?? 0) < pruneBelow) delete row[ch];
      }
      if (Object.keys(row).length === 0) delete transitions[ctx];
    }
  }

  // Build forbidden list (training words themselves) when requested.
  let forbidden: string[] | undefined;
  if (options.rejectSubstringsOfLength) {
    const minSub = options.rejectSubstringsOfLength;
    const set = new Set<string>();
    for (const { word } of entries) {
      if (word.length >= minSub) set.add(word);
    }
    forbidden = [...set];
  }

  const model: MarkovModel = {
    order,
    minLength,
    maxLength,
    transitions,
  };
  if (forbidden && forbidden.length > 0) {
    return { ...model, forbidden };
  }
  if (options.meta) {
    return { ...model, meta: options.meta };
  }
  return model;
}
