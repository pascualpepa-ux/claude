"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type FormState } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const [state, action] = useActionState<FormState, FormData>(signUp, {});

  // Registro hecho y pendiente de confirmar el email: mostramos solo el aviso.
  if (state.message) return <Alert tone="success">{state.message}</Alert>;

  return (
    <form action={action} className="flex flex-col gap-3.5" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Tu nombre</Label>
        <Input id="name" name="name" autoComplete="name" placeholder="Marta Sánchez" defaultValue={state.fields?.name} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="tu@restaurante.com" defaultValue={state.fields?.email} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <span className="text-[12px] text-fg-muted">Mínimo 8 caracteres.</span>
      </div>
      <label className="flex items-start gap-2.5 text-[13px] text-fg-muted">
        <input type="checkbox" name="terms" className="mt-0.5 size-4 accent-[var(--fg)]" required />
        <span>
          Acepto los{" "}
          <Link href="/terminos" className="text-fg underline underline-offset-2">Términos</Link> y la{" "}
          <Link href="/privacidad" className="text-fg underline underline-offset-2">Política de privacidad</Link>.
        </span>
      </label>
      <SubmitButton className="mt-1 w-full" pendingText="Creando cuenta…">
        Crear cuenta
      </SubmitButton>
    </form>
  );
}
