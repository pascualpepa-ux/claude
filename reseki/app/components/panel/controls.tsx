"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { setAutoPublish, syncNow } from "@/app/panel/actions";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

/** Botón «Buscar nuevas». */
export function SyncButton() {
  const [pending, start] = useTransition();
  return (
    <Button variant="secondary" size="sm" disabled={pending}
      onClick={() => start(async () => { const r = await syncNow(); toast(r.error ?? r.message ?? "Listo", r.error ? "error" : "success"); })}>
      {pending ? <Loader2 className="animate-spin" /> : <RefreshCw strokeWidth={1.6} />}
      Buscar nuevas
    </Button>
  );
}

/** Interruptor de respuesta automática 4–5★ dentro del panel. */
export function AutoPublishToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <button
      type="button" role="switch" aria-checked={on} aria-label="Respuesta automática" disabled={pending}
      onClick={() => {
        const next = !on;
        setOn(next);
        start(async () => {
          const r = await setAutoPublish(next);
          if (r.error) { setOn(!next); toast(r.error, "error"); } else toast(r.message ?? "Guardado");
        });
      }}
      className="relative h-5 w-9 shrink-0 rounded-full bg-border-strong transition-colors aria-checked:bg-accent disabled:opacity-60 after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform aria-checked:after:translate-x-4"
    />
  );
}

/** Mientras haya respuestas generándose, refresca el panel cada 3 s (máx. 2 min). */
export function AutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const started = Date.now();
    const t = setInterval(() => {
      if (Date.now() - started > 120_000) return clearInterval(t);
      router.refresh();
    }, 3000);
    return () => clearInterval(t);
  }, [active, router]);
  return null;
}
