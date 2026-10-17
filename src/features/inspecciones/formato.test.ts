import { afterEach, describe, expect, it, vi } from "vitest";
import {
  describirDefectuosas,
  describirResultados,
  formatearEntero,
  formatearFecha,
  formatearPorcentaje,
} from "./formato";

describe("formatearFecha", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('muestra "2026-10-16" como "16 oct 2026"', () => {
    expect(formatearFecha("2026-10-16")).toBe("16 oct 2026");
  });

  it("no corre el día en una zona al oeste de UTC", () => {
    // Con new Date("2026-10-16") esto daría el 15 en Ciudad de México.
    vi.stubEnv("TZ", "America/Mexico_City");
    expect(formatearFecha("2026-10-16")).toBe("16 oct 2026");
    expect(formatearFecha("2026-01-01")).toBe("1 ene 2026");
  });

  it("usa la abreviatura de cada mes", () => {
    expect(formatearFecha("2026-12-31")).toBe("31 dic 2026");
    expect(formatearFecha("2026-09-05")).toBe("5 sep 2026");
  });
});

describe("formatearPorcentaje", () => {
  it("muestra siempre 2 decimales", () => {
    expect(formatearPorcentaje(6.3309)).toBe("6.33%");
    expect(formatearPorcentaje(5)).toBe("5.00%");
    expect(formatearPorcentaje(0)).toBe("0.00%");
    expect(formatearPorcentaje((10 / 60) * 100)).toBe("16.67%");
  });

  it('muestra "Sin datos" cuando no hay porcentaje', () => {
    expect(formatearPorcentaje(null)).toBe("Sin datos");
  });
});

describe("formatearEntero", () => {
  it("separa los miles con coma (es-MX)", () => {
    expect(formatearEntero(1390)).toBe("1,390");
    expect(formatearEntero(1234567)).toBe("1,234,567");
    expect(formatearEntero(88)).toBe("88");
  });
});

describe("describirResultados", () => {
  it("cuenta cada resultado en orden y omite los que están en 0", () => {
    expect(
      describirResultados([
        "Rechazado",
        "Aprobado",
        "Con observaciones",
        "Aprobado",
      ]),
    ).toEqual(["2 aprobadas", "1 con observaciones", "1 rechazada"]);
    expect(describirResultados(["Rechazado", "Rechazado"])).toEqual([
      "2 rechazadas",
    ]);
  });

  it("con lista vacía no dice nada", () => {
    expect(describirResultados([])).toEqual([]);
  });
});

describe("describirDefectuosas", () => {
  it("usa singular y plural con separador de miles", () => {
    expect(describirDefectuosas(91)).toBe("91 defectuosas");
    expect(describirDefectuosas(1)).toBe("1 defectuosa");
    expect(describirDefectuosas(1500)).toBe("1,500 defectuosas");
  });
});
