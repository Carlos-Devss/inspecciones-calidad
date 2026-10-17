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

## Reglas de trabajo
- El código se escribe con asistencia de IA; Carlos revisa y aprueba cada paso. No modifiques `src/domain/` salvo que él lo pida explícitamente.
- Commits pequeños, uno por cambio lógico, en español con prefijo convencional (feat, fix, chore, docs, test, refactor). Nunca squash, amend ni force push.
- No toques la configuración de git (user.name, user.email, remotes).
- Nunca subas secretos: solo `.env.example`.
- Fuera de alcance: edición, borrado, autenticación e integración con otros módulos.
