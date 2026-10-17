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

// Formulario. En una columna (640–1023 px) los campos van en rejilla de 6:
// Producto | Lote, y Fecha | Revisadas | Defectuosas; vista previa a todo el
// ancho y el botón a la derecha. Menos de 640 px y desde 1024 px (columna
// de 360 px), un campo por renglón.
export const FORMULARIO_REJILLA =
  "flex flex-col gap-4 sm:grid sm:grid-cols-6 sm:items-start lg:flex";
export const CAMPO_MEDIO = "sm:col-span-3";
export const CAMPO_TERCIO = "sm:col-span-2";
export const CAMPO_COMPLETO = "sm:col-span-6";
export const BOTON_GUARDAR =
  "mt-1 w-full sm:col-span-6 sm:w-auto sm:min-w-[220px] sm:justify-self-end lg:w-full";
