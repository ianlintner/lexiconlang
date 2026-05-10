import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/*/src/**/*.test.ts", "tests/**/*.test.ts"],
    globals: false,
    reporters: "default",
  },
  resolve: {
    alias: {
      "@lexicon/core": new URL("./packages/core/src/index.ts", import.meta.url).pathname,
      "@lexicon/grammar": new URL("./packages/grammar/src/index.ts", import.meta.url).pathname,
      "@lexicon/language": new URL("./packages/language/src/index.ts", import.meta.url).pathname,
      "@lexicon/markov": new URL("./packages/markov/src/index.ts", import.meta.url).pathname,
      "@lexicon/fantasy": new URL("./packages/fantasy/src/index.ts", import.meta.url).pathname,
      "@lexicon/scifi": new URL("./packages/scifi/src/index.ts", import.meta.url).pathname,
      "@lexicon/modern": new URL("./packages/modern/src/index.ts", import.meta.url).pathname,
    },
  },
});
