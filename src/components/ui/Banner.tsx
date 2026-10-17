import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { unir } from "./clases";

// Aviso de error a nivel de sección. Neutro: el color se reserva para los
// resultados; el icono y el borde oscuro lo distinguen.
export function Banner({
  children,
  accion,
  className,
}: {
  children: ReactNode;
  accion?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={unir(
        "flex flex-wrap items-start gap-x-3 gap-y-2 rounded-control border border-grafito bg-acero p-3 text-sm text-grafito",
        className,
      )}
    >
      <CircleAlert size={16} aria-hidden className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
      {accion}
    </div>
  );
}
