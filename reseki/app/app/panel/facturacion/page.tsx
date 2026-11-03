import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Facturación" };

/** Facturación (FASE 5): suscripción de 39 €/mes con Stripe y portal de cliente. */
export default function BillingPage() {
  return (
    <>
      <div className="border-b border-border pb-6 pt-8">
        <h1 className="text-[22px] font-semibold">Facturación</h1>
        <p className="mt-1 text-[13px] text-fg-muted">Plan único · 39 € al mes por negocio, IVA no incluido.</p>
      </div>
      <Alert tone="info" className="mt-6 max-w-[620px]">El pago con Stripe se conecta en la fase 5.</Alert>
    </>
  );
}
