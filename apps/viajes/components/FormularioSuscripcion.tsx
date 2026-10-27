"use client";

import { useId, useState } from "react";
import { BellRinging, CheckCircle, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import type { TripPlan } from "@/lib/types";
import { useIdioma } from "./ProveedorIdioma";

/**
 * Suscripción a los avisos. Desde un viaje, manda también el viaje para vigilarlo.
 * El idioma que se guarda es el que la persona tiene elegido en la web en este momento.
 */
export function FormularioSuscripcion({ plan, compacto = false }: { plan?: TripPlan; compacto?: boolean }) {
  const { idioma, t } = useIdioma();
  const T = t.suscripcion;
  const id = useId();
  const [email, setEmail] = useState("");
  const [sitio, setSitio] = useState(""); // campo trampa para robots (invisible)
  const [estado, setEstado] = useState<"inicio" | "enviando" | "listo">("inicio");
  const [error, setError] = useState<string | null>(null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpio)) return setError(T.errores.email);
    setError(null);
    setEstado("enviando");
    try {
      const res = await fetch("/api/suscripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: limpio, idioma, plan, sitio }),
      });
      if (res.ok) return setEstado("listo");
      const j = await res.json().catch(() => ({}));
      setError(j.error === "email" ? T.errores.email : j.error === "limite" ? T.errores.limite : j.error === "envio" ? T.errores.envio : T.errores.general);
    } catch {
      setError(T.errores.general);
    }
    setEstado("inicio");
  };

  const caja = compacto ? "" : "rounded-2xl border border-arena-200 bg-papel p-4 dark:border-arena-800 dark:bg-arena-900";

  if (estado === "listo") {
    return (
      <div className={caja}>
        <p role="status" className="flex gap-2 text-sm text-oliva-800 dark:text-oliva-200">
          <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-oliva-700 dark:text-oliva-300" aria-hidden />
          {T.listo}
        </p>
        <button
          type="button"
          onClick={() => {
            setEstado("inicio");
            setEmail("");
          }}
          className="mt-2 text-sm text-arena-600 underline underline-offset-2 hover:text-arena-900 dark:text-arena-400 dark:hover:text-arena-100"
        >
          {T.otro}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className={caja}>
      <h2 className={`flex items-center gap-2 font-semibold ${compacto ? "text-sm" : ""}`}>
        <BellRinging size={20} weight="duotone" className="shrink-0 text-oliva-700 dark:text-oliva-300" aria-hidden />
        {plan ? T.tituloViaje : T.tituloPie}
      </h2>
      <p className="mt-1 text-sm text-arena-600 dark:text-arena-400">{T.bajada}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`${id}-email`} className="sr-only">
          {T.email}
        </label>
        <div className="relative min-w-0 flex-1">
          <EnvelopeSimple size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-arena-500" aria-hidden />
          <input
            id={`${id}-email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder={T.ejemplo}
            aria-invalid={!!error}
            aria-describedby={`${id}-spam${error ? ` ${id}-error` : ""}`}
            className="h-11 w-full rounded-xl border border-arena-300 bg-papel pr-3 pl-9 text-base placeholder:text-arena-500 focus:border-oliva-600 focus:ring-2 focus:ring-oliva-600/30 focus:outline-none dark:border-arena-700 dark:bg-arena-950"
          />
        </div>
        {/* Trampa para robots: oculta para las personas y los lectores de pantalla */}
        <input type="text" name="sitio" value={sitio} onChange={(e) => setSitio(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="h-11 shrink-0 rounded-xl bg-oliva-700 px-4 text-sm font-medium text-white transition hover:bg-oliva-800 active:scale-[0.98] disabled:opacity-60 dark:bg-oliva-300 dark:text-arena-950 dark:hover:bg-oliva-200"
        >
          {estado === "enviando" ? T.enviando : T.boton}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <p id={`${id}-spam`} className="mt-2 text-xs text-arena-500 dark:text-arena-400">
        {T.spam}
      </p>
    </form>
  );
}
