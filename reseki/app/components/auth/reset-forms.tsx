"use client";

import { useActionState } from "react";
import { requestPasswordReset, updatePassword, type FormState } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Paso 1: pedir el email para mandar el enlace de recuperación. */
export function RequestResetForm() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordReset, {});
  if (state.message) return <Alert tone="success">{state.message}</Alert>;
  return (
    <form action={action} className="flex flex-col gap-3.5" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="tu@restaurante.com" required />
      </div>
      <SubmitButton className="w-full" pendingText="Enviando…">Enviar enlace</SubmitButton>
    </form>
  );
}

/** Paso 2: elegir la contraseña nueva (se llega desde el enlace del email). */
export function NewPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(updatePassword, {});
  return (
    <form action={action} className="flex flex-col gap-3.5" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña nueva</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <span className="text-[12px] text-fg-muted">Mínimo 8 caracteres.</span>
      </div>
      <SubmitButton className="w-full" pendingText="Guardando…">Guardar y entrar</SubmitButton>
    </form>
  );
}
