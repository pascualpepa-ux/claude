import { cookies } from "next/headers";
import { COOKIE_ADMIN, COOKIE_DISPOSITIVO, dispositivoValido, sesionValida } from "@/lib/admin";
import { sortear, sorteoActivo } from "@/lib/sorteo";

export const runtime = "nodejs";

/** POST — solo el admin: hace el sorteo entre los suscriptores confirmados y lo deja registrado. */
export async function POST() {
  const galletas = await cookies();
  if (!dispositivoValido(galletas.get(COOKIE_DISPOSITIVO)?.value) || !sesionValida(galletas.get(COOKIE_ADMIN)?.value)) return Response.json({ error: "sesion" }, { status: 401 });
  if (!sorteoActivo()) return Response.json({ error: "inactivo" }, { status: 409 });
  try {
    const r = await sortear();
    return r ? Response.json(r) : Response.json({ error: "vacio" }, { status: 409 });
  } catch (e) {
    console.error("sorteo:", e);
    return Response.json({ error: "servidor" }, { status: 500 });
  }
}
