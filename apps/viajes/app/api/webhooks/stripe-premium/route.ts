import { actualizarPremiumPorCliente } from "@/lib/cuentas";
import { estadoDeSuscripcion, firmaStripeValida } from "@/lib/premium-pagos";

export const runtime = "nodejs";

interface EventoStripe {
  type: string;
  data: { object: { id: string; customer: string; status?: string } };
}

/** Avisos de Stripe sobre la suscripción de Rumbo Premium (se creó, cambió o se canceló). */
export async function POST(req: Request) {
  const secreto = process.env.STRIPE_WEBHOOK_SECRET_PREMIUM;
  if (!secreto) return new Response("sin configurar", { status: 503 });
  const cuerpo = await req.text();
  const firma = req.headers.get("stripe-signature") ?? "";
  if (!firmaStripeValida(cuerpo, firma, secreto)) return new Response("firma inválida", { status: 401 });

  const evento = JSON.parse(cuerpo) as EventoStripe;
  const sub = evento.data.object;
  try {
    if (evento.type === "customer.subscription.deleted") {
      await actualizarPremiumPorCliente(sub.customer, "cancelado", null);
    } else if (evento.type.startsWith("customer.subscription.") && sub.status) {
      await actualizarPremiumPorCliente(sub.customer, estadoDeSuscripcion(sub.status), sub.id);
    }
  } catch (e) {
    console.error("webhook stripe premium:", e);
    return new Response("error", { status: 500 });
  }
  return new Response("ok");
}
