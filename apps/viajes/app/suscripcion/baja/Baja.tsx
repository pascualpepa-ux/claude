"use client";

import { useState } from "react";
import { CheckCircle, EnvelopeSimple, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import type { Idioma } from "@/lib/idioma";
import { PAGINAS } from "@/lib/textos-suscripcion";

/** La baja se hace al apretar el botón (no con solo abrir el link, que los antivirus del correo abren solos). */
export function Baja({ token, email, idioma, yaDeBaja }: { token: string; email: string | null; idioma: Idioma; yaDeBaja: boolean }) {
  const T = PAGINAS[idioma];
  const [estado, setEstado] = useState<"inicio" | "enviando" | "ok" | "error">(yaDeBaja ? "ok" : "inicio");

  const bajar = async () => {
    setEstado("enviando");
    try {
      const r = await fetch("/api/suscripcion/baja", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: token }) });
      const j = await r.json();
      setEstado(j.ok ? "ok" : "error");
    } catch {
      setEstado("error");
    }
  };

  if (!email) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center md:py-28" lang={idioma}>
        <WarningCircle size={56} weight="duotone" className="text-amber-600 dark:text-amber-400" aria-hidden />
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">{T.invalido}</h1>
        <p className="mt-3 text-arena-600 dark:text-arena-400">{T.invalidoBajada}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center md:py-28" lang={idioma}>
      {estado === "ok" ? (
        <CheckCircle size={56} weight="fill" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
      ) : (
        <EnvelopeSimple size={56} weight="duotone" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
      )}
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-balance" role="status">
        {estado === "ok" ? T.bajaOk : T.bajaTitulo}
      </h1>
      <p className="mt-3 text-arena-600 dark:text-arena-400">{estado === "ok" ? T.bajaOkBajada : T.bajaBajada(email)}</p>
      {estado !== "ok" && (
        <button
          type="button"
          onClick={bajar}
          disabled={estado === "enviando"}
          className="mt-8 rounded-xl bg-oliva-700 px-5 py-3 font-medium text-white transition hover:bg-oliva-800 active:scale-[0.98] disabled:opacity-60 dark:bg-oliva-300 dark:text-arena-950"
        >
          {estado === "enviando" ? T.bajando : T.bajaBoton}
        </button>
      )}
      {estado === "error" && (
        <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-400">
          {T.bajaError}
        </p>
      )}
      {estado === "ok" && (
        <a href="/" className="mt-8 rounded-xl border border-arena-300 px-5 py-3 font-medium transition hover:bg-arena-100 dark:border-arena-700 dark:hover:bg-arena-800">
          {T.volver}
        </a>
      )}
    </main>
  );
}
