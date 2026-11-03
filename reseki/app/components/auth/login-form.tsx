"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type FormState } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signIn, {});
  return (
    <form action={action} className="flex flex-col gap-3.5" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="tu@restaurante.com" defaultValue={state.fields?.email} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <Link href="/recuperar" className="text-[12px] text-fg-muted hover:text-fg">
            ¿La olvidaste?
          </Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <SubmitButton className="mt-1 w-full" pendingText="Entrando…">
        Entrar
      </SubmitButton>
    </form>
  );
}
