"use client";

import { CircleCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { unir } from "./clases";

const DURACION_SALIDA = 200;

type EstadoToast = {
  id: number;
  mensaje: string;
  detalle?: string;
  saliendo: boolean;
};

// Muestra un aviso y lo retira solo después de `duracion` ms.
export function useToast(duracion = 4000) {
  const [toast, setToast] = useState<EstadoToast | null>(null);
  const temporizadores = useRef<number[]>([]);

  const limpiar = useCallback(() => {
    temporizadores.current.forEach((t) => window.clearTimeout(t));
    temporizadores.current = [];
  }, []);

  const mostrar = useCallback(
    (mensaje: string, detalle?: string) => {
      limpiar();
      setToast((anterior) => ({
        id: (anterior?.id ?? 0) + 1,
        mensaje,
        detalle,
        saliendo: false,
      }));
      temporizadores.current = [
        window.setTimeout(() => setToast((t) => (t ? { ...t, saliendo: true } : t)), duracion),
        window.setTimeout(() => setToast(null), duracion + DURACION_SALIDA),
      ];
    },
    [duracion, limpiar],
  );

  useEffect(() => limpiar, [limpiar]);

  return { toast, mostrar };
}

// La región aria-live siempre existe; cada aviso entra como un nodo nuevo
// (key distinta) para que el lector de pantalla lo anuncie aunque se repita.
export function Toast({ toast }: { toast: EstadoToast | null }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      {toast && (
        <div
          key={toast.id}
          className={unir(
            "pointer-events-auto flex max-w-sm items-start gap-2 rounded-panel bg-grafito px-4 py-3 text-sm text-lamina shadow-lg shadow-grafito/20",
            toast.saliendo ? "animate-toast-sale" : "animate-toast-entra",
          )}
        >
          <CircleCheck size={16} aria-hidden className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">{toast.mensaje}</p>
            {toast.detalle && <p className="mt-0.5 text-lamina/80">{toast.detalle}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
