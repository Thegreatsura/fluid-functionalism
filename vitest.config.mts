import { defineConfig } from "vitest/config";

// The preset and registry tests are plain node `.mjs` files. Component tests
// are `.tsx` and opt into jsdom per file with `// @vitest-environment jsdom`,
// so nothing here changes the environment globally.
const root = new URL(".", import.meta.url).pathname.replace(/\/$/, "");

export default defineConfig({
  resolve: {
    alias: { "@": root },
  },
  // tsconfig says `jsx: "preserve"` for Next; Vite 8's oxc transform must
  // compile it for the test runner instead.
  oxc: {
    jsx: { runtime: "automatic" },
  },
});
