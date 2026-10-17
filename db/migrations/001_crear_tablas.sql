-- Catálogo de productos que se pueden inspeccionar.
CREATE TABLE productos (
  codigo VARCHAR(10) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE
);

-- Una fila por inspección. El porcentaje y el resultado NO se guardan:
-- se calculan al leer con src/domain/, así un cambio de límite reclasifica todo.
-- Los CHECK son la tercera capa de validación (después del formulario y la API):
-- aunque alguien inserte directo en la BD, no puede guardar datos imposibles.
CREATE TABLE inspecciones (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  producto_codigo VARCHAR(10) NOT NULL REFERENCES productos(codigo),
  -- El lote no puede quedar vacío ni ser solo espacios.
  lote VARCHAR(50) NOT NULL CHECK (length(trim(lote)) > 0),
  fecha DATE NOT NULL,
  -- Sin piezas revisadas no hay inspección (y no se puede dividir entre cero).
  unidades_revisadas INTEGER NOT NULL CHECK (unidades_revisadas > 0),
  -- No hay defectuosas negativas ni más defectuosas que revisadas.
  unidades_defectuosas INTEGER NOT NULL CHECK (
    unidades_defectuosas >= 0 AND unidades_defectuosas <= unidades_revisadas
  ),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- La tabla se muestra de la más reciente a la más antigua; creado_en desempata
-- inspecciones del mismo día.
CREATE INDEX inspecciones_fecha_creado_en_idx
  ON inspecciones (fecha DESC, creado_en DESC);
