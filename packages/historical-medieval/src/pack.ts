import pack from "../data/historical-medieval.pack.json" with { type: "json" };
import type { CultureData, PackManifestV1 } from "@lexiconlang/packs";
import type { GrammarRules } from "@lexiconlang/grammar";

export const historicalMedievalPack = pack as unknown as PackManifestV1;

/** Literal entries stored in the pack's open culture templates. */
export interface TranslatedName {
  form: string;
  translation: string;
}

function literals(cultureId: string, kind: string): readonly TranslatedName[] {
  const culture = historicalMedievalPack.cultures.find((c) => c.id === cultureId) as CultureData | undefined;
  const templates = culture?.templates?.[kind] ?? [];
  return templates.flatMap((weighted) => {
    const entry = weighted.value;
    if (entry.kind !== "literal" || !entry.form) return [];
    return [{ form: entry.form, translation: entry.translation ?? "" }];
  });
}

const packId = "lexiconlang.historical-medieval";

export interface NamingCulture {
  id: string;
  label: string;
  given: readonly TranslatedName[];
  byname: readonly TranslatedName[];
}

const cultureDefs = [
  { id: `${packId}/culture/latin`, label: "Latin" },
  { id: `${packId}/culture/oldenglish`, label: "Old English" },
  { id: `${packId}/culture/celtic`, label: "Celtic" },
  { id: `${packId}/culture/norse`, label: "Norse" },
] as const;

export const cultures: readonly NamingCulture[] = cultureDefs.map((def) => ({
  id: def.id,
  label: def.label,
  given: literals(def.id, "given"),
  byname: literals(def.id, "byname"),
}));

export type CultureId = (typeof cultureDefs)[number]["id"];

/** Grammar rules from the pack, converted to the @lexiconlang/grammar rule shape. */
export function grammarRules(id: string): GrammarRules {
  const g = historicalMedievalPack.grammars.find((item) => item.id === id);
  if (!g) throw new Error(`unknown pack grammar: ${id}`);
  const rules: Record<string, unknown> = {};
  for (const rule of g.rules) {
    rules[rule.key] = rule.choices.map((choice) => choice.value);
  }
  return rules as GrammarRules;
}

/** Text results of a weighted table in the pack. */
export function tableTexts(id: string): readonly string[] {
  const table = historicalMedievalPack.tables.find((item) => item.id === id);
  if (!table) throw new Error(`unknown pack table: ${id}`);
  return table.entries.map((entry) => (entry.result.type === "text" ? entry.result.text : "")).filter(Boolean);
}

export const resourceIds = {
  manorGrammar: `${packId}/grammar/manor`,
  guildGrammar: `${packId}/grammar/guild`,
  monasteryGrammar: `${packId}/grammar/monastery`,
  feudalTitleTable: `${packId}/table/feudaltitle`,
  marketGoodTable: `${packId}/table/marketgood`,
  domainEventTable: `${packId}/table/domainevent`,
  heraldicFieldTable: `${packId}/table/heraldicfield`,
  heraldicChargeTable: `${packId}/table/heraldiccharge`,
} as const;
