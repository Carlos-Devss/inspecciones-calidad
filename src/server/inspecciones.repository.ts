import "server-only";
import { obtenerPool } from "./db";
import type { CrearInspeccion } from "../shared/inspeccion.schema";
import type { InspeccionGuardada, Producto } from "../shared/inspeccion.types";

// Todas las consultas usan parámetros ($1, $2...): los valores viajan separados
// del SQL, así que un texto como "'; DROP TABLE..." nunca se ejecuta como código.

type FilaInspeccion = {
  id: string;
  producto_codigo: string;
  producto_nombre: string;
  lote: string;
  fecha: string;
  unidades_revisadas: number;
  unidades_defectuosas: number;
  creado_en: Date;
};

// Único lugar donde se traduce de snake_case (BD) a camelCase (TypeScript).
function aInspeccion(fila: FilaInspeccion): InspeccionGuardada {
  return {
    id: fila.id,
    productoCodigo: fila.producto_codigo,
    productoNombre: fila.producto_nombre,
    lote: fila.lote,
    fecha: fila.fecha,
    unidadesRevisadas: fila.unidades_revisadas,
    unidadesDefectuosas: fila.unidades_defectuosas,
    creadoEn: fila.creado_en.toISOString(),
  };
}

const COLUMNAS_INSPECCION = `
  i.id, i.producto_codigo, p.nombre AS producto_nombre, i.lote, i.fecha,
  i.unidades_revisadas, i.unidades_defectuosas, i.creado_en
`;

export async function listarProductos(): Promise<Producto[]> {
  const { rows } = await obtenerPool().query<Producto>(
    "SELECT codigo, nombre FROM productos ORDER BY codigo",
  );
  return rows;
}

export async function existeProducto(codigo: string): Promise<boolean> {
  const { rowCount } = await obtenerPool().query(
    "SELECT 1 FROM productos WHERE codigo = $1",
    [codigo],
  );
  return rowCount === 1;
}

export async function listarInspecciones(filtros: {
  productoCodigo?: string;
}): Promise<InspeccionGuardada[]> {
  // "$1 IS NULL OR ..." permite una sola consulta fija: sin filtro se manda
  // null y la condición siempre se cumple. Nunca se arma el SQL con textos.
  // id DESC desempata filas con la misma fecha y hora de creación.
  const { rows } = await obtenerPool().query<FilaInspeccion>(
    `SELECT ${COLUMNAS_INSPECCION}
       FROM inspecciones i
       JOIN productos p ON p.codigo = i.producto_codigo
      WHERE ($1::varchar IS NULL OR i.producto_codigo = $1)
      ORDER BY i.fecha DESC, i.creado_en DESC, i.id DESC`,
    [filtros.productoCodigo ?? null],
  );
  return rows.map(aInspeccion);
}

export async function crearInspeccion(
  datos: CrearInspeccion,
): Promise<InspeccionGuardada> {
  // El CTE inserta y, en la misma consulta, une con productos para
  // regresar la fila completa con el nombre del producto.
  const { rows } = await obtenerPool().query<FilaInspeccion>(
    `WITH i AS (
       INSERT INTO inspecciones
         (producto_codigo, lote, fecha, unidades_revisadas, unidades_defectuosas)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *
     )
     SELECT ${COLUMNAS_INSPECCION}
       FROM i
       JOIN productos p ON p.codigo = i.producto_codigo`,
    [
      datos.productoCodigo,
      datos.lote,
      datos.fecha,
      datos.unidadesRevisadas,
      datos.unidadesDefectuosas,
    ],
  );
  return aInspeccion(rows[0]);
}
