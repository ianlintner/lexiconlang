import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/*/src/**/*.test.ts", "tests/**/*.test.ts"],
    globals: false,
    reporters: "default",
  },
  resolve: {
    alias: {
      "@lexiconlang/core": new URL("./packages/core/src/index.ts", import.meta.url).pathname,
      "@lexiconlang/grammar": new URL("./packages/grammar/src/index.ts", import.meta.url).pathname,
      "@lexiconlang/language": new URL("./packages/language/src/index.ts", import.meta.url).pathname,
      "@lexiconlang/markov": new URL("./packages/markov/src/index.ts", import.meta.url).pathname,
      "@lexiconlang/fantasy": new URL("./packages/fantasy/src/index.ts", import.meta.url).pathname,
      "@lexiconlang/scifi": new URL("./packages/scifi/src/index.ts", import.meta.url).pathname,
      "@lexiconlang/modern": new URL("./packages/modern/src/index.ts", import.meta.url).pathname,
    },
  },
});
