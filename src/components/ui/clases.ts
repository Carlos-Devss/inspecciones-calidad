// Une clases de Tailwind ignorando las vacías o condicionales en false.
export function unir(...clases: (string | false | null | undefined)[]): string {
  return clases.filter(Boolean).join(" ");
}

// Contorno de inputs y selects. `borde` (#D5DBE2) sobre blanco da 1.39:1;
// niebla al 75% llega a ~3.4:1, el mínimo de 3:1 para contornos de controles.
export const CONTORNO_CONTROL = "border border-niebla/75 hover:border-niebla";

// Estilo común de los controles de texto y selección.
export const ESTILO_CONTROL = unir(
  "h-10 w-full min-w-0 rounded-control bg-lamina px-3 text-grafito",
  // 16 px en móvil evita que iOS haga zoom al enfocar; 15 px desde sm.
  "text-base sm:text-cuerpo",
  "placeholder:text-niebla",
  "disabled:cursor-not-allowed disabled:bg-acero disabled:text-niebla",
  "aria-invalid:border-grafito aria-invalid:ring-1 aria-invalid:ring-grafito",
  CONTORNO_CONTROL,
);
