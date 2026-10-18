import { describe, expect, it, vi } from "vitest";
import type { InspeccionGuardada } from "../shared/inspeccion.types";
import { construirListado } from "./inspecciones.service";

// "server-only" lanza un error fuera de Next; en las pruebas no hace falta.
vi.mock("server-only", () => ({}));

function fila(
  id: string,
  unidadesRevisadas: number,
  unidadesDefectuosas: number,
): InspeccionGuardada {
  return {
    id,
    productoCodigo: "P001",
    productoNombre: "Martillo",
    lote: `L-2026-${id.padStart(3, "0")}`,
    fecha: "2026-10-16",
    unidadesRevisadas,
    unidadesDefectuosas,
    creadoEn: "2026-10-16T18:00:00.000Z",
  };
}

const filas = [
  fila("1", 100, 0), // 0%   Aprobado
  fila("2", 20, 1), // 5%   Aprobado
  fila("3", 10, 1), // 10%  Con observaciones
  fila("4", 10, 2), // 20%  Rechazado
  fila("5", 40, 7), // 17.5% Rechazado
];

// Recalcula el resumen a partir de las filas regresadas, para compararlo.
function resumenEsperado(lista: { unidadesRevisadas: number; unidadesDefectuosas: number }[]) {
  const totalRevisadas = lista.reduce((s, i) => s + i.unidadesRevisadas, 0);
  const totalDefectuosas = lista.reduce((s, i) => s + i.unidadesDefectuosas, 0);
  return {
    totalInspecciones: lista.length,
    totalRevisadas,
    totalDefectuosas,
    porcentajeGlobal: totalRevisadas > 0 ? (totalDefectuosas / totalRevisadas) * 100 : null,
  };
}

describe("construirListado", () => {
  it("sin filtro clasifica todas las filas y resume todas", () => {
    const { inspecciones, resumen } = construirListado(filas);

    expect(inspecciones.map((i) => i.resultado)).toEqual([
      "Aprobado",
      "Aprobado",
      "Con observaciones",
      "Rechazado",
      "Rechazado",
    ]);
    expect(inspecciones[2].porcentaje).toBe(10);
    expect(resumen).toEqual({
      totalInspecciones: 5,
      totalRevisadas: 180,
      totalDefectuosas: 11,
      porcentajeGlobal: (11 / 180) * 100,
    });
  });

  it("con filtro por resultado regresa solo esas filas y su resumen", () => {
    const { inspecciones, resumen } = construirListado(filas, "Rechazado");

    expect(inspecciones.map((i) => i.id)).toEqual(["4", "5"]);
    expect(resumen).toEqual({
      totalInspecciones: 2,
      totalRevisadas: 50,
      totalDefectuosas: 9,
      porcentajeGlobal: (9 / 50) * 100,
    });
  });

  it("si el filtro deja la lista vacía, el porcentaje global es null", () => {
    const { inspecciones, resumen } = construirListado([fila("1", 100, 0)], "Rechazado");

    expect(inspecciones).toEqual([]);
    expect(resumen).toEqual({
      totalInspecciones: 0,
      totalRevisadas: 0,
      totalDefectuosas: 0,
      porcentajeGlobal: null,
    });
  });

  it.each([undefined, "Aprobado", "Con observaciones", "Rechazado"] as const)(
    "el resumen coincide con las filas regresadas (filtro: %s)",
    (resultado) => {
      const { inspecciones, resumen } = construirListado(filas, resultado);
      expect(resumen).toEqual(resumenEsperado(inspecciones));
    },
  );
});
