import { expect, test } from "@playwright/test";
import { loteUnico, obtenerListado, obtenerProductos } from "./datos";
import { esperarListado, formulario, leerRegistros, llenarFormulario } from "./pantalla";

test.describe("Criterio de aceptación", () => {
  test("la vista previa muestra el porcentaje y el resultado antes de guardar", async ({
    page,
  }) => {
    await page.goto("/");
    const f = formulario(page);
    await expect(f.vistaPrevia).toContainText("Captura las unidades para ver el resultado");

    // Incluye los bordes: 5% todavía es Aprobado y 10% todavía es Con observaciones.
    const casos = [
      { revisadas: "200", defectuosas: "13", porcentaje: "6.50%", resultado: "Con observaciones" },
      { revisadas: "100", defectuosas: "5", porcentaje: "5.00%", resultado: "Aprobado" },
      { revisadas: "80", defectuosas: "8", porcentaje: "10.00%", resultado: "Con observaciones" },
      { revisadas: "40", defectuosas: "7", porcentaje: "17.50%", resultado: "Rechazado" },
    ];
    for (const caso of casos) {
      await f.revisadas.fill(caso.revisadas);
      await f.defectuosas.fill(caso.defectuosas);
      await expect(f.vistaPrevia).toContainText(caso.porcentaje);
      await expect(f.vistaPrevia).toContainText(caso.resultado);
      await expect(page.getByRole("meter", { name: "Medidor de tolerancia" })).toHaveAttribute(
        "aria-valuetext",
        new RegExp(`^${caso.porcentaje}`),
      );
    }
  });

  test("guarda una inspección válida, la muestra primera y sigue ahí al recargar", async ({
    page,
    request,
  }, testInfo) => {
    const lote = loteUnico(testInfo);
    const [producto] = await obtenerProductos(request);
    const esperado = {
      lote,
      productoCodigo: producto.codigo,
      revisadas: 200,
      defectuosas: 13,
      porcentaje: "6.50%",
      resultado: "Con observaciones",
    };

    await page.goto("/");
    await esperarListado(page);
    await llenarFormulario(page, {
      productoCodigo: producto.codigo,
      lote,
      revisadas: "200",
      defectuosas: "13",
    });

    const f = formulario(page);
    await expect(f.vistaPrevia).toContainText("6.50%");
    await expect(f.vistaPrevia).toContainText("Con observaciones");

    await f.guardar.click();
    await expect(page.getByRole("status")).toContainText("Inspección guardada");
    // Se limpian lote y cantidades para capturar el siguiente lote.
    await expect(f.lote).toHaveValue("");
    await expect(f.revisadas).toHaveValue("");

    await expect.poll(async () => (await leerRegistros(page))[0]).toEqual(esperado);

    await page.reload();
    await esperarListado(page);
    expect((await leerRegistros(page))[0]).toEqual(esperado);

    const { inspecciones } = await obtenerListado(request);
    expect(inspecciones[0]).toMatchObject({
      lote,
      productoCodigo: producto.codigo,
      unidadesRevisadas: 200,
      unidadesDefectuosas: 13,
      resultado: "Con observaciones",
    });
  });
});
