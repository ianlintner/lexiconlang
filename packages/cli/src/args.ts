// Tiny zero-dependency CLI argument parser.
// Supports: --flag, --key=value, --key value, positional args.
// Boolean flags negated with --no-flag.

export interface ParsedArgs {
  command?: string;
  positional: string[];
  options: Record<string, string | boolean>;
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const out: ParsedArgs = { positional: [], options: {} };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i] as string;
    if (i === 0 && !a.startsWith("-")) {
      out.command = a;
      i++;
      continue;
    }
    if (a.startsWith("--")) {
      const body = a.slice(2);
      const eq = body.indexOf("=");
      if (eq >= 0) {
        out.options[body.slice(0, eq)] = body.slice(eq + 1);
        i++;
        continue;
      }
      if (body.startsWith("no-")) {
        out.options[body.slice(3)] = false;
        i++;
        continue;
      }
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("-")) {
        out.options[body] = next;
        i += 2;
      } else {
        out.options[body] = true;
        i++;
      }
      continue;
    }
    if (a.startsWith("-")) {
      out.options[a.slice(1)] = true;
      i++;
      continue;
    }
    out.positional.push(a);
    i++;
  }
  return out;
}

export function requireOption(args: ParsedArgs, key: string): string {
  const v = args.options[key];
  if (typeof v !== "string") {
    throw new Error(`missing required --${key}`);
  }
  return v;
}

export function intOption(args: ParsedArgs, key: string, fallback: number): number {
  const v = args.options[key];
  if (v === undefined || v === true || v === false) return fallback;
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) throw new Error(`--${key} must be an integer`);
  return n;
}
