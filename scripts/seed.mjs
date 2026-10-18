// Inserta los datos de demostración de db/seeds/ solo si la tabla
// inspecciones está vacía, para no duplicarlos si se corre dos veces.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const carpeta = path.join(import.meta.dirname, "..", "db", "seeds");

if (!process.env.DATABASE_URL) {
  console.error("Falta la variable DATABASE_URL (revisa .env.local).");
  process.exit(1);
}

const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL });
await cliente.connect();

try {
  const { rows } = await cliente.query("SELECT count(*)::int AS total FROM inspecciones");
  if (rows[0].total > 0) {
    console.log(`La tabla inspecciones ya tiene ${rows[0].total} registros; no se insertó nada.`);
  } else {
    const archivos = (await readdir(carpeta)).filter((archivo) => archivo.endsWith(".sql")).sort();

    // Todos los seeds en una sola transacción: si uno falla, no queda nada a medias.
    try {
      await cliente.query("BEGIN");
      for (const archivo of archivos) {
        const sql = await readFile(path.join(carpeta, archivo), "utf8");
        const resultado = await cliente.query(sql);
        console.log(`Insertado: ${archivo} (${resultado.rowCount} filas)`);
      }
      await cliente.query("COMMIT");
    } catch (error) {
      await cliente.query("ROLLBACK");
      console.error(`Error al insertar datos de demostración: ${error.message}`);
      process.exitCode = 1;
    }
  }
} finally {
  await cliente.end();
}
