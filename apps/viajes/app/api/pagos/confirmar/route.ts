import { pagoRetenido } from "@/lib/agentes-reservas";
import { alertarDueno } from "@/lib/correo/envio";
import { ipDe, permitido } from "@/lib/limite";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST { reserva } — la tarjeta ya se aceptó en Stripe: se verifica la retención y el agente compra. */
export async function POST(req: Request) {
  if (!permitido(`confirmar-pago:${ipDe(req)}`, 20, 60 * 60 * 1000)) return Response.json({ error: "limite" }, { status: 429 });
  const c = await req.json().catch(() => null);
  if (typeof c?.reserva !== "string" || !/^[0-9a-f-]{36}$/.test(c.reserva)) return Response.json({ error: "datos" }, { status: 400 });
  try {
    const r = await pagoRetenido(c.reserva);
    if (r.estado === "emitida") return Response.json({ codigo: r.codigo });
    if (r.estado === "pendiente") return Response.json({ pendiente: true }, { status: 202 });
    if (r.estado === "esperando_pago") return Response.json({ error: "pago" }, { status: 402 });
    return Response.json({ error: "oferta" }, { status: 409 });
  } catch (e) {
    console.error("confirmar pago:", e);
    await alertarDueno("Error al confirmar un pago", `Reserva ${c.reserva}\n\n${e instanceof Error ? e.message : String(e)}`).catch(() => {});
    return Response.json({ error: "servidor" }, { status: 502 });
  }
}
