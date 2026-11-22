// N1 cross-port vector emitter. Run from the repository root after `pnpm build`:
//   node scripts/portable-vectors/emit.mjs
// Writes scripts/portable-vectors/vectors.json. Vectors are REVIEWED and COMMITTED:
// never regenerate them merely to make a failing implementation pass.
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createRng } from "../../packages/core/dist/rng.js";
import { contentHash } from "../../packages/packs/dist/src/hash.js";
import { loadPack } from "../../packages/packs/dist/src/pack.js";
import { createWorld } from "../../packages/packs/dist/src/world.js";

const here = dirname(fileURLToPath(import.meta.url));
const packPath = resolve(here, "portable.pack.json");
const assetPath = resolve(here, "assets", "syllables.markov.json");

const packText = await readFile(packPath, "utf8");
const assetBytes = new Uint8Array(await readFile(assetPath));
const resolver = {
  async resolve() { throw new Error("N1 demo pack has no dependencies"); },
  async readAsset(packId, path) {
    if (packId !== "acme.portable" || path !== "assets/syllables.markov.json") throw new Error(`unknown asset ${packId}:${path}`);
    return assetBytes;
  },
};
const pack = await loadPack(packText, { resolver });
const packHash = pack.hash;
const manifestHash = contentHash(JSON.parse(packText));

const vectors = [];
function add(vector) {
  vectors.push({ schema: "lexiconlang.n1.vectors/v1", ...vector });
}

function addRng(label, seed, path) {
  let rng = createRng(seed);
  const scope = [];
  for (const part of path) { rng = rng.fork(part); scope.push(part); }
  const draws = Array.from({ length: 8 }, () => rng.nextU32());
  const state = rng.state();
  add({
    id: `rng/${label}`,
    engine: "portable-rng-v1",
    seed,
    path,
    input: { count: 8 },
    expected: { draws, state: { algo: state.algo, state: [...state.state], origin: state.origin } },
  });
}

// Seeds exercise empty, ASCII, accented BMP and supplementary-plane strings.
for (const [label, seed] of [
  ["empty", ""],
  ["ascii", "golden-master-1"],
  ["accented", "café-ñ"],
  ["emoji", "🌊-tide"],
]) {
  addRng(`${label}/root`, seed, []);
  addRng(`${label}/nested`, seed, ["region:5", "settlement:11", "npc:3"]);
}

const seed = "n1-portable-seed";
const world = createWorld({ seed });
world.use(pack);

function addGenerate(id, generatorId, key, options = {}) {
  const path = [`generator:${generatorId}`, `key:${key}`];
  const expected = world.generate(generatorId, key, options);
  add({ id, engine: "portable-pack-v1", pack: { id: "acme.portable", version: "1.0.0", hash: packHash, manifestHash }, seed, path, input: { generator: generatorId, key, options }, expected });
}

for (const key of ["harbor-0", "harbor-1", "riverside", "éclair", "🌊"]) {
  addGenerate(`name/given/${encodeURIComponent(key)}`, "acme.portable/generator/given", key);
}
addGenerate("name/ship", "acme.portable/generator/ship", "vessel-1");
for (const key of ["omen-0", "omen-1", "omen-2"]) {
  addGenerate(`grammar/${key}`, "acme.portable/generator/omen", key);
}
for (const key of ["weather-0", "weather-1"]) {
  addGenerate(`table/weighted/${key}`, "acme.portable/generator/weather", key);
}
for (const key of ["dice-0", "dice-1"]) {
  addGenerate(`table/dice/${key}`, "acme.portable/generator/dice", key);
}
addGenerate("table/combo", "acme.portable/generator/combo", "combo-0");
for (const key of ["markov-0", "markov-1", "markov-2"]) {
  addGenerate(`markov/${key}`, "acme.portable/generator/markov", key);
}

// Derived-context independence: same key reached after sibling traversal.
const descendant = createRng(seed).fork("generator:acme.portable/generator/omen").fork("key:independent");
const siblingNoise = createRng(seed);
for (let i = 0; i < 20; i++) siblingNoise.fork(`noise:${i}`).nextU32();
const descendant2 = createRng(seed).fork("generator:acme.portable/generator/omen").fork("key:independent");
add({
  id: "independence/sibling-traversal",
  engine: "portable-rng-v1",
  seed,
  path: ["generator:acme.portable/generator/omen", "key:independent"],
  input: { siblingForks: 20 },
  expected: { draws: Array.from({ length: 8 }, () => descendant.nextU32()), afterTraversal: Array.from({ length: 8 }, () => descendant2.nextU32()) },
});

const output = JSON.stringify({ profile: "portable-v1", source: "@lexiconlang/packs F2", vectors }, null, 2) + "\n";
await writeFile(resolve(here, "vectors.json"), output);
console.log(`emitted ${vectors.length} vectors; packHash=${packHash}`);
