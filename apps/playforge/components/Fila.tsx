"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Fila horizontal deslizable con flechas (estilo Steam/Netflix). */
export function Fila({ titulo, subtitulo, verTodo, icono, children }: { titulo: string; subtitulo?: React.ReactNode; verTodo?: string; icono?: React.ReactNode; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const mover = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });
  return (
    <section className="group/fila relative mt-10">
      <div className="mb-3 flex items-end justify-between gap-4 px-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight sm:text-xl">{icono}{titulo}</h2>
          {subtitulo && <div className="mt-0.5 text-sm text-tenue">{subtitulo}</div>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {verTodo && <Link href={verTodo} className="rounded-lg px-2 py-1 text-sm font-medium text-marca-2 hover:bg-capa-2">Ver todo</Link>}
          <button onClick={() => mover(-1)} className="hidden rounded-lg border border-borde p-1.5 text-tenue transition hover:bg-capa-2 hover:text-texto sm:block" aria-label={`Anteriores en ${titulo}`}><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => mover(1)} className="hidden rounded-lg border border-borde p-1.5 text-tenue transition hover:bg-capa-2 hover:text-texto sm:block" aria-label={`Siguientes en ${titulo}`}><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div ref={ref} className="sin-scroll flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:scroll-px-6 sm:px-6">
        {children}
      </div>
    </section>
  );
}

export const ANCHO_TARJETA = "w-[64vw] sm:w-[260px] xl:w-[280px]";
