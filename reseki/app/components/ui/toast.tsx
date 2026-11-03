"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

/** Aviso flotante mínimo (sin dependencias). Llamar a toast("texto") desde cualquier componente cliente. */
type Toast = { text: string; tone: "success" | "error"; id: number };
let listener: ((t: Toast) => void) | null = null;

export function toast(text: string, tone: Toast["tone"] = "success") {
  listener?.({ text, tone, id: Date.now() });
}

export function Toaster() {
  const [current, setCurrent] = useState<Toast | null>(null);
  useEffect(() => {
    listener = setCurrent;
    return () => { listener = null; };
  }, []);
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setCurrent(null), 3200);
    return () => clearTimeout(t);
  }, [current]);

  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-[calc(20px+env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
      {current && (
        <div key={current.id} className="flex max-w-full items-center gap-2.5 rounded-md border border-border bg-surface px-3.5 py-2.5 text-[13.5px] shadow-card">
          {current.tone === "success" ? <CheckCircle2 className="size-4 text-success" /> : <AlertCircle className="size-4 text-danger" />}
          {current.text}
        </div>
      )}
    </div>
  );
}
