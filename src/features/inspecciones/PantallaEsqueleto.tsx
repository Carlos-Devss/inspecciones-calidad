import { Field } from "@/components/ui/Field";
import { Panel, PanelTitulo } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  COLUMNA_FORMULARIO,
  COLUMNA_LISTADO,
  DISTRIBUCION,
  ENCABEZADO_LISTADO,
} from "./distribucion";
import { TablaInspeccionesEsqueleto } from "./TablaInspecciones";
import { TarjetasResumen } from "./TarjetasResumen";
import { VistaPrevia } from "./VistaPrevia";

const ETIQUETAS_FORMULARIO = [
  "Producto",
  "Lote",
  "Fecha",
  "Unidades revisadas",
  "Unidades defectuosas",
];

// Lo que se ve mientras carga el código de la pantalla (respaldo del
// Suspense). Repite la distribución, títulos y alturas reales para que la
// pantalla aparezca sin saltos.
export function PantallaEsqueleto() {
  return (
    <div className={DISTRIBUCION}>
      <aside className={COLUMNA_FORMULARIO}>
        <Panel className="p-4 sm:p-5">
          <PanelTitulo>Nueva inspección</PanelTitulo>
          <div className="mt-4 flex flex-col gap-4">
            {ETIQUETAS_FORMULARIO.map((etiqueta) => (
              <Field key={etiqueta} id={`esqueleto-${etiqueta}`} etiqueta={etiqueta}>
                {() => <Skeleton className="h-10" />}
              </Field>
            ))}
            <VistaPrevia cantidades={null} />
            <Skeleton className="mt-1 h-10" />
          </div>
        </Panel>
      </aside>

      <div className={COLUMNA_LISTADO}>
        <TarjetasResumen resumen={null} filtrosActivos={[]} />
        <Panel>
          <div className={ENCABEZADO_LISTADO}>
            <PanelTitulo>Registro de inspecciones</PanelTitulo>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Skeleton className="h-[66px] sm:w-60" />
              <Skeleton className="h-[116px] sm:h-[62px] sm:w-[410px]" />
            </div>
          </div>
          <TablaInspeccionesEsqueleto />
        </Panel>
      </div>
    </div>
  );
}
