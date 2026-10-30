"use client";

import { useState } from "react";
import { useIdioma } from "./ProveedorIdioma";

/** Lleva al portal de Stripe para ver o cancelar la suscripción. */
export function BotonPortalPremium() {
  const { t } = useIdioma();
  const P = t.premium;
  const [cargando, setCargando] = useState(false);

  return (
    <button
      type="button"
      disabled={cargando}
      onClick={async () => {
        setCargando(true);
        try {
          const res = await fetch("/api/cuenta/portal", { method: "POST" });
          const cuerpo = await res.json().catch(() => ({}));
          if (res.ok && cuerpo.url) window.location.href = cuerpo.url;
        } finally {
          setCargando(false);
        }
      }}
      className="rounded-xl border border-arena-300 px-4 py-2 text-sm font-medium transition hover:bg-arena-100 disabled:opacity-50 dark:border-arena-700 dark:hover:bg-arena-800"
    >
      {cargando ? P.gestionando : P.gestionar}
    </button>
  );
}
