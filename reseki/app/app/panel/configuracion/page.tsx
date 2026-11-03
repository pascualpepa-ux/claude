import type { Metadata } from "next";
import { NotificationsForm } from "@/components/settings/notifications-form";
import { ToneForm } from "@/components/settings/tone-form";
import { SAMPLE_REVIEW } from "@/lib/demo";
import { requireRestaurant } from "@/lib/session";

export const metadata: Metadata = { title: "Configuración" };

/** Configuración: tono de las respuestas, respuesta automática y emails. */
export default async function SettingsPage() {
  const { user, restaurant } = await requireRestaurant();
  return (
    <>
      <div className="border-b border-border pb-6 pt-8">
        <h1 className="text-[22px] font-semibold">Configuración</h1>
        <p className="mt-1 text-[13px] text-fg-muted">Los cambios se aplican a las respuestas nuevas.</p>
      </div>

      <section className="mt-8">
        <h2 className="text-base font-semibold">Tono de las respuestas</h2>
        <div className="mt-4">
          <ToneForm mode="settings" sample={SAMPLE_REVIEW}
            initial={{ tone: restaurant.tone, use_tu: restaurant.use_tu, signature: restaurant.signature, extra_instructions: restaurant.extra_instructions }} />
        </div>
      </section>

      <section className="mt-12 max-w-[620px]">
        <h2 className="text-base font-semibold">Publicación y emails</h2>
        <div className="mt-4">
          <NotificationsForm email={user.email ?? ""}
            initial={{ auto_publish_positive: restaurant.auto_publish_positive, weekly_summary_email: restaurant.weekly_summary_email, negative_alert_email: restaurant.negative_alert_email }} />
        </div>
      </section>
    </>
  );
}
