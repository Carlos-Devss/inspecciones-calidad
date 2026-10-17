import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { CONTORNO_CONTROL, unir } from "./clases";

type Variante = "primario" | "secundario" | "sutil";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-grafito text-lamina hover:bg-grafito/90",
  secundario: unir("bg-lamina text-grafito hover:bg-acero", CONTORNO_CONTROL),
  sutil: "px-3 text-grafito hover:bg-acero",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  // Mientras carga el botón no responde, muestra un spinner y conserva el
  // foco (aria-disabled en lugar de disabled, que lo mandaría al <body>).
  cargando?: boolean;
};

export function Button({
  variante = "primario",
  cargando = false,
  className,
  children,
  onClick,
  type = "button",
  ...resto
}: Props) {
  function alHacerClic(evento: MouseEvent<HTMLButtonElement>) {
    if (cargando) {
      evento.preventDefault();
      return;
    }
    onClick?.(evento);
  }

  return (
    <button
      type={type}
      aria-disabled={cargando || undefined}
      onClick={alHacerClic}
      className={unir(
        "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-control px-4 text-sm font-medium whitespace-nowrap select-none",
        "disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-wait aria-disabled:opacity-80",
        VARIANTES[variante],
        className,
      )}
      {...resto}
    >
      {cargando && (
        <LoaderCircle size={16} aria-hidden className="animate-spin" />
      )}
      {children}
    </button>
  );
}
