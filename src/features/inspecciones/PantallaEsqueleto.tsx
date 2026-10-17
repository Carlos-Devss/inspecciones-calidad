import { Field } from "@/components/ui/Field";
import { Panel, PanelTitulo } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { unir } from "@/components/ui/clases";
import {
  BOTON_GUARDAR,
  CAMPO_COMPLETO,
  CAMPO_MEDIO,
  CAMPO_TERCIO,
  COLUMNA_FORMULARIO,
  COLUMNA_LISTADO,
  DISTRIBUCION,
  ENCABEZADO_LISTADO,
  FORMULARIO_REJILLA,
} from "./distribucion";
import { TablaInspeccionesEsqueleto } from "./TablaInspecciones";
import { TarjetasResumen } from "./TarjetasResumen";
import { VistaPrevia } from "./VistaPrevia";

const CAMPOS_FORMULARIO = [
  { etiqueta: "Producto", ancho: CAMPO_MEDIO },
  { etiqueta: "Lote", ancho: CAMPO_MEDIO },
  { etiqueta: "Fecha", ancho: CAMPO_TERCIO },
  { etiqueta: "Unidades revisadas", ancho: CAMPO_TERCIO },
  { etiqueta: "Unidades defectuosas", ancho: CAMPO_TERCIO },
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
          <div className={unir("mt-4", FORMULARIO_REJILLA)}>
            {CAMPOS_FORMULARIO.map(({ etiqueta, ancho }) => (
              <Field
                key={etiqueta}
                id={`esqueleto-${etiqueta}`}
                etiqueta={etiqueta}
                className={ancho}
              >
                {() => <Skeleton className="h-10" />}
              </Field>
            ))}
            <div className={CAMPO_COMPLETO}>
              <VistaPrevia cantidades={null} />
            </div>
            <Skeleton className={unir("h-10", BOTON_GUARDAR)} />
          </div>
        </Panel>
      </aside>

      <div className={COLUMNA_LISTADO}>
        <TarjetasResumen listado={null} filtrosActivos={[]} />
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
