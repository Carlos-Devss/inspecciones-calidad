import { defineConfig, devices } from "@playwright/test";

const enCI = Boolean(process.env.CI);

// Pruebas de punta a punta contra la app compilada (next build + next start),
// igual que en producción. Ver e2e/ y la sección de pruebas en CLAUDE.md.
export default defineConfig({
  testDir: "e2e",
  // Todas las pruebas usan la misma base de datos. En serie, una prueba no ve
  // las filas que otra está creando (p. ej. "la nueva queda primera").
  workers: 1,
  fullyParallel: false,
  forbidOnly: enCI,
  reporter: [["list"], ["html", { open: "never" }]],
  // Marca la corrida y, al final, borra sus inspecciones (lotes E2E-<marca>-*).
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "escritorio",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "movil",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !enCI,
    timeout: 240_000,
  },
});
