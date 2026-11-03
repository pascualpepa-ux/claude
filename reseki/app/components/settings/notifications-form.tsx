"use client";

import { useActionState } from "react";
import { saveNotifications, type Result } from "@/app/panel/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

const OPTIONS = [
  { id: "learn_from_past", title: "Aprender de mis respuestas anteriores", text: "La IA imita cómo respondes tú: las respuestas que ya tenías en Google y las que corriges a mano." },
  { id: "auto_publish_positive", title: "Publicar automáticamente 4 y 5 estrellas", text: "Las de 1 a 3 estrellas siempre esperan tu aprobación." },
  { id: "weekly_summary_email", title: "Resumen semanal por email", text: "Cada lunes: puntuación media, quejas y elogios frecuentes, y reseñas pendientes." },
  { id: "negative_alert_email", title: "Aviso de reseñas negativas", text: "Un email en cuanto llega una reseña de 1 o 2 estrellas." },
] as const;

export function NotificationsForm({ initial, email, examples }: { initial: Record<(typeof OPTIONS)[number]["id"], boolean>; email: string; examples: number }) {
  const [state, action] = useActionState<Result, FormData>(saveNotifications, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {OPTIONS.map((o) => (
          <label key={o.id} htmlFor={o.id} className="flex cursor-pointer items-start justify-between gap-4 px-5 py-4">
            <span>
              <span className="block text-[14.5px] font-medium">{o.title}</span>
              <span className="mt-0.5 block text-[13px] text-fg-muted">{o.text}</span>
              {o.id === "learn_from_past" && (
                <span className="mt-1 block text-[12.5px] text-fg-subtle">
                  {examples ? `Ahora mismo aprende de ${examples} ${examples === 1 ? "respuesta tuya" : "respuestas tuyas"}.` : "Todavía no hay respuestas tuyas de las que aprender."}
                </span>
              )}
            </span>
            <Switch id={o.id} name={o.id} defaultChecked={initial[o.id]} className="mt-1" />
          </label>
        ))}
      </div>
      <p className="text-[13px] text-fg-muted">Los emails se envían a <b className="font-medium text-fg">{email}</b>.</p>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && <Alert tone="success">{state.message}</Alert>}
      <div className="flex justify-end"><SubmitButton pendingText="Guardando…">Guardar ajustes</SubmitButton></div>
    </form>
  );
}
