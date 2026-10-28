import { esIdioma } from "@/lib/idioma";
import { aerolineasParaRuta } from "@/lib/aerolineas-pais";
import { buscarHorarios } from "@/lib/horarios-reales";
import { coordenadasAeropuerto } from "@/lib/lugares";
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
  const pedido = {
    origen: c.origen,
    destino: c.destino,
    regreso: c.regreso,
    ida: c.ida,
    vuelta: c.vuelta,
    clase: c.clase,
    aerolinea: c.aerolinea,
    equipaje: c.equipaje,
    idioma: esIdioma(c.idioma) ? (c.idioma as "es" | "en") : ("es" as const),
  };
  let resultado = await buscarVuelos(pedido);
  // Sin precios reales (sin clave o sin cupo de Google Flights): vuelos con número y horario reales y precio estimado.
  if (resultado.estado !== "ok") {
    const horarios = await buscarHorarios(pedido);
    if (horarios?.length) resultado = { estado: "ok", vuelos: horarios };
  }
  if (resultado.estado !== "ok") {
    // Sin vuelos reales: con qué aerolíneas buscar la ruta (la preferida y las principales de cada país).
    const aerolineas = aerolineasParaRuta(coordenadasAeropuerto(pedido.origen)?.pais, coordenadasAeropuerto(pedido.destino)?.pais, pedido.aerolinea);
    return Response.json({ ...resultado, aerolineas }, { headers: { "Cache-Control": "no-store" } });
  }
  return Response.json(resultado, { headers: { "Cache-Control": "no-store" } });
}
