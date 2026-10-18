import { expect, type Page } from "@playwright/test";
import type { Filtros } from "./datos";

// Lectura de la pantalla tal como la ve el usuario. La lista es una tabla en
// escritorio y tarjetas en móvil; leerRegistros entiende las dos.

export type Registro = {
  lote: string;
  productoCodigo: string;
  revisadas: number;
  defectuosas: number;
  porcentaje: string;
  resultado: string;
};

const dosDecimales = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Igual que la pantalla: 6.3309 → "6.33%".
export function formatearPorcentaje(valor: number): string {
  return `${dosDecimales.format(valor)}%`;
}

// "1,390" → 1390
function aNumero(texto: string): number {
  return Number(texto.replace(/,/g, "").trim());
}

// Espera a que tabla y tarjetas tengan datos y no haya petición pendiente.
export async function esperarListado(page: Page) {
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
}

// Espera la respuesta del listado con exactamente estos filtros.
export function esperarRespuestaListado(page: Page, filtros: Filtros) {
  return page.waitForResponse((respuesta) => {
    const url = new URL(respuesta.url());
    return (
      respuesta.request().method() === "GET" &&
      url.pathname === "/api/inspecciones" &&
      url.searchParams.get("producto") === (filtros.producto ?? null) &&
      url.searchParams.get("resultado") === (filtros.resultado ?? null)
    );
  });
}

// Aplica filtros con los controles y espera a que lleguen sus datos.
// `filtros` es el estado completo que debe quedar.
export async function filtrar(page: Page, filtros: Filtros, accion: () => Promise<unknown>) {
  const respuesta = esperarRespuestaListado(page, filtros);
  await accion();
  await respuesta;
  await esperarListado(page);
}

export function elegirResultado(page: Page, resultado: string) {
  return page
    .getByRole("radiogroup", { name: "Filtrar por resultado" })
    .locator("label", { hasText: new RegExp(`^${resultado}$`) })
    .click();
}

export function selectorProductoFiltro(page: Page) {
  return page.getByLabel("Filtrar por producto");
}

export async function leerRegistros(page: Page): Promise<Registro[]> {
  const tabla = page.getByRole("table");
  if (await tabla.isVisible()) {
    return tabla.locator("tbody tr").evaluateAll((filas) =>
      filas.map((fila) => {
        const celdas = fila.querySelectorAll("td");
        const texto = (i: number) => celdas[i]?.textContent?.trim() ?? "";
        const numero = (i: number) => Number(texto(i).replace(/,/g, ""));
        return {
          lote: texto(2),
          productoCodigo: celdas[1]?.querySelector("span")?.textContent?.trim() ?? "",
          revisadas: numero(3),
          defectuosas: numero(4),
          porcentaje: texto(6),
          resultado: texto(7),
        };
      }),
    );
  }

  const lista = page.getByRole("list", { name: /Inspecciones de la más reciente/ });
  if (!(await lista.isVisible())) return [];
  return lista.locator(":scope > li").evaluateAll((tarjetas) =>
    tarjetas.map((tarjeta) => {
      const parrafos = tarjeta.querySelectorAll(":scope > p");
      const cifras = [...tarjeta.querySelectorAll("dl dd")].map(
        (dd) => dd.textContent?.trim() ?? "",
      );
      return {
        lote: (parrafos[1]?.textContent ?? "").replace(/^Lote\s+/, "").trim(),
        productoCodigo: parrafos[0]?.querySelector("span")?.textContent?.trim() ?? "",
        revisadas: Number((cifras[0] ?? "").replace(/,/g, "")),
        defectuosas: Number((cifras[1] ?? "").replace(/,/g, "")),
        porcentaje: cifras[2] ?? "",
        resultado: tarjeta.querySelector(":scope > div > span")?.textContent?.trim() ?? "",
      };
    }),
  );
}

export async function leerTarjetas(page: Page) {
  const resumen = page.getByRole("region", { name: "Resumen" });
  const valor = (etiqueta: string) =>
    resumen
      .locator("dl > div")
      .filter({ has: page.locator("dt", { hasText: new RegExp(`^${etiqueta}$`) }) })
      .locator("dd")
      .first()
      .innerText();
  return {
    inspecciones: aNumero(await valor("Inspecciones")),
    revisadas: aNumero(await valor("Unidades revisadas")),
    defectosGlobales: (await valor("Defectos globales")).trim(),
  };
}

export function formulario(page: Page) {
  const panel = page.getByRole("region", { name: "Nueva inspección" });
  return {
    panel,
    producto: panel.getByLabel("Producto", { exact: true }),
    lote: panel.getByLabel("Lote"),
    fecha: panel.getByLabel("Fecha"),
    revisadas: panel.getByLabel("Unidades revisadas"),
    defectuosas: panel.getByLabel("Unidades defectuosas"),
    guardar: panel.getByRole("button", { name: "Guardar inspección" }),
    vistaPrevia: panel.getByText("Vista previa", { exact: true }).locator(".."),
    error: (campo: "producto" | "lote" | "fecha" | "revisadas" | "defectuosas") =>
      page.locator(`#inspeccion-${campo}-error`),
  };
}

export async function llenarFormulario(
  page: Page,
  datos: {
    productoCodigo: string;
    lote: string;
    revisadas: string;
    defectuosas: string;
    fecha?: string;
  },
) {
  const f = formulario(page);
  await f.producto.selectOption(datos.productoCodigo);
  await f.lote.fill(datos.lote);
  if (datos.fecha) await f.fecha.fill(datos.fecha);
  await f.revisadas.fill(datos.revisadas);
  await f.defectuosas.fill(datos.defectuosas);
}
