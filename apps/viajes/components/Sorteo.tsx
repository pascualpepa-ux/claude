"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Copy, Gift, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { SORTEO, enlaceSorteo } from "@/lib/textos-sorteo";
import type { Idioma } from "@/lib/idioma";
import { useIdioma } from "./ProveedorIdioma";

/** Barra fina arriba de todas las páginas mientras el sorteo está activo. */
export function BarraSorteo() {
  const { idioma } = useIdioma();
  const S = SORTEO[idioma];
  return (
    <Link
      href="/concurso"
      className="block bg-oliva-800 px-4 py-2 text-center text-sm font-medium text-arena-50 transition hover:bg-oliva-900 dark:bg-oliva-300 dark:text-arena-950 dark:hover:bg-oliva-200"
    >
      <Gift size={16} weight="fill" className="mr-1.5 inline -translate-y-px text-amber-300 dark:text-oliva-800" aria-hidden />
      {S.barra}
      <span className="ml-2 font-semibold underline underline-offset-2">{S.barraBoton} →</span>
    </Link>
  );
}

/** Cartel grande del sorteo (inicio y página del sorteo). */
export function CartelSorteo({ idioma, conBoton = true }: { idioma: Idioma; conBoton?: boolean }) {
  const S = SORTEO[idioma];
  return (
    <div className="relative isolate overflow-hidden rounded-3xl bg-oliva-900 px-6 py-8 text-arena-50 shadow-lg shadow-oliva-900/20 md:px-10 md:py-12">
      <Image src="/fotos/copenhague.jpg" alt="" fill sizes="(min-width: 1152px) 1152px, 100vw" className="-z-20 object-cover object-[60%_50%]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-oliva-950/95 via-oliva-950/80 to-oliva-950/20 max-md:to-oliva-950/75" />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-3 py-1 text-sm font-bold tracking-wide text-arena-950 uppercase">
          {S.alerta}
        </span>
        <p className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight text-balance md:text-6xl">{S.titulo}</p>
        <p className="mt-3 text-xl font-semibold text-amber-200 md:text-2xl">{S.premio}</p>
        <p className="mt-4 max-w-[52ch] text-arena-100">
          {S.bajada} {S.compartir}
        </p>
        {conBoton && (
          <Link
            href="/concurso"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-arena-50 px-6 py-3 text-lg font-semibold text-oliva-800 transition hover:bg-white active:scale-[0.98]"
          >
            {S.participar}
            <ArrowRight size={20} weight="bold" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}

/** Después de confirmar: el link personal para invitar y cuántas chances lleva. */
export function CompartirSorteo({ idioma, codigo, chances }: { idioma: Idioma; codigo: string; chances: number }) {
  const S = SORTEO[idioma];
  const url = enlaceSorteo(typeof window === "undefined" ? "https://rumbotraveling.com" : window.location.origin, codigo);
  const [copiado, setCopiado] = useState(false);
  const copiar = () =>
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      })
      .catch(() => {});
  return (
    <div className="w-full rounded-2xl border border-oliva-200 bg-oliva-50 p-5 text-left dark:border-oliva-800 dark:bg-oliva-900/30">
      <p className="flex items-center gap-2 font-semibold text-oliva-800 dark:text-oliva-200">
        <Gift size={20} weight="fill" aria-hidden />
        {S.tusChances(chances)}
      </p>
      <p className="mt-1 text-sm text-arena-600 dark:text-arena-400">{S.compartir}</p>
      <label className="mt-4 block text-sm font-medium" htmlFor="link-sorteo">
        {S.tuLink}
      </label>
      <input
        id="link-sorteo"
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
        className="mt-1 h-11 w-full rounded-xl border border-arena-300 bg-papel px-3 text-sm dark:border-arena-700 dark:bg-arena-950"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copiar}
          className="inline-flex items-center gap-2 rounded-xl border border-arena-300 bg-papel px-4 py-2 text-sm font-medium transition hover:bg-arena-100 dark:border-arena-700 dark:bg-arena-900 dark:hover:bg-arena-800"
        >
          {copiado ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
          <span role="status">{copiado ? S.copiado : S.copiar}</span>
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(S.mensaje(url))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-oliva-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-oliva-800 dark:bg-oliva-300 dark:text-arena-950"
        >
          <WhatsappLogo size={18} weight="fill" aria-hidden />
          {S.whatsapp}
        </a>
      </div>
    </div>
  );
}
