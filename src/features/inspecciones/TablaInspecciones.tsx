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

// La forma depende del ancho del panel (container queries), no de la
// ventana: con el formulario a un lado, el panel de una laptop mide menos
// que la ventana. Nunca hay scroll horizontal.
//   ≥ 820 px  tabla completa
//   560–819   tabla compacta: código bajo el nombre, lote bajo la fecha
//             y una sola columna "Defectuosas / revisadas"
//   < 560     tarjetas, una por inspección
const TABLA_VISIBLE = "hidden @min-[35rem]:table";
const TARJETAS_VISIBLES =
  "grid gap-3 p-4 @min-[35rem]:hidden";
const SOLO_COMPLETA = "hidden @min-[51.25rem]:table-cell";
const SOLO_COMPACTA = "@min-[51.25rem]:hidden";

type Columna = {
  titulo: string;
  numerica?: boolean;
  modo?: "completa" | "compacta";
};

const COLUMNAS: Columna[] = [
  { titulo: "Fecha" },
  { titulo: "Producto" },
  { titulo: "Lote", modo: "completa" },
  { titulo: "Revisadas", numerica: true, modo: "completa" },
  { titulo: "Defectuosas", numerica: true, modo: "completa" },
  { titulo: "Defectuosas / revisadas", numerica: true, modo: "compacta" },
  { titulo: "% defectos", numerica: true },
  { titulo: "Resultado" },
];

function claseModo(modo: Columna["modo"]) {
  if (modo === "completa") return SOLO_COMPLETA;
  if (modo === "compacta") return SOLO_COMPACTA;
  return undefined;
}

// La compacta usa menos aire entre columnas para caber en 560 px.
const CELDA =
  "border-b border-borde px-2 first:pl-5 last:pr-5 @min-[51.25rem]:px-2.5 @min-[51.25rem]:first:pl-5 @min-[51.25rem]:last:pr-5";
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
      <table className={unir(TABLA, TABLA_VISIBLE)}>
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
                <time dateTime={inspeccion.fecha} className="block">
                  {formatearFecha(inspeccion.fecha)}
                </time>
                {/* En la compacta el lote va debajo, como texto secundario. */}
                <span className="block text-etiqueta text-niebla @min-[51.25rem]:hidden">
                  {inspeccion.lote}
                </span>
              </td>
              {/* El nombre no se parte salvo en lo más angosto de la compacta. */}
              <td
                className={unir(
                  CELDA,
                  "py-3 whitespace-nowrap @max-[36rem]:whitespace-normal",
                )}
              >
                {inspeccion.productoNombre}
                {/* En la compacta el código va debajo, como texto secundario. */}
                <span className="block text-etiqueta text-niebla @min-[51.25rem]:ml-1.5 @min-[51.25rem]:inline">
                  {inspeccion.productoCodigo}
                </span>
              </td>
              <td className={unir(CELDA, SOLO_COMPLETA, "py-3 break-all")}>
                {inspeccion.lote}
              </td>
              <td className={unir(CELDA, SOLO_COMPLETA, "py-3 text-right")}>
                {formatearEntero(inspeccion.unidadesRevisadas)}
              </td>
              <td className={unir(CELDA, SOLO_COMPLETA, "py-3 text-right")}>
                {formatearEntero(inspeccion.unidadesDefectuosas)}
              </td>
              <td
                className={unir(
                  CELDA,
                  SOLO_COMPACTA,
                  "py-3 text-right whitespace-nowrap",
                )}
              >
                {formatearEntero(inspeccion.unidadesDefectuosas)} /{" "}
                {formatearEntero(inspeccion.unidadesRevisadas)}
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

      <ul aria-label={descripcion} className={TARJETAS_VISIBLES}>
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
        {COLUMNAS.map(({ titulo, numerica, modo }) => (
          <th
            key={titulo}
            scope="col"
            className={unir(
              CELDA,
              claseModo(modo),
              // Encabezado fijo al desplazar la página.
              "sticky top-0 z-10 bg-lamina py-2.5 align-bottom text-etiqueta font-medium text-niebla @min-[51.25rem]:whitespace-nowrap",
              numerica ? "text-right" : "text-left",
              titulo === "% defectos" && "whitespace-nowrap",
              // El sello no se parte: la columna mide lo justo y el espacio
              // sobrante se queda para el nombre del producto.
              titulo === "Resultado" && "w-px",
            )}
          >
            {titulo}
            {titulo === "Fecha" && (
              <span className="whitespace-nowrap @min-[51.25rem]:hidden">
                {" "}
                / lote
              </span>
            )}
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

// Seis filas (o tarjetas) con la misma altura que las reales en cada modo.
export function TablaInspeccionesEsqueleto() {
  const filas = Array.from({ length: FILAS_ESQUELETO }, (_, i) => i);
  return (
    <div aria-hidden className="@container">
      <table className={unir(TABLA, TABLA_VISIBLE)}>
        <Encabezado />
        <tbody>
          {filas.map((fila) => (
            <tr key={fila} className={FILA}>
              {COLUMNAS.map(({ titulo, numerica, modo }) => (
                <td
                  key={titulo}
                  className={unir(CELDA, claseModo(modo), "py-3")}
                >
                  <SkeletonTexto
                    className={unir(
                      titulo === "Resultado" ? "h-4 w-28" : "w-14",
                      numerica && "ml-auto",
                    )}
                  />
                  {/* Código y lote ocupan una segunda línea en la compacta. */}
                  {(titulo === "Producto" || titulo === "Fecha") && (
                    <SkeletonTexto
                      alto="h-5 @min-[51.25rem]:hidden"
                      className="w-10"
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className={TARJETAS_VISIBLES}>
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
