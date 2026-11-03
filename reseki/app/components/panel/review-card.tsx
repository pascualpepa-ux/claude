"use client";

import { Check, CornerDownRight, Loader2, Pencil, ShieldAlert, Sparkles, X } from "lucide-react";
import { useState, useTransition } from "react";
import { approveReply, regenerateReply, rejectReply, type Result } from "@/app/panel/actions";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/ui/stars";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import type { ReplyStatus } from "@/lib/types";

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  comment: string;
  language: string | null; // nombre legible ("Inglés")
  ago: string; // "hace 2 h"
  reply: {
    id: string;
    status: ReplyStatus;
    suggested: string;
    final: string | null;
    automatic: boolean;
    edited: boolean;
    publishedAgo: string | null;
    error: string | null;
    fromGoogle?: boolean; // ya estaba respondida en Google antes de usar Reseki
  } | null;
}

/** Tarjeta de una reseña con su respuesta: aprobar, editar, rechazar o generar otra. */
export function ReviewCard({ item }: { item: ReviewItem }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.reply?.suggested ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const run = (key: string, fn: () => Promise<Result>, after?: () => void) => {
    setBusy(key);
    startTransition(async () => {
      const res = await fn();
      setBusy(null);
      if (res.error) toast(res.error, "error");
      else {
        if (res.message) toast(res.message);
        after?.();
      }
    });
  };

  const initials = item.author.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const reply = item.reply;

  return (
    <article className="flex flex-col gap-3.5 rounded-lg border border-border bg-surface p-5">
      <header className="flex flex-wrap items-start gap-3">
        <span className="grid size-[34px] shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-[13px] font-semibold text-fg-muted">{initials}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{item.author}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-fg-muted">
            <Stars value={item.rating} />
            <span>{item.ago}</span>
            {item.language && <span>{item.language}</span>}
          </p>
        </div>
        {reply && reply.status !== "publicada" && item.rating <= 3 && (
          <span className="inline-flex h-[22px] items-center gap-1 rounded-full border border-accent-line bg-accent-soft px-2 text-[12px] font-medium text-accent max-sm:order-last max-sm:ml-[46px]">
            <ShieldAlert className="size-3" strokeWidth={1.75} />
            Requiere tu aprobación
          </span>
        )}
      </header>

      {item.comment ? <p className="max-w-[72ch] whitespace-pre-line text-[14.5px]">{item.comment}</p> : <p className="text-[14px] italic text-fg-muted">Sin comentario, solo estrellas.</p>}

      <div className="flex flex-col gap-2.5 border-t border-border pt-3.5">
        {/* Generando todavía */}
        {!reply && (
          <p className="flex items-center gap-2 text-[13.5px] text-fg-muted">
            <Loader2 className="size-4 animate-spin" /> Preparando la respuesta…
          </p>
        )}

        {/* Publicada */}
        {reply?.status === "publicada" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-fg-muted">
                <CornerDownRight className="size-3.5" strokeWidth={1.75} />
                Respuesta del propietario{reply.publishedAgo ? ` · ${reply.publishedAgo}` : ""}
              </span>
              <span className="inline-flex h-[22px] items-center gap-1 rounded-full bg-success-soft px-2 text-[12px] font-medium text-success">
                <Check className="size-3" />
                {reply.fromGoogle ? "Respondida por ti en Google" : reply.automatic ? "Publicada automáticamente" : reply.edited ? "Editada y aprobada por ti" : "Aprobada por ti"}
              </span>
            </div>
            <p className="whitespace-pre-line rounded-md border border-border bg-bg-subtle px-3.5 py-3 text-sm">{reply.final ?? reply.suggested}</p>
          </>
        )}

        {/* Error al generar */}
        {reply?.status === "error" && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-border-strong px-3.5 py-3 text-[13.5px] text-fg-muted">
            <span>{reply.error ?? "No hemos podido generar la respuesta."}</span>
            <Button size="sm" onClick={() => run("regen", () => regenerateReply(reply.id))} disabled={!!busy}>
              {busy === "regen" ? <Loader2 className="animate-spin" /> : <Sparkles />} Reintentar
            </Button>
          </div>
        )}

        {/* Rechazada */}
        {reply?.status === "rechazada" && !editing && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-border-strong px-3.5 py-3 text-[13.5px] text-fg-muted">
            <span>Has descartado la respuesta sugerida.</span>
            <span className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => { setDraft(""); setEditing(true); }} disabled={!!busy}>Escribir la mía</Button>
              <Button size="sm" onClick={() => run("regen", () => regenerateReply(reply.id))} disabled={!!busy}>
                {busy === "regen" ? <Loader2 className="animate-spin" /> : <Sparkles />} Generar otra
              </Button>
            </span>
          </div>
        )}

        {/* Pendiente (o escribiendo la propia tras rechazar) */}
        {reply && (reply.status === "pendiente" || (reply.status === "rechazada" && editing)) && (
          <>
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-accent">
              <Sparkles className="size-3.5" strokeWidth={1.75} />
              {reply.status === "rechazada" ? "Tu respuesta" : `Respuesta sugerida${item.language ? ` · ${item.language.toLowerCase()}` : ""}`}
            </span>
            {editing ? (
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={5} autoFocus aria-label="Editar respuesta" />
            ) : (
              <p className="whitespace-pre-line rounded-md border border-border bg-bg-subtle px-3.5 py-3 text-sm">{reply.suggested}</p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              {editing ? (
                <>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setDraft(reply.suggested); }} disabled={!!busy}>Cancelar</Button>
                  <Button size="sm" onClick={() => run("approve", () => approveReply(reply.id, draft))} disabled={!!busy || draft.trim().length < 2}>
                    {busy === "approve" ? <Loader2 className="animate-spin" /> : <Check />} Guardar y publicar
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="ghost" onClick={() => run("reject", () => rejectReply(reply.id))} disabled={!!busy}>
                    {busy === "reject" ? <Loader2 className="animate-spin" /> : <X />} Rechazar
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { setDraft(reply.suggested); setEditing(true); }} disabled={!!busy}>
                    <Pencil /> Editar
                  </Button>
                  <Button size="sm" onClick={() => run("approve", () => approveReply(reply.id))} disabled={!!busy}>
                    {busy === "approve" ? <Loader2 className="animate-spin" /> : <Check />} Aprobar y publicar
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}
