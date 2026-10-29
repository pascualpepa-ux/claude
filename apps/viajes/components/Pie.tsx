"use client";

import Link from "next/link";
import { EnvelopeSimple, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";
import { YOUTUBE_URL } from "@/lib/seo";
import { LogoCompleto } from "./Logo";
import { useIdioma } from "./ProveedorIdioma";

export function Pie() {
  const { t } = useIdioma();
  const anio = new Date().getFullYear();
  const link = "text-arena-700 hover:text-oliva-700 hover:underline dark:text-arena-300 dark:hover:text-oliva-300";
  return (
    <footer className="mt-auto border-t border-arena-200 bg-arena-100 dark:border-arena-800 dark:bg-arena-900">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-10 pb-6 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="flex flex-col items-start gap-3">
          <LogoCompleto ancho={132} />
          <p className="max-w-[36ch] text-sm text-arena-600 dark:text-arena-400">{t.pie.lema}</p>
          <p className="text-[11px] text-arena-500 dark:text-arena-400">
            <a href="https://www.geonames.org" target="_blank" rel="noopener noreferrer" className="hover:underline">
              {t.pie.creditos}
            </a>
          </p>
        </div>
        <div className="flex flex-col gap-8 sm:flex-row sm:gap-14">
        <nav aria-label={t.pie.navegacion}>
          <ul className="grid gap-2 text-sm">
            <li>
              <Link href="/planificar" className={link}>
                {t.pie.planificar}
              </Link>
            </li>
            <li>
              <Link href="/viaje?ejemplo=1" className={link}>
                {t.pie.ejemplo}
              </Link>
            </li>
            <li>
              <Link href="/guias" className={link}>
                {t.pie.guias}
              </Link>
            </li>
            <li>
              <Link href="/opinar" className={link}>
                {t.pie.opinar}
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <p className="text-sm font-semibold">{t.pie.escribinos}</p>
          <a href="mailto:info@rumbotraveling.com" className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-oliva-700 hover:underline dark:text-oliva-300">
            <EnvelopeSimple size={18} weight="duotone" aria-hidden />
            info@rumbotraveling.com
          </a>
          <p className="mt-2 text-sm">
            <Link href="/contacto" className={link}>
              {t.pie.contacto}
            </Link>
          </p>
          <a
            href={YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-oliva-700 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-oliva-800 dark:bg-oliva-300 dark:text-arena-950 dark:hover:bg-oliva-200"
          >
            <YoutubeLogo size={20} weight="fill" aria-hidden />
            {t.pie.youtube}
          </a>
        </div>
        </div>
      </div>
      <div className="border-t border-arena-200 dark:border-arena-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs text-arena-600 dark:text-arena-400">{t.pie.derechos(anio)}</p>
          <p className="flex items-center gap-3 text-xs text-arena-600 dark:text-arena-400">
            {t.pie.creadoPor}
            <Link
              href="/admin"
              prefetch={false}
              className="text-[11px] text-arena-400 hover:text-arena-600 hover:underline dark:text-arena-500 dark:hover:text-arena-300"
            >
              {t.pie.admin}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
