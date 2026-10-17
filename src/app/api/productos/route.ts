import { connection } from "next/server";
import { respuestaErrorInterno } from "@/server/respuestas";
import { listarProductos } from "@/server/inspecciones.repository";

export async function GET() {
  // Espera una petición real: sin esto Next podría generar la respuesta
  // una sola vez al compilar y servir siempre esos mismos datos.
  await connection();
  try {
    const productos = await listarProductos();
    return Response.json({ productos });
  } catch (error) {
    return respuestaErrorInterno(error);
  }
}
