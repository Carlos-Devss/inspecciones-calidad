import type { InputHTMLAttributes, Ref } from "react";
import { ESTILO_CONTROL, unir } from "./clases";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  ref?: Ref<HTMLInputElement>;
};

// En iOS Safari el input de fecha conserva un ancho mínimo propio del
// control nativo y se sale del panel aunque tenga width: 100%. Se quita la
// apariencia nativa y se fuerza bloque con min-width 0 en todos los inputs,
// así todos miden y se ven igual (altura, padding y alineación).
const SIN_APARIENCIA_NATIVA = unir(
  "block appearance-none [-webkit-appearance:none]",
  // Sin apariencia nativa, WebKit sube el valor de la fecha: una altura de
  // línea igual al interior del campo (40 px - 2 px de borde) lo centra.
  // Safari además centra el texto horizontalmente; se alinea a la izquierda.
  "[&[type=date]]:leading-[38px]",
  "[&::-webkit-date-and-time-value]:text-left",
  "[&::-webkit-datetime-edit]:p-0",
);

export function Input({ className, ...resto }: Props) {
  return <input className={unir(ESTILO_CONTROL, SIN_APARIENCIA_NATIVA, className)} {...resto} />;
}
