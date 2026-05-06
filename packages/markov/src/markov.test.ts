import { describe, expect, it } from "vitest";
import { createContext } from "@content-gen/core";
import { markov } from "./sampler.js";
import { train } from "./trainer.js";
import { fromJSON, toJSON } from "./model.js";

const elvishCorpus = [
  "Aelar", "Aerdeth", "Ahvain", "Aramil", "Arannis", "Aust", "Beiro",
  "Berrian", "Caeldrim", "Carric", "Dayereth", "Dreali", "Eiravel",
  "Enialis", "Erdan", "Erevan", "Fivin", "Galinndan", "Gennal", "Hadarai",
  "Halimath", "Heian", "Himo", "Immeral", "Ivellios", "Korfel", "Lamlis",
  "Laucian", "Lucan", "Mindartis", "Naal", "Nutae", "Paelias", "Peren",
];

describe("markov", () => {
  it("trains a model and produces deterministic samples", () => {
    const model = train(elvishCorpus, { order: 3, minLength: 4, maxLength: 10 });
    const gen = markov(model);
    const a = gen.generate(createContext({ seed: "elf-1" }));
    const b = gen.generate(createContext({ seed: "elf-1" }));
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(4);
    expect(a.length).toBeLessThanOrEqual(10);
  });

  it("produces different output for different seeds", () => {
    const model = train(elvishCorpus, { order: 3 });
    const gen = markov(model);
    const a = gen.generate(createContext({ seed: "elf-1" }));
    const b = gen.generate(createContext({ seed: "elf-2" }));
    // Probabilistic but for these seeds should differ.
    expect(a).not.toBe(b);
  });

  it("rejects training-corpus verbatim when forbidden is enabled", () => {
    const model = train(elvishCorpus, {
      order: 3,
      rejectSubstringsOfLength: 4,
    });
    expect(model.forbidden).toBeDefined();
    expect(model.forbidden!.length).toBeGreaterThan(0);

    const gen = markov(model);
    for (let i = 0; i < 200; i++) {
      const out = gen.generate(createContext({ seed: `t:${i}` })).toLowerCase();
      for (const f of model.forbidden!) {
        expect(out).not.toBe(f);
      }
    }
  });

  it("model JSON round-trips", () => {
    const model = train(elvishCorpus, { order: 3 });
    const json = toJSON(model);
    const restored = fromJSON(json);
    const a = markov(model).generate(createContext({ seed: "rt" }));
    const b = markov(restored).generate(createContext({ seed: "rt" }));
    expect(a).toBe(b);
  });

  it("higher-order produces output that resembles training", () => {
    const model = train(elvishCorpus, { order: 3, minLength: 5 });
    const gen = markov(model);
    const samples = new Set<string>();
    for (let i = 0; i < 50; i++) {
      samples.add(gen.generate(createContext({ seed: `s:${i}` })));
    }
    // Should produce a healthy variety, not collapse to a single output.
    expect(samples.size).toBeGreaterThan(20);
  });
});
