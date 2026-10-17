import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

// Atributos que el campo le pasa a su control para enlazar etiqueta y error.
export type PropsControl = {
  id: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
};

type Props = {
  id: string;
  etiqueta: string;
  error?: string;
  // Recibe los atributos de accesibilidad y regresa el control (input, select...).
  children: (control: PropsControl) => ReactNode;
};

export function Field({ id, etiqueta, error, children }: Props) {
  const idError = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-etiqueta font-medium text-grafito">
        {etiqueta}
      </label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? idError : undefined,
      })}
      {error && <MensajeError id={idError}>{error}</MensajeError>}
    </div>
  );
}

export function MensajeError({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-etiqueta text-grafito">
      <CircleAlert size={16} aria-hidden className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
