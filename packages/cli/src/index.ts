#!/usr/bin/env node
import { parseArgs } from "./args.js";
import { runBuildMarkov } from "./commands/build-markov.js";
import { runScaffoldPack } from "./commands/scaffold-pack.js";

const HELP = `lexiconlang — generative content toolkit

Usage:
  lexiconlang <command> [options]

Commands:
  build-markov <input.json> --out <model.json>
      Train a Markov model from a JSON corpus (string[] or {word,weight}[]).
      Options:
        --order <n>                       (default 3)
        --min-length <n>                  (default 3)
        --max-length <n>                  (default 14)
        --reject-substrings-of-length <n> Refuse output that contains training
                                          entries of this length or more.
        --no-lowercase                    Disable lowercasing the corpus.

  scaffold-pack <name> [--dir <packages>]
      Create a new content pack package skeleton at <dir>/<name>.

  help, --help, -h
      Show this message.
`;

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);

  if (!args.command || args.command === "help" || args.options["help"] || args.options["h"]) {
    console.log(HELP);
    return;
  }

  switch (args.command) {
    case "build-markov":
      await runBuildMarkov(args);
      return;
    case "scaffold-pack":
      await runScaffoldPack(args);
      return;
    default:
      console.error(`Unknown command: ${args.command}\n`);
      console.log(HELP);
      process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`error: ${msg}`);
  process.exitCode = 1;
});
