export type Resultado = "Aprobado" | "Con observaciones" | "Rechazado";

// Límites en porcentaje de piezas defectuosas. Son inclusivos:
// hasta 5% es Aprobado, hasta 10% es Con observaciones, más de 10% es Rechazado.
export const LIMITE_APROBADO = 5;
export const LIMITE_OBSERVACIONES = 10;

// Sirve de guarda de tipo: si regresa true, TypeScript ya trata el valor como number.
// Rechaza "", null, undefined, NaN, Infinity y decimales.
function esEntero(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isInteger(valor);
}

// Recibe unknown porque los datos pueden venir de un formulario o de la API
// sin validar; la función no confía en quien la llama.
export function clasificarInspeccion(
  revisadas: unknown,
  defectuosas: unknown,
): { porcentaje: number; resultado: Resultado } {
  // Una regla por validación, cada una con su propio mensaje.
  if (!esEntero(revisadas)) {
    throw new Error("Las unidades revisadas deben ser un número entero.");
  }
  if (revisadas <= 0) {
    throw new Error("Las unidades revisadas deben ser mayores que cero.");
  }
  if (!esEntero(defectuosas)) {
    throw new Error("Las unidades defectuosas deben ser un número entero.");
  }
  if (defectuosas < 0) {
    throw new Error("Las unidades defectuosas no pueden ser negativas.");
  }
  if (defectuosas > revisadas) {
    throw new Error(
      "Las unidades defectuosas no pueden ser más que las revisadas.",
    );
  }

  // El porcentaje es solo para mostrarlo; no se redondea aquí.
  const porcentaje = (defectuosas / revisadas) * 100;

  // Se clasifica comparando enteros en vez de usar el porcentaje.
  // "defectuosas / revisadas * 100 <= LIMITE" equivale a
  // "defectuosas * 100 <= revisadas * LIMITE", pero sin dividir.
  // Dividir genera errores de punto flotante: 7 / 100 * 100 da
  // 7.000000000000001, y un caso justo en el límite podría caer del lado equivocado.
  if (defectuosas * 100 <= revisadas * LIMITE_APROBADO) {
    return { porcentaje, resultado: "Aprobado" };
  }
  if (defectuosas * 100 <= revisadas * LIMITE_OBSERVACIONES) {
    return { porcentaje, resultado: "Con observaciones" };
  }
  return { porcentaje, resultado: "Rechazado" };
}
