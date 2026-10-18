// Aplica en orden las migraciones de db/migrations/ que aún no estén registradas
// en schema_migrations. Cada migración corre en su propia transacción.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const carpeta = path.join(import.meta.dirname, "..", "db", "migrations");

if (!process.env.DATABASE_URL) {
  console.error("Falta la variable DATABASE_URL (revisa .env.local).");
  process.exit(1);
}

const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL });
await cliente.connect();

try {
  await cliente.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nombre TEXT PRIMARY KEY,
      aplicada_en TIMESTAMPTZ DEFAULT now()
    )
  `);

  const { rows } = await cliente.query("SELECT nombre FROM schema_migrations");
  const aplicadas = new Set(rows.map((fila) => fila.nombre));

  // El prefijo numérico (001_, 002_...) hace que el orden alfabético sea el correcto.
  const archivos = (await readdir(carpeta)).filter((archivo) => archivo.endsWith(".sql")).sort();

  for (const archivo of archivos) {
    if (aplicadas.has(archivo)) {
      console.log(`Omitida (ya aplicada): ${archivo}`);
      continue;
    }

    const sql = await readFile(path.join(carpeta, archivo), "utf8");
    // La migración y su registro van en la misma transacción: o queda todo o nada.
    try {
      await cliente.query("BEGIN");
      await cliente.query(sql);
      await cliente.query("INSERT INTO schema_migrations (nombre) VALUES ($1)", [archivo]);
      await cliente.query("COMMIT");
      console.log(`Aplicada: ${archivo}`);
    } catch (error) {
      await cliente.query("ROLLBACK");
      console.error(`Error en ${archivo}: ${error.message}`);
      process.exitCode = 1;
      break;
    }
  }
} finally {
  await cliente.end();
}
