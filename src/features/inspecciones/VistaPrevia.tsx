import { ResultadoSello } from "@/components/ui/ResultadoSello";
import { unir } from "@/components/ui/clases";
import {
  clasificarInspeccion,
  LIMITE_APROBADO,
  LIMITE_OBSERVACIONES,
} from "@/domain/clasificacion";
import { formatearPorcentaje } from "./formato";

// La escala llega a 15% con los límites actuales (5 y 10). Si el límite
// superior creciera, la escala crece con él para que las marcas quepan.
const MAXIMO_ESCALA = Math.max(15, Math.ceil(LIMITE_OBSERVACIONES * 1.5));

// Posición en la barra (0–100) de un porcentaje; lo que pasa del máximo se
// queda al final.
function posicion(porcentaje: number): number {
  return (Math.min(porcentaje, MAXIMO_ESCALA) / MAXIMO_ESCALA) * 100;
}

type Props = {
  // Solo llega cuando las dos cantidades son válidas.
  cantidades: { revisadas: number; defectuosas: number } | null;
};

// Muestra, mientras se captura, qué resultado tendrá la inspección. Usa la
// misma función de dominio que el servidor, así que no puede contradecirlo.
export function VistaPrevia({ cantidades }: Props) {
  const clasificacion = cantidades
    ? clasificarInspeccion(cantidades.revisadas, cantidades.defectuosas)
    : null;

  return (
    <div className="rounded-control border border-borde p-4">
      <p className="text-etiqueta font-medium text-niebla">Vista previa</p>

      <div
        aria-live="polite"
        aria-atomic="true"
        className="mt-1 flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-1"
      >
        {clasificacion ? (
          <>
            <p className="text-2xl font-semibold text-grafito">
              {formatearPorcentaje(clasificacion.porcentaje)}
              <span className="sr-only"> de unidades defectuosas,</span>
            </p>
            <ResultadoSello resultado={clasificacion.resultado} />
          </>
        ) : (
          <p className="text-sm text-niebla">
            Captura las unidades para ver el resultado
          </p>
        )}
      </div>

      <MedidorTolerancia porcentaje={clasificacion?.porcentaje ?? null} />
    </div>
  );
}

function MedidorTolerancia({ porcentaje }: { porcentaje: number | null }) {
  const limites = [LIMITE_APROBADO, LIMITE_OBSERVACIONES];
  const excedido = porcentaje !== null && porcentaje > MAXIMO_ESCALA;

  return (
    <div
      role="meter"
      aria-label="Medidor de tolerancia"
      aria-valuemin={0}
      aria-valuemax={MAXIMO_ESCALA}
      aria-valuenow={Math.min(porcentaje ?? 0, MAXIMO_ESCALA)}
      aria-valuetext={
        porcentaje === null
          ? "Sin datos"
          : `${formatearPorcentaje(porcentaje)}; límites en ${LIMITE_APROBADO}% y ${LIMITE_OBSERVACIONES}%`
      }
      className="mt-4"
    >
      {/* El margen horizontal deja espacio a la aguja en los extremos y el
          overflow evita que la capa desplazada cree scroll horizontal. */}
      <div className="overflow-hidden px-2 py-1.5">
        <div className="relative h-2.5">
          <div className="absolute inset-0 flex overflow-hidden rounded-full">
            <div
              className="bg-aprobado-fondo"
              style={{ width: `${posicion(LIMITE_APROBADO)}%` }}
            />
            <div
              className="bg-observaciones-fondo"
              style={{
                width: `${posicion(LIMITE_OBSERVACIONES) - posicion(LIMITE_APROBADO)}%`,
              }}
            />
            <div className="flex-1 bg-rechazado-fondo" />
          </div>

          {limites.map((limite) => (
            <div
              key={limite}
              aria-hidden
              className="absolute -inset-y-1 w-px -translate-x-1/2 bg-niebla"
              style={{ left: `${posicion(limite)}%` }}
            />
          ))}

          {/* La capa mide lo mismo que la barra: trasladarla un X% la mueve
              X% de la barra, y se anima con transform (sin recalcular layout). */}
          <div
            aria-hidden
            className={unir(
              "absolute inset-0 transition-transform duration-200 ease-out",
              porcentaje === null && "invisible",
            )}
            style={{ transform: `translateX(${posicion(porcentaje ?? 0)}%)` }}
          >
            <div className="absolute top-1/2 left-0 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-grafito ring-2 ring-lamina" />
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="relative mx-2 mt-1 h-5 text-etiqueta text-niebla"
      >
        <span className="absolute left-0">0%</span>
        {limites.map((limite) => (
          <span
            key={limite}
            className="absolute -translate-x-1/2"
            style={{ left: `${posicion(limite)}%` }}
          >
            {limite}%
          </span>
        ))}
        <span className="absolute right-0">
          {MAXIMO_ESCALA}%{excedido && "+"}
        </span>
      </div>
    </div>
  );
}
