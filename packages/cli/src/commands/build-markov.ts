import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { train, toJSON, type Corpus } from "@lexiconlang/markov";
import { intOption, requireOption, type ParsedArgs } from "../args.js";

export async function runBuildMarkov(args: ParsedArgs): Promise<void> {
  const input = args.positional[0] ?? requireOption(args, "input");
  const output = (args.options["out"] as string | undefined)
    ?? (args.options["output"] as string | undefined)
    ?? requireOption(args, "out");

  const order = intOption(args, "order", 3);
  const minLength = intOption(args, "min-length", 3);
  const maxLength = intOption(args, "max-length", 14);
  const reject = args.options["reject-substrings-of-length"];
  const rejectLen = typeof reject === "string" ? Number.parseInt(reject, 10) : undefined;
  const lowercase = args.options["lowercase"] !== false;

  const inputPath = resolve(input);
  const raw = await readFile(inputPath, "utf8");
  const corpus = parseCorpus(raw, inputPath);

  const model = train(corpus, {
    order,
    minLength,
    maxLength,
    rejectSubstringsOfLength: rejectLen,
    lowercase,
    meta: { source: inputPath, generatedAt: new Date().toISOString() },
  });

  const outputPath = resolve(output);
  await writeFile(outputPath, JSON.stringify(toJSON(model)) + "\n", "utf8");

  const transitionCount = Object.keys(model.transitions).length;
  console.log(
    `[build-markov] order=${order} minLength=${minLength} maxLength=${maxLength}`,
  );
  console.log(`[build-markov] ${corpus.length} entries → ${transitionCount} contexts`);
  console.log(`[build-markov] wrote ${outputPath}`);
}

function parseCorpus(raw: string, path: string): Corpus {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      throw new Error(`corpus at ${path}: expected JSON array`);
    }
    return parsed as Corpus;
  }
  // Fallback: newline-delimited.
  return trimmed
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("#"));
}
