import { esIdioma } from "@/lib/idioma";
import { buscarVuelos } from "@/lib/vuelos-reales";

export const runtime = "nodejs";
// La búsqueda profunda en Google Flights y la verificación tardan: hasta un minuto.
export const maxDuration = 60;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const IATA = /^[A-Z]{3}$/;

/** Vuelos reales para el viaje. POST { origen, destino, regreso, ida, vuelta, clase, aerolinea, equipaje, idioma } */
export async function POST(req: Request) {
  const c = await req.json().catch(() => null);
  const valido =
    c &&
    [c.origen, c.destino, c.regreso].every((x) => typeof x === "string" && IATA.test(x)) &&
    [c.ida, c.vuelta].every((x) => typeof x === "string" && FECHA.test(x)) &&
    ["economica", "premium", "business"].includes(c.clase) &&
    ["mano", "valija"].includes(c.equipaje) &&
    typeof c.aerolinea === "string" &&
    c.aerolinea.length <= 60;
  if (!valido) return Response.json({ error: "pedido inválido" }, { status: 400 });
  const resultado = await buscarVuelos({
    origen: c.origen,
    destino: c.destino,
    regreso: c.regreso,
    ida: c.ida,
    vuelta: c.vuelta,
    clase: c.clase,
    aerolinea: c.aerolinea,
    equipaje: c.equipaje,
    idioma: esIdioma(c.idioma) ? c.idioma : "es",
  });
  return Response.json(resultado, { headers: { "Cache-Control": "no-store" } });
}
