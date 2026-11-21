import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runValidatePack } from "./validate-pack.js";

describe("validate-pack CLI", () => {
  const dirs: string[] = [];
  afterEach(async () => {
    vi.restoreAllMocks();
    process.exitCode = 0;
    for (const d of dirs) await rm(d, { recursive: true, force: true });
  });

  async function tempDir(): Promise<string> {
    const d = await mkdtemp(join(tmpdir(), "lexcli-"));
    dirs.push(d);
    return d;
  }

  it("reports a valid pack with id, version and hash", async () => {
    const dir = await tempDir();
    const manifest = {
      formatVersion: 1,
      id: "cli.test",
      version: "1.0.0",
      license: "CC0-1.0",
      description: "Original test pack",
      provenance: [{ id: "orig", source: "original:cli.test", title: "Test", creator: "Tester", license: "CC0-1.0", attribution: "Original", modifications: "None", files: ["cli.test.pack.json"] }],
      depends: [], extends: [], requires: [],
      cultures: [], meaningPacks: [], grammars: [], tables: [], corpora: [], markovModels: [], generators: [],
    };
    const file = join(dir, "cli.test.pack.json");
    await writeFile(file, JSON.stringify(manifest));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await runValidatePack({ command: "validate-pack", positional: ["cli.test.pack.json"], options: { root: dir } });
    expect(log).toHaveBeenCalledOnce();
    expect(log.mock.calls[0][0]).toMatch(/^valid cli\.test@1\.0\.0 [0-9a-f]{64}$/);
    expect(process.exitCode).not.toBe(1);
  });

  it("prints structured diagnostics and sets exitCode=1 for an invalid pack", async () => {
    const dir = await tempDir();
    const file = join(dir, "bad.pack.json");
    await writeFile(file, JSON.stringify({ formatVersion: 1, id: "bad" }));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    await runValidatePack({ command: "validate-pack", positional: ["bad.pack.json"], options: { root: dir } });
    expect(log).not.toHaveBeenCalled();
    expect(err).toHaveBeenCalled();
    expect(err.mock.calls[0][0]).toMatch(/^SCHEMA /);
    expect(process.exitCode).toBe(1);
  });

  it("requires a file argument", async () => {
    await expect(runValidatePack({ command: "validate-pack", positional: [], options: {} })).rejects.toThrow(/usage:/);
  });
});
