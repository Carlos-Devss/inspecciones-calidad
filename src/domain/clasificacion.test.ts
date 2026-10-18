import { describe, expect, it } from "vitest";
import { clasificarInspeccion } from "./clasificacion";

describe("clasificarInspeccion", () => {
  it.each([
    { revisadas: 20, defectuosas: 1, esperado: "Aprobado" },
    { revisadas: 19, defectuosas: 1, esperado: "Con observaciones" },
    { revisadas: 10, defectuosas: 1, esperado: "Con observaciones" },
    { revisadas: 9, defectuosas: 1, esperado: "Rechazado" },
  ])(
    "$revisadas revisadas y $defectuosas defectuosas → $esperado",
    ({ revisadas, defectuosas, esperado }) => {
      expect(clasificarInspeccion(revisadas, defectuosas).resultado).toBe(esperado);
    },
  );

  it("calcula el porcentaje exacto, sin redondear", () => {
    expect(clasificarInspeccion(19, 1).porcentaje).toBe((1 / 19) * 100);
  });

  it("acepta cero defectuosas: 0% y Aprobado", () => {
    expect(clasificarInspeccion(10, 0)).toEqual({
      porcentaje: 0,
      resultado: "Aprobado",
    });
  });

  it("acepta todas defectuosas: Rechazado", () => {
    expect(clasificarInspeccion(10, 10).resultado).toBe("Rechazado");
  });

  it.each([
    {
      caso: "cero revisadas",
      revisadas: 0,
      defectuosas: 0,
      mensaje: "Las unidades revisadas deben ser mayores que cero.",
    },
    {
      caso: "revisadas negativas",
      revisadas: -5,
      defectuosas: 0,
      mensaje: "Las unidades revisadas deben ser mayores que cero.",
    },
    {
      caso: "defectuosas negativas",
      revisadas: 10,
      defectuosas: -1,
      mensaje: "Las unidades defectuosas no pueden ser negativas.",
    },
    {
      caso: "revisadas decimales",
      revisadas: 10.5,
      defectuosas: 1,
      mensaje: "Las unidades revisadas deben ser un número entero.",
    },
    {
      caso: "defectuosas decimales",
      revisadas: 10,
      defectuosas: 1.5,
      mensaje: "Las unidades defectuosas deben ser un número entero.",
    },
    {
      caso: 'revisadas ""',
      revisadas: "",
      defectuosas: 1,
      mensaje: "Las unidades revisadas deben ser un número entero.",
    },
    {
      caso: 'defectuosas ""',
      revisadas: 10,
      defectuosas: "",
      mensaje: "Las unidades defectuosas deben ser un número entero.",
    },
    {
      caso: "revisadas null",
      revisadas: null,
      defectuosas: 1,
      mensaje: "Las unidades revisadas deben ser un número entero.",
    },
    {
      caso: "defectuosas undefined",
      revisadas: 10,
      defectuosas: undefined,
      mensaje: "Las unidades defectuosas deben ser un número entero.",
    },
    {
      caso: "defectuosas mayores que revisadas",
      revisadas: 10,
      defectuosas: 11,
      mensaje: "Las unidades defectuosas no pueden ser más que las revisadas.",
    },
  ])("rechaza $caso", ({ revisadas, defectuosas, mensaje }) => {
    expect(() => clasificarInspeccion(revisadas, defectuosas)).toThrow(mensaje);
  });
});
