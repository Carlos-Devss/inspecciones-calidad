import { ChevronDown } from "lucide-react";
import type { Ref, SelectHTMLAttributes } from "react";
import { ESTILO_CONTROL, unir } from "./clases";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  ref?: Ref<HTMLSelectElement>;
};

// Select nativo (accesible y con el selector del sistema en móvil) con la
// misma forma que los inputs.
export function Select({ className, children, ...resto }: Props) {
  return (
    <div className={unir("relative", className)}>
      <select className={unir(ESTILO_CONTROL, "cursor-pointer appearance-none pr-9")} {...resto}>
        {children}
      </select>
      <ChevronDown
        size={16}
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-niebla"
      />
    </div>
  );
}
