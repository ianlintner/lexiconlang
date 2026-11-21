import type { Context, Generator } from "@lexiconlang/core";
import { portableInt } from "./grammar.js";
import type { PackDiagnostic, TableData, TableResult } from "./types.js";

export interface TableRoll {
  table: string;
  entry: string;
  total?: number;
  dice?: readonly number[];
  text: string;
  children: readonly TableRoll[];
}

export interface TableHost {
  table(id: string): TableData;
  generator(id: string): Generator<unknown>;
  expandGrammar(id: string, template: string, ctx: Context): string;
}

export function validateTable(table: TableData, describeTable?: (id: string) => TableData | undefined): readonly PackDiagnostic[] {
  const diag: PackDiagnostic[] = [];
  const base = `/tables/${table.id}`;
  const keys = new Set<string>();
  table.entries.forEach((entry, i) => {
    if (keys.has(entry.key)) diag.push({ code: "COLLISION", pointer: `${base}/entries/${i}/key`, message: `duplicate entry key ${entry.key}` });
    keys.add(entry.key);
    if (table.mode === "weighted" && (!Number.isSafeInteger(entry.weight ?? 0) || (entry.weight ?? 0) < 1)) {
      diag.push({ code: "LIMIT", pointer: `${base}/entries/${i}/weight`, message: "weighted entry requires a positive integer weight" });
    }
    if (table.mode === "dice" && (!entry.range || entry.range[0] > entry.range[1])) {
      diag.push({ code: "SCHEMA", pointer: `${base}/entries/${i}/range`, message: "dice entry requires an ordered inclusive range" });
    }
    validateResult(entry.result, `${base}/entries/${i}/result`, diag, describeTable, new Set([table.id]));
  });
  if (table.mode === "dice" && table.dice) {
    const min = table.dice.count + table.dice.modifier;
    const max = table.dice.count * table.dice.sides + table.dice.modifier;
    const covered = new Set<number>();
    for (const entry of table.entries) {
      if (!entry.range) continue;
      for (let n = entry.range[0]; n <= entry.range[1]; n++) {
        if (n < min || n > max) diag.push({ code: "SCHEMA", pointer: `${base}/entries`, message: `range ${n} outside attainable interval [${min}, ${max}]` });
        if (covered.has(n)) diag.push({ code: "SCHEMA", pointer: `${base}/entries`, message: `overlapping range at ${n}` });
        covered.add(n);
      }
    }
    for (let n = min; n <= max; n++) {
      if (!covered.has(n)) diag.push({ code: "SCHEMA", pointer: `${base}/entries`, message: `range gap at ${n}` });
    }
  }
  return diag;
}

function validateResult(
  result: TableResult,
  pointer: string,
  diag: PackDiagnostic[],
  describeTable: ((id: string) => TableData | undefined) | undefined,
  chain: ReadonlySet<string>,
): void {
  if (result.type === "text") return;
  if (result.type === "table" || result.type === "roll") {
    if (describeTable) {
      const child = describeTable(result.table);
      if (!child) diag.push({ code: "REFERENCE", pointer, message: `unknown table ${result.table}` });
      else if (chain.has(result.table)) diag.push({ code: "CYCLE", pointer, message: `table reference cycle: ${[...chain, result.table].join(" -> ")}` });
      else validateTable(child, describeTable);
    }
    return;
  }
  if (result.type === "sequence") {
    result.parts.forEach((part, i) => validateResult(part.result, `${pointer}/parts/${i}/result`, diag, describeTable, chain));
  }
}

export function rollTable(table: TableData, ctx: Context, host: TableHost, depth = 0): TableRoll {
  const maxDepth = table.maxDepth ?? 16;
  if (depth > maxDepth) throw new Error(`table: recursion depth exceeded (${maxDepth})`);
  let entry = table.entries[0] as TableData["entries"][number];
  let total: number | undefined;
  let dice: readonly number[] | undefined;
  if (table.mode === "dice" && table.dice) {
    dice = Array.from({ length: table.dice.count }, (_, i) => 1 + portableInt(table.dice?.sides ?? 6, ctx.child(`die:${i}`).rng));
    total = dice.reduce((a, b) => a + b, 0) + table.dice.modifier;
    const found = table.entries.find((e) => e.range && total !== undefined && total >= e.range[0] && total <= e.range[1]);
    if (!found) throw new Error(`table ${table.id}: no range covers ${total}`);
    entry = found;
  } else {
    const selectCtx = ctx.child("select");
    const entries = table.entries;
    const sum = entries.reduce((s, e) => s + (e.weight ?? 0), 0);
    if (sum <= 0 || sum > 0x1_0000_0000) throw new Error(`table ${table.id}: invalid weight total ${sum}`);
    const roll = portableInt(sum, selectCtx.rng);
    let cumulative = 0;
    entry = entries[entries.length - 1] as TableData["entries"][number];
    for (const e of entries) {
      cumulative += e.weight ?? 0;
      if (roll < cumulative) { entry = e; break; }
    }
  }
  const rendered = renderResult(entry.result, ctx.child(`entry:${entry.key}`), host, depth, table.maxDepth ?? 16);
  return {
    table: table.id,
    entry: entry.key,
    ...(total === undefined ? {} : { total }),
    ...(dice === undefined ? {} : { dice }),
    text: rendered.text,
    children: rendered.children,
  };
}

function renderResult(result: TableResult, ctx: Context, host: TableHost, depth: number, maxDepth: number): { text: string; children: readonly TableRoll[] } {
  if (depth > maxDepth) throw new Error(`table: recursion depth exceeded (${maxDepth})`);
  if (result.type === "text") return { text: result.text, children: [] };
  if (result.type === "table") {
    const child = rollTable(host.table(result.table), ctx.child(`table:${result.table}`), host, depth + 1);
    return { text: child.text, children: [child] };
  }
  if (result.type === "generator") {
    const value = host.generator(result.generator).generate(ctx.child(`generator:${result.generator}`));
    if (result.field) {
      if (value === null || typeof value !== "object" || !(result.field in value)) throw new Error(`table: generator ${result.generator} has no field ${result.field}`);
      return { text: String((value as Record<string, unknown>)[result.field]), children: [] };
    }
    return { text: String(value), children: [] };
  }
  if (result.type === "grammar") {
    return { text: host.expandGrammar(result.grammar, result.template, ctx.child(`grammar:${result.grammar}`)), children: [] };
  }
  if (result.type === "sequence") {
    const parts = result.parts.map((p) => renderResult(p.result, ctx.child(`part:${p.key}`), host, depth + 1, maxDepth));
    return { text: parts.map((p) => p.text).join(result.separator), children: parts.flatMap((p) => p.children) };
  }
  const attempts = result.duplicates === "reroll" ? Math.min(1000, result.count * 32) : 1;
  const seen = new Set<string>();
  const children: TableRoll[] = [];
  for (let i = 0; i < result.count; i++) {
    for (let attempt = 0; attempt < attempts; attempt++) {
      const child = rollTable(host.table(result.table), ctx.child(`roll:${i}`).child(`attempt:${attempt}`), host, depth + 1);
      const key = `${child.table}\u0000${child.entry}`;
      if (result.duplicates === "reroll" && seen.has(key)) continue;
      seen.add(key);
      children.push(child);
      break;
    }
    if (children.length <= i) throw new Error(`table: duplicate suppression exhausted for ${result.table}`);
  }
  return { text: children.map((c) => c.text).join(" "), children };
}
