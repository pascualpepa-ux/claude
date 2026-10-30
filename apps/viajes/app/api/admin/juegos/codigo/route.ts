import { cookies } from "next/headers";
import { COOKIE_ADMIN, COOKIE_DISPOSITIVO, contrasenaValida, dispositivoValido, sesionValida } from "@/lib/admin";

/** POST { codigo } — juegos del admin: el código de ventaja es la contraseña del admin, y se revisa acá (nunca en la página). */
export async function POST(req: Request) {
  const galletas = await cookies();
  if (!dispositivoValido(galletas.get(COOKIE_DISPOSITIVO)?.value) || !sesionValida(galletas.get(COOKIE_ADMIN)?.value)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const c = await req.json().catch(() => null);
  const ok = typeof c?.codigo === "string" && contrasenaValida(c.codigo);
  if (!ok) await new Promise((r) => setTimeout(r, 800));
  return Response.json({ ok });
}
