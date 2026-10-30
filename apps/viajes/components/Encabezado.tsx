"use client";

import Link from "next/link";
import { Marca } from "./Logo";
import { SelectorIdioma } from "./SelectorIdioma";
import { useIdioma } from "./ProveedorIdioma";

export function Encabezado() {
  const { idioma, t } = useIdioma();
  return (
    <header className="sticky top-0 z-30 border-b border-arena-200/80 bg-arena-50/90 backdrop-blur dark:border-arena-800/80 dark:bg-arena-950/90">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={t.encabezado.inicio}>
          <Marca alto={34} prioridad />
          <span className="hidden text-lg font-bold tracking-tight text-oliva-700 min-[400px]:inline dark:text-arena-100">
            Rumbo <span className="hidden md:inline">Traveling</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {process.env.NEXT_PUBLIC_RESERVAS === "1" && (
            <Link
              href="/reservar"
              className="hidden shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-oliva-800 transition hover:bg-arena-100 sm:inline-block dark:text-oliva-200 dark:hover:bg-arena-800"
            >
              {idioma === "es" ? "Vuelos y hoteles" : "Flights & hotels"}
            </Link>
          )}
          <Link
            href="/guias"
            className="hidden shrink-0 rounded-xl px-3 py-2 text-sm font-medium text-arena-800 transition hover:bg-arena-100 sm:inline-block dark:text-arena-200 dark:hover:bg-arena-800"
          >
            {t.encabezado.guias}
          </Link>
          <SelectorIdioma />
          <Link
            href="/planificar"
            className="shrink-0 rounded-xl bg-oliva-700 px-3 py-2 text-sm font-medium whitespace-nowrap text-white transition hover:bg-oliva-800 active:scale-[0.98] sm:px-4 dark:bg-oliva-300 dark:text-arena-950 dark:hover:bg-oliva-200"
          >
            {t.encabezado.planificar}
          </Link>
        </div>
      </nav>
      {/* En el celular no entra en el menú: va en una franja propia, siempre a la vista. */}
      {process.env.NEXT_PUBLIC_RESERVAS === "1" && (
        <Link
          href="/reservar"
          className="flex items-center justify-center gap-2 border-t border-arena-200/80 bg-oliva-700 px-4 py-2 text-sm font-semibold text-white sm:hidden dark:border-arena-800/80 dark:bg-oliva-300 dark:text-arena-950"
        >
          ✈️ {idioma === "es" ? "Comprá vuelos y hoteles acá" : "Book flights & hotels here"} →
        </Link>
      )}
    </header>
  );
}
