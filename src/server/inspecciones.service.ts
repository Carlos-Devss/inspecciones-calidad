import "server-only";
import { clasificarInspeccion, type Resultado } from "../domain/clasificacion";
import { resumirInspecciones } from "../domain/resumen";
import { MENSAJES, type CrearInspeccion, type Filtros } from "../shared/inspeccion.schema";
import type {
  InspeccionClasificada,
  InspeccionGuardada,
  ListadoInspecciones,
} from "../shared/inspeccion.types";
import * as repositorio from "./inspecciones.repository";

// Error de datos del usuario (400), con el mensaje de cada campo.
// Se distingue de un error inesperado (500).
export class ErrorDeValidacion extends Error {
  constructor(public readonly campos: Record<string, string>) {
    super("Datos de inspección inválidos");
    this.name = "ErrorDeValidacion";
  }
}

function clasificar(fila: InspeccionGuardada): InspeccionClasificada {
  const { porcentaje, resultado } = clasificarInspeccion(
    fila.unidadesRevisadas,
    fila.unidadesDefectuosas,
  );
  return { ...fila, porcentaje, resultado };
}

// Función pura (sin BD) para poder probarla directo.
export function construirListado(
  filas: InspeccionGuardada[],
  resultado?: Resultado,
): ListadoInspecciones {
  const clasificadas = filas.map(clasificar);
  const inspecciones = resultado
    ? clasificadas.filter((inspeccion) => inspeccion.resultado === resultado)
    : clasificadas;

  // El resumen sale de la MISMA lista que se regresa: la tabla y las
  // tarjetas no pueden contradecirse porque leen exactamente las mismas filas.
  const resumen = resumirInspecciones(
    inspecciones.map((inspeccion) => ({
      revisadas: inspeccion.unidadesRevisadas,
      defectuosas: inspeccion.unidadesDefectuosas,
    })),
  );

  return { inspecciones, resumen };
}

export async function obtenerListado(filtros: Filtros): Promise<ListadoInspecciones> {
  // El producto se filtra en SQL (es una columna guardada). El resultado se
  // filtra aquí porque se calcula al leer y no existe en la BD.
  const filas = await repositorio.listarInspecciones({
    productoCodigo: filtros.producto,
  });
  return construirListado(filas, filtros.resultado);
}

export async function registrarInspeccion(datos: CrearInspeccion): Promise<InspeccionClasificada> {
  if (!(await repositorio.existeProducto(datos.productoCodigo))) {
    throw new ErrorDeValidacion({ productoCodigo: MENSAJES.productoNoExiste });
  }
  const guardada = await repositorio.crearInspeccion(datos);
  return clasificar(guardada);
}
