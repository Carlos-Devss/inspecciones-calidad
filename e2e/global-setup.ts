// Marca de la corrida. Las pruebas la heredan por el entorno y la usan en el
// lote de todo lo que crean (E2E-<marca>-<n>); global-teardown.ts borra solo eso.
export default function globalSetup() {
  process.env.E2E_CORRIDA = String(Date.now());
}
