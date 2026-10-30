// Cobro con tarjeta (Stripe), solo servidor. La clave secreta vive en STRIPE_SECRET_KEY (Vercel).
// La plata se RETIENE al pagar y se COBRA recién cuando el pasaje o el hotel quedan confirmados;
// si la compra falla, se libera la retención y al cliente no se le cobra nada.

const API = "https://api.stripe.com/v1";

export const pagosActivos = () => !!process.env.STRIPE_SECRET_KEY;
export const pagosPrueba = () => (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");

/** Monedas sin centavos en Stripe (el monto va entero). */
const SIN_DECIMALES = new Set(["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"]);
export const aMinimo = (monto: number, moneda: string) =>
  SIN_DECIMALES.has(moneda.toUpperCase()) ? Math.round(monto) : Math.round(monto * 100);
export const deMinimo = (n: number, moneda: string) => (SIN_DECIMALES.has(moneda.toUpperCase()) ? n : n / 100);

function formulario(datos: Record<string, string | number | undefined>) {
  const f = new URLSearchParams();
  for (const [k, v] of Object.entries(datos)) if (v !== undefined) f.append(k, String(v));
  return f;
}

async function stripe<T>(ruta: string, datos?: Record<string, string | number | undefined>, idempotencia?: string): Promise<T> {
  const res = await fetch(`${API}${ruta}`, {
    method: datos ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      ...(datos ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(idempotencia ? { "Idempotency-Key": idempotencia } : {}),
    },
    body: datos ? formulario(datos) : undefined,
    cache: "no-store",
  });
  const j = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${j.error?.message ?? "error"}`);
  return j;
}

export interface IntentoPago {
  id: string;
  client_secret: string;
  status: string;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
}

/** Crea el pago con retención (se cobra después, cuando la compra sale). */
export function crearPago(reservaId: string, monto: number, moneda: string, email: string, descripcion: string) {
  return stripe<IntentoPago>(
    "/payment_intents",
    {
      amount: aMinimo(monto, moneda),
      currency: moneda.toLowerCase(),
      capture_method: "manual",
      "automatic_payment_methods[enabled]": "true",
      "automatic_payment_methods[allow_redirects]": "never",
      receipt_email: email,
      description: descripcion.slice(0, 300),
      "metadata[reserva]": reservaId,
    },
    `pago-${reservaId}`,
  );
}

export const verPago = (id: string) => stripe<IntentoPago>(`/payment_intents/${encodeURIComponent(id)}`);

/** Cobra lo retenido (la compra salió). */
export const cobrar = (id: string) => stripe<IntentoPago>(`/payment_intents/${encodeURIComponent(id)}/capture`, {}, `cobrar-${id}`);

/** Libera lo retenido (la compra falló): al cliente no se le cobra nada. */
export const liberar = (id: string) => stripe<IntentoPago>(`/payment_intents/${encodeURIComponent(id)}/cancel`, {}, `liberar-${id}`);

/** Devuelve plata de un pago ya cobrado (cancelación). */
export const devolver = (id: string, monto: number, moneda: string) =>
  stripe<{ id: string; status: string }>("/refunds", { payment_intent: id, amount: aMinimo(monto, moneda) }, `devolver-${id}-${aMinimo(monto, moneda)}`);
