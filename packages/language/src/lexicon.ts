import type { Context } from "@content-gen/core";
import type { Culture, Lexicon, WordClass } from "./types.js";
import { generateWord } from "./phonotactics.js";

/**
 * Build a deterministic, key-addressed lexicon for a culture.
 * Each meaning's conlang form is derived from a fork keyed on the meaning ID,
 * ensuring order-independence and patch stability.
 */
export function buildLexicon(culture: Culture, ctx: Context): Lexicon {
  const cultureCtx = ctx.child(`lang:${culture.id}`);
  const cache = new Map<string, string>();

  // Build a flat map of all meanings from all packs
  const allMeanings = new Map<string, { class: WordClass; tags: readonly string[]; label?: string }>();
  for (const pack of culture.meaningPacks) {
    for (const meaning of pack.meanings) {
      allMeanings.set(meaning.id, { class: meaning.class, tags: meaning.tags, label: meaning.label });
    }
  }

  return {
    cultureId: culture.id,

    formOf(meaningId: string): string {
      let form = cache.get(meaningId);
      if (form !== undefined) return form;

      // Key-addressed fork: order-independent
      const wordCtx = cultureCtx.child(`word:${meaningId}`);
      form = generateWord(culture.glyphs, wordCtx);
      cache.set(meaningId, form);
      return form;
    },

    byClass(c: WordClass, tag?: string) {
      const result = [];
      for (const pack of culture.meaningPacks) {
        for (const meaning of pack.meanings) {
          if (meaning.class !== c) continue;
          if (tag && !meaning.tags.includes(tag)) continue;
          result.push(meaning);
        }
      }
      return result;
    },

    materialize() {
      const result = new Map<string, string>();
      for (const meaningId of allMeanings.keys()) {
        result.set(meaningId, this.formOf(meaningId));
      }
      return result;
    },
  };
}
