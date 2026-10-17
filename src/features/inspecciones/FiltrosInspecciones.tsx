import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import type { Resultado } from "@/domain/clasificacion";
import { RESULTADOS, type Filtros } from "@/shared/inspeccion.schema";
import type { Producto } from "@/shared/inspeccion.types";

// "" representa "Todos" en el control segmentado.
const OPCIONES_RESULTADO = [
  { valor: "", etiqueta: "Todos" },
  ...RESULTADOS.map((resultado) => ({ valor: resultado, etiqueta: resultado })),
] as const;

type Props = {
  productos: Producto[];
  filtros: Filtros;
  onCambiar: (filtros: Filtros) => void;
};

export function FiltrosInspecciones({ productos, filtros, onCambiar }: Props) {
  const hayFiltros = Boolean(filtros.producto || filtros.resultado);
  // Si la URL trae un producto que el catálogo aún no carga (o no existe),
  // se agrega como opción para que el select muestre lo que se filtra.
  const productoDesconocido =
    filtros.producto &&
    !productos.some((producto) => producto.codigo === filtros.producto);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end">
      {/* El select cede ancho (de 240 a 192 px) para que quepa junto al
          control segmentado en paneles medianos (laptop de 1100 px). */}
      <div className="md:max-w-60 md:min-w-48 md:flex-1">
        <Field id="filtro-producto" etiqueta="Producto">
          {(control) => (
            <Select
              {...control}
              value={filtros.producto ?? ""}
              onChange={(e) =>
                onCambiar({ ...filtros, producto: e.target.value || undefined })
              }
            >
              <option value="">Todos los productos</option>
              {productoDesconocido && (
                <option value={filtros.producto}>{filtros.producto}</option>
              )}
              {productos.map((producto) => (
                <option key={producto.codigo} value={producto.codigo}>
                  {producto.codigo} {producto.nombre}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <SegmentedControl
        etiqueta="Resultado"
        nombre="filtro-resultado"
        opciones={OPCIONES_RESULTADO}
        valor={filtros.resultado ?? ""}
        onChange={(valor) =>
          onCambiar({
            ...filtros,
            resultado: (valor || undefined) as Resultado | undefined,
          })
        }
      />

      {hayFiltros && (
        <Button
          variante="sutil"
          className="self-start md:self-auto"
          onClick={() => onCambiar({})}
        >
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
