import { ResultadoSello } from "@/components/ui/ResultadoSello";
import { SkeletonTexto } from "@/components/ui/Skeleton";
import { unir } from "@/components/ui/clases";
import type { InspeccionClasificada } from "@/shared/inspeccion.types";
import {
  formatearEntero,
  formatearFecha,
  formatearPorcentaje,
} from "./formato";

type Props = {
  inspecciones: InspeccionClasificada[];
  // Inspección recién guardada: su fila se resalta un momento.
  idResaltado: string | null;
  descripcion: string;
};

const COLUMNAS = [
  { titulo: "Fecha" },
  { titulo: "Producto" },
  { titulo: "Lote" },
  { titulo: "Revisadas", numerica: true },
  { titulo: "Defectuosas", numerica: true },
  { titulo: "% defectos", numerica: true },
  { titulo: "Resultado" },
];

const CELDA = "border-b border-borde px-3 first:pl-5 last:pr-5";
const TABLA = "w-full border-separate border-spacing-0 text-sm";
const FILA = "[&:last-child>td]:border-b-0";
const FILAS_ESQUELETO = 6;

function Encabezado() {
  return (
    <thead>
      <tr>
        {COLUMNAS.map(({ titulo, numerica }) => (
          <th
            key={titulo}
            scope="col"
            className={unir(
              CELDA,
              // Encabezado fijo al desplazar la página.
              "sticky top-0 z-10 bg-lamina py-2.5 text-etiqueta font-medium whitespace-nowrap text-niebla",
              numerica ? "text-right" : "text-left",
            )}
          >
            {titulo}
          </th>
        ))}
      </tr>
    </thead>
  );
}

// Seis filas con la misma altura que las reales (línea de 20 px + py-3).
export function TablaInspeccionesEsqueleto() {
  return (
    <table aria-hidden className={TABLA}>
      <Encabezado />
      <tbody>
        {Array.from({ length: FILAS_ESQUELETO }, (_, fila) => (
          <tr key={fila} className={FILA}>
            {COLUMNAS.map(({ titulo, numerica }) => (
              <td key={titulo} className={unir(CELDA, "py-3")}>
                <SkeletonTexto
                  className={unir(
                    titulo === "Resultado" ? "h-4 w-28" : "w-14",
                    numerica && "ml-auto",
                  )}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function TablaInspecciones({
  inspecciones,
  idResaltado,
  descripcion,
}: Props) {
  return (
    <table className={TABLA}>
      <caption className="sr-only">{descripcion}</caption>
      <Encabezado />
      <tbody>
        {inspecciones.map((inspeccion) => (
          <tr
            key={inspeccion.id}
            className={unir(
              FILA,
              inspeccion.id === idResaltado && "fila-nueva",
            )}
          >
            <td className={unir(CELDA, "py-3 whitespace-nowrap")}>
              <time dateTime={inspeccion.fecha}>
                {formatearFecha(inspeccion.fecha)}
              </time>
            </td>
            <td className={unir(CELDA, "py-3")}>
              {inspeccion.productoNombre}
              <span className="ml-1.5 text-etiqueta text-niebla">
                {inspeccion.productoCodigo}
              </span>
            </td>
            <td className={unir(CELDA, "py-3 break-all")}>{inspeccion.lote}</td>
            <td className={unir(CELDA, "py-3 text-right")}>
              {formatearEntero(inspeccion.unidadesRevisadas)}
            </td>
            <td className={unir(CELDA, "py-3 text-right")}>
              {formatearEntero(inspeccion.unidadesDefectuosas)}
            </td>
            <td className={unir(CELDA, "py-3 text-right")}>
              {formatearPorcentaje(inspeccion.porcentaje)}
            </td>
            <td className={unir(CELDA, "py-2.5")}>
              {/* En bloque para que la fila mida lo mismo que el esqueleto. */}
              <div className="flex">
                <ResultadoSello resultado={inspeccion.resultado} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
