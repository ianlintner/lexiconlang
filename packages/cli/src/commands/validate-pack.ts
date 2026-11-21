import { loadPackFile } from "@lexiconlang/packs/node";
import { PackValidationError } from "@lexiconlang/packs";
import { resolve } from "node:path";
import type { ParsedArgs } from "../args.js";

export async function runValidatePack(args: ParsedArgs): Promise<void> {
  const file = args.positional[0];
  if (!file) throw new Error("usage: lexiconlang validate-pack <file> [--root <dir>]");
  const root = resolve((args.options["root"] as string | undefined) ?? ".");
  try {
    const pack = await loadPackFile(file, { root });
    console.log(`valid ${pack.manifest.id}@${pack.manifest.version} ${pack.hash}`);
    if (pack.dependencies.length > 0) {
      console.log(`dependencies: ${pack.dependencies.map((d) => `${d.manifest.id}@${d.manifest.version}`).join(", ")}`);
    }
  } catch (error) {
    if (error instanceof PackValidationError) {
      for (const d of error.diagnostics) console.error(`${d.code} ${d.pointer || "/"}: ${d.message}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}
