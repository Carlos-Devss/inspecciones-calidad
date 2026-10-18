import { describe, expect, it } from "vitest";
import { resumirInspecciones } from "./resumen";

describe("resumirInspecciones", () => {
  it("calcula el porcentaje global con totales, no promediando porcentajes", () => {
    const lista = [
      { revisadas: 100, defectuosas: 0 },
      { revisadas: 10, defectuosas: 2 },
    ];

    const resumen = resumirInspecciones(lista);

    expect(resumen).toEqual({
      totalInspecciones: 2,
      totalRevisadas: 110,
      totalDefectuosas: 2,
      porcentajeGlobal: (2 / 110) * 100,
    });
    expect(resumen.porcentajeGlobal).toBeCloseTo(1.82, 2);

    // Promediar los porcentajes individuales (0% y 20%) daría 10%, que es incorrecto.
    const promedioDePorcentajes =
      lista.reduce((suma, i) => suma + (i.defectuosas / i.revisadas) * 100, 0) / lista.length;
    expect(promedioDePorcentajes).toBe(10);
    expect(resumen.porcentajeGlobal).not.toBe(promedioDePorcentajes);
  });

  it("con lista vacía regresa totales en 0 y porcentaje null", () => {
    expect(resumirInspecciones([])).toEqual({
      totalInspecciones: 0,
      totalRevisadas: 0,
      totalDefectuosas: 0,
      porcentajeGlobal: null,
    });
  });
});
