"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { Panel, PanelTitulo } from "@/components/ui/Panel";
import { Toast, useToast } from "@/components/ui/Toast";
import { unir } from "@/components/ui/clases";
import { filtrosSchema, type Filtros } from "@/shared/inspeccion.schema";
import type {
  InspeccionClasificada,
  Producto,
} from "@/shared/inspeccion.types";
import { construirQuery } from "./api-client";
import {
  COLUMNA_FORMULARIO,
  COLUMNA_LISTADO,
  DISTRIBUCION,
  ENCABEZADO_LISTADO,
} from "./distribucion";
import { EstadoError, EstadoVacio } from "./EstadoVacio";
import { FiltrosInspecciones } from "./FiltrosInspecciones";
import {
  FormularioInspeccion,
  ID_CAMPO_PRODUCTO,
} from "./FormularioInspeccion";
import {
  TablaInspecciones,
  TablaInspeccionesEsqueleto,
} from "./TablaInspecciones";
import { TarjetasResumen } from "./TarjetasResumen";
import { useInspecciones } from "./useInspecciones";
import { useProductos } from "./useProductos";

const DURACION_RESALTADO = 1500;

// La URL es la fuente de verdad de los filtros. Un valor inválido
// (p. ej. ?resultado=Inventado) se ignora en lugar de romper la pantalla.
function leerFiltros(params: URLSearchParams): Filtros {
  const producto = filtrosSchema.shape.producto.safeParse(
    params.get("producto") ?? undefined,
  );
  const resultado = filtrosSchema.shape.resultado.safeParse(
    params.get("resultado") ?? undefined,
  );
  return {
    producto: producto.success ? producto.data : undefined,
    resultado: resultado.success ? resultado.data : undefined,
  };
}

function nombresDeFiltros(filtros: Filtros, productos: Producto[]): string[] {
  const nombres: string[] = [];
  if (filtros.producto) {
    const producto = productos.find((p) => p.codigo === filtros.producto);
    nombres.push(producto?.nombre ?? filtros.producto);
  }
  if (filtros.resultado) nombres.push(filtros.resultado);
  return nombres;
}

function coincide(inspeccion: InspeccionClasificada, filtros: Filtros) {
  return (
    (!filtros.producto || filtros.producto === inspeccion.productoCodigo) &&
    (!filtros.resultado || filtros.resultado === inspeccion.resultado)
  );
}

// Orquesta la pantalla. El flujo es de un solo sentido:
// filtros → URL → petición → tabla y tarjetas (de la misma respuesta).
export function PantallaInspecciones() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // router.replace consulta al servidor antes de actualizar la URL. Mientras
  // tanto, el valor optimista hace que el control responda al instante y que
  // la petición de datos salga de inmediato; al terminar, manda la URL.
  const [filtros, setFiltrosOptimistas] = useOptimistic(
    leerFiltros(searchParams),
  );
  const [, iniciarTransicion] = useTransition();

  const productos = useProductos();
  const { listado, fallo, pendiente, filtrando, recargar } =
    useInspecciones(filtros);
  const { toast, mostrar } = useToast();
  const [idResaltado, setIdResaltado] = useState<string | null>(null);

  const filtrosActivos = nombresDeFiltros(filtros, productos.productos);

  // El resaltado dura 1.5 s desde que la fila nueva aparece en la lista.
  const filaNuevaVisible =
    idResaltado !== null &&
    listado?.inspecciones.some((i) => i.id === idResaltado) === true;
  useEffect(() => {
    if (!filaNuevaVisible) return;
    const temporizador = window.setTimeout(
      () => setIdResaltado(null),
      DURACION_RESALTADO,
    );
    return () => window.clearTimeout(temporizador);
  }, [filaNuevaVisible]);

  function cambiarFiltros(nuevos: Filtros) {
    setIdResaltado(null);
    const query = construirQuery(nuevos);
    iniciarTransicion(() => {
      setFiltrosOptimistas(nuevos);
      // replace: filtrar no llena el historial; scroll: false: no salta arriba.
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  }

  function alGuardar(inspeccion: InspeccionClasificada) {
    setIdResaltado(inspeccion.id);
    recargar();
    mostrar(
      "Inspección guardada",
      coincide(inspeccion, filtros)
        ? undefined
        : "No aparece en la lista por los filtros activos.",
    );
  }

  // Mientras llegan los datos de otros filtros se queda lo anterior, atenuado.
  const atenuado = unir(
    "transition-opacity duration-200",
    filtrando && "opacity-60",
  );

  let lista;
  if (fallo) {
    lista = <EstadoError reintentando={pendiente} onReintentar={recargar} />;
  } else if (!listado) {
    lista = <TablaInspeccionesEsqueleto />;
  } else if (listado.inspecciones.length === 0) {
    lista =
      filtrosActivos.length > 0 ? (
        <EstadoVacio
          variante="sin-coincidencias"
          onLimpiarFiltros={() => cambiarFiltros({})}
        />
      ) : (
        <EstadoVacio
          variante="sin-datos"
          onIrAlFormulario={() =>
            document.getElementById(ID_CAMPO_PRODUCTO)?.focus()
          }
        />
      );
  } else {
    lista = (
      <TablaInspecciones
        inspecciones={listado.inspecciones}
        idResaltado={idResaltado}
        descripcion={[
          "Inspecciones de la más reciente a la más antigua",
          ...filtrosActivos,
        ].join(", ")}
      />
    );
  }

  return (
    <div className={DISTRIBUCION}>
      <aside className={COLUMNA_FORMULARIO}>
        <FormularioInspeccion
          productos={productos.productos}
          estadoProductos={productos.estado}
          onReintentarProductos={productos.reintentar}
          onGuardada={alGuardar}
        />
      </aside>

      <div className={COLUMNA_LISTADO}>
        {/* Si falla la carga no hay totales que mostrar: el error va en la lista. */}
        {!fallo && (
          <div aria-busy={pendiente} className={atenuado}>
            <TarjetasResumen
              resumen={listado?.resumen ?? null}
              filtrosActivos={filtrosActivos}
            />
          </div>
        )}

        <Panel aria-labelledby="titulo-listado">
          <div className={ENCABEZADO_LISTADO}>
            <PanelTitulo id="titulo-listado">
              Registro de inspecciones
            </PanelTitulo>
            <FiltrosInspecciones
              productos={productos.productos}
              filtros={filtros}
              onCambiar={cambiarFiltros}
            />
          </div>
          <div aria-busy={pendiente} className={atenuado}>
            {lista}
          </div>
        </Panel>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
