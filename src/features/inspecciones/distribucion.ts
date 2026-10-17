// Distribución de la pantalla, compartida por la pantalla real y su
// esqueleto para que el cambio entre uno y otro no mueva nada.

// ≥1024 px: formulario de 360 px a la izquierda y listado a la derecha.
// Menos: una columna (formulario, resumen, filtros, lista).
export const DISTRIBUCION =
  "grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start";

// El formulario se queda fijo al desplazar. Si no cabe en la ventana
// (pantallas bajas o con errores visibles), se desplaza por dentro en lugar
// de esconder el botón de guardar.
export const COLUMNA_FORMULARIO =
  "lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:overscroll-contain";

export const COLUMNA_LISTADO = "flex min-w-0 flex-col gap-6";

export const ENCABEZADO_LISTADO =
  "flex flex-col gap-4 border-b border-borde p-4 sm:p-5";
