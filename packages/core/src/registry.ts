import type { Generator } from "./generator.js";

export interface Registry {
  register<T>(gen: Generator<T>): void;
  get<T>(id: string): Generator<T>;
  has(id: string): boolean;
  resolve<T>(ref: string | Generator<T>): Generator<T>;
  list(): readonly string[];
}

export class RegistryImpl implements Registry {
  private readonly map = new Map<string, Generator<unknown>>();

  register<T>(gen: Generator<T>): void {
    if (this.map.has(gen.id)) {
      throw new Error(`Registry: duplicate generator id '${gen.id}'`);
    }
    this.map.set(gen.id, gen as Generator<unknown>);
  }

  get<T>(id: string): Generator<T> {
    const g = this.map.get(id);
    if (!g) throw new Error(`Registry: no generator registered for id '${id}'`);
    return g as Generator<T>;
  }

  has(id: string): boolean {
    return this.map.has(id);
  }

  resolve<T>(ref: string | Generator<T>): Generator<T> {
    return typeof ref === "string" ? this.get<T>(ref) : ref;
  }

  list(): readonly string[] {
    return [...this.map.keys()].sort();
  }
}

export function createRegistry(): Registry {
  return new RegistryImpl();
}
