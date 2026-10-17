import { Check, TriangleAlert, X, type LucideIcon } from "lucide-react";
import type { Resultado } from "@/domain/clasificacion";
import { unir } from "./clases";

// Único lugar donde un resultado se vuelve color. Siempre lleva icono y
// texto: el color nunca es la única señal.
const ESTILOS: Record<Resultado, { clases: string; Icono: LucideIcon }> = {
  Aprobado: { clases: "bg-aprobado-fondo text-aprobado", Icono: Check },
  "Con observaciones": {
    clases: "bg-observaciones-fondo text-observaciones",
    Icono: TriangleAlert,
  },
  Rechazado: { clases: "bg-rechazado-fondo text-rechazado", Icono: X },
};

export function ResultadoSello({
  resultado,
  className,
}: {
  resultado: Resultado;
  className?: string;
}) {
  const { clases, Icono } = ESTILOS[resultado];
  return (
    <span
      className={unir(
        "inline-flex items-center gap-1.5 rounded-control px-2 py-0.5 text-etiqueta font-medium whitespace-nowrap transition-colors duration-200",
        clases,
        className,
      )}
    >
      <Icono size={16} aria-hidden className="shrink-0" />
      {resultado}
    </span>
  );
}
