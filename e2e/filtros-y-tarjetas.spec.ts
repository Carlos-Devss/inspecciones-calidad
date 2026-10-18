import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import {
  crearInspeccion,
  loteUnico,
  obtenerListado,
  obtenerProductos,
  RESULTADOS,
  type Filtros,
} from "./datos";
import {
  elegirResultado,
  esperarListado,
  filtrar,
  formatearPorcentaje,
  leerRegistros,
  leerTarjetas,
  selectorProductoFiltro,
} from "./pantalla";

// Las filas visibles, las tarjetas y la API deben coincidir para los filtros
// dados. No supone totales fijos: todo se calcula de lo que hay en pantalla.
async function comprobarTablaYTarjetas(page: Page, request: APIRequestContext, filtros: Filtros) {
  const registros = await leerRegistros(page);
  const tarjetas = await leerTarjetas(page);
  const api = await obtenerListado(request, filtros);

  expect(registros.map((r) => r.lote)).toEqual(api.inspecciones.map((i) => i.lote));
  for (const registro of registros) {
    if (filtros.resultado) expect(registro.resultado).toBe(filtros.resultado);
    if (filtros.producto) expect(registro.productoCodigo).toBe(filtros.producto);
  }

  const revisadas = registros.reduce((suma, r) => suma + r.revisadas, 0);
  const defectuosas = registros.reduce((suma, r) => suma + r.defectuosas, 0);
  expect(tarjetas.inspecciones).toBe(registros.length);
  expect(tarjetas.revisadas).toBe(revisadas);
  // Porcentaje global = defectuosas ÷ revisadas, no el promedio de porcentajes.
  expect(tarjetas.defectosGlobales).toBe(
    revisadas > 0 ? formatearPorcentaje((defectuosas / revisadas) * 100) : "Sin datos",
  );
}

test.describe("Filtros y tarjetas de resumen", () => {
  let productoCodigo: string;

  // Una inspección de cada resultado, para que ningún filtro quede vacío
  // aunque la base esté recién creada.
  test.beforeEach(async ({ page, request }, testInfo) => {
    [{ codigo: productoCodigo }] = await obtenerProductos(request);
    for (const [revisadas, defectuosas] of [
      [100, 2], // 2%  Aprobado
      [100, 8], // 8%  Con observaciones
      [100, 20], // 20% Rechazado
    ]) {
      await crearInspeccion(request, {
        productoCodigo,
        lote: loteUnico(testInfo),
        unidadesRevisadas: revisadas,
        unidadesDefectuosas: defectuosas,
      });
    }
    await page.goto("/");
    await esperarListado(page);
  });

  test("con cada resultado, las filas coinciden con las tarjetas", async ({ page, request }) => {
    await comprobarTablaYTarjetas(page, request, {});

    for (const resultado of RESULTADOS) {
      await filtrar(page, { resultado }, () => elegirResultado(page, resultado));
      expect((await leerRegistros(page)).length).toBeGreaterThan(0);
      await comprobarTablaYTarjetas(page, request, { resultado });
    }

    await filtrar(page, {}, () => elegirResultado(page, "Todos"));
    await comprobarTablaYTarjetas(page, request, {});
  });

  test("combina producto y resultado", async ({ page, request }) => {
    await filtrar(page, { producto: productoCodigo }, () =>
      selectorProductoFiltro(page).selectOption(productoCodigo),
    );
    await comprobarTablaYTarjetas(page, request, { producto: productoCodigo });

    await filtrar(page, { producto: productoCodigo, resultado: "Rechazado" }, () =>
      elegirResultado(page, "Rechazado"),
    );
    expect((await leerRegistros(page)).length).toBeGreaterThan(0);
    await comprobarTablaYTarjetas(page, request, {
      producto: productoCodigo,
      resultado: "Rechazado",
    });
    await expect(page.getByRole("region", { name: "Resumen" })).toContainText("Rechazado");
  });

  test("sin coincidencias muestra el estado vacío y Sin datos", async ({ page, request }) => {
    // Busca una combinación sin inspecciones en la base actual.
    let vacio: Filtros | undefined;
    for (const { codigo } of await obtenerProductos(request)) {
      for (const resultado of RESULTADOS) {
        const { inspecciones } = await obtenerListado(request, { producto: codigo, resultado });
        if (inspecciones.length === 0) {
          vacio = { producto: codigo, resultado };
          break;
        }
      }
      if (vacio) break;
    }
    test.skip(!vacio, "Todas las combinaciones de producto y resultado tienen inspecciones.");
    const { producto, resultado } = vacio!;

    await filtrar(page, { producto }, () => selectorProductoFiltro(page).selectOption(producto!));
    await filtrar(page, { producto, resultado }, () => elegirResultado(page, resultado!));

    await expect(page.getByText("Ninguna inspección coincide con estos filtros.")).toBeVisible();
    expect(await leerRegistros(page)).toEqual([]);
    expect(await leerTarjetas(page)).toEqual({
      inspecciones: 0,
      revisadas: 0,
      defectosGlobales: "Sin datos",
    });
  });

  test("Limpiar filtros recupera todas las inspecciones", async ({ page, request }) => {
    await filtrar(page, { producto: productoCodigo }, () =>
      selectorProductoFiltro(page).selectOption(productoCodigo),
    );
    await filtrar(page, { producto: productoCodigo, resultado: "Aprobado" }, () =>
      elegirResultado(page, "Aprobado"),
    );

    await filtrar(page, {}, () =>
      page.getByRole("button", { name: "Limpiar filtros" }).first().click(),
    );

    await expect(selectorProductoFiltro(page)).toHaveValue("");
    await expect(page.getByRole("radio", { name: "Todos" })).toBeChecked();
    await expect.poll(() => new URL(page.url()).search).toBe("");
    await comprobarTablaYTarjetas(page, request, {});
  });

  test("el filtro sobrevive a recargar la página", async ({ page, request }) => {
    const filtros = { producto: productoCodigo, resultado: "Rechazado" } as const;
    await filtrar(page, { producto: productoCodigo }, () =>
      selectorProductoFiltro(page).selectOption(productoCodigo),
    );
    await filtrar(page, filtros, () => elegirResultado(page, "Rechazado"));
    await expect(page).toHaveURL(/resultado=Rechazado/);

    await page.reload();
    await esperarListado(page);

    await expect(selectorProductoFiltro(page)).toHaveValue(productoCodigo);
    await expect(page.getByRole("radio", { name: "Rechazado" })).toBeChecked();
    await comprobarTablaYTarjetas(page, request, filtros);
  });
});
