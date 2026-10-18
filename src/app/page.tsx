import { Suspense } from "react";
import { PantallaEsqueleto } from "@/features/inspecciones/PantallaEsqueleto";
import { PantallaInspecciones } from "@/features/inspecciones/PantallaInspecciones";

// Solo compone: encabezado y la pantalla interactiva. La pantalla va en
// Suspense porque depende de la petición (la fecha de hoy y, más adelante,
// los filtros de la URL) y no puede generarse una sola vez al compilar.
export default function Home() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-grafito">Inspecciones de calidad</h1>
        <p className="mt-1 text-cuerpo text-niebla">Registro y seguimiento de lotes por muestreo</p>
      </header>
      <main>
        <Suspense fallback={<PantallaEsqueleto />}>
          <PantallaInspecciones />
        </Suspense>
      </main>
    </div>
  );
}
