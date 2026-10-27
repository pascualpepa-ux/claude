"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { COOKIE_IDIOMA, IDIOMAS } from "@/lib/idioma";
import { PARAM_IDIOMA } from "@/lib/seo";
import { useIdioma } from "./ProveedorIdioma";

/** Botones ES / EN. Guarda la elección por un año y vuelve a pedir la página en ese idioma. */
export function SelectorIdioma() {
  const { idioma, t } = useIdioma();
  const router = useRouter();
  const [cambiando, iniciar] = useTransition();

  return (
    <div
      role="group"
      aria-label={t.encabezado.idioma}
      className={`flex shrink-0 rounded-xl border border-arena-300 p-0.5 text-xs font-semibold dark:border-arena-700 ${cambiando ? "opacity-60" : ""}`}
    >
      {IDIOMAS.map((opcion) => (
        <button
          key={opcion}
          type="button"
          lang={opcion}
          aria-pressed={idioma === opcion}
          onClick={() => {
            if (opcion === idioma) return;
            document.cookie = `${COOKIE_IDIOMA}=${opcion}; path=/; max-age=31536000; samesite=lax`;
            document.documentElement.lang = opcion;
            // Si la dirección trae ?lang=, se actualiza: si no, seguiría mandando el idioma anterior.
            const url = new URL(window.location.href);
            if (url.searchParams.has(PARAM_IDIOMA)) {
              url.searchParams.set(PARAM_IDIOMA, opcion);
              iniciar(() => router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false }));
            } else {
              iniciar(() => router.refresh());
            }
          }}
          className={`rounded-[10px] px-2 py-1.5 uppercase transition ${
            idioma === opcion
              ? "bg-oliva-700 text-white dark:bg-oliva-300 dark:text-arena-950"
              : "text-arena-600 hover:text-oliva-700 dark:text-arena-400 dark:hover:text-oliva-300"
          }`}
        >
          {opcion}
        </button>
      ))}
    </div>
  );
}
