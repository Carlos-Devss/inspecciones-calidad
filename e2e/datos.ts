import { expect, type APIRequestContext, type TestInfo } from "@playwright/test";
import pg from "pg";
import type { Resultado } from "../src/domain/clasificacion";
import type {
  InspeccionClasificada,
  ListadoInspecciones,
  Producto,
} from "../src/shared/inspeccion.types";

// Datos de las pruebas E2E. Cada corrida crea sus inspecciones con el lote
// E2E-<corrida>-<n> y al final borra solo esas (global-teardown.ts). Las
// pruebas no suponen totales fijos: comparan contra la API o contra la
// pantalla, así pasan igual con la base del seed (CI) que con la de desarrollo.

// En local, DATABASE_URL sale de .env.local; en CI viene del entorno.
try {
  process.loadEnvFile(".env.local");
} catch {
  // Sin .env.local: se usa el entorno.
}

export const RESULTADOS: Resultado[] = ["Aprobado", "Con observaciones", "Rechazado"];

export type Filtros = { producto?: string; resultado?: Resultado };

export function prefijoDeCorrida(): string {
  const corrida = process.env.E2E_CORRIDA;
  if (!corrida) {
    throw new Error("Falta E2E_CORRIDA: la define e2e/global-setup.ts.");
  }
  return `E2E-${corrida}-`;
}

let contador = 0;

// El índice del worker evita choques si Playwright reinicia el worker tras
// un fallo (el contador vuelve a empezar, pero el índice cambia).
export function loteUnico(testInfo: TestInfo): string {
  contador += 1;
  return `${prefijoDeCorrida()}${testInfo.workerIndex}-${contador}`;
}

// Hoy y mañana en la zona horaria del negocio, como AAAA-MM-DD.
export function hoy(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function manana(): string {
  const [anio, mes, dia] = hoy().split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia + 1)).toISOString().slice(0, 10);
}

export async function obtenerProductos(request: APIRequestContext): Promise<Producto[]> {
  const respuesta = await request.get("/api/productos");
  expect(respuesta.status()).toBe(200);
  const { productos } = (await respuesta.json()) as { productos: Producto[] };
  expect(productos.length).toBeGreaterThan(0);
  return productos;
}

export async function obtenerListado(
  request: APIRequestContext,
  filtros: Filtros = {},
): Promise<ListadoInspecciones> {
  const params: Record<string, string> = {};
  if (filtros.producto) params.producto = filtros.producto;
  if (filtros.resultado) params.resultado = filtros.resultado;
  const respuesta = await request.get("/api/inspecciones", { params });
  expect(respuesta.status()).toBe(200);
  return (await respuesta.json()) as ListadoInspecciones;
}

export async function contarPorLote(request: APIRequestContext, lote: string): Promise<number> {
  const { inspecciones } = await obtenerListado(request);
  return inspecciones.filter((inspeccion) => inspeccion.lote === lote).length;
}

// Crea una inspección por la API (para preparar datos sin pasar por la pantalla).
export async function crearInspeccion(
  request: APIRequestContext,
  datos: {
    productoCodigo: string;
    lote: string;
    unidadesRevisadas: number;
    unidadesDefectuosas: number;
    fecha?: string;
  },
): Promise<InspeccionClasificada> {
  const respuesta = await request.post("/api/inspecciones", {
    data: { fecha: hoy(), ...datos },
  });
  expect(respuesta.status()).toBe(201);
  const { inspeccion } = (await respuesta.json()) as { inspeccion: InspeccionClasificada };
  return inspeccion;
}

// Borra solo las inspecciones de esta corrida. El prefijo no lleva % ni _,
// así que LIKE lo toma literal.
export async function borrarInspeccionesDeLaCorrida(): Promise<number> {
  const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await cliente.connect();
  try {
    const { rowCount } = await cliente.query("DELETE FROM inspecciones WHERE lote LIKE $1", [
      `${prefijoDeCorrida()}%`,
    ]);
    return rowCount ?? 0;
  } finally {
    await cliente.end();
  }
}
