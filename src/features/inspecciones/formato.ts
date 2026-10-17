// Formato de lo que se muestra en pantalla (es-MX). Redondear aquí es solo
// visual: los cálculos usan siempre el valor completo.

const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

// "2026-10-16" → "16 oct 2026". Se parte el texto en lugar de crear un Date:
// new Date("2026-10-16") es medianoche UTC, que en México todavía es el 15.
export function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  return `${Number(dia)} ${MESES[Number(mes) - 1]} ${anio}`;
}

const enteros = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });
const dosDecimales = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// 1390 → "1,390"
export function formatearEntero(valor: number): string {
  return enteros.format(valor);
}

// 6.3309 → "6.33%"; null (no hay piezas revisadas) → "Sin datos".
export function formatearPorcentaje(valor: number | null): string {
  return valor === null ? "Sin datos" : `${dosDecimales.format(valor)}%`;
}
