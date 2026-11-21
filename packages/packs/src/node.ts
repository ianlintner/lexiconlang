import { resolve, sep } from "node:path";
import { readFile, realpath } from "node:fs/promises";
import { loadPack } from "./pack.js";
import { PackValidationError, type LoadedPack, type LoadPackOptions } from "./types.js";

export interface LoadPackFileOptions extends LoadPackOptions {
  /** Trusted base directory; asset/dependency paths must stay inside it. */
  root?: string;
}

/** Node-only filesystem entry point. Kept out of the browser-safe main export. */
export async function loadPackFile(path: string, options: LoadPackFileOptions = {}): Promise<LoadedPack> {
  const root = resolve(options.root ?? ".");
  const file = resolve(root, path);
  const [realRoot, realFile] = await Promise.all([realpath(root).catch(() => root), realpath(file).catch(() => file)]);
  if (!isInside(realRoot, realFile)) throw new PackValidationError([{ code: "SCHEMA", pointer: "", message: `pack path escapes trusted root: ${path}` }]);
  const text = await readFile(realFile, "utf8");
  const resolver = options.resolver ?? {
    async resolve() { throw new PackValidationError([{ code: "DEPENDENCY", pointer: "/depends", message: "no resolver configured for pack dependencies" }]); },
    async readAsset() { throw new PackValidationError([{ code: "INTEGRITY", pointer: "", message: "no resolver configured for pack assets" }]); },
  };
  return loadPack(text, { ...options, resolver });
}

function isInside(root: string, path: string): boolean {
  return path === root || path.startsWith(root.endsWith(sep) ? root : root + sep);
}
