import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Props =
  // Aún no existe ninguna inspección: invita a registrar la primera.
  | { variante: "sin-datos"; onIrAlFormulario: () => void }
  // Hay inspecciones, pero ninguna pasa los filtros.
  | { variante: "sin-coincidencias"; onLimpiarFiltros: () => void };

export function EstadoVacio(props: Props) {
  if (props.variante === "sin-datos") {
    return (
      <div className="m-4 flex flex-col items-center gap-1 rounded-panel border border-dashed border-niebla/75 px-6 py-12 text-center sm:m-5">
        <p className="text-base font-semibold text-grafito">Aún no hay inspecciones registradas.</p>
        <p className="text-sm text-niebla">Registra la primera con el formulario.</p>
        <Button variante="secundario" className="mt-4" onClick={props.onIrAlFormulario}>
          Ir al formulario
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-cuerpo text-grafito">Ninguna inspección coincide con estos filtros.</p>
      <Button variante="secundario" onClick={props.onLimpiarFiltros}>
        Limpiar filtros
      </Button>
    </div>
  );
}

export function EstadoError({
  reintentando,
  onReintentar,
}: {
  reintentando: boolean;
  onReintentar: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <CircleAlert size={16} aria-hidden className="text-grafito" />
      <p className="text-cuerpo text-grafito">No se pudieron cargar las inspecciones.</p>
      <Button variante="secundario" cargando={reintentando} onClick={onReintentar}>
        Reintentar
      </Button>
    </div>
  );
}
