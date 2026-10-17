"use client";

import { useCallback, useEffect, useState } from "react";
import type { Producto } from "@/shared/inspeccion.types";
import { obtenerProductos } from "./api-client";

type EstadoProductos = {
  productos: Producto[];
  estado: "cargando" | "listo" | "error";
};

// Catálogo de productos para el formulario y los filtros.
export function useProductos() {
  const [{ productos, estado }, setEstado] = useState<EstadoProductos>({
    productos: [],
    estado: "cargando",
  });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    // Si el componente se desmonta (o React monta dos veces en desarrollo),
    // se cancela la petición y su respuesta ya no actualiza el estado.
    const controlador = new AbortController();
    obtenerProductos(controlador.signal).then(
      (lista) => {
        if (!controlador.signal.aborted) {
          setEstado({ productos: lista, estado: "listo" });
        }
      },
      () => {
        if (!controlador.signal.aborted) {
          setEstado((anterior) => ({ ...anterior, estado: "error" }));
        }
      },
    );
    return () => controlador.abort();
  }, [intento]);

  const reintentar = useCallback(() => {
    setEstado((anterior) => ({ ...anterior, estado: "cargando" }));
    setIntento((n) => n + 1);
  }, []);

  return { productos, estado, reintentar };
}
