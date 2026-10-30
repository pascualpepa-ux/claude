import { NextResponse } from "next/server";
import { usuarioDeSesion } from "@/lib/cuentas";
import { crearPortalPremium, premiumPagosActivos } from "@/lib/premium-pagos";

export const runtime = "nodejs";

/** POST → portal de Stripe para ver o cancelar la suscripción. Devuelve { url }. */
export async function POST() {
  if (!premiumPagosActivos()) return NextResponse.json({ error: "inactivo" }, { status: 503 });
  const usuario = await usuarioDeSesion();
  if (!usuario?.stripe_customer_id) return NextResponse.json({ error: "sin_suscripcion" }, { status: 404 });
  try {
    const sesion = await crearPortalPremium(usuario.stripe_customer_id);
    return NextResponse.json({ url: sesion.url });
  } catch (e) {
    console.error("portal premium:", e);
    return NextResponse.json({ error: "servidor" }, { status: 502 });
  }
}
