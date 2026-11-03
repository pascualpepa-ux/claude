import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";
import { Alert } from "@/components/ui/alert";
import { requireRestaurant } from "@/lib/session";

export const metadata: Metadata = { title: "Bienvenida" };

/**
 * Onboarding (FASE 2): conectar Google + configurar el tono.
 * En esta fase solo confirma que el login y la base de datos funcionan.
 */
export default async function OnboardingPage() {
  const { user, restaurant } = await requireRestaurant();
  if (restaurant.onboarding_completed_at) redirect("/panel");

  const firstName = restaurant.owner_name.split(" ")[0] || user.email;
  return (
    <div className="min-h-dvh bg-bg-subtle">
      <header className="border-b border-border bg-bg">
        <div className="mx-auto flex h-15 max-w-[1040px] items-center justify-between px-4 sm:px-8">
          <Logo href="/onboarding" />
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-[560px] px-4 py-12">
        <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-fg-muted">Cuenta creada</p>
        <h1 className="mt-2 text-[28px] font-semibold">Hola, {firstName}</h1>
        <p className="mt-2 text-fg-muted">
          Tu cuenta funciona y está guardada con el email <b className="font-medium text-fg">{user.email}</b>.
        </p>
        <Alert tone="info" className="mt-8">
          Aquí irán los pasos para conectar tu ficha de Google y elegir el tono de las respuestas (fase 2).
        </Alert>
      </main>
    </div>
  );
}
