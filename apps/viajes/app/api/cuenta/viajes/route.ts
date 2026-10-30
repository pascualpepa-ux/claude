import { NextResponse } from "next/server";
import { esPremium, usuarioDeSesion } from "@/lib/cuentas";
import { guardarViajeGuardadoDb, listarViajesGuardados } from "@/lib/viajes-guardados";
import type { TripPlan } from "@/lib/types";

export const runtime = "nodejs";

async function usuarioPremium() {
  const usuario = await usuarioDeSesion();
  if (!usuario || !esPremium(usuario)) return null;
  return usuario;
}

/** GET → los viajes guardados de verdad del usuario Premium con sesión iniciada. */
export async function GET() {
  const usuario = await usuarioPremium();
  if (!usuario) return NextResponse.json({ error: "no_premium" }, { status: 403 });
  return NextResponse.json({ viajes: await listarViajesGuardados(usuario.id) });
}

function validoPlan(p: unknown): p is TripPlan {
  const plan = p as Partial<TripPlan> | null;
  return !!plan && typeof plan === "object" && !!plan.input && typeof plan.input.origen === "string" && typeof plan.input.destino === "string";
}

/** POST { plan, borrador?, id? } → guarda (o actualiza, con `id`) un viaje para el usuario Premium con sesión iniciada. */
export async function POST(req: Request) {
  const usuario = await usuarioPremium();
  if (!usuario) return NextResponse.json({ error: "no_premium" }, { status: 403 });
  const c = await req.json().catch(() => null);
  if (!validoPlan(c?.plan)) return NextResponse.json({ error: "datos" }, { status: 400 });
  const id = typeof c.id === "string" ? c.id : undefined;
  const nombre = `${c.plan.input.origen} → ${c.plan.input.destino}`;
  const viaje = await guardarViajeGuardadoDb(usuario.id, nombre, c.plan, c.borrador, id);
  return NextResponse.json({ viaje });
}
