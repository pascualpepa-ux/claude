import { NextResponse } from "next/server";
import { COOKIE_USUARIO } from "@/lib/cuentas";

export const runtime = "nodejs";

/** POST → cierra la sesión del usuario. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_USUARIO, "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
  return res;
}
