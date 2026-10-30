import { NextResponse } from "next/server";
import { esPremium, usuarioDeSesion } from "@/lib/cuentas";
import { borrarViajeGuardadoDb } from "@/lib/viajes-guardados";

export const runtime = "nodejs";

/** DELETE → borra un viaje guardado del usuario Premium con sesión iniciada. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await usuarioDeSesion();
  if (!usuario || !esPremium(usuario)) return NextResponse.json({ error: "no_premium" }, { status: 403 });
  const { id } = await params;
  await borrarViajeGuardadoDb(usuario.id, id);
  return NextResponse.json({ ok: true });
}
