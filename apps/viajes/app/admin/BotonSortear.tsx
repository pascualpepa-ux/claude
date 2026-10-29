"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Idioma } from "@/lib/idioma";

export function BotonSortear({ idioma }: { idioma: Idioma }) {
  const router = useRouter();
  const [estado, setEstado] = useState<"inicio" | "sorteando" | "error">("inicio");
  const es = idioma === "es";
  return (
    <div>
      <button
        type="button"
        disabled={estado === "sorteando"}
        onClick={async () => {
          if (!confirm(es ? "¿Elegir uno al azar como sugerencia? Queda anotado en la lista." : "Pick one at random as a suggestion? It is noted in the list.")) return;
          setEstado("sorteando");
          const res = await fetch("/api/admin/sorteo", { method: "POST" }).catch(() => null);
          setEstado(res?.ok ? "inicio" : "error");
          router.refresh();
        }}
        className="rounded-xl bg-oliva-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-oliva-800 disabled:opacity-60 dark:bg-oliva-300 dark:text-arena-950"
      >
        {estado === "sorteando" ? (es ? "Sorteando…" : "Drawing…") : es ? "Sugerir uno al azar" : "Suggest one at random"}
      </button>
      {estado === "error" && <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">{es ? "No se pudo sortear. Probá de nuevo." : "The draw failed. Try again."}</p>}
    </div>
  );
}

/** Botón de cada participante: lo deja anotado como ganador elegido por el dueño. */
export function BotonElegir({ email, idioma }: { email: string; idioma: Idioma }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const es = idioma === "es";
  return (
    <button
      type="button"
      disabled={ocupado}
      onClick={async () => {
        if (!confirm(es ? `¿Elegir a ${email} como ganador?` : `Pick ${email} as the winner?`)) return;
        setOcupado(true);
        await fetch("/api/admin/sorteo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => null);
        setOcupado(false);
        router.refresh();
      }}
      className="rounded-lg border border-oliva-300 px-3 py-1 text-xs font-semibold text-oliva-800 transition hover:bg-oliva-50 disabled:opacity-60 dark:border-oliva-700 dark:text-oliva-200 dark:hover:bg-oliva-900/40"
    >
      {es ? "Elegir ganador" : "Pick winner"}
    </button>
  );
}
