import { climaReal } from "@/lib/clima-real";

export const runtime = "nodejs";
export const maxDuration = 30;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const IATA = /^[A-Z]{3}$/;

/** Clima real de cada ciudad del viaje: POST { lugares: [{ iata, fechas }] }. */
export async function POST(req: Request) {
  const cuerpo = await req.json().catch(() => null);
  const lugares = (cuerpo?.lugares ?? []) as { iata?: unknown; fechas?: unknown }[];
  const validos =
    Array.isArray(lugares) &&
    lugares.length > 0 &&
    lugares.length <= 5 &&
    lugares.every(
      (l) =>
        typeof l.iata === "string" &&
        IATA.test(l.iata) &&
        Array.isArray(l.fechas) &&
        l.fechas.length > 0 &&
        l.fechas.length <= 61 &&
        l.fechas.every((f) => typeof f === "string" && FECHA.test(f)),
    );
  if (!validos) return Response.json({ error: "pedido inválido" }, { status: 400 });
  const datos = await climaReal(lugares as { iata: string; fechas: string[] }[]);
  return Response.json(datos, { headers: { "Cache-Control": "no-store" } });
}
