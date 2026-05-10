// Convenience runner: executes every example in order, useful as a smoke
// test ("does the demo still work after my refactor?").
//
// Run: pnpm --filter examples all

import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const files = readdirSync(here)
  .filter((f) => /^\d{2}-.+\.ts$/.test(f))
  .sort();

let failed = 0;
for (const file of files) {
  console.log(`\n${"═".repeat(72)}`);
  console.log(`  ${file}`);
  console.log("═".repeat(72));
  const r = spawnSync("npx", ["tsx", resolve(here, file)], {
    cwd: here,
    stdio: "inherit",
  });
  if (r.status !== 0) {
    failed++;
    console.error(`  → FAILED with exit ${r.status}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} example(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${files.length} examples ran cleanly.`);
