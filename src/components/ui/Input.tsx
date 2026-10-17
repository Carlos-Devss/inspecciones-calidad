import type { InputHTMLAttributes, Ref } from "react";
import { ESTILO_CONTROL, unir } from "./clases";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  ref?: Ref<HTMLInputElement>;
};

export function Input({ className, ...resto }: Props) {
  return (
    <input
      className={unir(
        ESTILO_CONTROL,
        // Safari alinea al centro el texto del input de fecha.
        "[&::-webkit-date-and-time-value]:text-left",
        className,
      )}
      {...resto}
    />
  );
}
