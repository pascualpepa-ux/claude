import { agenteVuelos, registrar } from "@/lib/agentes-reservas";
import { ErrorDuffel, ofertaActual, ventaPermitida, type Pasajero } from "@/lib/duffel";
import { dbConfigurada } from "@/lib/db";
import { ipDe, permitido } from "@/lib/limite";

export const runtime = "nodejs";
export const maxDuration = 60;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEFONO = /^\+[1-9]\d{6,14}$/;
const NOMBRE = /^[\p{L}][\p{L} '-]{0,39}$/u;

function pasajeroValido(p: Partial<Pasajero>): p is Pasajero {
  return (
    !!p && NOMBRE.test(p.nombre ?? "") && NOMBRE.test(p.apellido ?? "") && FECHA.test(p.nacimiento ?? "") &&
    (p.genero === "m" || p.genero === "f") && ["mr", "ms", "mrs"].includes(p.tratamiento ?? "") &&
    EMAIL.test(p.email ?? "") && TELEFONO.test(p.telefono ?? "")
  );
}

/**
 * POST { ofertaId, pasajeros } → anota la compra y el agente de vuelos emite el pasaje.
 * Si la aerolínea no responde, la compra queda pendiente y el vigilante la sigue hasta terminarla.
 */
export async function POST(req: Request) {
  if (!ventaPermitida() || !dbConfigurada()) return Response.json({ error: "inactivo" }, { status: 503 });
  if (!permitido(`emitir:${ipDe(req)}`, 6, 60 * 60 * 1000)) return Response.json({ error: "limite" }, { status: 429 });
  const c = await req.json().catch(() => null);
  const pasajeros = Array.isArray(c?.pasajeros) ? c.pasajeros : [];
  if (typeof c?.ofertaId !== "string" || !/^off_\w+$/.test(c.ofertaId) || !pasajeros.length || !pasajeros.every(pasajeroValido)) {
    return Response.json({ error: "datos" }, { status: 400 });
  }
  try {
    const { oferta } = await ofertaActual(c.ofertaId);
    if (oferta.pasajeros.length !== pasajeros.length) return Response.json({ error: "datos" }, { status: 400 });
    const id = await registrar(oferta, pasajeros);
    const r = await agenteVuelos(id);
    if (r.estado === "emitida") return Response.json({ codigo: r.codigo, oferta });
    if (r.estado === "pendiente") return Response.json({ pendiente: true, oferta }, { status: 202 });
    return Response.json({ error: "oferta" }, { status: 409 });
  } catch (e) {
    console.error("emitir pasaje:", e);
    if (e instanceof ErrorDuffel && e.status < 500) return Response.json({ error: "oferta" }, { status: 409 });
    if (e instanceof ErrorDuffel) return Response.json({ error: "aerolinea" }, { status: 502 });
    return Response.json({ error: "servidor" }, { status: 502 });
  }
}
