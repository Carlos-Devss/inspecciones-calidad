import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  crearInspeccionSchema,
  erroresPorCampo,
  filtrosSchema,
  MENSAJES,
} from "./inspeccion.schema";

const valida = {
  productoCodigo: "P001",
  lote: "L-2026-011",
  fecha: "2026-10-16",
  unidadesRevisadas: 100,
  unidadesDefectuosas: 3,
};

// Regresa { campo: mensaje } o null si los datos son válidos.
function errores(datos: unknown) {
  const resultado = crearInspeccionSchema.safeParse(datos);
  return resultado.success ? null : erroresPorCampo(resultado.error);
}

describe("crearInspeccionSchema", () => {
  // Reloj fijo: 16 de octubre de 2026 al mediodía en Ciudad de México (UTC-6).
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-16T18:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("acepta datos válidos y recorta el lote", () => {
    const resultado = crearInspeccionSchema.safeParse({
      ...valida,
      lote: "  L-2026-011  ",
    });
    expect(resultado.success).toBe(true);
    expect(resultado.data).toEqual(valida);
  });

  it.each([
    { campo: "productoCodigo", mensaje: MENSAJES.productoObligatorio },
    { campo: "lote", mensaje: MENSAJES.loteObligatorio },
    { campo: "fecha", mensaje: MENSAJES.fechaObligatoria },
    { campo: "unidadesRevisadas", mensaje: MENSAJES.revisadasObligatorias },
    { campo: "unidadesDefectuosas", mensaje: MENSAJES.defectuosasObligatorias },
  ])("rechaza $campo vacío o faltante", ({ campo, mensaje }) => {
    const sinCampo: Record<string, unknown> = { ...valida };
    delete sinCampo[campo];

    expect(errores(sinCampo)).toEqual({ [campo]: mensaje });
    expect(errores({ ...valida, [campo]: "" })).toEqual({ [campo]: mensaje });
    expect(errores({ ...valida, [campo]: null })).toEqual({ [campo]: mensaje });
  });

  it("rechaza un lote de solo espacios", () => {
    expect(errores({ ...valida, lote: "   " })).toEqual({
      lote: MENSAJES.loteObligatorio,
    });
  });

  it("rechaza un lote de 51 caracteres y acepta uno de 50", () => {
    expect(errores({ ...valida, lote: "L".repeat(51) })).toEqual({
      lote: MENSAJES.loteMuyLargo,
    });
    expect(errores({ ...valida, lote: "L".repeat(50) })).toBeNull();
  });

  it("rechaza una fecha que no existe en el calendario", () => {
    expect(errores({ ...valida, fecha: "2026-02-30" })).toEqual({
      fecha: MENSAJES.fechaInexistente,
    });
  });

  it.each(["16/10/2026", "2026-10-1", "ayer"])(
    "rechaza la fecha con formato inválido %s",
    (fecha) => {
      expect(errores({ ...valida, fecha })).toEqual({
        fecha: MENSAJES.fechaFormato,
      });
    },
  );

  it("rechaza la fecha de mañana y acepta la de hoy", () => {
    expect(errores({ ...valida, fecha: "2026-10-17" })).toEqual({
      fecha: MENSAJES.fechaFutura,
    });
    expect(errores({ ...valida, fecha: "2026-10-16" })).toBeNull();
  });

  it("calcula hoy en la zona del negocio, no en UTC", () => {
    // 03:00 UTC del 17 = 21:00 del 16 en Ciudad de México: el 17 aún es futuro.
    vi.setSystemTime(new Date("2026-10-17T03:00:00Z"));
    expect(errores({ ...valida, fecha: "2026-10-17" })).toEqual({
      fecha: MENSAJES.fechaFutura,
    });
  });

  it.each([
    { caso: "revisadas 0", valor: 0, mensaje: MENSAJES.revisadasMayorQueCero },
    { caso: "revisadas negativas", valor: -5, mensaje: MENSAJES.revisadasMayorQueCero },
    { caso: "revisadas decimales", valor: 10.5, mensaje: MENSAJES.revisadasEnteras },
  ])("rechaza $caso", ({ valor, mensaje }) => {
    expect(
      errores({ ...valida, unidadesRevisadas: valor, unidadesDefectuosas: 0 }),
    ).toEqual({ unidadesRevisadas: mensaje });
  });

  it.each([
    { caso: "defectuosas negativas", valor: -1, mensaje: MENSAJES.defectuosasNegativas },
    { caso: "defectuosas decimales", valor: 1.5, mensaje: MENSAJES.defectuosasEnteras },
  ])("rechaza $caso", ({ valor, mensaje }) => {
    expect(errores({ ...valida, unidadesDefectuosas: valor })).toEqual({
      unidadesDefectuosas: mensaje,
    });
  });

  it("rechaza defectuosas mayores que revisadas, con el error en unidadesDefectuosas", () => {
    expect(
      errores({ ...valida, unidadesRevisadas: 10, unidadesDefectuosas: 11 }),
    ).toEqual({ unidadesDefectuosas: MENSAJES.defectuosasMayoresQueRevisadas });
  });

  it("muestra la regla cruzada junto con errores de otros campos", () => {
    expect(
      errores({ ...valida, lote: "", unidadesRevisadas: 10, unidadesDefectuosas: 11 }),
    ).toEqual({
      lote: MENSAJES.loteObligatorio,
      unidadesDefectuosas: MENSAJES.defectuosasMayoresQueRevisadas,
    });
  });

  it('rechaza el texto "10" en lugar de número, sin convertirlo', () => {
    expect(errores({ ...valida, unidadesRevisadas: "10" })).toEqual({
      unidadesRevisadas: MENSAJES.revisadasObligatorias,
    });
    expect(errores({ ...valida, unidadesDefectuosas: "1" })).toEqual({
      unidadesDefectuosas: MENSAJES.defectuosasObligatorias,
    });
  });
});

describe("filtrosSchema", () => {
  it("acepta filtros vacíos, por producto y por resultado", () => {
    expect(filtrosSchema.parse({})).toEqual({});
    expect(
      filtrosSchema.parse({ producto: "P001", resultado: "Con observaciones" }),
    ).toEqual({ producto: "P001", resultado: "Con observaciones" });
  });

  it("rechaza un resultado que no existe", () => {
    expect(filtrosSchema.safeParse({ resultado: "Inventado" }).success).toBe(
      false,
    );
  });
});
