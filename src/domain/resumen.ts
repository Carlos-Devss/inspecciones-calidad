export type ResumenInspecciones = {
  totalInspecciones: number;
  totalRevisadas: number;
  totalDefectuosas: number;
  // null cuando no hay piezas revisadas: no existe un porcentaje que mostrar.
  porcentajeGlobal: number | null;
};

// Recibe datos ya validados (vienen de la BD), por eso no vuelve a validarlos.
export function resumirInspecciones(
  lista: { revisadas: number; defectuosas: number }[],
): ResumenInspecciones {
  let totalRevisadas = 0;
  let totalDefectuosas = 0;
  for (const inspeccion of lista) {
    totalRevisadas += inspeccion.revisadas;
    totalDefectuosas += inspeccion.defectuosas;
  }

  // Se divide el total de defectuosas entre el total de revisadas, en vez de
  // promediar los porcentajes de cada inspección. El promedio le da el mismo
  // peso a una inspección de 10 piezas que a una de 100, y eso distorsiona el
  // resultado: con 100/0 y 10/2 el promedio da 10%, pero de 110 piezas solo
  // 2 salieron defectuosas, que es 1.82%.
  const porcentajeGlobal = totalRevisadas > 0 ? (totalDefectuosas / totalRevisadas) * 100 : null;

  return {
    totalInspecciones: lista.length,
    totalRevisadas,
    totalDefectuosas,
    porcentajeGlobal,
  };
}
