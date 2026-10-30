"use client";

import { useState } from "react";
import Link from "next/link";
import { List, X } from "@phosphor-icons/react/dist/ssr";
import { YOUTUBE_URL } from "@/lib/seo";
import { Marca } from "./Logo";
import { SelectorIdioma } from "./SelectorIdioma";
import { useIdioma } from "./ProveedorIdioma";

const enlace =
  "shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-arena-800 transition hover:bg-arena-100 dark:text-arena-200 dark:hover:bg-arena-800";
const enlaceMenu =
  "block rounded-xl px-4 py-3 text-base font-medium text-arena-800 transition hover:bg-arena-100 dark:text-arena-200 dark:hover:bg-arena-800";

export function Encabezado() {
  const { idioma, t } = useIdioma();
  const [abierto, setAbierto] = useState(false);

  const textoVuelos = idioma === "es" ? "Vuelos y hoteles" : "Flights & hotels";
  const textoContacto = idioma === "es" ? "Contacto" : "Contact";

  return (
    <header className="sticky top-0 z-30 border-b border-arena-200/80 bg-arena-50/90 backdrop-blur dark:border-arena-800/80 dark:bg-arena-950/90">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={t.encabezado.inicio}>
          <Marca alto={34} prioridad />
          <span className="hidden text-lg font-bold tracking-tight text-oliva-700 min-[400px]:inline dark:text-arena-100">
            Rumbo <span className="hidden lg:inline">Traveling</span>
          </span>
        </Link>

        {/* Pantallas grandes: todos los links en texto, en la misma línea. */}
        <div className="hidden items-center gap-1 sm:flex">
          {process.env.NEXT_PUBLIC_RESERVAS === "1" && (
            <Link href="/reservar" className={enlace}>
              {textoVuelos}
            </Link>
          )}
          <Link href="/guias" className={enlace}>
            {t.encabezado.guias}
          </Link>
          <Link href="/contacto" className={enlace}>
            {textoContacto}
          </Link>
          <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className={enlace}>
            YouTube
          </a>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <SelectorIdioma />
          <Link
            href="/planificar"
            className="hidden shrink-0 rounded-xl bg-oliva-700 px-3 py-2 text-sm font-medium whitespace-nowrap text-white transition hover:bg-oliva-800 active:scale-[0.98] sm:inline-block sm:px-4 dark:bg-oliva-300 dark:text-arena-950 dark:hover:bg-oliva-200"
          >
            {t.encabezado.planificar}
          </Link>
          {/* Pantallas chicas: todo lo de arriba se junta acá, en texto, dentro del menú. */}
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-label={idioma === "es" ? "Abrir menú" : "Open menu"}
            className="flex shrink-0 items-center justify-center rounded-xl p-2 text-arena-800 transition hover:bg-arena-100 sm:hidden dark:text-arena-200 dark:hover:bg-arena-800"
          >
            {abierto ? <X size={22} aria-hidden /> : <List size={22} aria-hidden />}
          </button>
        </div>
      </nav>

      {abierto && (
        <div className="border-t border-arena-200/80 bg-arena-50 px-4 py-2 sm:hidden dark:border-arena-800/80 dark:bg-arena-950">
          <div className="mx-auto flex max-w-6xl flex-col gap-0.5">
            {process.env.NEXT_PUBLIC_RESERVAS === "1" && (
              <Link href="/reservar" className={enlaceMenu} onClick={() => setAbierto(false)}>
                {textoVuelos}
              </Link>
            )}
            <Link href="/guias" className={enlaceMenu} onClick={() => setAbierto(false)}>
              {t.encabezado.guias}
            </Link>
            <Link href="/contacto" className={enlaceMenu} onClick={() => setAbierto(false)}>
              {textoContacto}
            </Link>
            <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className={enlaceMenu}>
              YouTube
            </a>
            <Link
              href="/planificar"
              onClick={() => setAbierto(false)}
              className="mt-2 rounded-xl bg-oliva-700 px-4 py-3 text-center text-base font-medium text-white transition hover:bg-oliva-800 dark:bg-oliva-300 dark:text-arena-950 dark:hover:bg-oliva-200"
            >
              {t.encabezado.planificar}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
