// CI config guard: pnpm version must have exactly one source of truth.
//
// `pnpm/action-setup` resolves the pnpm version from either its own `version:`
// input or the `packageManager` field in package.json. When a workflow passes
// `version:` *and* package.json declares `packageManager`, the action aborts
// the job before installing anything with:
//
//   Error: Multiple versions of pnpm specified:
//     - version <X> in the GitHub Action config with the key "version"
//     - version pnpm@<Y> in the package.json with the key "packageManager"
//
// That is a whole-job failure on every workflow it appears in, and it never
// reaches a test or typecheck step — so nothing in the suite catches it. This
// test is the missing guard: it scans the workflow files and fails when a pnpm
// version is declared twice with disagreeing values, or not at all.
//
// The regression it locks in: commit 16128c1 shipped `.github/workflows/ci.yml`
// with `version: 10` while package.json pinned `pnpm@10.29.3`, failing
// `test (node 20)` and `test (node 22)` on main.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const workflowsDir = join(repoRoot, ".github", "workflows");

interface PnpmSetupStep {
  /** 1-based line number of the `uses:` entry, for actionable failures. */
  line: number;
  /** The ref the workflow pins, e.g. "v6". */
  ref: string;
  /** Value of a `version:` key inside the step's block, if any. */
  version: string | undefined;
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/**
 * Minimal scan for `uses: pnpm/action-setup@<ref>` steps and the `version:` key
 * that belongs to each one. A full YAML parse is unnecessary here: the action's
 * own resolution only ever reads the step's `with:` block, and every workflow
 * in this repo is plain 2-space-indented YAML.
 */
function findPnpmSetupSteps(text: string): PnpmSetupStep[] {
  const lines = text.split(/\r?\n/);
  const steps: PnpmSetupStep[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = /^(\s*)(-\s+)?uses:\s*pnpm\/action-setup@(\S+)\s*$/.exec(
      lines[i]!,
    );
    if (!match) continue;

    // Indent at which the `uses:` key starts; anything less indented ends the
    // step. `- ` on a sequence entry sits before the key and is not indent.
    // Note: group 2 is the optional `- ` sequence marker, group 3 is the ref.
    const keyIndent = match[1]!.length + (match[2]?.length ?? 0);

    let version: string | undefined;
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j]!;
      // A blank line is a legal YAML step separator: a step's `with:` block
      // cannot be interrupted by one, so terminate the scan rather than skip.
      if (line.trim() === "") break;

      const lineIndent = line.length - line.trimStart().length;
      if (lineIndent < keyIndent) break;

      const versionMatch = /^\s*version:\s*(.+?)\s*$/.exec(line);
      if (versionMatch) {
        version = unquote(versionMatch[1]!);
        break;
      }
    }

    steps.push({ line: i + 1, ref: match[3]!, version });
  }

  return steps;
}

const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
  packageManager?: string;
};

const packageManagerVersion =
  typeof pkg.packageManager === "string" && pkg.packageManager.startsWith("pnpm@")
    ? pkg.packageManager.slice("pnpm@".length).split("+")[0]
    : undefined;

const workflowFiles = readdirSync(workflowsDir)
  .filter((name) => /\.ya?ml$/.test(name))
  .sort();

const setups = workflowFiles.flatMap((name) =>
  findPnpmSetupSteps(readFileSync(join(workflowsDir, name), "utf8")).map(
    (step) => ({ file: name, ...step }),
  ),
);

describe("pnpm version has a single source of truth", () => {
  it("package.json declares packageManager for pnpm", () => {
    // Workflows that omit `version:` rely on this field entirely; without it
    // the action fails with "No pnpm version is specified".
    expect(packageManagerVersion).toBeDefined();
  });

  it("finds the pnpm/action-setup steps that are expected to exist", () => {
    // Guards the scan itself: if a workflow is renamed or a step is dropped,
    // the assertions below would pass vacuously.
    expect(setups.length).toBeGreaterThan(0);
    expect(setups.map((s) => s.file)).toContain("ci.yml");
  });

  it("never specifies a version that disagrees with packageManager", () => {
    const conflicts = setups
      .filter(
        (s) =>
          s.version !== undefined &&
          packageManagerVersion !== undefined &&
          s.version !== packageManagerVersion,
      )
      .map(
        (s) =>
          `.github/workflows/${s.file}:${s.line} pins version: ${s.version} ` +
          `but package.json declares packageManager: pnpm@${packageManagerVersion}`,
      );

    expect(conflicts).toEqual([]);
  });

  it("always resolves a pnpm version from somewhere", () => {
    const unresolvable = setups
      .filter((s) => s.version === undefined && packageManagerVersion === undefined)
      .map(
        (s) =>
          `.github/workflows/${s.file}:${s.line} passes no version: and ` +
          `package.json declares no packageManager`,
      );

    expect(unresolvable).toEqual([]);
  });
});
