"use client";

import { useEffect, useState } from "react";
import { CheckCircle, CircleNotch, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { useIdioma } from "@/components/ProveedorIdioma";
import type { Idioma } from "@/lib/idioma";
import { PAGINAS } from "@/lib/textos-suscripcion";

type Estado = "cargando" | "ok" | "vencido" | "invalido" | "error";

/**
 * La confirmación se hace desde la página (no con solo abrir el link): los antivirus de algunos correos
 * abren los links para revisarlos y no deben confirmar por la persona. Para la persona es igual:
 * apretó "Confirmar" en el email y ve que quedó suscripta.
 */
export function Confirmar({ token }: { token: string }) {
  const { idioma: idiomaWeb } = useIdioma();
  const [estado, setEstado] = useState<Estado>("cargando");
  const [idioma, setIdioma] = useState<Idioma>(idiomaWeb);

  const confirmar = () => {
    setEstado("cargando");
    fetch("/api/suscripcion/confirmar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: token }) })
      .then((r) => r.json())
      .then((j: { estado: Estado; idioma?: Idioma | null }) => {
        if (j.idioma) setIdioma(j.idioma);
        setEstado(["ok", "vencido", "invalido"].includes(j.estado) ? j.estado : "error");
      })
      .catch(() => setEstado("error"));
  };
  useEffect(() => {
    if (token) confirmar();
    else setEstado("invalido");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const T = PAGINAS[idioma];
  const titulo = { cargando: T.confirmando, ok: T.ok, vencido: T.vencido, invalido: T.invalido, error: T.error }[estado];
  const bajada = { cargando: "", ok: T.okBajada, vencido: T.vencidoBajada, invalido: T.invalidoBajada, error: T.errorBajada }[estado];

  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center md:py-28" lang={idioma}>
      {estado === "cargando" ? (
        <CircleNotch size={48} className="animate-spin text-oliva-700 motion-reduce:animate-none dark:text-oliva-300" aria-hidden />
      ) : estado === "ok" ? (
        <CheckCircle size={56} weight="fill" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
      ) : (
        <WarningCircle size={56} weight="duotone" className="text-amber-600 dark:text-amber-400" aria-hidden />
      )}
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-balance" role="status">
        {titulo}
      </h1>
      {bajada && <p className="mt-3 text-arena-600 dark:text-arena-400">{bajada}</p>}
      {estado !== "cargando" && (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {estado === "error" && (
            <button type="button" onClick={confirmar} className="rounded-xl border border-arena-300 px-5 py-3 font-medium transition hover:bg-arena-100 dark:border-arena-700 dark:hover:bg-arena-800">
              {T.reintentar}
            </button>
          )}
          <a href="/" className="rounded-xl bg-oliva-700 px-5 py-3 font-medium text-white transition hover:bg-oliva-800 active:scale-[0.98] dark:bg-oliva-300 dark:text-arena-950">
            {T.volver}
          </a>
        </div>
      )}
    </main>
  );
}
