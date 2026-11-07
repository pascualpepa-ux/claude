import { cookies } from "next/headers";
import { COOKIE_ADMIN, COOKIE_DISPOSITIVO, dispositivoValido, sesionValida } from "@/lib/admin";
import { borrarSorteo, elegirGanador, sortear, sorteoActivo } from "@/lib/sorteo";

export const runtime = "nodejs";

/** POST { email? } — solo el admin: con email, lo elige como ganador; sin email, sugiere uno al azar. Queda registrado. */
export async function POST(req: Request) {
  const galletas = await cookies();
  if (!dispositivoValido(galletas.get(COOKIE_DISPOSITIVO)?.value) || !sesionValida(galletas.get(COOKIE_ADMIN)?.value)) return Response.json({ error: "sesion" }, { status: 401 });
  if (!sorteoActivo()) return Response.json({ error: "inactivo" }, { status: 409 });
  try {
    const c = await req.json().catch(() => null);
    const r = typeof c?.email === "string" ? await elegirGanador(c.email) : await sortear();
    return r ? Response.json(r) : Response.json({ error: "vacio" }, { status: 409 });
  } catch (e) {
    console.error("sorteo:", e);
    return Response.json({ error: "servidor" }, { status: 500 });
  }
}

/** DELETE { creado } — solo el admin: borra una sugerencia o elección anotada. */
export async function DELETE(req: Request) {
  const galletas = await cookies();
  if (!dispositivoValido(galletas.get(COOKIE_DISPOSITIVO)?.value) || !sesionValida(galletas.get(COOKIE_ADMIN)?.value)) return Response.json({ error: "sesion" }, { status: 401 });
  const c = await req.json().catch(() => null);
  if (typeof c?.creado !== "string" || Number.isNaN(Date.parse(c.creado))) return Response.json({ error: "datos" }, { status: 400 });
  try {
    return (await borrarSorteo(c.creado)) ? Response.json({ ok: true }) : Response.json({ error: "no_existe" }, { status: 404 });
  } catch (e) {
    console.error("borrar sorteo:", e);
    return Response.json({ error: "servidor" }, { status: 500 });
  }
}
