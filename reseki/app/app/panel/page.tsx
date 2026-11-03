import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert } from "@/components/ui/alert";
import { requireRestaurant } from "@/lib/session";

export const metadata: Metadata = { title: "Reseñas" };

/** Panel de reseñas (FASE 3). De momento comprueba la sesión y el onboarding. */
export default async function PanelPage() {
  const { user, restaurant } = await requireRestaurant();
  if (!restaurant.onboarding_completed_at) redirect("/onboarding");

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex h-15 max-w-[960px] items-center justify-between px-4 sm:px-8">
          <Logo href="/panel" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[960px] px-4 py-10 sm:px-8">
        <h1 className="text-[22px] font-semibold">Reseñas</h1>
        <p className="mt-1 text-[13px] text-fg-muted">{restaurant.name || "Tu restaurante"} · {user.email}</p>
        <Alert tone="info" className="mt-6">El panel de reseñas llega en la fase 3.</Alert>
      </main>
    </div>
  );
}
