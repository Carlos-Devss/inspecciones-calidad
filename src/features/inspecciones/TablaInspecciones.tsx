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

// Tabla o tarjetas según el ancho del panel, no de la ventana: la tabla
// necesita ~820 px y entre 768 y 1279 px de ventana el panel mide menos
// (la columna derecha a 1024 px mide ~590 px). Así nunca hay scroll
// horizontal. En móvil (<768 px) siempre son tarjetas.
const SOLO_TABLA = "hidden @min-[52rem]:table";
const SOLO_TARJETAS =
  "grid gap-3 p-4 @min-[40rem]:grid-cols-2 @min-[52rem]:hidden";

const CELDA = "border-b border-borde px-2.5 first:pl-5 last:pr-5";
const TABLA = "w-full border-separate border-spacing-0 text-sm";
const FILA = "[&:last-child>td]:border-b-0";
const TARJETA = "rounded-panel border border-borde p-4";
const FILAS_ESQUELETO = 6;

export function TablaInspecciones({
  inspecciones,
  idResaltado,
  descripcion,
}: Props) {
  return (
    <div className="@container">
      <table className={unir(TABLA, SOLO_TABLA)}>
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
              <td className={unir(CELDA, "py-3 break-all")}>
                {inspeccion.lote}
              </td>
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

      <ul aria-label={descripcion} className={SOLO_TARJETAS}>
        {inspecciones.map((inspeccion) => (
          <li
            key={inspeccion.id}
            className={unir(
              TARJETA,
              inspeccion.id === idResaltado && "fila-nueva",
            )}
          >
            <TarjetaInspeccion inspeccion={inspeccion} />
          </li>
        ))}
      </ul>
    </div>
  );
}

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

function TarjetaInspeccion({
  inspeccion,
}: {
  inspeccion: InspeccionClasificada;
}) {
  const cifras = [
    ["Revisadas", formatearEntero(inspeccion.unidadesRevisadas)],
    ["Defectuosas", formatearEntero(inspeccion.unidadesDefectuosas)],
    ["% defectos", formatearPorcentaje(inspeccion.porcentaje)],
  ];
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <time
          dateTime={inspeccion.fecha}
          className="text-etiqueta text-niebla"
        >
          {formatearFecha(inspeccion.fecha)}
        </time>
        <ResultadoSello resultado={inspeccion.resultado} />
      </div>
      <p className="mt-2 font-medium text-grafito">
        {inspeccion.productoNombre}
        <span className="ml-1.5 text-etiqueta font-normal text-niebla">
          {inspeccion.productoCodigo}
        </span>
      </p>
      <p className="text-sm break-all text-niebla">Lote {inspeccion.lote}</p>
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-borde pt-3">
        {cifras.map(([etiqueta, valor]) => (
          <div key={etiqueta}>
            <dt className="text-etiqueta text-niebla">{etiqueta}</dt>
            <dd className="text-sm font-medium text-grafito">{valor}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

// Seis filas (o tarjetas) con la misma altura que las reales.
export function TablaInspeccionesEsqueleto() {
  const filas = Array.from({ length: FILAS_ESQUELETO }, (_, i) => i);
  return (
    <div aria-hidden className="@container">
      <table className={unir(TABLA, SOLO_TABLA)}>
        <Encabezado />
        <tbody>
          {filas.map((fila) => (
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

      <div className={SOLO_TARJETAS}>
        {filas.map((fila) => (
          <div key={fila} className={TARJETA}>
            <div className="flex items-center justify-between gap-2">
              <SkeletonTexto className="w-20" />
              <SkeletonTexto alto="h-6" className="h-4 w-24" />
            </div>
            <SkeletonTexto alto="mt-2 h-6" className="w-32" />
            <SkeletonTexto className="w-24" />
            <div className="mt-3 flex gap-6 border-t border-borde pt-3">
              {[0, 1, 2].map((cifra) => (
                <div key={cifra}>
                  <SkeletonTexto className="w-16" />
                  <SkeletonTexto className="w-10" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
