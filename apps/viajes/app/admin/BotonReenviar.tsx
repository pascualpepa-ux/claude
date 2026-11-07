"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Idioma } from "@/lib/idioma";

/** Reenvía el email de confirmación a los suscriptores que no confirmaron (no los confirma: lo tienen que hacer ellos). */
export function BotonReenviar({ idioma, cantidad }: { idioma: Idioma; cantidad: number }) {
  const router = useRouter();
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const es = idioma === "es";
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={ocupado}
        onClick={async () => {
          setOcupado(true);
          const res = await fetch("/api/admin/suscriptores", { method: "POST" }).catch(() => null);
          const j = res?.ok ? await res.json() : null;
          setAviso(
            j
              ? es
                ? `Listo: se reenvió a ${j.enviados}${j.fallidos ? ` (${j.fallidos} no se pudieron, probá en una hora)` : ""}.`
                : `Done: resent to ${j.enviados}${j.fallidos ? ` (${j.fallidos} failed, try in an hour)` : ""}.`
              : es
                ? "No se pudo reenviar. Probá de nuevo."
                : "Couldn't resend. Try again.",
          );
          setOcupado(false);
          router.refresh();
        }}
        className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
      >
        {ocupado ? (es ? "Enviando…" : "Sending…") : es ? `Reenviar el email de confirmación a los ${cantidad} sin confirmar` : `Resend the confirmation email to the ${cantidad} unconfirmed`}
      </button>
      {aviso && <p role="status" className="text-sm text-arena-700 dark:text-arena-300">{aviso}</p>}
    </div>
  );
}
