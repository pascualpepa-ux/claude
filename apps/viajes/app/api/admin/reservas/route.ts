import { cookies } from "next/headers";
import { cancelarDesdeAdmin } from "@/lib/agentes-reservas";
import { COOKIE_ADMIN, COOKIE_DISPOSITIVO, dispositivoValido, sesionValida } from "@/lib/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST { id } — solo el admin: cancela una reserva con la aerolínea o el hotel. */
export async function POST(req: Request) {
  const g = await cookies();
  if (!dispositivoValido(g.get(COOKIE_DISPOSITIVO)?.value) || !sesionValida(g.get(COOKIE_ADMIN)?.value)) return Response.json({ error: "sesion" }, { status: 401 });
  const c = await req.json().catch(() => null);
  if (typeof c?.id !== "string" || !/^[0-9a-f-]{36}$/.test(c.id)) return Response.json({ error: "datos" }, { status: 400 });
  try {
    const r = await cancelarDesdeAdmin(c.id);
    return Response.json(r, { status: r.estado === "invalida" ? 404 : 200 });
  } catch (e) {
    console.error("cancelar desde admin:", e);
    return Response.json({ error: "servidor" }, { status: 502 });
  }
}
