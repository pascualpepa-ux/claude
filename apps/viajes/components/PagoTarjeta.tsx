"use client";

import { useEffect, useRef, useState } from "react";
import { CircleNotch, Lock } from "@phosphor-icons/react/dist/ssr";
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import { useIdioma } from "./ProveedorIdioma";

// Recuadro de la tarjeta (Stripe) dentro de la página. Los datos de la tarjeta van directo a Stripe:
// nunca pasan por nuestro servidor. Al pagar, la plata queda retenida y el agente compra.

let stripeCargado: Promise<Stripe | null> | null = null;
const cargarStripe = () => (stripeCargado ??= loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""));

const T = {
  es: { pagar: (p: string) => `Pagar ${p}`, pagando: "Procesando el pago…", seguro: "Pago seguro con Stripe. Si la compra no sale, no se te cobra nada.", prueba: "Modo prueba: usá la tarjeta 4242 4242 4242 4242, cualquier fecha futura y cualquier código.", error: "No se pudo procesar la tarjeta. Revisá los datos o probá con otra." },
  en: { pagar: (p: string) => `Pay ${p}`, pagando: "Processing payment…", seguro: "Secure payment with Stripe. If the booking fails, you're not charged.", prueba: "Test mode: use card 4242 4242 4242 4242, any future date and any code.", error: "The card couldn't be processed. Check the details or try another card." },
};

export function PagoTarjeta({ clientSecret, reserva, total, prueba, onResultado }: {
  clientSecret: string;
  reserva: string;
  total: string;
  prueba: boolean;
  onResultado: (r: { codigo?: string; pendiente?: boolean; error?: string }) => void;
}) {
  const { idioma } = useIdioma();
  const t = T[idioma];
  const caja = useRef<HTMLDivElement>(null);
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [elementos, setElementos] = useState<StripeElements | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    cargarStripe().then((s) => {
      if (!vivo || !s || !caja.current) return;
      const el = s.elements({
        clientSecret,
        locale: idioma,
        appearance: { theme: "stripe", variables: { colorPrimary: "#575b40", borderRadius: "12px", fontFamily: "system-ui, sans-serif" } },
      });
      el.create("payment", { layout: "tabs" }).mount(caja.current);
      setStripe(s);
      setElementos(el);
    });
    return () => {
      vivo = false;
    };
  }, [clientSecret, idioma]);

  const pagar = async () => {
    if (!stripe || !elementos) return;
    setOcupado(true);
    setError(null);
    const r = await stripe.confirmPayment({ elements: elementos, redirect: "if_required" });
    if (r.error || r.paymentIntent?.status !== "requires_capture") {
      setError(r.error?.message ?? t.error);
      setOcupado(false);
      return;
    }
    const res = await fetch("/api/pagos/confirmar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reserva }) }).catch(() => null);
    const j = res ? await res.json().catch(() => ({})) : { error: "general" };
    setOcupado(false);
    onResultado(res?.ok ? j : { error: j.error ?? "general" });
  };

  return (
    <div className="grid gap-4 rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900">
      {prueba && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">{t.prueba}</p>}
      <div ref={caja} className="min-h-40" />
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
      <button
        type="button"
        onClick={pagar}
        disabled={ocupado || !stripe}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-oliva-700 px-5 py-3 text-lg font-semibold text-white transition hover:bg-oliva-800 active:scale-[0.98] disabled:opacity-60 dark:bg-oliva-300 dark:text-arena-950"
      >
        {ocupado ? <CircleNotch size={20} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <Lock size={20} weight="fill" aria-hidden />}
        {ocupado ? t.pagando : t.pagar(total)}
      </button>
      <p className="flex items-center gap-1.5 text-xs text-arena-500">
        <Lock size={14} aria-hidden />
        {t.seguro}
      </p>
    </div>
  );
}
