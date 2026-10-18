import { borrarInspeccionesDeLaCorrida, prefijoDeCorrida } from "./datos";

export default async function globalTeardown() {
  const borradas = await borrarInspeccionesDeLaCorrida();
  console.log(`Limpieza E2E: ${borradas} inspecciones con lote ${prefijoDeCorrida()}* borradas.`);
}
