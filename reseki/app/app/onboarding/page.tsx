import { ArrowLeft, Check, FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { finishOnboarding } from "@/app/onboarding/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { Logo } from "@/components/logo";
import { ConnectDemoForm } from "@/components/settings/connect-form";
import { ToneForm } from "@/components/settings/tone-form";
import { SignOutButton } from "@/components/sign-out-button";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { sampleReviewFor } from "@/lib/demo";
import { isDemoMode } from "@/lib/env";
import { requireRestaurant } from "@/lib/session";

export const metadata: Metadata = { title: "Bienvenida" };
export const dynamic = "force-dynamic";

/**
 * Onboarding en 3 pasos (?paso=1|2|3):
 *  1. Conectar la ficha de Google (en modo demo, una ficha de ejemplo)
 *  2. Elegir el tono, con vista previa real de la IA
 *  3. Respuesta automática y emails
 */
export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ paso?: string; error?: string }> }) {
  const { restaurant } = await requireRestaurant();
  if (restaurant.onboarding_completed_at) redirect("/panel");

  const { paso, error } = await searchParams;
  const connected = Boolean(restaurant.google_connected_at);
  // Sin ficha conectada no se puede pasar del paso 1.
  const step = !connected ? 1 : paso === "3" ? 3 : 2;

  return (
    <div className="min-h-dvh bg-bg-subtle">
      <header className="border-b border-border bg-bg">
        <div className="mx-auto flex h-15 max-w-[1040px] items-center justify-between gap-4 px-4 sm:px-8">
          <Logo href="/onboarding" />
          <div className="flex items-center gap-3">
            <span className="flex gap-1" aria-label={`Paso ${step} de 3`}>
              {[1, 2, 3].map((i) => (
                <i key={i} className={`block h-[3px] w-7 rounded-full ${i <= step ? "bg-fg" : "bg-border"}`} />
              ))}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1040px] px-4 py-10 sm:px-8 sm:py-12">
        <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-fg-muted">Paso {step} de 3</p>

        {step === 1 && (
          <>
            <h1 className="mt-2 text-[28px] font-semibold">Conecta tu ficha de Google</h1>
            <p className="mt-2 max-w-[560px] text-fg-muted">
              Reseki necesita acceso a tu perfil de empresa para leer las reseñas y publicar las respuestas en tu nombre.
            </p>
            <div className="mt-8 flex max-w-[560px] flex-col gap-5 rounded-lg border border-border bg-surface p-6 shadow-xs sm:p-7">
              <ul className="flex flex-col gap-2.5 text-[14.5px]">
                {["Leer las reseñas de tu ficha", "Publicar respuestas como propietario", "Nada más: no tocamos horarios, fotos ni datos de tu negocio"].map((t) => (
                  <li key={t} className="flex gap-2.5"><Check className="mt-0.5 size-4 text-accent" strokeWidth={1.75} />{t}</li>
                ))}
              </ul>
              {isDemoMode ? (
                <>
                  <Alert tone="info">
                    <span className="inline-flex items-center gap-1.5 font-medium text-fg"><FlaskConical className="size-3.5" />Modo demo</span>
                    <br />
                    Mientras Google aprueba el acceso a su API, Reseki crea una ficha con reseñas de ejemplo para que pruebes todo el flujo. No se publica nada en Google.
                  </Alert>
                  <ConnectDemoForm />
                </>
              ) : (
                <Alert tone="info">La conexión real con Google llega en la fase 8.</Alert>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="mt-2 text-[28px] font-semibold">¿Cómo quieres sonar?</h1>
            <p className="mt-2 text-fg-muted">Lo puedes cambiar cuando quieras desde Configuración.</p>
            <div className="mt-8">
              <ToneForm
                mode="onboarding"
                sample={sampleReviewFor(restaurant.business_type)}
                initial={{
                  tone: restaurant.tone,
                  use_tu: restaurant.use_tu,
                  signature: restaurant.signature,
                  extra_instructions: restaurant.extra_instructions || "Invita siempre a volver.",
                }}
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="mt-2 text-[28px] font-semibold">Últimos ajustes</h1>
            <p className="mt-2 text-fg-muted">Decide qué se publica solo y qué te avisamos por email.</p>
            {error && <Alert tone="error" className="mt-6 max-w-[620px]">No hemos podido guardar. Vuelve a intentarlo.</Alert>}
            <form action={finishOnboarding} className="mt-8 max-w-[620px]">
              <div className="divide-y divide-border rounded-lg border border-border bg-surface shadow-xs">
                <Option id="auto_publish_positive" defaultChecked={restaurant.auto_publish_positive}
                  title="Publicar automáticamente las reseñas de 4 y 5 estrellas"
                  text="La respuesta sale en cuanto llega la reseña. Las de 1 a 3 estrellas siempre esperan tu aprobación." />
                <Option id="weekly_summary_email" defaultChecked={restaurant.weekly_summary_email}
                  title="Resumen semanal por email"
                  text="Cada lunes: puntuación media, quejas y elogios frecuentes, y reseñas pendientes." />
                <Option id="negative_alert_email" defaultChecked={restaurant.negative_alert_email}
                  title="Aviso de reseñas negativas"
                  text="Un email en cuanto llega una reseña de 1 o 2 estrellas." />
              </div>
              <div className="mt-7 flex justify-between gap-3">
                <Link href="/onboarding?paso=2" className={buttonVariants({ variant: "ghost" })}><ArrowLeft />Atrás</Link>
                <SubmitButton pendingText="Preparando tu panel…">Ir al panel</SubmitButton>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

function Option({ id, title, text, defaultChecked }: { id: string; title: string; text: string; defaultChecked: boolean }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4 px-6 py-5">
      <span>
        <span className="block text-[15px] font-medium">{title}</span>
        <span className="mt-1 block max-w-[46ch] text-[13.5px] text-fg-muted">{text}</span>
      </span>
      <Switch id={id} name={id} defaultChecked={defaultChecked} className="mt-1" />
    </label>
  );
}
