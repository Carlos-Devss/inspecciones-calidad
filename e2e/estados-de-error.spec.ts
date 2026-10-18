import { expect, test, type Page, type Route } from "@playwright/test";
import { contarPorLote, crearInspeccion, loteUnico, obtenerProductos } from "./datos";
import { esperarListado, formulario, leerRegistros, llenarFormulario } from "./pantalla";

const esApiInspecciones = (url: URL) => url.pathname === "/api/inspecciones";

// Responde 500 a las peticiones con este método y deja pasar las demás.
function responder500(metodo: "GET" | "POST") {
  return (route: Route) =>
    route.request().method() === metodo
      ? route.fulfill({
          status: 500,
          json: {
            error: "ERROR_INTERNO",
            mensaje: "No se pudo completar la operación. Intenta de nuevo.",
          },
        })
      : route.fallback();
}

async function quitarIntercepto(page: Page) {
  await page.unroute(esApiInspecciones);
}

test.describe("Estados de error", () => {
  test("si el listado responde 500 se ve el error y Reintentar lo recupera", async ({
    page,
    request,
  }, testInfo) => {
    const lote = loteUnico(testInfo);
    const [producto] = await obtenerProductos(request);
    await crearInspeccion(request, {
      productoCodigo: producto.codigo,
      lote,
      unidadesRevisadas: 100,
      unidadesDefectuosas: 1,
    });

    await page.route(esApiInspecciones, responder500("GET"));
    await page.goto("/");

    const error = page.getByRole("alert").filter({
      hasText: "No se pudieron cargar las inspecciones.",
    });
    await expect(error).toBeVisible();
    // Sin datos no hay totales que mostrar.
    await expect(page.getByRole("region", { name: "Resumen" })).toHaveCount(0);

    await quitarIntercepto(page);
    await error.getByRole("button", { name: "Reintentar" }).click();

    await expect(error).toHaveCount(0);
    await esperarListado(page);
    await expect(page.getByRole("region", { name: "Resumen" })).toBeVisible();
    expect((await leerRegistros(page)).map((r) => r.lote)).toContain(lote);
  });

  test("si el guardado responde 500 se avisa y se conserva lo capturado", async ({
    page,
    request,
  }, testInfo) => {
    const lote = loteUnico(testInfo);
    const [producto] = await obtenerProductos(request);
    const f = formulario(page);

    await page.goto("/");
    await esperarListado(page);
    await page.route(esApiInspecciones, responder500("POST"));
    await llenarFormulario(page, {
      productoCodigo: producto.codigo,
      lote,
      revisadas: "120",
      defectuosas: "3",
    });
    const fecha = await f.fecha.inputValue();
    await f.guardar.click();

    await expect(f.panel.getByRole("alert")).toHaveText(
      "No se pudo guardar la inspección. Revisa tu conexión e inténtalo de nuevo.",
    );
    await expect(f.producto).toHaveValue(producto.codigo);
    await expect(f.lote).toHaveValue(lote);
    await expect(f.fecha).toHaveValue(fecha);
    await expect(f.revisadas).toHaveValue("120");
    await expect(f.defectuosas).toHaveValue("3");
    expect(await contarPorLote(request, lote)).toBe(0);

    // Al volver la conexión, lo capturado se guarda sin reescribirlo.
    await quitarIntercepto(page);
    await f.guardar.click();
    await expect(page.getByRole("status")).toContainText("Inspección guardada");
    await expect(f.panel.getByRole("alert")).toHaveCount(0);
    expect(await contarPorLote(request, lote)).toBe(1);
  });
});
