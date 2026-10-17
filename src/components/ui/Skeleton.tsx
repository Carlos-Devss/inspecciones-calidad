import { unir } from "./clases";

// Bloque de relleno mientras carga. El tamaño lo define quien lo usa, para
// que tenga la misma forma que el contenido real.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={unir("animate-pulse rounded-control bg-acero", className)}
    />
  );
}
