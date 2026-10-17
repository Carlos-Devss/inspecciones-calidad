@AGENTS.md

# Inspecciones de calidad — prueba técnica
Pantalla para registrar inspecciones de calidad (producto, lote, fecha, unidades revisadas, unidades defectuosas) con tabla, filtros y totales. Next.js (App Router) + TypeScript + PostgreSQL (driver `pg`, SQL plano, sin ORM) + Zod + Vitest. Interfaz en español.

## Reglas
- La lógica de clasificación (`src/lib/inspeccion.ts`) y sus pruebas las escribe Carlos a mano. No las crees ni las modifiques salvo que él lo pida explícitamente.
- Commits pequeños, uno por cambio lógico, en español con prefijo convencional (feat, fix, chore, docs, test). Nunca squash, amend ni force push.
- No toques la configuración de git (user.name, user.email, remotes).
- Nunca subas secretos: solo `.env.example`.
- Edición, borrado, autenticación e integración con otros módulos están fuera de alcance.
