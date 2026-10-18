import type { CrearInspeccion, Filtros } from "@/shared/inspeccion.schema";
import type {
  ErrorApi,
  InspeccionClasificada,
  ListadoInspecciones,
  Producto,
} from "@/shared/inspeccion.types";

// Única puerta del navegador hacia la API. Traduce las respuestas HTTP a
// valores tipados para que los componentes no lean códigos de estado.

// La API respondió con error (500, 400 en un GET) o con algo inesperado.
export class ErrorDeCarga extends Error {
  constructor(ruta: string, estado: number) {
    super(`${ruta} respondió ${estado}`);
    this.name = "ErrorDeCarga";
  }
}

async function obtenerJson<T>(ruta: string, signal?: AbortSignal): Promise<T> {
  // Un fallo de red o un abort rechazan aquí mismo; quien llama distingue
  // el abort revisando su propio signal.
  const respuesta = await fetch(ruta, { signal, cache: "no-store" });
  if (!respuesta.ok) {
    throw new ErrorDeCarga(ruta, respuesta.status);
  }
  return (await respuesta.json()) as T;
}

export async function obtenerProductos(signal?: AbortSignal): Promise<Producto[]> {
  const { productos } = await obtenerJson<{ productos: Producto[] }>("/api/productos", signal);
  return productos;
}

export function construirQuery(filtros: Filtros): string {
  const params = new URLSearchParams();
  if (filtros.producto) params.set("producto", filtros.producto);
  if (filtros.resultado) params.set("resultado", filtros.resultado);
  return params.toString();
}

export function obtenerInspecciones(
  filtros: Filtros,
  signal?: AbortSignal,
): Promise<ListadoInspecciones> {
  const query = construirQuery(filtros);
  return obtenerJson<ListadoInspecciones>(
    query ? `/api/inspecciones?${query}` : "/api/inspecciones",
    signal,
  );
}

export type ResultadoGuardado =
  | { tipo: "guardada"; inspeccion: InspeccionClasificada }
  // 400: mensajes por campo, tal como los regresa el servidor.
  | { tipo: "validacion"; campos: Record<string, string> }
  // 500, respuesta inesperada o sin conexión: lo capturado no se pierde.
  | { tipo: "fallo" };

export async function crearInspeccion(datos: CrearInspeccion): Promise<ResultadoGuardado> {
  try {
    const respuesta = await fetch("/api/inspecciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });

    if (respuesta.status === 201) {
      const { inspeccion } = (await respuesta.json()) as {
        inspeccion: InspeccionClasificada;
      };
      return { tipo: "guardada", inspeccion };
    }

    if (respuesta.status === 400) {
      const cuerpo = (await respuesta.json()) as ErrorApi;
      if (cuerpo.error === "VALIDACION") {
        return { tipo: "validacion", campos: cuerpo.campos };
      }
    }

    return { tipo: "fallo" };
  } catch {
    // fetch rechaza sin conexión; json() rechaza si el cuerpo no es JSON.
    return { tipo: "fallo" };
  }
}
