// Si algún componente de cliente importa este archivo, el build falla:
// así la conexión y DATABASE_URL nunca llegan al navegador.
import "server-only";
import { Pool, types } from "pg";

// Por defecto pg convierte DATE a un Date de JavaScript a medianoche en la
// zona horaria del servidor. Al serializarlo a UTC, "2026-10-16" puede verse
// como "2026-10-15" en México. Una fecha de inspección es un día del
// calendario, no un instante, así que la dejamos como texto YYYY-MM-DD.
const OID_DATE = 1082;
types.setTypeParser(OID_DATE, (valor) => valor);

// En desarrollo, el recargado en caliente vuelve a ejecutar este módulo en
// cada cambio. Guardar el pool en globalThis evita abrir un pool nuevo
// (y nuevas conexiones) cada vez.
const globalConPool = globalThis as typeof globalThis & {
  poolInspecciones?: Pool;
};

// Se crea al primer uso y no al importar, para que el build no exija
// DATABASE_URL si ninguna página consulta la BD durante la compilación.
export function obtenerPool(): Pool {
  if (!globalConPool.poolInspecciones) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "Falta la variable de entorno DATABASE_URL. Cópiala de .env.example a .env.local.",
      );
    }
    globalConPool.poolInspecciones = new Pool({ connectionString });
  }
  return globalConPool.poolInspecciones;
}
