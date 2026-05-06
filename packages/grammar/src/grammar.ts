import type { Context, Generator, Registry, WeightInput } from "@content-gen/core";
import { buildAliasTable, sampleAlias, normalizeWeights } from "@content-gen/core";
import { builtinModifiers, type Modifier } from "./modifiers.js";
import { parse, type Node, type ModifierCall } from "./parser.js";

// ─── grammar definition ──────────────────────────────────────────────────

export type RuleValue<C = unknown> =
  | string
  | readonly string[]
  | WeightInput<string>
  | Generator<string, C>
  | ((ctx: Context<C>) => string);

export type GrammarRules<C = unknown> = Record<string, RuleValue<C>>;

export interface GrammarOptions<C = unknown> {
  id?: string;
  start?: string;
  modifiers?: Record<string, Modifier>;
  registry?: Registry;
  maxDepth?: number;
}

export interface Grammar<C = unknown> extends Generator<string, C> {
  readonly id: string;
  readonly rules: GrammarRules<C>;
  generate(ctx: Context<C>): string;
  expand(template: string, ctx: Context<C>): string;
}

// Each compiled rule produces a string given a context.
type CompiledRule<C> = (ctx: Context<C>, locals: LocalScope) => string;

interface LocalScope {
  parent: LocalScope | null;
  vars: Map<string, Node[]>;
}

// ─── compile a single rule's value ───────────────────────────────────────

function compileRuleValue<C>(value: RuleValue<C>): CompiledRule<C> {
  if (typeof value === "function") {
    return (ctx) => value(ctx);
  }
  if (typeof value === "string") {
    const ast = parse(value);
    return (ctx, locals) => evalNodes(ast, ctx, locals, this_);
  }
  if (Array.isArray(value)) {
    // string[] — uniform random pick
    const arr = value as readonly string[];
    if (arr.length === 0) return () => "";
    const asts = arr.map((s) => parse(s));
    return (ctx, locals) => {
      const idx = ctx.rng.nextInt(0, arr.length);
      const ast = asts[idx] ?? [];
      return evalNodes(ast, ctx, locals, this_);
    };
  }
  // Generator-like object
  if (typeof value === "object" && value !== null && "generate" in value && typeof (value as Generator<string, C>).generate === "function") {
    const gen = value as Generator<string, C>;
    return (ctx) => gen.generate(ctx);
  }
  // Weighted record / array of {value,weight}
  const weighted = normalizeWeights(value as WeightInput<string>);
  if (weighted.length === 0) return () => "";
  const table = buildAliasTable<string>(weighted);
  // Pre-parse each branch.
  const asts = weighted.map((w) => parse(w.value));
  return (ctx, locals) => {
    // Use alias table only to find the index, then return the parsed AST.
    const picked = sampleAlias(table, ctx.rng);
    const idx = weighted.findIndex((w) => w.value === picked);
    const ast = asts[idx >= 0 ? idx : 0] ?? [];
    return evalNodes(ast, ctx, locals, this_);
  };
}

// `this_` is replaced at call-time with the active grammar evaluation
// context. It's threaded as a parameter rather than via closure so a single
// grammar value can be reused across multiple Grammar instances.
type EvalCtx<C> = {
  modifiers: Record<string, Modifier>;
  rules: Map<string, CompiledRule<C>>;
  registry?: Registry;
  maxDepth: number;
  depth: number;
};
let this_: EvalCtx<unknown> | null = null;

// ─── evaluate parsed nodes into a string ─────────────────────────────────

function evalNodes<C>(
  nodes: readonly Node[],
  ctx: Context<C>,
  locals: LocalScope,
  ec: EvalCtx<unknown> | null,
): string {
  if (!ec) throw new Error("grammar: evaluation context missing");
  if (ec.depth > ec.maxDepth) {
    throw new Error(`grammar: recursion depth exceeded (${ec.maxDepth})`);
  }
  let out = "";
  let i = 0;
  for (const node of nodes) {
    // Sub-context per slot keeps positional determinism. Use `i` so that
    // adding text at the end of a template doesn't shift earlier slots.
    if (node.type === "text") {
      out += node.value;
    } else if (node.type === "raw") {
      out += node.value;
    } else {
      // Apply actions first: they push variables onto the local scope.
      for (const action of node.actions) {
        locals.vars.set(action.name, action.rule);
      }
      if (node.symbol === "__action__") {
        i++;
        continue;
      }
      const slotCtx = ctx.child(`g:${i}:${node.symbol}`);
      let value = expandSymbol(node.symbol, slotCtx, locals, ec);
      for (const mod of node.mods) {
        value = applyModifier(value, mod, ec);
      }
      out += value;
    }
    i++;
  }
  return out;
}

function expandSymbol<C>(
  symbol: string,
  ctx: Context<C>,
  locals: LocalScope,
  ec: EvalCtx<unknown>,
): string {
  // Local variables shadow rules.
  let scope: LocalScope | null = locals;
  while (scope) {
    const v = scope.vars.get(symbol);
    if (v !== undefined) {
      const next: LocalScope = { parent: scope, vars: new Map() };
      ec.depth++;
      try {
        return evalNodes(v, ctx, next, ec);
      } finally {
        ec.depth--;
      }
    }
    scope = scope.parent;
  }

  // Plugin lookup via colon prefix: `#markov:elvish#` → registry.get('markov:elvish')
  if (symbol.includes(":") && ec.registry?.has(symbol)) {
    const gen = ec.registry.get<string>(symbol);
    return gen.generate(ctx);
  }

  const rule = ec.rules.get(symbol);
  if (!rule) {
    // Fall back to registry lookup by bare name.
    if (ec.registry?.has(symbol)) {
      return ec.registry.get<string>(symbol).generate(ctx);
    }
    return `((${symbol}))`;
  }
  ec.depth++;
  try {
    return rule(ctx, { parent: locals, vars: new Map() });
  } finally {
    ec.depth--;
  }
}

function applyModifier(input: string, call: ModifierCall, ec: EvalCtx<unknown>): string {
  const fn = ec.modifiers[call.name];
  if (!fn) return input;
  return fn(input, ...call.args);
}

// ─── public factory ──────────────────────────────────────────────────────

export function grammar<C = unknown>(
  rules: GrammarRules<C>,
  options: GrammarOptions<C> = {},
): Grammar<C> {
  const startKey = options.start ?? (rules.start !== undefined ? "start" : "origin");
  const compiled = new Map<string, CompiledRule<C>>();
  for (const [k, v] of Object.entries(rules)) {
    compiled.set(k, compileRuleValue<C>(v));
  }
  const modifiers = { ...builtinModifiers, ...(options.modifiers ?? {}) };
  const id = options.id ?? "grammar";
  const maxDepth = options.maxDepth ?? 64;

  return {
    id,
    rules,
    generate(ctx: Context<C>) {
      return this.expand(`#${startKey}#`, ctx);
    },
    expand(template: string, ctx: Context<C>) {
      const ec: EvalCtx<unknown> = {
        modifiers,
        rules: compiled as unknown as Map<string, CompiledRule<unknown>>,
        registry: options.registry ?? ctx.registry,
        maxDepth,
        depth: 0,
      };
      const prev = this_;
      this_ = ec;
      try {
        const ast = parse(template);
        return evalNodes(ast, ctx, { parent: null, vars: new Map() }, ec);
      } finally {
        this_ = prev;
      }
    },
  };
}
