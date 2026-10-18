import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { obtenerProductos } from "./datos";
import { elegirResultado, esperarListado, filtrar, formulario } from "./pantalla";

// Revisa WCAG 2.2 A y AA con axe y regresa solo las violaciones serias o
// críticas, en un formato legible para el reporte.
async function violacionesGraves(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  return violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => ({
      regla: v.id,
      impacto: v.impact,
      ayuda: v.help,
      nodos: v.nodes.map((n) => n.target.join(" ")),
    }));
}

test.describe("Accesibilidad", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await esperarListado(page);
  });

  test("la pantalla cargada no tiene violaciones serias ni críticas", async ({ page }) => {
    expect(await violacionesGraves(page)).toEqual([]);
  });

  test("el formulario con errores no tiene violaciones serias ni críticas", async ({ page }) => {
    const f = formulario(page);
    await f.guardar.click();
    await expect(f.error("lote")).toBeVisible();

    expect(await violacionesGraves(page)).toEqual([]);
  });

  test("la vista previa y un filtro activo no tienen violaciones serias ni críticas", async ({
    page,
    request,
  }) => {
    const [producto] = await obtenerProductos(request);
    const f = formulario(page);
    await f.producto.selectOption(producto.codigo);
    await f.revisadas.fill("40");
    await f.defectuosas.fill("7");
    await expect(f.vistaPrevia).toContainText("Rechazado");
    await filtrar(page, { resultado: "Rechazado" }, () => elegirResultado(page, "Rechazado"));

    expect(await violacionesGraves(page)).toEqual([]);
  });
});
