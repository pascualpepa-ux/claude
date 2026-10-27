import { buscarHoteles } from "@/lib/hoteles-reales";
import { esIdioma } from "@/lib/idioma";

export const runtime = "nodejs";
export const maxDuration = 60;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const IATA = /^[A-Z]{3}$/;

/** Hoteles reales por ciudad. POST { ciudades: [{ clave, ciudad, iata, entrada, salida }], viajeros, tipo, preferido, idioma } */
export async function POST(req: Request) {
  const c = await req.json().catch(() => null);
  const ciudades = c?.ciudades;
  const valido =
    Array.isArray(ciudades) &&
    ciudades.length >= 1 &&
    ciudades.length <= 4 &&
    ciudades.every(
      (x: Record<string, unknown>) =>
        typeof x.clave === "string" && x.clave.length <= 80 &&
        typeof x.ciudad === "string" && x.ciudad.length <= 80 &&
        typeof x.iata === "string" && IATA.test(x.iata) &&
        typeof x.entrada === "string" && FECHA.test(x.entrada) &&
        typeof x.salida === "string" && FECHA.test(x.salida) && x.salida > x.entrada,
    ) &&
    Number.isInteger(c.viajeros) && c.viajeros >= 1 && c.viajeros <= 12 &&
    ["hostel", "3", "4", "5", "depto"].includes(c.tipo) &&
    typeof c.preferido === "string" && c.preferido.length <= 80;
  if (!valido) return Response.json({ error: "pedido inválido" }, { status: 400 });
  const r = await buscarHoteles({ ciudades, viajeros: c.viajeros, tipo: c.tipo, preferido: c.preferido, idioma: esIdioma(c.idioma) ? c.idioma : "es" });
  return Response.json(r, { headers: { "Cache-Control": "no-store" } });
}
