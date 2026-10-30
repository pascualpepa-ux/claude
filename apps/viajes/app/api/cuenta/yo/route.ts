import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_USUARIO, esPremium, usuarioIdDeCookie, usuarioPorId } from "@/lib/cuentas";
import { dbConfigurada } from "@/lib/db";

export const runtime = "nodejs";

/** GET → el usuario de la sesión actual, o null si no hay sesión iniciada. */
export async function GET() {
  if (!dbConfigurada()) return NextResponse.json({ usuario: null });

  const jarra = await cookies();
  const usuarioId = usuarioIdDeCookie(jarra.get(COOKIE_USUARIO)?.value);
  if (!usuarioId) return NextResponse.json({ usuario: null });

  const usuario = await usuarioPorId(usuarioId);
  if (!usuario) return NextResponse.json({ usuario: null });

  return NextResponse.json({
    usuario: { email: usuario.email, premium: esPremium(usuario) },
  });
}
