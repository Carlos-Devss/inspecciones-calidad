# Inspecciones de calidad

Pantalla web para registrar inspecciones de calidad por producto y lote, con clasificación automática, filtros y totales.

[![CI](https://github.com/Carlos-Devss/inspecciones-calidad/actions/workflows/ci.yml/badge.svg)](https://github.com/Carlos-Devss/inspecciones-calidad/actions/workflows/ci.yml)

**Deploy:** https://inspecciones-calidad.vercel.app

## Requisitos

- Node.js 20.19 o superior (los scripts de base de datos usan `--env-file-if-exists`).
- npm.
- PostgreSQL 14 o superior, en Neon o local.

## Instalación y ejecución local

```bash
git clone https://github.com/Carlos-Devss/inspecciones-calidad.git
cd inspecciones-calidad
npm ci
cp .env.example .env.local   # escribe tu DATABASE_URL
npm run db:migrate
npm run db:seed
npm run dev
```

La app queda en http://localhost:3000.

## Variables de entorno

| Variable       | Uso                                        | Ejemplo                                                                    |
| -------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| `DATABASE_URL` | Conexión a PostgreSQL de la app y scripts. | `postgresql://usuario:password@host:5432/inspecciones?sslmode=verify-full` |

`sslmode=verify-full` cifra la conexión y verifica el certificado del servidor. En una base local sin TLS, quita `?sslmode=verify-full`. Solo `.env.example` está en el repositorio.

## Migraciones y datos iniciales

| Archivo                                    | Qué crea                                                                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `db/migrations/001_crear_tablas.sql`       | Tablas `productos` e `inspecciones`, con `CHECK` (revisadas > 0, 0 ≤ defectuosas ≤ revisadas, lote no vacío) e índice por fecha. |
| `db/migrations/002_catalogo_productos.sql` | Catálogo de 5 productos: P001 Martillo, P002 Pinzas, P003 Desarmador, P004 Flexómetro, P005 Llave ajustable.                     |

`npm run db:migrate` aplica en orden las migraciones pendientes, cada una en su transacción, y las registra en la tabla `schema_migrations`; correrlo otra vez no repite las ya aplicadas.

`npm run db:seed` carga 10 inspecciones de demostración de `db/seeds/` que cubren los tres resultados y los bordes exactos de 5% y 10%. Solo inserta si la tabla `inspecciones` está vacía.

## Pruebas

```bash
npm test                          # unitarias (Vitest), no necesitan base de datos
npx playwright install chromium   # solo la primera vez
npm run test:e2e                  # E2E (Playwright) contra la app compilada y la base de DATABASE_URL
```

**Unitarias: 61 pruebas.** Cubren:

- Las 4 pruebas obligatorias de clasificación:

  | Revisadas | Defectuosas | Porcentaje | Resultado         |
  | --------: | ----------: | ---------: | ----------------- |
  |        20 |           1 |      5.00% | Aprobado          |
  |        19 |           1 |      5.26% | Con observaciones |
  |        10 |           1 |     10.00% | Con observaciones |
  |         9 |           1 |     11.11% | Rechazado         |

- Rechazo de datos inválidos: 0 revisadas, cantidades negativas o decimales, valores vacíos o nulos, más defectuosas que revisadas, lote vacío o de más de 50 caracteres, fechas futuras o inexistentes y texto en lugar de número.
- Porcentaje global con totales y lista vacía.
- Filtro por resultado con el resumen calculado sobre la misma lista, y respuesta 500 sin detalles internos.

**E2E: 37 pruebas** en Chromium de escritorio (1440×900) y móvil (Pixel 7). Cubren guardar y ver la inspección al recargar, validaciones del formulario, filtros y tarjetas, estados de error, accesibilidad con axe y ausencia de scroll horizontal en móvil. Cada prueba crea sus datos con el lote `E2E-<corrida>-<n>` y al final borra solo esos.

## Reto de lógica

| Porcentaje de defectuosas | Resultado         |
| ------------------------- | ----------------- |
| ≤ 5%                      | Aprobado          |
| > 5% y ≤ 10%              | Con observaciones |
| > 10%                     | Rechazado         |

**Se clasifica sin redondear y comparando enteros.** En lugar de `defectuosas / revisadas * 100 <= 5` se evalúa `defectuosas * 100 <= revisadas * 5`: dividir introduce errores de punto flotante (`7 / 100 * 100` da `7.000000000000001`). Los límites son constantes en `src/domain/clasificacion.ts`.

**Porcentaje global = total de defectuosas ÷ total de revisadas × 100.** Prueba con 100/0 y 10/2: 2 ÷ 110 × 100 = **1.82%**.

Promediar los porcentajes daría (0% + 20%) ÷ 2 = 10%, porque el promedio le da el mismo peso a una inspección de 10 piezas que a una de 100. El global hace que cada pieza cuente igual.

**Lista vacía:** sin piezas revisadas no hay porcentaje; la tarjeta muestra "Sin datos".

## Decisiones de UX y estados

- **Formulario fijo junto a la tabla:** en escritorio se queda visible al desplazar el registro.
- **Vista previa con medidor:** muestra el porcentaje y el resultado antes de guardar, ubicados en las zonas de 5% y 10%.
- **Errores por campo:** aparecen debajo de cada campo al salir de él o al guardar, y el foco va al primero.
- **Captura rápida:** al guardar se conservan producto y fecha y el foco vuelve al lote.
- **Filtros en la URL:** sobreviven a recargar y se pueden compartir.
- **Tabla y tarjetas de la misma respuesta:** la API regresa la lista filtrada y su resumen juntos, así nunca se contradicen.
- **Adaptación a móvil:** de 320 a 1920 px sin scroll horizontal; la tabla se compacta y en pantallas angostas pasa a tarjetas.

| Estado       | Cómo se resuelve                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Carga        | Esqueleto con la misma forma que la tabla y las tarjetas; al cambiar de filtro, los datos previos se atenúan.                 |
| Error        | "No se pudieron cargar las inspecciones" con botón Reintentar; si falla el guardado, un aviso conserva lo capturado.          |
| Confirmación | Aviso "Inspección guardada" y la fila nueva se resalta; si los filtros la ocultan, el aviso lo dice.                          |
| Vacío        | Sin inspecciones invita a registrar la primera; sin coincidencias ofrece Limpiar filtros y las tarjetas muestran "Sin datos". |

## Deploy

- **Vercel conectado a GitHub:** cada push a `main` despliega a producción y cada PR genera un preview.
- **Neon con dos ramas:** `production` para la demo y `desarrollo` para local y previews.
- **Variables por ambiente en Vercel:** `DATABASE_URL` de Production apunta a la rama `production`; la de Preview y Development, a `desarrollo`.
- **Migrar producción:** Vercel no corre migraciones. Antes de integrar un cambio de esquema:

  ```bash
  DATABASE_URL="<url de production>" npm run db:migrate
  ```

## Uso de inteligencia artificial

Este proyecto se desarrolló con asistencia de IA, de forma declarada y verificada.

**Herramientas:**

- **Claude** (aplicación de Claude): análisis del requerimiento, plan de trabajo, decisiones de diseño y revisión de cada entrega.
- **Claude Code** (extensión de VS Code): escritura de código, pruebas, capturas y pull requests.

| Etapa                         | Qué hizo la IA                                                                                  | Qué hice yo                                                                                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Análisis y plan               | Desglosó el requerimiento y propuso un plan por fases y una arquitectura por capas              | Validé el entendimiento del producto y aprobé el plan y el alcance de cada fase                                                                                                     |
| Lógica de dominio             | Escribió la clasificación, el porcentaje global y sus pruebas a partir de las reglas del examen | Revisé cada regla y verifiqué los casos obligatorios                                                                                                                                |
| Base de datos, API y pantalla | Generó el código a partir de requisitos detallados                                              | Aprobé las decisiones de diseño; cada entrega pasó por revisión antes de mi aprobación                                                                                              |
| Infraestructura               | Me guio paso a paso                                                                             | Creé y configuré el repositorio, la base en Neon (producción y desarrollo), el deploy en Vercel y la protección de `main`                                                           |
| QA                            | Generó las pruebas automáticas y las capturas                                                   | Hice QA manual en producción y en un iPhone; encontré tres problemas (fecha desbordada en iOS, etiquetas de filtros confusas y un botón desalineado) que se corrigieron en el PR #1 |
| Documentación                 | Redactó los borradores                                                                          | Revisé y ajusté el contenido                                                                                                                                                        |

**Qué se ajustó en el camino:**

- Al revisar capturas reales: la tabla dejó de convertirse en tarjetas en laptops, se equilibraron las tarjetas de resumen y se nombraron las zonas del medidor.
- Después del deploy: se separó la base de desarrollo de la de producción para no ensuciar la demo.
- El CI detectó que la instalación dependía de una configuración de mi máquina, y se corrigió.

**Cómo se verificó:**

- 61 pruebas unitarias y 37 de punta a punta que corren en cada cambio contra una base temporal.
- Se comprobó que las pruebas fallan si se rompe el código a propósito.
- QA manual en producción y en iPhone.
- Revisión de cada PR en su ambiente de preview antes de integrarlo.

**Trazabilidad:** los commits asistidos llevan la línea `Co-Authored-By: Claude`.

## Decisiones y pendientes

### Decisiones técnicas

- **Resultado calculado al leer:** no se guarda en la base; cambiar un límite reclasifica todo el historial.
- **Validación en tres capas:** formulario, API (el mismo esquema Zod) y `CHECK` de PostgreSQL.
- **Neon:** su plan gratuito no pausa ni borra la base, así que la demo siempre está disponible.
- **Ambientes separados:** producción tiene su propia base; desarrollo, previews y pruebas usan otra.
- **CI con E2E y `main` protegida:** cada PR corre lint, formato, tipos, unitarias, build y E2E contra un PostgreSQL temporal; `main` solo acepta PR con esos checks en verde.

### Supuestos de negocio

| Punto no definido en el requerimiento                    | Decisión tomada                                                       | ¿Confirmar con negocio?  |
| -------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------ |
| ¿Se permiten fechas futuras?                             | No: se valida hasta el día de hoy en hora de México                   | Sí                       |
| ¿Un lote puede inspeccionarse más de una vez?            | Sí, se permiten reinspecciones                                        | Sí                       |
| ¿El lote tiene un formato fijo?                          | Texto libre, máximo 50 caracteres, sin espacios al inicio ni al final | Sí                       |
| ¿"Más reciente" es por fecha de inspección o de captura? | Por fecha de inspección; si empatan, la última capturada              | Sí                       |
| ¿Cuántos decimales se muestran?                          | 2 en pantalla; el cálculo nunca redondea                              | No, es técnico           |
| ¿Quién define los límites de 5% y 10%?                   | Viven en un solo lugar del código (src/domain)                        | Sí, son regla de negocio |

### Pendientes

- **Volumen:** el listado carga todas las inspecciones; con miles de registros habría que paginar.
- **Arranque en frío de Neon:** la primera carga tras un rato sin uso tarda un poco más.
- **Firefox sin probar:** se probó en Chrome y en Safari de iPhone.
