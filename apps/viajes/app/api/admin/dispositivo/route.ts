import { NextResponse } from "next/server";
import { COOKIE_DISPOSITIVO, DURACION_DISPOSITIVO_SEG, claveDispositivoValida, valorDispositivo } from "@/lib/admin";

/** GET ?clave=... — se abre una vez desde el dispositivo del dueño: lo deja autorizado para el admin. */
export async function GET(req: Request) {
  const clave = new URL(req.url).searchParams.get("clave") ?? "";
  if (!claveDispositivoValida(clave)) {
    await new Promise((r) => setTimeout(r, 800));
    return new NextResponse("No encontrado", { status: 404 });
  }
  const res = NextResponse.redirect(new URL("/admin", req.url));
  res.cookies.set(COOKIE_DISPOSITIVO, valorDispositivo(), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: DURACION_DISPOSITIVO_SEG });
  return res;
}
