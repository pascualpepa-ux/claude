"use client";

import { useState } from "react";
import { useIdioma } from "./ProveedorIdioma";

/** Arranca el checkout de Stripe para la suscripción mensual y redirige para pagar. */
export function BotonSuscribirme() {
  const { t } = useIdioma();
  const P = t.premium;
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={cargando}
        onClick={async () => {
          setCargando(true);
          setError("");
          try {
            const res = await fetch("/api/cuenta/suscribir", { method: "POST" });
            const cuerpo = await res.json().catch(() => ({}));
            if (res.ok && cuerpo.url) {
              window.location.href = cuerpo.url;
              return;
            }
            setError(res.status === 429 ? P.errorLimite : P.errorNoSePudo);
          } catch {
            setError(P.errorSinInternet);
          } finally {
            setCargando(false);
          }
        }}
        className="rounded-xl bg-amber-500 px-5 py-3 font-medium text-arena-950 transition hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50"
      >
        {cargando ? P.suscribiendo : P.suscribirme}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
