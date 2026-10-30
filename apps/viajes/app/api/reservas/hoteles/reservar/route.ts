import { agenteHoteles, registrarHotel } from "@/lib/agentes-reservas";
import { dbConfigurada } from "@/lib/db";
import { ErrorHoteles, hotelesPermitido, prereservar, type Huesped, type OfertaHotel } from "@/lib/hoteles";
import { ipDe, permitido } from "@/lib/limite";

export const runtime = "nodejs";
export const maxDuration = 60;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEFONO = /^\+[1-9]\d{6,14}$/;
const NOMBRE = /^[\p{L}][\p{L} '-]{0,39}$/u;

/**
 * POST { oferta: { ofertaId, nombre }, entrada, salida, huesped } → el agente de hoteles reserva.
 * El precio lo confirma el hotel acá (prebook), nunca se toma el que manda la página.
 */
export async function POST(req: Request) {
  if (!hotelesPermitido() || !dbConfigurada()) return Response.json({ error: "inactivo" }, { status: 503 });
  if (!permitido(`reservar-hotel:${ipDe(req)}`, 6, 60 * 60 * 1000)) return Response.json({ error: "limite" }, { status: 429 });
  const c = await req.json().catch(() => null);
  const h = c?.huesped as Partial<Huesped> | undefined;
  const ofertaId = c?.oferta?.ofertaId;
  const nombreHotel = typeof c?.oferta?.nombre === "string" ? c.oferta.nombre.slice(0, 120) : "";
  if (
    typeof ofertaId !== "string" || ofertaId.length > 4000 || !nombreHotel || !FECHA.test(c?.entrada) || !FECHA.test(c?.salida) ||
    !h || !NOMBRE.test(h.nombre ?? "") || !NOMBRE.test(h.apellido ?? "") || !EMAIL.test(h.email ?? "") || !TELEFONO.test(h.telefono ?? "")
  ) {
    return Response.json({ error: "datos" }, { status: 400 });
  }
  try {
    const pre = await prereservar(ofertaId);
    const oferta = { ofertaId, nombre: nombreHotel, precio: pre.precio, moneda: pre.moneda } as OfertaHotel;
    const id = await registrarHotel(oferta, h as Huesped, c.entrada, c.salida);
    const r = await agenteHoteles(id);
    if (r.estado === "emitida") return Response.json({ codigo: r.codigo, precio: pre.precio, moneda: pre.moneda });
    if (r.estado === "pendiente") return Response.json({ pendiente: true }, { status: 202 });
    return Response.json({ error: "oferta" }, { status: 409 });
  } catch (e) {
    console.error("reservar hotel:", e);
    if (e instanceof ErrorHoteles && e.status < 500) return Response.json({ error: "oferta" }, { status: 409 });
    return Response.json({ error: "servidor" }, { status: 502 });
  }
}
