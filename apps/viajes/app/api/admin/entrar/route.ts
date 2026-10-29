import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_ADMIN, COOKIE_DISPOSITIVO, adminConfigurado, contrasenaValida, crearSesion, dispositivoValido } from "@/lib/admin";

export async function POST(req: Request) {
  if (!adminConfigurado()) {
    return NextResponse.json({ error: "El acceso de administrador no está configurado." }, { status: 503 });
  }
  if (!dispositivoValido((await cookies()).get(COOKIE_DISPOSITIVO)?.value)) return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  const datos = await req.json().catch(() => ({}));
  const intento = typeof datos?.contrasena === "string" ? datos.contrasena : "";
  if (!contrasenaValida(intento)) {
    // Una pequeña espera frena los intentos repetidos.
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }
  const { valor, maxAge } = crearSesion();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_ADMIN, valor, { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge });
  return res;
}
