import { NextResponse } from "next/server";
import { emailValido } from "@/lib/suscripciones";
import { COOKIE_USUARIO, crearCookieSesion, crearUsuario, cuentasConfiguradas, usuarioPorEmail } from "@/lib/cuentas";
import { dbConfigurada } from "@/lib/db";
import { ipDe, permitido } from "@/lib/limite";

export const runtime = "nodejs";

/** POST { email, contrasena } → crea la cuenta y deja la sesión iniciada. */
export async function POST(req: Request) {
  if (!dbConfigurada() || !cuentasConfiguradas()) {
    return NextResponse.json({ error: "inactivo" }, { status: 503 });
  }
  if (!permitido(`cuenta-registrar:${ipDe(req)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "limite" }, { status: 429 });
  }
  const c = await req.json().catch(() => null);
  const email = typeof c?.email === "string" ? c.email.trim() : "";
  const contrasena = typeof c?.contrasena === "string" ? c.contrasena : "";
  if (!emailValido(email)) return NextResponse.json({ error: "email" }, { status: 400 });
  if (contrasena.length < 8 || contrasena.length > 72) {
    return NextResponse.json({ error: "contrasena" }, { status: 400 });
  }
  if (await usuarioPorEmail(email)) {
    return NextResponse.json({ error: "existe" }, { status: 409 });
  }
  const usuario = await crearUsuario(email, contrasena);
  const { valor, maxAge } = crearCookieSesion(usuario.id);
  const res = NextResponse.json({ usuario: { email: usuario.email, premium_estado: usuario.premium_estado } });
  res.cookies.set(COOKIE_USUARIO, valor, { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge });
  return res;
}
