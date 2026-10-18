import { Fragment, type ReactNode } from "react";
import { SkeletonTexto } from "@/components/ui/Skeleton";
import { unir } from "@/components/ui/clases";
import type { ListadoInspecciones } from "@/shared/inspeccion.types";
import {
  describirDefectuosas,
  describirResultados,
  formatearEntero,
  formatearPorcentaje,
} from "./formato";

type Props = {
  // null mientras llega la primera respuesta: se muestra el esqueleto.
  listado: ListadoInspecciones | null;
  // Nombres de los filtros activos, p. ej. ["Pinzas", "Rechazado"].
  filtrosActivos: string[];
};

// < 640 px: un solo panel con tres filas (etiqueta y detalle a la izquierda,
// valor a la derecha). ≥ 640 px: tres tarjetas.
const CONTENEDOR = unir(
  "divide-y divide-borde rounded-panel border border-borde bg-lamina",
  "sm:grid sm:grid-cols-3 sm:gap-4 sm:divide-y-0 sm:rounded-none sm:border-0 sm:bg-transparent",
);
const ELEMENTO = unir(
  "@container grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-3",
  "sm:grid-cols-1 sm:content-start sm:rounded-panel sm:border sm:border-borde sm:bg-lamina sm:p-4",
);
const ETIQUETA = "col-start-1 row-start-1";
const VALOR =
  "col-start-2 row-span-2 row-start-1 text-right sm:col-start-1 sm:row-span-1 sm:row-start-2 sm:mt-1 sm:text-left";
const DETALLE = "col-start-1 row-start-2 sm:row-start-3 sm:mt-0.5";

export function TarjetasResumen({ listado, filtrosActivos }: Props) {
  return (
    <section aria-labelledby="titulo-resumen">
      <h2 id="titulo-resumen" className="sr-only">
        Resumen
      </h2>
      {/* Los filtros salen de la URL, así que la línea existe desde el
          esqueleto y no empuja las tarjetas cuando llegan los datos. Deja
          claro que los totales son del conjunto filtrado. */}
      {filtrosActivos.length > 0 && (
        <p className="mb-3 text-sm text-niebla">Mostrando: {filtrosActivos.join(", ")}</p>
      )}
      {listado ? <Totales listado={listado} /> : <TotalesEsqueleto />}
    </section>
  );
}

// Todo sale de la misma respuesta que la tabla: no pueden contradecirse.
function Totales({ listado }: { listado: ListadoInspecciones }) {
  const { resumen, inspecciones } = listado;
  const sinDatos = resumen.porcentajeGlobal === null;
  return (
    <dl className={CONTENEDOR}>
      <Tarjeta
        etiqueta="Inspecciones"
        detalle={describirResultados(inspecciones.map((i) => i.resultado))}
      >
        {formatearEntero(resumen.totalInspecciones)}
      </Tarjeta>
      <Tarjeta
        etiqueta="Unidades revisadas"
        detalle={describirDefectuosas(resumen.totalDefectuosas)}
      >
        {formatearEntero(resumen.totalRevisadas)}
      </Tarjeta>
      <Tarjeta etiqueta="Defectos globales" detalle="Defectuosas ÷ revisadas" secundario={sinDatos}>
        {formatearPorcentaje(resumen.porcentajeGlobal)}
      </Tarjeta>
    </dl>
  );
}

function Tarjeta({
  etiqueta,
  detalle,
  secundario = false,
  children,
}: {
  etiqueta: string;
  // Varias piezas se separan con comas y cada una se mantiene en un renglón.
  detalle: string | string[];
  secundario?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={ELEMENTO}>
      <dt className={unir(ETIQUETA, "text-etiqueta font-medium text-niebla")}>{etiqueta}</dt>
      <dd
        className={unir(
          VALOR,
          "text-2xl font-semibold",
          secundario ? "text-niebla" : "text-grafito",
        )}
      >
        {children}
      </dd>
      {detalle.length > 0 && (
        <dd className={unir(DETALLE, "text-etiqueta text-niebla")}>
          {typeof detalle === "string"
            ? detalle
            : detalle.map((pieza, indice) => (
                <Fragment key={pieza}>
                  {indice > 0 && ", "}
                  <span className="whitespace-nowrap">{pieza}</span>
                </Fragment>
              ))}
        </dd>
      )}
    </div>
  );
}

// Misma retícula, tarjetas y alturas de línea que los totales reales.
function TotalesEsqueleto() {
  return (
    <div className={CONTENEDOR}>
      {["w-24", "w-28", "w-28"].map((ancho, indice) => (
        <div key={indice} className={ELEMENTO}>
          <SkeletonTexto alto={unir(ETIQUETA, "h-5")} className={ancho} />
          <SkeletonTexto
            alto={unir(VALOR, "h-8 justify-end sm:justify-start")}
            className="h-5 w-16"
          />
          <div className={DETALLE}>
            <SkeletonTexto className="w-32" />
            {/* El conteo por resultado ocupa dos renglones en tarjeta y
                tres si la tarjeta es angosta (menos de 208 px de contenido). */}
            {indice === 0 && (
              <>
                <SkeletonTexto alto="hidden h-5 sm:flex" className="w-24" />
                <SkeletonTexto alto="hidden h-5 sm:flex @min-[13rem]:hidden" className="w-20" />
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
