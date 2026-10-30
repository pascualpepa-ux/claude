import { NextResponse } from "next/server";
import { esPremium, guardarClienteStripe, usuarioDeSesion } from "@/lib/cuentas";
import { crearCheckoutPremium, crearClienteStripe, premiumPagosActivos } from "@/lib/premium-pagos";
import { ipDe, permitido } from "@/lib/limite";

export const runtime = "nodejs";

/** POST → arranca el checkout de Stripe para la suscripción mensual de Rumbo Premium. Devuelve { url }. */
export async function POST(req: Request) {
  if (!premiumPagosActivos()) return NextResponse.json({ error: "inactivo" }, { status: 503 });
  if (!permitido(`suscribir:${ipDe(req)}`, 10, 60 * 60 * 1000)) return NextResponse.json({ error: "limite" }, { status: 429 });
  const usuario = await usuarioDeSesion();
  if (!usuario) return NextResponse.json({ error: "sin_sesion" }, { status: 401 });
  if (esPremium(usuario)) return NextResponse.json({ error: "ya_premium" }, { status: 409 });
  try {
    let clienteId = usuario.stripe_customer_id;
    if (!clienteId) {
      const cliente = await crearClienteStripe(usuario.email, usuario.id);
      clienteId = cliente.id;
      await guardarClienteStripe(usuario.id, clienteId);
    }
    const sesion = await crearCheckoutPremium(clienteId, usuario.id);
    if (!sesion.url) return NextResponse.json({ error: "servidor" }, { status: 502 });
    return NextResponse.json({ url: sesion.url });
  } catch (e) {
    console.error("suscribir premium:", e);
    return NextResponse.json({ error: "servidor" }, { status: 502 });
  }
}
