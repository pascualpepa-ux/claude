import { cookies } from "next/headers";
import { COOKIE_ADMIN, COOKIE_DISPOSITIVO, dispositivoValido, sesionValida } from "@/lib/admin";
import { reenviarConfirmaciones } from "@/lib/suscripciones";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST — solo el admin: reenvía el email de confirmación a los suscriptores que no confirmaron. */
export async function POST() {
  const galletas = await cookies();
  if (!dispositivoValido(galletas.get(COOKIE_DISPOSITIVO)?.value) || !sesionValida(galletas.get(COOKIE_ADMIN)?.value)) return Response.json({ error: "sesion" }, { status: 401 });
  try {
    return Response.json(await reenviarConfirmaciones());
  } catch (e) {
    console.error("reenviar confirmaciones:", e);
    return Response.json({ error: "servidor" }, { status: 500 });
  }
}
