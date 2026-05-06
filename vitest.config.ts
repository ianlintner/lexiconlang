import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/*/src/**/*.test.ts", "tests/**/*.test.ts"],
    globals: false,
    reporters: "default",
  },
  resolve: {
    alias: {
      "@content-gen/core": new URL("./packages/core/src/index.ts", import.meta.url).pathname,
      "@content-gen/grammar": new URL("./packages/grammar/src/index.ts", import.meta.url).pathname,
      "@content-gen/markov": new URL("./packages/markov/src/index.ts", import.meta.url).pathname,
      "@content-gen/fantasy": new URL("./packages/fantasy/src/index.ts", import.meta.url).pathname,
      "@content-gen/scifi": new URL("./packages/scifi/src/index.ts", import.meta.url).pathname,
      "@content-gen/modern": new URL("./packages/modern/src/index.ts", import.meta.url).pathname,
    },
  },
});
