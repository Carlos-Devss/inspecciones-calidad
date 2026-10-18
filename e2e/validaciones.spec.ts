import { expect, test, type Page } from "@playwright/test";
import { contarPorLote, loteUnico, manana, obtenerListado, obtenerProductos } from "./datos";
import { esperarListado, formulario, llenarFormulario } from "./pantalla";

// Cuenta los POST a la API que salen del navegador.
function contarEnvios(page: Page) {
  let envios = 0;
  page.on("request", (peticion) => {
    if (peticion.method() === "POST" && new URL(peticion.url()).pathname === "/api/inspecciones") {
      envios += 1;
    }
  });
  return () => envios;
}

test.describe("Validaciones del formulario", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await esperarListado(page);
  });

  test("con el formulario vacío marca cada campo obligatorio y no guarda nada", async ({
    page,
    request,
  }) => {
    const envios = contarEnvios(page);
    const antes = (await obtenerListado(request)).inspecciones.length;
    const f = formulario(page);

    await f.guardar.click();

    await expect(f.error("producto")).toHaveText("Selecciona un producto.");
    await expect(f.error("lote")).toHaveText("El lote es obligatorio.");
    await expect(f.error("revisadas")).toHaveText(
      "Las unidades revisadas son obligatorias y deben ser un número.",
    );
    await expect(f.error("defectuosas")).toHaveText(
      "Las unidades defectuosas son obligatorias y deben ser un número.",
    );
    // La fecha trae hoy por defecto: no tiene error.
    await expect(f.error("fecha")).toHaveCount(0);
    await expect(f.lote).toHaveAttribute("aria-invalid", "true");
    await expect(f.lote).toHaveAttribute("aria-describedby", "inspeccion-lote-error");
    // El foco va al primer campo con error.
    await expect(f.producto).toBeFocused();

    expect(envios()).toBe(0);
    expect((await obtenerListado(request)).inspecciones.length).toBe(antes);
  });

  const casos = [
    {
      nombre: "con decimales en las cantidades",
      revisadas: "10.5",
      defectuosas: "1.5",
      errores: {
        revisadas: "Las unidades revisadas deben ser un número entero.",
        defectuosas: "Las unidades defectuosas deben ser un número entero.",
      },
    },
    {
      nombre: "con más defectuosas que revisadas",
      revisadas: "10",
      defectuosas: "11",
      errores: { defectuosas: "Las unidades defectuosas no pueden ser más que las revisadas." },
    },
    {
      nombre: "con fecha futura",
      revisadas: "100",
      defectuosas: "1",
      fecha: manana(),
      errores: { fecha: "La fecha no puede ser futura." },
    },
  ] as const;

  for (const caso of casos) {
    test(`${caso.nombre} muestra el error en su campo y no guarda nada`, async ({
      page,
      request,
    }, testInfo) => {
      const envios = contarEnvios(page);
      const lote = loteUnico(testInfo);
      const [producto] = await obtenerProductos(request);
      const f = formulario(page);

      await llenarFormulario(page, {
        productoCodigo: producto.codigo,
        lote,
        revisadas: caso.revisadas,
        defectuosas: caso.defectuosas,
        fecha: "fecha" in caso ? caso.fecha : undefined,
      });
      await f.guardar.click();

      for (const [campo, mensaje] of Object.entries(caso.errores)) {
        await expect(f.error(campo as keyof typeof caso.errores)).toHaveText(mensaje);
      }
      // Solo los campos del caso tienen error.
      await expect(page.locator('[aria-invalid="true"]')).toHaveCount(
        Object.keys(caso.errores).length,
      );

      expect(envios()).toBe(0);
      expect(await contarPorLote(request, lote)).toBe(0);
    });
  }

  test("un doble clic en Guardar registra la inspección una sola vez", async ({
    page,
    request,
  }, testInfo) => {
    const envios = contarEnvios(page);
    const lote = loteUnico(testInfo);
    const [producto] = await obtenerProductos(request);
    const f = formulario(page);

    await llenarFormulario(page, {
      productoCodigo: producto.codigo,
      lote,
      revisadas: "50",
      defectuosas: "1",
    });
    await f.guardar.dblclick();

    await expect(page.getByRole("status")).toContainText("Inspección guardada");
    await page.waitForLoadState("networkidle");

    expect(envios()).toBe(1);
    expect(await contarPorLote(request, lote)).toBe(1);
  });
});
