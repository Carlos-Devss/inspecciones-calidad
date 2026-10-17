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

// Una línea de texto: ocupa la altura de línea completa (`alto`) para que
// el contenido real no cambie la altura al llegar, con la barra al centro.
export function SkeletonTexto({
  alto = "h-5",
  className,
}: {
  alto?: string;
  className?: string;
}) {
  return (
    <div aria-hidden className={unir("flex items-center", alto)}>
      <Skeleton className={unir("h-3", className)} />
    </div>
  );
}
