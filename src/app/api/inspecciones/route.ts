import { connection, type NextRequest } from "next/server";
import { crearInspeccionSchema, erroresPorCampo, filtrosSchema } from "@/shared/inspeccion.schema";
import {
  ErrorDeValidacion,
  obtenerListado,
  registrarInspeccion,
} from "@/server/inspecciones.service";
import { respuestaErrorInterno, respuestaValidacion } from "@/server/respuestas";

// Esta ruta solo traduce HTTP: lee la petición, valida con el esquema
// compartido, llama al servicio y elige el código de respuesta.

export async function GET(request: NextRequest) {
  // Siempre datos frescos: la respuesta se calcula en cada petición.
  await connection();

  const filtros = filtrosSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!filtros.success) {
    return respuestaValidacion(erroresPorCampo(filtros.error));
  }

  try {
    const listado = await obtenerListado(filtros.data);
    return Response.json(listado);
  } catch (error) {
    return respuestaErrorInterno(error);
  }
}

export async function POST(request: NextRequest) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return respuestaValidacion({
      general: "El cuerpo de la petición no es un JSON válido.",
    });
  }

  const datos = crearInspeccionSchema.safeParse(cuerpo);
  if (!datos.success) {
    return respuestaValidacion(erroresPorCampo(datos.error));
  }

  try {
    const inspeccion = await registrarInspeccion(datos.data);
    return Response.json({ inspeccion }, { status: 201 });
  } catch (error) {
    if (error instanceof ErrorDeValidacion) {
      return respuestaValidacion(error.campos);
    }
    return respuestaErrorInterno(error);
  }
}
