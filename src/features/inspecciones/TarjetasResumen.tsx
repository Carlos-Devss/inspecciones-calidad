import type { ReactNode } from "react";
import { SkeletonTexto } from "@/components/ui/Skeleton";
import { unir } from "@/components/ui/clases";
import type { ResumenInspecciones } from "@/domain/resumen";
import { formatearEntero, formatearPorcentaje } from "./formato";

type Props = {
  // null mientras llega la primera respuesta: se muestra el esqueleto.
  resumen: ResumenInspecciones | null;
  // Nombres de los filtros activos, p. ej. ["Pinzas", "Rechazado"].
  filtrosActivos: string[];
};

const RETICULA = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4";
const TARJETA = "rounded-panel border border-borde bg-lamina p-4";
// La tercera tarjeta ocupa toda la fila en móvil.
const TARJETA_ANCHA = "col-span-2 sm:col-span-1";

export function TarjetasResumen({ resumen, filtrosActivos }: Props) {
  return (
    <section aria-labelledby="titulo-resumen">
      <h2 id="titulo-resumen" className="sr-only">
        Resumen
      </h2>
      {/* Los filtros salen de la URL, así que la línea existe desde el
          esqueleto y no empuja las tarjetas cuando llegan los datos. Deja
          claro que los totales son del conjunto filtrado. */}
      {filtrosActivos.length > 0 && (
        <p className="mb-3 text-sm text-niebla">
          Mostrando: {filtrosActivos.join(", ")}
        </p>
      )}
      {resumen ? <Totales resumen={resumen} /> : <TotalesEsqueleto />}
    </section>
  );
}

function Totales({ resumen }: { resumen: ResumenInspecciones }) {
  const sinDatos = resumen.porcentajeGlobal === null;
  return (
    <dl className={RETICULA}>
      <Tarjeta etiqueta="Inspecciones">
        {formatearEntero(resumen.totalInspecciones)}
      </Tarjeta>
      <Tarjeta etiqueta="Unidades revisadas">
        {formatearEntero(resumen.totalRevisadas)}
      </Tarjeta>
      <Tarjeta
        etiqueta="Defectos globales"
        className={TARJETA_ANCHA}
        secundario={sinDatos}
        detalle={
          sinDatos
            ? undefined
            : `${formatearEntero(resumen.totalDefectuosas)} de ${formatearEntero(resumen.totalRevisadas)} unidades`
        }
      >
        {formatearPorcentaje(resumen.porcentajeGlobal)}
      </Tarjeta>
    </dl>
  );
}

function Tarjeta({
  etiqueta,
  detalle,
  secundario = false,
  className,
  children,
}: {
  etiqueta: string;
  detalle?: string;
  secundario?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={unir(TARJETA, className)}>
      <dt className="text-etiqueta font-medium text-niebla">{etiqueta}</dt>
      <dd
        className={unir(
          "mt-1 text-2xl font-semibold",
          secundario ? "text-niebla" : "text-grafito",
        )}
      >
        {children}
      </dd>
      {detalle && (
        <dd className="mt-0.5 text-etiqueta text-niebla">{detalle}</dd>
      )}
    </div>
  );
}

// Misma retícula, tarjetas y alturas de línea que los totales reales.
function TotalesEsqueleto() {
  return (
    <div className={RETICULA}>
      {["w-24", "w-28", "w-28"].map((ancho, indice) => (
        <div
          key={indice}
          className={unir(TARJETA, indice === 2 && TARJETA_ANCHA)}
        >
          <SkeletonTexto className={ancho} />
          <SkeletonTexto alto="mt-1 h-8" className="h-5 w-16" />
          {/* Solo "Defectos globales" lleva línea de detalle. */}
          {indice === 2 && (
            <SkeletonTexto alto="mt-0.5 h-5" className="w-32" />
          )}
        </div>
      ))}
    </div>
  );
}
