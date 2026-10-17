import "server-only";
import type { ErrorApi } from "../shared/inspeccion.types";

// Formato único de errores de la API.

export function respuestaValidacion(campos: Record<string, string>) {
  return Response.json({ error: "VALIDACION", campos } satisfies ErrorApi, {
    status: 400,
  });
}

// El detalle (mensaje de la BD, stack) solo va al log del servidor. Al cliente
// se le manda un mensaje genérico: el error original puede revelar tablas,
// columnas o datos de conexión.
export function respuestaErrorInterno(error: unknown) {
  console.error("Error inesperado en la API:", error);
  return Response.json(
    {
      error: "ERROR_INTERNO",
      mensaje: "No se pudo completar la operación. Intenta de nuevo.",
    } satisfies ErrorApi,
    { status: 500 },
  );
}
