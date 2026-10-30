import { NextResponse } from "next/server";
import { COOKIE_USUARIO, contrasenaCoincide, crearCookieSesion, cuentasConfiguradas, usuarioPorEmail } from "@/lib/cuentas";
import { dbConfigurada } from "@/lib/db";
import { ipDe, permitido } from "@/lib/limite";

export const runtime = "nodejs";

/** POST { email, contrasena } → inicia sesión si las credenciales son correctas. */
export async function POST(req: Request) {
  if (!dbConfigurada() || !cuentasConfiguradas()) {
    return NextResponse.json({ error: "inactivo" }, { status: 503 });
  }
  if (!permitido(`cuenta-entrar:${ipDe(req)}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "limite" }, { status: 429 });
  }
  const c = await req.json().catch(() => null);
  const email = typeof c?.email === "string" ? c.email.trim() : "";
  const contrasena = typeof c?.contrasena === "string" ? c.contrasena : "";
  if (!email || !contrasena) return NextResponse.json({ error: "credenciales" }, { status: 400 });

  const usuario = await usuarioPorEmail(email);
  if (!usuario || !contrasenaCoincide(contrasena, usuario.contrasena_hash)) {
    return NextResponse.json({ error: "credenciales" }, { status: 401 });
  }
  const { valor, maxAge } = crearCookieSesion(usuario.id);
  const res = NextResponse.json({ usuario: { email: usuario.email, premium_estado: usuario.premium_estado } });
  res.cookies.set(COOKIE_USUARIO, valor, { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge });
  return res;
}
