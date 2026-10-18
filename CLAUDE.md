@AGENTS.md

# Inspecciones de calidad — prueba técnica

Pantalla para registrar inspecciones de calidad (producto, lote, fecha, unidades revisadas, unidades defectuosas) con tabla, filtros y tarjetas de resumen. Next.js (App Router) + TypeScript + PostgreSQL (driver `pg`, SQL plano, sin ORM) + Zod + Vitest + Tailwind. Interfaz en español.

## Arquitectura (respetarla siempre)

- `src/app/` — rutas. `page.tsx` solo compone la pantalla; `api/*/route.ts` son el backend HTTP. Sin lógica de negocio aquí.
- `src/domain/` — lógica de negocio pura (clasificación y resumen). Sin React, sin BD, sin Next. Cada archivo con su `.test.ts` al lado.
- `src/server/` — solo servidor (`import "server-only"`):
  - `db.ts` — pool de `pg` (`obtenerPool()`).
  - `*.repository.ts` — SQL parametrizado (nunca concatenar valores en SQL); traduce snake_case → camelCase.
  - `*.service.ts` — orquesta repositorio + dominio: clasifica al leer, filtra por resultado y calcula el resumen sobre la misma lista. Lanza `ErrorDeValidacion` para errores de datos.
  - `respuestas.ts` — arma las respuestas de error de la API.
- `src/shared/` — esquemas Zod y tipos que usan cliente y servidor. Un solo esquema valida el formulario y la API.

## Contrato de la API

- `GET /api/productos` → 200 `{ productos }`.
- `GET /api/inspecciones?producto=P001&resultado=Rechazado` (ambos opcionales) → 200 `{ inspecciones, resumen }`.
- `POST /api/inspecciones` → 201 `{ inspeccion }`.
- Cada inspección: id, productoCodigo, productoNombre, lote, fecha, unidadesRevisadas, unidadesDefectuosas, porcentaje (sin redondear), resultado, creadoEn.
- Errores:
  - 400 `{ error: "VALIDACION", campos: { campo: "mensaje" } }` para datos inválidos, query inválida, producto inexistente o JSON roto (este último en `campos.general`).
  - 500 `{ error: "ERROR_INTERNO", mensaje }` con mensaje genérico; el detalle solo va al log del servidor.
- Los GET llaman `await connection()` para no cachearse (con `cacheComponents` no existe `export const dynamic`).
- `src/features/inspecciones/` — componentes y hooks de la pantalla.
- `src/components/ui/` — componentes visuales reutilizables sin lógica de negocio.
- `db/` — SQL numerado. `db/migrations/` tiene las migraciones (incluye el catálogo de productos); `npm run db:migrate` (`scripts/migrate.mjs`) aplica en orden las pendientes y las registra en `schema_migrations`. `db/seeds/` tiene datos de demostración; `npm run db:seed` (`scripts/seed.mjs`) los inserta solo si `inspecciones` está vacía.

## Decisiones

- El resultado y los porcentajes NO se guardan en la BD: se calculan al leer con `src/domain/`. Así un cambio de límite reclasifica todo.
- La API de listado regresa la lista filtrada y su resumen en la misma respuesta, para que tabla y tarjetas siempre coincidan.
- Los límites de clasificación viven en constantes en `src/domain/clasificacion.ts`.

## Diseño

- El color solo significa resultado: toda la interfaz es neutra (incluidos errores, banners y toast); el color vive solo en `ResultadoSello` y en los tramos del medidor, siempre con icono y texto.
- Tokens en `@theme` de `globals.css` (los colores de Tailwind están borrados): acero, lamina, grafito, niebla, borde y aprobado/observaciones/rechazado con su `-fondo`. Nada de colores sueltos; contorno de controles = `niebla/75` (3:1).
- Tipografía: IBM Plex Sans 400/500/600; título 24/600, panel 16/600, cuerpo 14–15/400, etiquetas 13/500 (`text-etiqueta`). Cifras con `tabular-nums` (global en `body`). Sin mayúsculas sostenidas ni monoespaciada.
- Forma: bordes de 1px, `rounded-control` (6px) y `rounded-panel` (10px), sin sombras salvo el toast; espaciado en múltiplos de 4; foco = anillo grafito de 2px con separación.
- Movimiento solo como respuesta a una acción (medidor, color del sello, toast, fila nueva, opacidad al filtrar), 200 ms; nada se anima al cargar. Con `prefers-reduced-motion` todo es instantáneo.
- Sin scroll horizontal de 320 a 1920px: la lista cambia de tabla a tarjetas por ancho del contenedor, no del viewport. Áreas táctiles ≥40px en móvil.

## Scripts

- `npm run lint`, `npm test`, `npm run build` — lint, pruebas (Vitest) y build.
- `npm run format` aplica Prettier; `npm run format:check` solo verifica (lo corre CI).
- `npm run typecheck` — `next typegen && tsc --noEmit` (genera los tipos de rutas de Next, como `LayoutProps`, antes de revisar).
- CI (`.github/workflows/ci.yml`) corre en cada PR hacia `main` y en push a `main`: lint, format:check, typecheck, test y build. Node sale de `.nvmrc`.

## Reglas de trabajo

- El código se escribe con asistencia de IA; Carlos revisa y aprueba cada paso. No modifiques `src/domain/` salvo que él lo pida explícitamente.
- Todo cambio va en una rama con Pull Request y CI en verde; nunca push directo a main.
- Commits pequeños, uno por cambio lógico, en español con prefijo convencional (feat, fix, chore, docs, test, refactor, style, ci). Nunca squash, amend ni force push.
- No toques la configuración de git (user.name, user.email, remotes).
- Nunca subas secretos: solo `.env.example`.
- Fuera de alcance: edición, borrado, autenticación e integración con otros módulos.
