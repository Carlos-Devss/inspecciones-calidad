import { useId } from "react";
import { CONTORNO_CONTROL, unir } from "./clases";

type Opcion<T extends string> = { valor: T; etiqueta: string };

type Props<T extends string> = {
  etiqueta: string;
  nombre: string;
  opciones: readonly Opcion<T>[];
  valor: T;
  onChange: (valor: T) => void;
  className?: string;
};

// Grupo de radios nativos con forma de control segmentado. Los radios dan
// gratis la navegación con teclado: Tab entra al grupo y las flechas cambian
// la opción. La etiqueta usa la misma tipografía y espacio que la de Field
// (en lugar de <legend>) para quedar en la misma línea base que un select.
export function SegmentedControl<T extends string>({
  etiqueta,
  nombre,
  opciones,
  valor,
  onChange,
  className,
}: Props<T>) {
  const idEtiqueta = useId();
  return (
    <div className={unir("flex min-w-0 flex-col gap-1.5", className)}>
      <span id={idEtiqueta} className="text-etiqueta font-medium text-grafito">
        {etiqueta}
      </span>
      {/* Desde 768 px mide 40 px, como los selects; en móvil cada opción
          mide 40 px para el área táctil. */}
      <div
        role="radiogroup"
        aria-labelledby={idEtiqueta}
        className={unir(
          "grid grid-cols-2 gap-1 rounded-control bg-lamina p-0.5 sm:flex sm:flex-wrap md:h-10",
          CONTORNO_CONTROL,
        )}
      >
        {opciones.map((opcion) => (
          <label
            key={opcion.valor}
            className={unir(
              "flex min-h-10 cursor-pointer items-center justify-center rounded-sm px-2 py-1 text-center text-sm leading-tight font-medium text-niebla sm:px-3 md:h-full md:min-h-0",
              "hover:text-grafito has-checked:bg-grafito has-checked:text-lamina",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-grafito",
            )}
          >
            <input
              type="radio"
              name={nombre}
              value={opcion.valor}
              checked={opcion.valor === valor}
              onChange={() => onChange(opcion.valor)}
              className="sr-only"
            />
            {opcion.etiqueta}
          </label>
        ))}
      </div>
    </div>
  );
}
