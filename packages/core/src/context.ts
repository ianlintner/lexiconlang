import { createRng, type RNG, type Seed } from "./rng.js";
import type { Registry } from "./registry.js";

export interface Context<S = unknown> {
  readonly rng: RNG;
  readonly scope: readonly string[];
  readonly tags: ReadonlySet<string>;
  readonly locale?: string;
  readonly data: S;
  readonly registry?: Registry;
  child(label: string, extra?: ContextOverrides<S>): Context<S>;
  withTags(...tags: string[]): Context<S>;
  withData<S2>(data: S2): Context<S2>;
}

export interface ContextOverrides<S = unknown> {
  tags?: Iterable<string>;
  locale?: string;
  data?: S;
  registry?: Registry;
}

export interface CreateContextOptions<S = unknown> {
  seed: Seed;
  tags?: Iterable<string>;
  locale?: string;
  data?: S;
  registry?: Registry;
}

class ContextImpl<S> implements Context<S> {
  readonly rng: RNG;
  readonly scope: readonly string[];
  readonly tags: ReadonlySet<string>;
  readonly locale?: string;
  readonly data: S;
  readonly registry?: Registry;

  constructor(opts: {
    rng: RNG;
    scope: readonly string[];
    tags: ReadonlySet<string>;
    locale?: string;
    data: S;
    registry?: Registry;
  }) {
    this.rng = opts.rng;
    this.scope = opts.scope;
    this.tags = opts.tags;
    if (opts.locale !== undefined) this.locale = opts.locale;
    this.data = opts.data;
    if (opts.registry !== undefined) this.registry = opts.registry;
  }

  child(label: string, extra?: ContextOverrides<S>): Context<S> {
    return new ContextImpl<S>({
      rng: this.rng.fork(label),
      scope: [...this.scope, label],
      tags: extra?.tags ? new Set([...this.tags, ...extra.tags]) : this.tags,
      locale: extra?.locale ?? this.locale,
      data: (extra?.data ?? this.data) as S,
      registry: extra?.registry ?? this.registry,
    });
  }

  withTags(...tags: string[]): Context<S> {
    return new ContextImpl<S>({
      rng: this.rng,
      scope: this.scope,
      tags: new Set([...this.tags, ...tags]),
      locale: this.locale,
      data: this.data,
      registry: this.registry,
    });
  }

  withData<S2>(data: S2): Context<S2> {
    return new ContextImpl<S2>({
      rng: this.rng,
      scope: this.scope,
      tags: this.tags,
      locale: this.locale,
      data,
      registry: this.registry,
    });
  }
}

export function createContext<S = undefined>(opts: CreateContextOptions<S>): Context<S> {
  return new ContextImpl<S>({
    rng: createRng(opts.seed),
    scope: [],
    tags: new Set(opts.tags ?? []),
    locale: opts.locale,
    data: (opts.data ?? undefined) as S,
    registry: opts.registry,
  });
}
