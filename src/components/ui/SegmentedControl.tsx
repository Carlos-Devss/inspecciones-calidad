import { CONTORNO_CONTROL, unir } from "./clases";

type Opcion<T extends string> = { valor: T; etiqueta: string };

type Props<T extends string> = {
  leyenda: string;
  nombre: string;
  opciones: readonly Opcion<T>[];
  valor: T;
  onChange: (valor: T) => void;
  className?: string;
};

// Grupo de radios nativos con forma de control segmentado. Los radios dan
// gratis la navegación con teclado: Tab entra al grupo y las flechas cambian
// la opción.
export function SegmentedControl<T extends string>({
  leyenda,
  nombre,
  opciones,
  valor,
  onChange,
  className,
}: Props<T>) {
  return (
    <fieldset className={unir("min-w-0", className)}>
      <legend className="mb-1.5 text-etiqueta font-medium text-grafito">
        {leyenda}
      </legend>
      <div
        className={unir(
          "grid grid-cols-2 gap-1 rounded-control bg-lamina p-1 sm:flex sm:flex-wrap",
          CONTORNO_CONTROL,
        )}
      >
        {opciones.map((opcion) => (
          <label
            key={opcion.valor}
            className={unir(
              "flex min-h-10 cursor-pointer items-center justify-center rounded-sm px-2 py-1 text-center text-sm leading-tight font-medium text-niebla sm:min-h-8 sm:px-3",
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
    </fieldset>
  );
}
