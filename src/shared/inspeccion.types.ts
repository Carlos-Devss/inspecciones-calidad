import type { Resultado } from "../domain/clasificacion";
import type { ResumenInspecciones } from "../domain/resumen";

// Tipos de las respuestas de la API, compartidos por servidor y cliente.

export type Producto = {
  codigo: string;
  nombre: string;
};

// Una inspección tal como está guardada en la BD (ya en camelCase).
export type InspeccionGuardada = {
  // BIGINT llega de pg como texto: JavaScript no representa con exactitud
  // enteros mayores a 2^53, así que no se convierte a number.
  id: string;
  productoCodigo: string;
  productoNombre: string;
  lote: string;
  fecha: string; // AAAA-MM-DD
  unidadesRevisadas: number;
  unidadesDefectuosas: number;
  creadoEn: string; // ISO 8601
};

// Lo que regresa la API: la inspección más su clasificación calculada al leer.
export type InspeccionClasificada = InspeccionGuardada & {
  porcentaje: number;
  resultado: Resultado;
};

export type ListadoInspecciones = {
  inspecciones: InspeccionClasificada[];
  resumen: ResumenInspecciones;
};

export type ErrorApi =
  | { error: "VALIDACION"; campos: Record<string, string> }
  | { error: "ERROR_INTERNO"; mensaje: string };
