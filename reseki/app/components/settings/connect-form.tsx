"use client";

import { ArrowRight } from "lucide-react";
import { useActionState } from "react";
import { connectBusiness, type ActionState } from "@/app/onboarding/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BUSINESS_TYPES } from "@/lib/business";

/** Paso 1 en modo demo: el dueño escribe el nombre y se crea una ficha de ejemplo. */
export function ConnectDemoForm() {
  const [state, action] = useActionState<ActionState, FormData>(connectBusiness, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nombre del negocio</Label>
        <Input id="name" name="name" placeholder="Casa Lumbre" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="business_type">Tipo de negocio</Label>
        <select id="business_type" name="business_type" defaultValue="restaurante" required
          className="h-9 w-full rounded-sm border border-border bg-surface px-2.5 text-sm text-fg focus:border-accent focus:shadow-[0_0_0_3px_var(--ring)] focus:outline-none">
          {BUSINESS_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
        <span className="text-[12.5px] text-fg-muted">La IA adapta las respuestas a tu sector.</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="city">Ciudad <span className="font-normal text-fg-subtle">· opcional</span></Label>
        <Input id="city" name="city" placeholder="Madrid" />
      </div>
      <SubmitButton size="lg" className="w-full" pendingText="Conectando…">
        Conectar ficha de ejemplo <ArrowRight />
      </SubmitButton>
    </form>
  );
}
