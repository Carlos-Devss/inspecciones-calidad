# Inspecciones de calidad

Documentación principal del proyecto, para evaluadores y desarrolladores: pantalla web para registrar inspecciones de calidad por producto y lote, con clasificación automática, filtros y totales.

[![CI](https://github.com/Carlos-Devss/inspecciones-calidad/actions/workflows/ci.yml/badge.svg)](https://github.com/Carlos-Devss/inspecciones-calidad/actions/workflows/ci.yml)

**Demo:** [inspecciones-calidad.vercel.app](https://inspecciones-calidad.vercel.app)

![Pantalla de inspecciones en escritorio a 1440 px](docs/capturas/01-escritorio-1440.png)

## Índice

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Requisitos](#requisitos)
- [Instalación local](#instalación-local)
- [Variables de entorno](#variables-de-entorno)
- [Migraciones y datos](#migraciones-y-datos)
- [Scripts](#scripts)
- [Pruebas](#pruebas)
- [Reto de lógica](#reto-de-lógica)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Deploy](#deploy)
- [Flujo de trabajo](#flujo-de-trabajo)
- [Uso de inteligencia artificial](#uso-de-inteligencia-artificial)
- [Supuestos de negocio](#supuestos-de-negocio)
- [Documentación](#documentación)

## Funcionalidades

- Registro de inspecciones: producto del catálogo, lote, fecha, unidades revisadas y unidades defectuosas.
- Vista previa del porcentaje y del resultado mientras se captura, con un medidor de tolerancia.
- Validación en tres capas: formulario, API y restricciones `CHECK` de PostgreSQL.
- Registro de inspecciones de la más reciente a la más antigua, con filtros por producto y por resultado que se conservan en la URL.
- Tarjetas de resumen (inspecciones, unidades revisadas y porcentaje global) calculadas sobre la misma lista filtrada.
- Estados de carga, error con reintento, vacío y confirmación de guardado.
- Diseño adaptable de 320 a 1920 px sin scroll horizontal; la tabla pasa a tarjetas en pantallas angostas.

**Fuera de alcance:** edición y borrado de inspecciones, autenticación e integración con otros módulos.

## Stack

| Capa              | Tecnología                                               | Versión           |
| ----------------- | -------------------------------------------------------- | ----------------- |
| Framework         | Next.js (App Router)                                     | 16.4.2            |
| UI                | React y React DOM                                        | 19.3.0            |
| Lenguaje          | TypeScript                                               | ^5                |
| Estilos           | Tailwind CSS                                             | ^4                |
| Iconos            | lucide-react                                             | ^1.58.0           |
| Validación        | Zod                                                      | ^4.6.7            |
| Base de datos     | PostgreSQL con el driver `pg` (SQL plano, sin ORM)       | pg ^8.23.1        |
| Pruebas unitarias | Vitest                                                   | ^4.1.12           |
| Pruebas E2E       | Playwright y @axe-core/playwright                        | ^1.64.1 / ^4.13.0 |
| Calidad           | ESLint (eslint-config-next) y Prettier                   | ^9 / ^3.9.10      |
| Infraestructura   | Vercel (hosting), Neon (PostgreSQL), GitHub Actions (CI) | —                 |

## Requisitos

- **Node.js 20.19 o superior** (`engines` en `package.json`; CI usa la versión de `.nvmrc`, 22). Los scripts de base de datos usan `--env-file-if-exists`, disponible desde Node 20.19.
- **npm** (incluido con Node).
- **PostgreSQL 14 o superior**, en Neon o local.

## Instalación local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Carlos-Devss/inspecciones-calidad.git
   cd inspecciones-calidad
   ```
2. Instala las dependencias exactas del lockfile:
   ```bash
   npm ci
   ```
3. Crea `.env.local` a partir del ejemplo y escribe tu cadena de conexión:
   ```bash
   cp .env.example .env.local
   ```
4. Crea las tablas y el catálogo de productos:
   ```bash
   npm run db:migrate
   ```
5. Carga los datos de demostración (opcional):
   ```bash
   npm run db:seed
   ```
6. Inicia el servidor de desarrollo y abre [http://localhost:3000](http://localhost:3000):
   ```bash
   npm run dev
   ```

## Variables de entorno

| Variable       | Uso                                            | Ejemplo                                                                    |
| -------------- | ---------------------------------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL` | Conexión a PostgreSQL de la app y los scripts. | `postgresql://usuario:password@host:5432/inspecciones?sslmode=verify-full` |

**Por qué `sslmode=verify-full`:** cifra la conexión y además verifica el certificado y el nombre del servidor, lo que evita un intermediario. Con `require`, `pg` 8 advierte que en la versión 9 dejará de verificar el certificado.

Solo `.env.example` está en el repositorio; `.env.local` está en `.gitignore`. En una base local sin TLS, usa una cadena sin `sslmode`.

## Migraciones y datos

- **`db/migrations/`** contiene SQL numerado (`001_crear_tablas.sql`, `002_catalogo_productos.sql`). `npm run db:migrate` aplica en orden las pendientes, cada una en su transacción, y las registra en la tabla `schema_migrations`.
- **El catálogo de productos es una migración** y no un seed: la app no funciona sin él, así que debe existir en todos los ambientes, incluida producción.
- **`db/seeds/`** tiene 10 inspecciones de demostración que cubren los tres resultados y los bordes exactos de 5% y 10%. `npm run db:seed` es idempotente: solo inserta si la tabla `inspecciones` está vacía.

## Scripts

| Script                 | Qué hace                                                                  |
| ---------------------- | ------------------------------------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo de Next.js.                                        |
| `npm run build`        | Compilación de producción.                                                |
| `npm run start`        | Sirve la compilación de producción.                                       |
| `npm run lint`         | ESLint.                                                                   |
| `npm run format`       | Aplica Prettier a todo el repositorio.                                    |
| `npm run format:check` | Verifica el formato sin modificar archivos (lo corre CI).                 |
| `npm run typecheck`    | `next typegen && tsc --noEmit`: genera los tipos de rutas y revisa tipos. |
| `npm test`             | Pruebas unitarias con Vitest.                                             |
| `npm run test:e2e`     | Pruebas de punta a punta con Playwright contra la app compilada.          |
| `npm run db:migrate`   | Aplica las migraciones pendientes de `db/migrations/`.                    |
| `npm run db:seed`      | Inserta los datos de demostración si la tabla de inspecciones está vacía. |

## Pruebas

### Unitarias (Vitest)

**61 pruebas en 6 archivos**, cada una junto al archivo que prueba. No necesitan base de datos.

| Archivo                                     | Pruebas | Qué cubre                                           |
| ------------------------------------------- | ------: | --------------------------------------------------- |
| `src/domain/clasificacion.test.ts`          |      17 | Reglas de clasificación y validación de cantidades  |
| `src/domain/resumen.test.ts`                |       2 | Porcentaje global y lista vacía                     |
| `src/shared/inspeccion.schema.test.ts`      |      24 | Esquema compartido de formulario y API              |
| `src/server/inspecciones.service.test.ts`   |       7 | Filtro por resultado y resumen sobre la misma lista |
| `src/features/inspecciones/formato.test.ts` |       9 | Formato de fechas, cifras y porcentajes             |
| `src/app/api/inspecciones/route.test.ts`    |       2 | Respuesta 500 sin detalles internos                 |

```bash
npm test
```

### De punta a punta (Playwright)

**20 escenarios** en 6 archivos de `e2e/`, uno por criterio: criterio de aceptación, validaciones, filtros y tarjetas, estados de error, accesibilidad con axe y móvil.

Corren en dos proyectos: escritorio (Chromium 1440×900) y móvil (Pixel 7). Son 40 ejecuciones; las 3 de móvil se omiten en escritorio, así que **37 se ejecutan y pasan en cada corrida de CI**.

**Aislamiento:** todo lo que crea una prueba lleva el lote `E2E-<marca de la corrida>-<n>`, y al terminar `e2e/global-teardown.ts` borra solo los lotes de esa corrida. Las pruebas no suponen totales fijos: comparan contra la API o contra lo que muestra la pantalla.

```bash
npx playwright install chromium   # solo la primera vez
npm run test:e2e                  # compila, levanta en el puerto 3100 y prueba
```

Usan la base de `DATABASE_URL` (en local, la de `.env.local`). En CI corren contra un PostgreSQL 16 temporal.

## Reto de lógica

### Reglas de clasificación

| Porcentaje de unidades defectuosas | Resultado         |
| ---------------------------------- | ----------------- |
| ≤ 5%                               | Aprobado          |
| > 5% y ≤ 10%                       | Con observaciones |
| > 10%                              | Rechazado         |

**Dónde viven:** los límites son las constantes `LIMITE_APROBADO = 5` y `LIMITE_OBSERVACIONES = 10` en [`src/domain/clasificacion.ts`](src/domain/clasificacion.ts). La clasificación se calcula al leer, así que cambiar un límite reclasifica todo el historial.

**Por qué se compara con enteros:** en vez de `defectuosas / revisadas * 100 <= 5` se evalúa `defectuosas * 100 <= revisadas * 5`. Dividir introduce errores de punto flotante: `7 / 100 * 100` da `7.000000000000001`, y un caso justo en el límite podría caer del lado equivocado.

### Pruebas obligatorias

| Revisadas | Defectuosas | Porcentaje | Resultado esperado | Resultado obtenido  |
| --------: | ----------: | ---------: | ------------------ | ------------------- |
|        20 |           1 |      5.00% | Aprobado           | ✓ Aprobado          |
|        19 |           1 |      5.26% | Con observaciones  | ✓ Con observaciones |
|        10 |           1 |     10.00% | Con observaciones  | ✓ Con observaciones |
|         9 |           1 |     11.11% | Rechazado          | ✓ Rechazado         |

### Porcentaje global

**Porcentaje global = total de unidades defectuosas ÷ total de unidades revisadas × 100.** Se calcula en [`src/domain/resumen.ts`](src/domain/resumen.ts) sobre la misma lista filtrada que muestra la tabla.

Prueba con dos inspecciones, 100 revisadas con 0 defectuosas y 10 revisadas con 2 defectuosas:

| Método                            | Cálculo        | Resultado |
| --------------------------------- | -------------- | --------: |
| Global (el que se usa)            | 2 ÷ 110 × 100  |     1.82% |
| Promedio de porcentajes (no usar) | (0% + 20%) ÷ 2 |       10% |

El promedio le da el mismo peso a una inspección de 10 piezas que a una de 100; el global hace que cada pieza cuente igual.

**Lista vacía:** sin unidades revisadas no hay porcentaje que calcular; la función regresa `null` y la tarjeta muestra "Sin datos".

## Estructura del proyecto

```text
.
├── .github/              CI y plantilla de pull request
├── db/
│   ├── migrations/       SQL numerado: tablas y catálogo de productos
│   └── seeds/            Datos de demostración
├── docs/                 Informe, manual, arquitectura y capturas
├── e2e/                  Pruebas de Playwright y sus utilidades
├── scripts/              migrate.mjs y seed.mjs
└── src/
    ├── app/              Rutas: page.tsx compone la pantalla; api/ es el backend HTTP
    ├── components/ui/    Componentes visuales reutilizables, sin lógica de negocio
    ├── domain/           Lógica de negocio pura: clasificación y resumen
    ├── features/
    │   └── inspecciones/ Componentes y hooks de la pantalla
    ├── server/           Solo servidor: pool, repositorio, servicio y respuestas de error
    └── shared/           Esquemas Zod y tipos que usan cliente y servidor
```

**Convención de nombres:** las carpetas técnicas van en inglés por convención de Next.js (`app`, `components`, `server`); el dominio va en español, el idioma del negocio (`clasificacion.ts`, `inspecciones.service.ts`).

## Deploy

| Ambiente   | Origen                  | Hosting           | Base de datos           |
| ---------- | ----------------------- | ----------------- | ----------------------- |
| Producción | `main`                  | Vercel production | Neon, rama `production` |
| Preview    | Cada pull request       | Vercel preview    | Neon, rama `desarrollo` |
| Desarrollo | Máquina local           | `npm run dev`     | Neon, rama `desarrollo` |
| CI         | Cada PR y push a `main` | GitHub Actions    | PostgreSQL 16 temporal  |

**Variables por ambiente:** en Vercel, `DATABASE_URL` de Production apunta a la rama `production` de Neon, y la de Preview y Development a la rama `desarrollo`. Así la demo no se ensucia con datos de prueba.

**Migrar producción:** Vercel no corre migraciones. Antes de integrar un cambio de esquema, aplica la migración a producción:

```bash
DATABASE_URL="<url de production>" npm run db:migrate
```

Como cada migración se registra en `schema_migrations`, correrla de nuevo no repite las ya aplicadas.

## Flujo de trabajo

1. Cada cambio va en una rama (`feat/`, `fix/`, `docs/`, `test/`, `chore/`…) con commits pequeños y prefijo convencional.
2. Se abre un pull request hacia `main` con la [plantilla](.github/pull_request_template.md): qué cambia, por qué, cómo se probó y la lista de verificación.
3. CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) corre dos jobs:
   - **Verificar:** lint, formato, tipos, pruebas unitarias y build.
   - **E2E:** PostgreSQL 16 temporal, migraciones, seed y Playwright; si falla, sube el reporte como artefacto.
4. Se revisa el preview de Vercel y se integra con merge commit.

**`main` protegida** (ruleset "Proteger main"): solo se integra por pull request, los checks Verificar y E2E son obligatorios, no se permite force push ni borrar la rama, y el único método de merge es merge commit.

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

## Supuestos de negocio

| Punto no definido en el requerimiento                    | Decisión tomada                                                       | ¿Confirmar con negocio?  |
| -------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------ |
| ¿Se permiten fechas futuras?                             | No: se valida hasta el día de hoy en hora de México                   | Sí                       |
| ¿Un lote puede inspeccionarse más de una vez?            | Sí, se permiten reinspecciones                                        | Sí                       |
| ¿El lote tiene un formato fijo?                          | Texto libre, máximo 50 caracteres, sin espacios al inicio ni al final | Sí                       |
| ¿"Más reciente" es por fecha de inspección o de captura? | Por fecha de inspección; si empatan, la última capturada              | Sí                       |
| ¿Cuántos decimales se muestran?                          | 2 en pantalla; el cálculo nunca redondea                              | No, es técnico           |
| ¿Quién define los límites de 5% y 10%?                   | Viven en un solo lugar del código (src/domain)                        | Sí, son regla de negocio |

## Documentación

| Documento                                        | Para quién                       |
| ------------------------------------------------ | -------------------------------- |
| [Informe de entrega](docs/informe-de-entrega.md) | Responsables y evaluadores       |
| [Manual de usuario](docs/manual-de-usuario.md)   | Inspectores y supervisores       |
| [Arquitectura](docs/arquitectura.md)             | Equipo técnico                   |
| [Índice de la documentación](docs/README.md)     | Todos                            |
| [Capturas](docs/capturas/)                       | Referencia visual de la pantalla |
