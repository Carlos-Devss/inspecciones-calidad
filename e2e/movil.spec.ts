import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { obtenerListado, obtenerProductos, RESULTADOS, type Filtros } from "./datos";
import {
  elegirResultado,
  esperarListado,
  filtrar,
  formulario,
  selectorProductoFiltro,
} from "./pantalla";

async function expectSinScrollHorizontal(page: Page) {
  const { contenido, ventana } = await page.evaluate(() => ({
    contenido: document.documentElement.scrollWidth,
    ventana: document.documentElement.clientWidth,
  }));
  expect(contenido, "el contenido no debe ser más ancho que la ventana").toBeLessThanOrEqual(
    ventana,
  );
}

// Primera combinación de producto y resultado sin inspecciones, si existe.
async function buscarFiltroSinDatos(request: APIRequestContext) {
  for (const { codigo } of await obtenerProductos(request)) {
    for (const resultado of RESULTADOS) {
      const filtros: Filtros = { producto: codigo, resultado };
      if ((await obtenerListado(request, filtros)).inspecciones.length === 0) return filtros;
    }
  }
  return undefined;
}

test.describe("Móvil", () => {
  test.skip(({ isMobile }) => !isMobile, "Solo aplica al proyecto móvil.");

  test("no hay scroll horizontal con datos ni con errores en el formulario", async ({ page }) => {
    await page.goto("/");
    await esperarListado(page);
    await expectSinScrollHorizontal(page);

    const f = formulario(page);
    await f.guardar.click();
    await expect(f.error("lote")).toBeVisible();
    await expectSinScrollHorizontal(page);
  });

  test("no hay scroll horizontal en el estado sin coincidencias", async ({ page, request }) => {
    const vacio = await buscarFiltroSinDatos(request);
    test.skip(!vacio, "Todas las combinaciones de producto y resultado tienen inspecciones.");
    const { producto, resultado } = vacio!;

    await page.goto("/");
    await esperarListado(page);
    await filtrar(page, { producto }, () => selectorProductoFiltro(page).selectOption(producto!));
    await filtrar(page, { producto, resultado }, () => elegirResultado(page, resultado!));
    await expect(page.getByText("Ninguna inspección coincide con estos filtros.")).toBeVisible();
    await expectSinScrollHorizontal(page);
  });

  test("a 320 px tampoco hay scroll horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/");
    await esperarListado(page);
    await expectSinScrollHorizontal(page);

    const f = formulario(page);
    await f.guardar.click();
    await expect(f.error("lote")).toBeVisible();
    await expectSinScrollHorizontal(page);
  });
});
