import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { obtenerListado, registrarInspeccion } from "@/server/inspecciones.service";
import { GET, POST } from "./route";

// "server-only" lanza un error fuera de Next; en las pruebas no hace falta.
vi.mock("server-only", () => ({}));

// connection() solo funciona dentro de una petición real de Next.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: vi.fn(async () => {}),
}));

// Se conserva ErrorDeValidacion; solo se simulan las operaciones con la BD.
vi.mock("@/server/inspecciones.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/inspecciones.service")>()),
  obtenerListado: vi.fn(),
  registrarInspeccion: vi.fn(),
}));

const URL_API = "http://localhost/api/inspecciones";

// Un error como el que lanzaría pg: con detalles que no deben salir de la API.
const ERROR_DE_BD = new Error(
  'relation "inspecciones" does not exist (host=db.interno password=secreto)',
);

const RESPUESTA_GENERICA = {
  error: "ERROR_INTERNO",
  mensaje: "No se pudo completar la operación. Intenta de nuevo.",
};

const INSPECCION_VALIDA = {
  productoCodigo: "P001",
  lote: "L-2026-001",
  fecha: "2026-10-01",
  unidadesRevisadas: 100,
  unidadesDefectuosas: 2,
};

describe("API de inspecciones ante un error inesperado", () => {
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.resetAllMocks();
    consoleError.mockRestore();
  });

  async function comprobar500(respuesta: Response) {
    expect(respuesta.status).toBe(500);
    const texto = await respuesta.text();
    expect(JSON.parse(texto)).toEqual(RESPUESTA_GENERICA);
    // Nada del error original llega al cliente.
    for (const detalle of ["relation", 'inspecciones"', "db.interno", "secreto", "stack"]) {
      expect(texto).not.toContain(detalle);
    }
    // El detalle sí queda en el log del servidor.
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), ERROR_DE_BD);
  }

  it("GET responde 500 con el mensaje genérico", async () => {
    vi.mocked(obtenerListado).mockRejectedValue(ERROR_DE_BD);

    const respuesta = await GET(new NextRequest(URL_API));

    await comprobar500(respuesta);
  });

  it("POST responde 500 con el mensaje genérico", async () => {
    vi.mocked(registrarInspeccion).mockRejectedValue(ERROR_DE_BD);

    const respuesta = await POST(
      new NextRequest(URL_API, {
        method: "POST",
        body: JSON.stringify(INSPECCION_VALIDA),
      }),
    );

    expect(registrarInspeccion).toHaveBeenCalledOnce();
    await comprobar500(respuesta);
  });
});
