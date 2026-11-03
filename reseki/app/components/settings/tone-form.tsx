"use client";

import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { previewTone, saveTone, type ActionState } from "@/app/onboarding/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stars } from "@/components/ui/stars";
import { Textarea } from "@/components/ui/textarea";
import type { ReplyTone } from "@/lib/types";
import { cn } from "@/lib/utils";

const TONES: { value: ReplyTone; label: string; hint: string }[] = [
  { value: "cercano", label: "Cercano", hint: "Cálido y natural, como en la barra." },
  { value: "formal", label: "Formal", hint: "Cortés y cuidado. Para alta cocina." },
  { value: "divertido", label: "Divertido", hint: "Con chispa y algo de humor." },
];

export interface ToneValues {
  tone: ReplyTone;
  use_tu: boolean;
  signature: string;
  extra_instructions: string;
}

/**
 * Formulario del tono con vista previa generada por la IA.
 * Se usa en el onboarding (paso 2) y en Configuración.
 */
export function ToneForm({
  initial,
  sample,
  mode,
}: {
  initial: ToneValues;
  sample: { authorName: string; rating: number; comment: string };
  mode: "onboarding" | "settings";
}) {
  const [values, setValues] = useState(initial);
  const [state, action] = useActionState<ActionState, FormData>(saveTone, {});
  const [preview, setPreview] = useState<{ text?: string; error?: string }>({});
  const [pending, startPreview] = useTransition();
  const set = <K extends keyof ToneValues>(k: K, v: ToneValues[K]) => setValues((s) => ({ ...s, [k]: v }));

  const runPreview = () => startPreview(async () => setPreview(await previewTone(values)));

  return (
    <form action={action} className="grid items-start gap-6 lg:grid-cols-2">
      <input type="hidden" name="tone" value={values.tone} />
      <input type="hidden" name="use_tu" value={String(values.use_tu)} />
      {mode === "onboarding" && <input type="hidden" name="next" value="onboarding" />}

      <div className="flex min-w-0 flex-col gap-6 rounded-lg border border-border bg-surface p-6 shadow-xs sm:p-7">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[13px] font-medium">Tono</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                aria-pressed={values.tone === t.value}
                onClick={() => set("tone", t.value)}
                className={cn(
                  "flex flex-col gap-0.5 rounded-md border border-border bg-surface p-3 text-left transition-[border-color,box-shadow] hover:border-border-strong",
                  values.tone === t.value && "border-fg shadow-[0_0_0_1px_var(--fg)]",
                )}
              >
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-[12.5px] leading-snug text-fg-muted">{t.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[13px] font-medium">Trato al cliente</legend>
          <div className="inline-flex w-fit gap-0.5 rounded-md border border-border bg-surface-2 p-[3px]">
            {[
              { v: true, l: "Tutear" },
              { v: false, l: "De usted" },
            ].map((o) => (
              <button
                key={o.l}
                type="button"
                aria-pressed={values.use_tu === o.v}
                onClick={() => set("use_tu", o.v)}
                className={cn(
                  "h-7 rounded-[5px] px-3 text-[13px] font-medium text-fg-muted",
                  values.use_tu === o.v && "bg-surface text-fg shadow-xs",
                )}
              >
                {o.l}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signature">Firma</Label>
          <Input id="signature" name="signature" value={values.signature} maxLength={80}
            onChange={(e) => set("signature", e.target.value)} placeholder="Ej: El equipo de Casa Lumbre" />
          <span className="text-[13px] text-fg-muted">Aparece al final de cada respuesta.</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="extra_instructions">
            Indicaciones extra <span className="font-normal text-fg-subtle">· opcional</span>
          </Label>
          <Textarea id="extra_instructions" name="extra_instructions" value={values.extra_instructions} maxLength={1000}
            onChange={(e) => set("extra_instructions", e.target.value)}
            placeholder="Ej: Invita siempre a volver. Para quejas, ofrece escribir a hola@turestaurante.com." />
          <span className="text-[13px] text-fg-muted">La IA nunca inventará descuentos ni datos que no pongas aquí.</span>
        </div>

        {state.error && <Alert tone="error">{state.error}</Alert>}
        {state.ok && <Alert tone="success">Cambios guardados. Se aplicarán a las próximas respuestas.</Alert>}

        <div className="flex justify-end">
          <SubmitButton pendingText="Guardando…">
            {mode === "onboarding" ? <>Continuar <ArrowRight /></> : "Guardar cambios"}
          </SubmitButton>
        </div>
      </div>

      {/* Vista previa */}
      <div className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-xs lg:sticky lg:top-6">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-fg-muted">Vista previa</span>
          <span className="rounded-full border border-border px-2 py-0.5 text-[12px] text-fg-muted">Reseña de ejemplo</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="grid size-[34px] place-items-center rounded-full border border-border bg-surface-2 text-[13px] font-semibold text-fg-muted">PM</span>
          <div>
            <p className="text-sm font-medium">{sample.authorName}</p>
            <Stars value={sample.rating} />
          </div>
        </div>
        <p className="text-[14.5px]">{sample.comment}</p>

        <div className="min-h-[120px] rounded-md border border-accent-line bg-accent-soft px-4 py-3.5 text-sm">
          <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-accent">
            <Sparkles className="size-3.5" strokeWidth={1.75} />
            Así respondería Reseki
          </p>
          {pending ? (
            <p className="flex items-center gap-2 text-fg-muted"><Loader2 className="size-4 animate-spin" /> Escribiendo…</p>
          ) : preview.text ? (
            <p className="whitespace-pre-line">{preview.text}</p>
          ) : preview.error ? (
            <p className="text-danger">{preview.error}</p>
          ) : (
            <p className="text-fg-muted">Elige las opciones y pulsa «Probar» para ver una respuesta real escrita por la IA.</p>
          )}
        </div>
        <Button type="button" variant="secondary" onClick={runPreview} disabled={pending} className="self-start">
          <Sparkles strokeWidth={1.6} />
          {preview.text ? "Probar otra vez" : "Probar"}
        </Button>
      </div>
    </form>
  );
}
