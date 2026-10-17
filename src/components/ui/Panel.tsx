import type { HTMLAttributes, ReactNode } from "react";
import { unir } from "./clases";

// Superficie blanca con borde de 1 px. La jerarquía la dan la tipografía y
// el espacio, no sombras.
export function Panel({
  className,
  children,
  ...resto
}: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={unir("rounded-panel border border-borde bg-lamina", className)}
      {...resto}
    >
      {children}
    </section>
  );
}

export function PanelTitulo({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <h2 id={id} className="text-base font-semibold text-grafito">
      {children}
    </h2>
  );
}
