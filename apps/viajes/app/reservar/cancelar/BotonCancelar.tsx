"use client";

import { useState } from "react";
import { CheckCircle, CircleNotch } from "@phosphor-icons/react/dist/ssr";

export function BotonCancelar({ token, aviso }: { token: string; aviso: string }) {
  const [estado, setEstado] = useState<"inicio" | "cancelando" | "ok" | "error">("inicio");
  const [devolucion, setDevolucion] = useState("");
  if (estado === "ok") {
    return (
      <p role="status" className="flex items-center gap-2 rounded-xl bg-oliva-50 px-4 py-3 font-medium text-oliva-800 dark:bg-oliva-900/30 dark:text-oliva-200">
        <CheckCircle size={22} weight="fill" aria-hidden />
        Reserva cancelada. {devolucion} Te mandamos la confirmación por email.
      </p>
    );
  }
  return (
    <div className="grid gap-3">
      <button
        type="button"
        disabled={estado === "cancelando"}
        onClick={async () => {
          if (!window.confirm(aviso)) return;
          setEstado("cancelando");
          const r = await fetch("/api/reservas/cancelar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: token }) }).catch(() => null);
          const j = r ? await r.json().catch(() => ({})) : {};
          if (r?.ok && (j.estado === "ok" || j.estado === "ya")) {
            setDevolucion(j.devolucion > 0 ? `Devolución: ${Number(j.devolucion).toFixed(2)} ${j.moneda}.` : j.estado === "ya" ? "" : "Esta tarifa no tenía devolución.");
            setEstado("ok");
          } else setEstado("error");
        }}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
      >
        {estado === "cancelando" && <CircleNotch size={20} className="animate-spin motion-reduce:animate-none" aria-hidden />}
        {estado === "cancelando" ? "Cancelando…" : "Cancelar la reserva"}
      </button>
      {estado === "error" && <p role="alert" className="text-sm text-red-700 dark:text-red-400">No se pudo cancelar. Escribinos a info@rumbotraveling.com y lo resolvemos.</p>}
    </div>
  );
}
