import { buscarOfertas, ErrorDuffel, ventaPermitida } from "@/lib/duffel";
import { ipDe, permitido } from "@/lib/limite";

export const runtime = "nodejs";
export const maxDuration = 30;

const IATA = /^[A-Z]{3}$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** POST { origen, destino, ida, vuelta?, adultos } → vuelos que se pueden comprar en la web, con nuestra comisión incluida. */
export async function POST(req: Request) {
  if (!ventaPermitida()) return Response.json({ error: "inactivo" }, { status: 503 });
  if (!permitido(`buscar:${ipDe(req)}`, 30, 60 * 60 * 1000)) return Response.json({ error: "limite" }, { status: 429 });
  const c = await req.json().catch(() => null);
  const adultos = Number(c?.adultos);
  const hoy = new Date().toISOString().slice(0, 10);
  if (
    !IATA.test(c?.origen) || !IATA.test(c?.destino) || c.origen === c.destino ||
    !FECHA.test(c?.ida) || c.ida < hoy ||
    (c.vuelta && (!FECHA.test(c.vuelta) || c.vuelta < c.ida)) ||
    !Number.isInteger(adultos) || adultos < 1 || adultos > 6
  ) {
    return Response.json({ error: "datos" }, { status: 400 });
  }
  try {
    const ofertas = await buscarOfertas({ origen: c.origen, destino: c.destino, ida: c.ida, vuelta: c.vuelta || undefined, adultos });
    return Response.json({ ofertas });
  } catch (e) {
    console.error("buscar vuelos:", e);
    return Response.json({ error: e instanceof ErrorDuffel && e.status < 500 ? "datos" : "servidor" }, { status: 502 });
  }
}
