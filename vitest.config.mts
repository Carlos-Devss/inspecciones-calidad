import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // El mismo alias que tsconfig.json, para probar módulos que importan "@/...".
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // e2e/ es de Playwright (npm run test:e2e), no de Vitest.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
