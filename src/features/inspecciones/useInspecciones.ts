"use client";

import { useCallback, useEffect, useState } from "react";
import type { Filtros } from "@/shared/inspeccion.schema";
import type { ListadoInspecciones } from "@/shared/inspeccion.types";
import { construirQuery, obtenerInspecciones } from "./api-client";

type Estado = {
  // Petición a la que corresponde lo último que se recibió.
  clave: string | null;
  // Filtros del listado que se está mostrando.
  claveFiltros: string | null;
  // Último listado que llegó bien. Se conserva mientras llega el siguiente,
  // para no regresar al esqueleto ni parpadear al cambiar de filtro.
  listado: ListadoInspecciones | null;
  fallo: boolean;
};

// Lista y resumen de inspecciones para unos filtros. Cada cambio de filtros
// (o recarga) cancela la petición anterior con AbortController: si el
// usuario cambia rápido de filtro, una respuesta vieja nunca pisa la nueva.
export function useInspecciones({ producto, resultado }: Filtros) {
  const [recargas, setRecargas] = useState(0);
  const [estado, setEstado] = useState<Estado>({
    clave: null,
    claveFiltros: null,
    listado: null,
    fallo: false,
  });

  const claveFiltros = construirQuery({ producto, resultado });
  const clave = `${claveFiltros}#${recargas}`;

  useEffect(() => {
    const controlador = new AbortController();
    obtenerInspecciones({ producto, resultado }, controlador.signal).then(
      (listado) => {
        if (controlador.signal.aborted) return;
        setEstado({ clave, claveFiltros, listado, fallo: false });
      },
      () => {
        // Un abort no es un error: es una petición que ya no interesa.
        if (controlador.signal.aborted) return;
        setEstado((anterior) => ({ ...anterior, clave, fallo: true }));
      },
    );
    return () => controlador.abort();
  }, [producto, resultado, clave, claveFiltros]);

  const recargar = useCallback(() => setRecargas((n) => n + 1), []);

  return {
    listado: estado.listado,
    fallo: estado.fallo,
    // Hay una petición en curso cuya respuesta aún no llega.
    pendiente: estado.clave !== clave,
    // El listado visible es de otros filtros: se está filtrando.
    filtrando: estado.listado !== null && estado.claveFiltros !== claveFiltros,
    recargar,
  };
}
