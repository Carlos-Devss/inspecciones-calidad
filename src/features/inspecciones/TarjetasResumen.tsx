import type { ReactNode } from "react";
import { unir } from "@/components/ui/clases";
import type { ResumenInspecciones } from "@/domain/resumen";
import { formatearEntero, formatearPorcentaje } from "./formato";

type Props = {
  resumen: ResumenInspecciones;
  // Nombres de los filtros activos, p. ej. ["Pinzas", "Rechazado"].
  filtrosActivos: string[];
};

export function TarjetasResumen({ resumen, filtrosActivos }: Props) {
  const sinDatos = resumen.porcentajeGlobal === null;
  return (
    <section aria-labelledby="titulo-resumen">
      <h2 id="titulo-resumen" className="sr-only">
        Resumen
      </h2>
      {/* Deja claro que los totales son del conjunto filtrado. */}
      {filtrosActivos.length > 0 && (
        <p className="mb-3 text-sm text-niebla">
          Mostrando: {filtrosActivos.join(", ")}
        </p>
      )}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Tarjeta etiqueta="Inspecciones">
          {formatearEntero(resumen.totalInspecciones)}
        </Tarjeta>
        <Tarjeta etiqueta="Unidades revisadas">
          {formatearEntero(resumen.totalRevisadas)}
        </Tarjeta>
        <Tarjeta
          etiqueta="Defectos globales"
          className="col-span-2 sm:col-span-1"
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
    </section>
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
    <div
      className={unir(
        "rounded-panel border border-borde bg-lamina p-4",
        className,
      )}
    >
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
