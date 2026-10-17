"use client";

import { Toast, useToast } from "@/components/ui/Toast";
import { FormularioInspeccion } from "./FormularioInspeccion";
import { useProductos } from "./useProductos";

// Orquesta la pantalla: catálogo, formulario y avisos.
export function PantallaInspecciones() {
  const productos = useProductos();
  const { toast, mostrar } = useToast();

  function alGuardar() {
    mostrar("Inspección guardada");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
      <aside className="lg:sticky lg:top-6">
        <FormularioInspeccion
          productos={productos.productos}
          estadoProductos={productos.estado}
          onReintentarProductos={productos.reintentar}
          onGuardada={alGuardar}
        />
      </aside>
      <Toast toast={toast} />
    </div>
  );
}
