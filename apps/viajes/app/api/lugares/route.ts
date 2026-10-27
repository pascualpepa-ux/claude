import { NextResponse } from "next/server";
import { buscarLugares } from "@/lib/lugares";

// Búsqueda de ciudades (y países, para el destino) con sus aeropuertos cercanos, para el paso 1 del asistente.
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const q = params.get("q")?.slice(0, 60) ?? "";
  // tipo=destino también devuelve países (se puede viajar a un país y que la web sugiera las ciudades).
  return NextResponse.json(
    { lugares: buscarLugares(q, 6, params.get("tipo") === "destino") },
    { headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } },
  );
}
