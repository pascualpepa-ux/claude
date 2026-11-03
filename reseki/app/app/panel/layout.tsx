import { FlaskConical } from "lucide-react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { PanelNav } from "@/components/panel/nav";
import { SignOutButton } from "@/components/sign-out-button";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/toast";
import { isDemoMode } from "@/lib/env";
import { requireRestaurant } from "@/lib/session";

// Siempre dinámico: depende de la sesión del usuario.
export const dynamic = "force-dynamic";

/** Marco del panel: barra lateral en escritorio, barra superior con pestañas en el móvil. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, restaurant } = await requireRestaurant();
  if (!restaurant.onboarding_completed_at) redirect("/onboarding");

  const { count } = await supabase
    .from("replies")
    .select("id", { count: "exact", head: true })
    .in("status", ["pendiente", "error", "rechazada"]);
  const pending = count ?? 0;
  const title = restaurant.google_location_title || restaurant.name || "Tu restaurante";
  const initials = title.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[240px_1fr]">
      {/* Barra lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-5 border-r border-border bg-bg-subtle px-3 py-4 lg:flex">
        <div className="px-1.5 pt-1"><Logo href="/panel" /></div>
        <div className="flex items-center gap-2.5 rounded-md border border-border bg-surface p-2 shadow-xs">
          <span className="grid size-[26px] shrink-0 place-items-center rounded-[6px] border border-border bg-surface-2 text-[12px] font-semibold">{initials}</span>
          <div className="min-w-0 leading-tight">
            <b className="block truncate text-[13px] font-medium">{title}</b>
            <small className="text-[12px] text-fg-muted">Google{isDemoMode ? " · demo" : ""}</small>
          </div>
        </div>
        <PanelNav pending={pending} />
        <div className="mt-auto flex flex-col gap-3">
          {isDemoMode && (
            <p className="flex gap-2 rounded-sm border border-dashed border-border-strong px-2.5 py-2 text-[12px] leading-snug text-fg-muted">
              <FlaskConical className="mt-px size-3.5 shrink-0" />
              Modo demo. Las reseñas son de ejemplo y nada se publica en Google.
            </p>
          )}
          <div className="flex items-center justify-between gap-1">
            <span className="min-w-0 truncate px-1 text-[12px] text-fg-muted">{user.email}</span>
            <ThemeToggle />
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Barra superior (móvil y tablet) */}
      <div className="sticky top-0 z-20 border-b border-border bg-bg lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Logo href="/panel" />
          <div className="flex items-center gap-1">
            {isDemoMode && <span className="rounded-full border border-border px-2 py-0.5 text-[12px] text-fg-muted">Demo</span>}
            <ThemeToggle />
          </div>
        </div>
        <PanelNav pending={pending} horizontal />
      </div>

      <div className="flex min-w-0 flex-col">
        <main className="mx-auto w-full max-w-[960px] flex-1 px-4 pb-16 sm:px-10">{children}</main>
        <div className="lg:hidden flex justify-center pb-4"><SignOutButton /></div>
        <SiteFooter />
      </div>
      <Toaster />
    </div>
  );
}
