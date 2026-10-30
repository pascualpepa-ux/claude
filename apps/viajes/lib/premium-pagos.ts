import { createHmac, timingSafeEqual } from "node:crypto";
import { pagosActivos, stripe } from "./pagos";
import { SITIO_URL } from "./seo";

// Suscripción mensual de Rumbo Premium (Stripe Subscriptions). Solo servidor.
// El precio vive en Stripe (STRIPE_PRICE_PREMIUM_MENSUAL, un Price ID "price_..." recurrente mensual).
// Los avisos de cambios de estado (pagó, falló, canceló) llegan por webhook, firmados con
// STRIPE_WEBHOOK_SECRET_PREMIUM: https://docs.stripe.com/webhooks#verify-manually

export const premiumPagosActivos = () => pagosActivos() && !!process.env.STRIPE_PRICE_PREMIUM_MENSUAL;

interface ClienteStripe {
  id: string;
}

/** Crea el cliente de Stripe para una cuenta nueva (una sola vez; después se reusa el id guardado). */
export const crearClienteStripe = (email: string, usuarioId: string) =>
  stripe<ClienteStripe>("/customers", { email, "metadata[usuario]": usuarioId }, `cliente-${usuarioId}`);

interface SesionCheckout {
  id: string;
  url: string | null;
}

/** Sesión de pago para arrancar la suscripción mensual. Vuelve a /premium al terminar (bien o mal). */
export function crearCheckoutPremium(customerId: string, usuarioId: string) {
  return stripe<SesionCheckout>("/checkout/sessions", {
    mode: "subscription",
    customer: customerId,
    "line_items[0][price]": process.env.STRIPE_PRICE_PREMIUM_MENSUAL,
    "line_items[0][quantity]": 1,
    "subscription_data[metadata][usuario]": usuarioId,
    success_url: `${SITIO_URL}/premium?suscripto=1`,
    cancel_url: `${SITIO_URL}/premium`,
  });
}

interface SesionPortal {
  url: string;
}

/** Portal de Stripe para que la persona vea o cancele su suscripción cuando quiera. */
export const crearPortalPremium = (customerId: string) =>
  stripe<SesionPortal>("/billing_portal/sessions", { customer: customerId, return_url: `${SITIO_URL}/premium` });

/** Controla la firma de Stripe-Signature antes de creerle a un webhook. */
export function firmaStripeValida(cuerpo: string, encabezado: string, secreto: string): boolean {
  const partes = Object.fromEntries(encabezado.split(",").map((p) => p.split("=") as [string, string]));
  const t = partes.t;
  const v1 = partes.v1;
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 5 * 60) return false; // evita reenvíos viejos
  const esperada = createHmac("sha256", secreto).update(`${t}.${cuerpo}`).digest("hex");
  const a = Buffer.from(v1, "hex");
  const b = Buffer.from(esperada, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Estado de usuarios.premium_estado según el status de la suscripción en Stripe. */
export function estadoDeSuscripcion(status: string): "activo" | "cancelado" | "pago_fallido" | "inactivo" {
  if (status === "active" || status === "trialing") return "activo";
  if (status === "past_due" || status === "unpaid") return "pago_fallido";
  if (status === "canceled" || status === "incomplete_expired") return "cancelado";
  return "inactivo";
}
