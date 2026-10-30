import { alertarDueno } from "@/lib/correo/envio";
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

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/**
 * POST { oferta, entrada, salida, adultos, huesped } → el agente de hoteles reserva.
 * De la oferta que manda la página solo se usan los datos para el email (nombre, dirección, estrellas...).
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
    const o = c.oferta;
    const oferta: OfertaHotel = {
      ofertaId,
      hotelId: texto(o.hotelId, 40),
      nombre: nombreHotel,
      foto: null,
      estrellas: Math.min(5, Math.max(0, Number(o.estrellas) || 0)),
      puntaje: Number.isFinite(Number(o.puntaje)) && o.puntaje !== null ? Number(o.puntaje) : null,
      direccion: texto(o.direccion, 200),
      habitacion: texto(o.habitacion, 120),
      regimen: texto(o.regimen, 60),
      reembolsable: o.reembolsable === true,
      precio: pre.precio,
      moneda: pre.moneda,
    };
    const adultos = Math.min(4, Math.max(1, Number(c.adultos) || 1));
    const id = await registrarHotel(oferta, h as Huesped, c.entrada, c.salida, adultos);
    const r = await agenteHoteles(id);
    if (r.estado === "emitida") return Response.json({ codigo: r.codigo, precio: pre.precio, moneda: pre.moneda });
    if (r.estado === "pendiente") return Response.json({ pendiente: true }, { status: 202 });
    return Response.json({ error: "oferta" }, { status: 409 });
  } catch (e) {
    console.error("reservar hotel:", e);
    // Si pasa algo raro, le llega un email al dueño en el momento.
    await alertarDueno("Error al reservar hotel", `Algo falló en una compra.\n\n${e instanceof Error ? e.message : String(e)}\n\nRevisá el admin y los emails de los agentes.`).catch(() => {});
    if (e instanceof ErrorHoteles && e.status < 500) return Response.json({ error: "oferta" }, { status: 409 });
    return Response.json({ error: "servidor" }, { status: 502 });
  }
}
