import { z } from "zod";
import type { Resultado } from "../domain/clasificacion";

// Zona horaria de la planta. Define qué día es "hoy" para validar fechas,
// sin depender de la zona del servidor (en la nube suele ser UTC).
export const ZONA_HORARIA_NEGOCIO = "America/Mexico_City";

export const RESULTADOS = [
  "Aprobado",
  "Con observaciones",
  "Rechazado",
] as const satisfies readonly Resultado[];

// Máximo de una columna INTEGER en PostgreSQL. Un número mayor haría fallar
// el INSERT con un error 500; así se rechaza antes con un mensaje claro.
const MAXIMO_UNIDADES = 2_147_483_647;

export const MENSAJES = {
  productoObligatorio: "Selecciona un producto.",
  productoNoExiste: "El producto seleccionado no existe.",
  loteObligatorio: "El lote es obligatorio.",
  loteMuyLargo: "El lote no puede tener más de 50 caracteres.",
  fechaObligatoria: "La fecha es obligatoria.",
  fechaFormato: "La fecha debe tener el formato AAAA-MM-DD.",
  fechaInexistente: "La fecha no existe en el calendario.",
  fechaFutura: "La fecha no puede ser futura.",
  revisadasObligatorias: "Las unidades revisadas son obligatorias y deben ser un número.",
  revisadasEnteras: "Las unidades revisadas deben ser un número entero.",
  revisadasMayorQueCero: "Las unidades revisadas deben ser mayores que cero.",
  defectuosasObligatorias: "Las unidades defectuosas son obligatorias y deben ser un número.",
  defectuosasEnteras: "Las unidades defectuosas deben ser un número entero.",
  defectuosasNegativas: "Las unidades defectuosas no pueden ser negativas.",
  defectuosasMayoresQueRevisadas: "Las unidades defectuosas no pueden ser más que las revisadas.",
  unidadesMuyGrandes: "La cantidad es demasiado grande.",
  productoFiltroInvalido: "El código de producto del filtro no es válido.",
  resultadoFiltroInvalido: "El resultado debe ser Aprobado, Con observaciones o Rechazado.",
} as const;

// Fecha de hoy como texto YYYY-MM-DD en la zona horaria del negocio.
// El formato "en-CA" produce justo AAAA-MM-DD.
export function fechaDeHoy(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA_NEGOCIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Una fecha es real si, al armarla, JavaScript no la "corrige":
// 2026-02-30 se convierte en 2026-03-02, así que no coincide y se rechaza.
function esFechaReal(texto: string): boolean {
  const [anio, mes, dia] = texto.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
  );
}

// Sin z.coerce ni conversiones: coerce convierte "" y null en 0, así que un
// campo vacío pasaría como "0 unidades" en lugar de marcarse como obligatorio.
// El formulario debe mandar números reales; cualquier otra cosa se rechaza.
const unidadesRevisadas = z
  .number({ error: MENSAJES.revisadasObligatorias })
  .int({ error: MENSAJES.revisadasEnteras })
  .positive({ error: MENSAJES.revisadasMayorQueCero })
  .max(MAXIMO_UNIDADES, { error: MENSAJES.unidadesMuyGrandes });

const unidadesDefectuosas = z
  .number({ error: MENSAJES.defectuosasObligatorias })
  .int({ error: MENSAJES.defectuosasEnteras })
  .nonnegative({ error: MENSAJES.defectuosasNegativas })
  .max(MAXIMO_UNIDADES, { error: MENSAJES.unidadesMuyGrandes });

// Un solo esquema valida el formulario (cliente) y el POST (servidor).
export const crearInspeccionSchema = z
  .object({
    productoCodigo: z
      .string({ error: MENSAJES.productoObligatorio })
      .trim()
      .min(1, { error: MENSAJES.productoObligatorio }),
    lote: z
      .string({ error: MENSAJES.loteObligatorio })
      .trim()
      .min(1, { error: MENSAJES.loteObligatorio })
      .max(50, { error: MENSAJES.loteMuyLargo }),
    // abort: si una regla de la fecha falla, no se evalúan las siguientes,
    // para mostrar un solo mensaje y no revisar el calendario de un texto mal formado.
    fecha: z
      .string({ error: MENSAJES.fechaObligatoria })
      .min(1, { error: MENSAJES.fechaObligatoria, abort: true })
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        error: MENSAJES.fechaFormato,
        abort: true,
      })
      .refine(esFechaReal, { error: MENSAJES.fechaInexistente, abort: true })
      // Supuesto de negocio: no se registran inspecciones que aún no ocurren.
      // Comparar textos AAAA-MM-DD equivale a comparar fechas.
      .refine((fecha) => fecha <= fechaDeHoy(), {
        error: MENSAJES.fechaFutura,
      }),
    unidadesRevisadas,
    unidadesDefectuosas,
  })
  .refine((datos) => datos.unidadesDefectuosas <= datos.unidadesRevisadas, {
    error: MENSAJES.defectuosasMayoresQueRevisadas,
    // El error se muestra debajo del campo de defectuosas.
    path: ["unidadesDefectuosas"],
    // Corre aunque otros campos (lote, fecha...) tengan errores, siempre que
    // las dos cantidades sean válidas; así el usuario ve todos los errores juntos.
    when: (payload) =>
      unidadesRevisadas.safeParse((payload.value as Record<string, unknown>)?.unidadesRevisadas)
        .success &&
      unidadesDefectuosas.safeParse((payload.value as Record<string, unknown>)?.unidadesDefectuosas)
        .success,
  });

// Filtros del GET. Todo llega como texto en la URL.
export const filtrosSchema = z.object({
  producto: z
    .string()
    .trim()
    .min(1, { error: MENSAJES.productoFiltroInvalido })
    .max(10, { error: MENSAJES.productoFiltroInvalido })
    .optional(),
  resultado: z.enum(RESULTADOS, { error: MENSAJES.resultadoFiltroInvalido }).optional(),
});

export type CrearInspeccionEntrada = z.input<typeof crearInspeccionSchema>;
export type CrearInspeccion = z.output<typeof crearInspeccionSchema>;
export type Filtros = z.output<typeof filtrosSchema>;

// Convierte un error de Zod en { campo: "primer mensaje" }, el formato que
// regresa la API y que el formulario muestra debajo de cada campo.
export function erroresPorCampo(error: z.ZodError): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "general");
    campos[campo] ??= issue.message;
  }
  return campos;
}
