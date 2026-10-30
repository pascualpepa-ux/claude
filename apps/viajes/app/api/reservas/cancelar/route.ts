import { cancelarReserva } from "@/lib/agentes-reservas";
import { dbConfigurada } from "@/lib/db";
import { ipDe, permitido } from "@/lib/limite";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST { t } — cancela la reserva del link del email. */
export async function POST(req: Request) {
  if (!dbConfigurada()) return Response.json({ error: "inactivo" }, { status: 503 });
  if (!permitido(`cancelar:${ipDe(req)}`, 10, 60 * 60 * 1000)) return Response.json({ error: "limite" }, { status: 429 });
  const c = await req.json().catch(() => null);
  if (typeof c?.t !== "string" || !/^[\w-]{20,60}$/.test(c.t)) return Response.json({ error: "invalida" }, { status: 400 });
  try {
    const r = await cancelarReserva(c.t);
    return Response.json(r, { status: r.estado === "invalida" ? 404 : 200 });
  } catch (e) {
    console.error("cancelar reserva:", e);
    return Response.json({ error: "servidor" }, { status: 502 });
  }
}
