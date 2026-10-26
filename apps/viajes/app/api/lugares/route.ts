import { NextResponse } from "next/server";
import { buscarLugares } from "@/lib/lugares";

// Búsqueda de ciudades con sus aeropuertos cercanos para el paso 1 del asistente.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 60) ?? "";
  return NextResponse.json(
    { lugares: buscarLugares(q) },
    { headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" } },
  );
}
