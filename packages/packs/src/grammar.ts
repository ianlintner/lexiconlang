import type { Context, Generator, RNG } from "@lexiconlang/core";
import { builtinModifiers } from "@lexiconlang/grammar";
import type { GrammarData, PackDiagnostic } from "./types.js";

export const MODIFIER_NAMES = new Set(Object.keys(builtinModifiers));
const RULE_KEY = /^[A-Za-z_][A-Za-z0-9_-]*$/;
const RESOURCE_ID = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*\/[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/;

export interface PortableModifier { name: string; args: readonly string[] }
export type PortableNode =
  | { type: "text"; value: string }
  | { type: "ref"; head: string; external: boolean; mods: readonly PortableModifier[] };

export interface ParsedTemplate { nodes: readonly PortableNode[]; diagnostics: readonly PackDiagnostic[] }

/** Portable v1 reference grammar: #rule#, #<full.id>#, modifiers split only after the head. */
export function parsePortable(template: string, pointer = ""): ParsedTemplate {
  const nodes: PortableNode[] = [];
  const diagnostics: PackDiagnostic[] = [];
  let text = "";
  const flush = () => { if (text) { nodes.push({ type: "text", value: text }); text = ""; } };
  let i = 0;
  while (i < template.length) {
    const ch = template[i] as string;
    if (ch === "\\" && i + 1 < template.length) {
      text += template[i + 1];
      i += 2;
      continue;
    }
    if (ch !== "#") { text += ch; i++; continue; }
    const close = findClosing(template, i + 1);
    if (close < 0) {
      diagnostics.push({ code: "REFERENCE", pointer, message: "unterminated # reference" });
      i++;
      continue;
    }
    flush();
    const inner = template.slice(i + 1, close);
    const parsed = parseHead(inner, `${pointer}`);
    diagnostics.push(...parsed.diagnostics);
    if (parsed.node) nodes.push(parsed.node);
    i = close + 1;
  }
  flush();
  return { nodes, diagnostics };
}

function findClosing(template: string, start: number): number {
  for (let i = start; i < template.length; i++) {
    if (template[i] === "\\") { i++; continue; }
    if (template[i] === "#") return i;
  }
  return -1;
}

function parseHead(inner: string, pointer: string): { node?: PortableNode; diagnostics: PackDiagnostic[] } {
  const diagnostics: PackDiagnostic[] = [];
  let head = "";
  let external = false;
  let rest = inner;
  if (inner.startsWith("<")) {
    const end = inner.indexOf(">");
    if (end < 0) {
      return { diagnostics: [{ code: "REFERENCE", pointer, message: "unterminated < in reference" }] };
    }
    head = inner.slice(1, end);
    external = true;
    rest = inner.slice(end + 1);
    if (!RESOURCE_ID.test(head)) diagnostics.push({ code: "REFERENCE", pointer, message: `invalid full id in reference: ${JSON.stringify(head)}` });
  } else {
    const dot = inner.indexOf(".");
    head = (dot < 0 ? inner : inner.slice(0, dot)).trim();
    rest = dot < 0 ? "" : inner.slice(dot);
    if (!RULE_KEY.test(head)) diagnostics.push({ code: "REFERENCE", pointer, message: `invalid rule key in reference: ${JSON.stringify(head)}` });
    if (inner.includes("/")) diagnostics.push({ code: "REFERENCE", pointer, message: `bare full id in reference; use <...>: ${JSON.stringify(inner)}` });
  }
  if (!head) diagnostics.push({ code: "REFERENCE", pointer, message: "empty reference head" });
  const mods: PortableModifier[] = [];
  let pos = 0;
  while (rest.startsWith(".", pos)) {
    pos++;
    let name = "";
    while (pos < rest.length && /[A-Za-z0-9_-]/.test(rest[pos] as string)) name += rest[pos++] as string;
    if (!name) {
      diagnostics.push({ code: "REFERENCE", pointer, message: "empty modifier name" });
      break;
    }
    const args: string[] = [];
    if (rest[pos] === "(") {
      const end = rest.indexOf(")", pos + 1);
      if (end < 0) {
        diagnostics.push({ code: "REFERENCE", pointer, message: "unterminated modifier args" });
        break;
      }
      const argText = rest.slice(pos + 1, end);
      if (argText.trim()) args.push(...argText.split(",").map((a) => a.trim()));
      pos = end + 1;
    }
    if (!MODIFIER_NAMES.has(name)) diagnostics.push({ code: "REFERENCE", pointer, message: `unknown modifier ${JSON.stringify(name)}` });
    mods.push({ name, args });
  }
  if (pos < rest.length && rest[pos] !== ".") {
    diagnostics.push({ code: "REFERENCE", pointer, message: `unexpected text in reference: ${JSON.stringify(rest.slice(pos))}` });
  }
  if (diagnostics.length > 0) return { diagnostics };
  return { node: { type: "ref", head, external, mods }, diagnostics };
}

/** Exact integer roll: floor(u32 * n / 2^32) with BigInt, for 1 <= n <= 2^32. */
export function portableInt(n: number, rng: RNG): number {
  if (!Number.isSafeInteger(n) || n < 1 || n > 0x1_0000_0000) throw new RangeError(`portableInt: n out of range (${n})`);
  return Number((BigInt(rng.nextU32()) * BigInt(n)) >> 32n);
}

export function validateGrammar(grammar: GrammarData, describeExternal?: (id: string) => "string" | undefined): readonly PackDiagnostic[] {
  const diag: PackDiagnostic[] = [];
  const rules = new Map<string, readonly { value: string; weight: number }[]>();
  for (const [i, rule] of grammar.rules.entries()) {
    if (rules.has(rule.key)) diag.push({ code: "COLLISION", pointer: `/grammars/${grammar.id}/rules/${i}/key`, message: `duplicate rule key ${rule.key}` });
    rules.set(rule.key, rule.choices);
    let total = 0;
    for (const [j, choice] of rule.choices.entries()) {
      total += choice.weight;
      const parsed = parsePortable(choice.value, `/grammars/${grammar.id}/rules/${i}/choices/${j}/value`);
      diag.push(...parsed.diagnostics);
      for (const node of parsed.nodes) {
        if (node.type !== "ref") continue;
        if (node.external) {
          const shape = describeExternal?.(node.head);
          if (describeExternal && shape !== "string") diag.push({ code: "REFERENCE", pointer: `/grammars/${grammar.id}/rules/${i}/choices/${j}/value`, message: `external ref ${node.head} must be a string-output generator` });
        } else if (!grammar.rules.some((r) => r.key === node.head)) {
          diag.push({ code: "REFERENCE", pointer: `/grammars/${grammar.id}/rules/${i}/choices/${j}/value`, message: `unknown rule ${node.head}` });
        }
      }
    }
    if (total > 0x1_0000_0000) diag.push({ code: "LIMIT", pointer: `/grammars/${grammar.id}/rules/${i}/choices`, message: `weight total ${total} exceeds 2^32` });
  }
  if (!rules.has(grammar.start)) diag.push({ code: "REFERENCE", pointer: `/grammars/${grammar.id}/start`, message: `unknown start rule ${grammar.start}` });
  // Static recursion: a rule graph cycle is a validation error.
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const walk = (key: string, chain: string[]): void => {
    if (visiting.has(key)) {
      diag.push({ code: "CYCLE", pointer: `/grammars/${grammar.id}/rules`, message: `grammar rule cycle: ${[...chain, key].join(" -> ")}` });
      return;
    }
    if (visited.has(key)) return;
    visiting.add(key);
    for (const choice of rules.get(key) ?? []) {
      for (const node of parsePortable(choice.value).nodes) {
        if (node.type === "ref" && !node.external) walk(node.head, [...chain, key]);
      }
    }
    visiting.delete(key);
    visited.add(key);
  };
  for (const key of rules.keys()) walk(key, []);
  return diag;
}

export interface PortableGrammar {
  generate(ctx: Context): string;
  expandTemplate(template: string, ctx: Context): string;
}

/** New interpreter profile. Never substitutes for the existing TS grammar selection. */
export function portableGrammar(
  data: GrammarData,
  external: (id: string) => Generator<unknown>,
): PortableGrammar {
  const rules = new Map(data.rules.map((r) => [r.key, r.choices]));
  const maxDepth = data.maxDepth ?? 32;

  const choose = (key: string, ctx: Context): string => {
    const choices = rules.get(key);
    if (!choices) throw new Error(`portable grammar: unknown rule ${key}`);
    const total = choices.reduce((sum, c) => sum + c.weight, 0);
    if (total <= 0 || total > 0x1_0000_0000) throw new Error(`portable grammar: invalid weight total for ${key}`);
    const roll = portableInt(total, ctx.child("select").rng);
    let cumulative = 0;
    for (const choice of choices) {
      cumulative += choice.weight;
      if (roll < cumulative) return choice.value;
    }
    return (choices[choices.length - 1] as { value: string }).value;
  };

  const expand = (template: string, ctx: Context, depth: number): string => {
    if (depth > maxDepth) throw new Error(`portable grammar: recursion depth exceeded (${maxDepth})`);
    const { nodes } = parsePortable(template);
    let out = "";
    let slot = 0;
    for (const node of nodes) {
      if (node.type === "text") { out += node.value; continue; }
      const slotCtx = ctx.child(`slot:${slot++}`);
      let value: string;
      if (node.external) {
        const gen = external(node.head);
        value = String(gen.generate(slotCtx.child(`generator:${node.head}`)));
      } else {
        const ruleCtx = slotCtx.child(`rule:${node.head}`);
        value = expand(choose(node.head, ruleCtx), ruleCtx, depth + 1);
      }
      for (const mod of node.mods) value = (builtinModifiers[mod.name] as (s: string, ...args: string[]) => string)(value, ...mod.args);
      out += value;
    }
    return out;
  };

  return {
    generate(ctx: Context) { const ruleCtx = ctx.child(`rule:${data.start}`); return expand(choose(data.start, ruleCtx), ruleCtx, 0); },
    expandTemplate(template: string, ctx: Context) { return expand(template, ctx, 0); },
  };
}
