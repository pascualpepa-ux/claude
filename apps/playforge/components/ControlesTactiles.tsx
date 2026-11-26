"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Circle, Zap } from "lucide-react";
import type { Accion, Entrada } from "@/juegos/runtime/entrada";
import type { EsquemaTactil } from "@/juegos/runtime/tipos";

function Boton({ entrada, accion, children, className = "", etiqueta }: { entrada: Entrada; accion: Accion; children: React.ReactNode; className?: string; etiqueta: string }) {
  const on = (e: React.PointerEvent) => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); entrada.activar(accion); navigator.vibrate?.(8); };
  const off = (e: React.PointerEvent) => { e.preventDefault(); entrada.desactivar(accion); };
  return (
    <button
      aria-label={etiqueta}
      onPointerDown={on} onPointerUp={off} onPointerCancel={off} onPointerLeave={off} onContextMenu={(e) => e.preventDefault()}
      className={`pointer-events-auto grid touch-none select-none place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition active:scale-90 active:bg-white/30 ${className}`}
    >
      {children}
    </button>
  );
}

/** Botones en pantalla para celulares según el esquema del motor. */
export function ControlesTactiles({ esquema, entrada }: { esquema: EsquemaTactil; entrada: Entrada }) {
  if (esquema === "puntero" || esquema === "toque" || esquema === "deslizar") return null;
  const t = "h-16 w-16";
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {esquema === "cruceta" ? (
        <div className="grid grid-cols-3 gap-1">
          <span /><Boton entrada={entrada} accion="arriba" etiqueta="Arriba" className={t}><ArrowUp /></Boton><span />
          <Boton entrada={entrada} accion="izq" etiqueta="Izquierda" className={t}><ArrowLeft /></Boton><span />
          <Boton entrada={entrada} accion="der" etiqueta="Derecha" className={t}><ArrowRight /></Boton>
          <span /><Boton entrada={entrada} accion="abajo" etiqueta="Abajo" className={t}><ArrowDown /></Boton><span />
        </div>
      ) : (
        <div className="flex gap-3">
          <Boton entrada={entrada} accion="izq" etiqueta="Izquierda" className="h-[72px] w-[72px]"><ArrowLeft className="h-7 w-7" /></Boton>
          <Boton entrada={entrada} accion="der" etiqueta="Derecha" className="h-[72px] w-[72px]"><ArrowRight className="h-7 w-7" /></Boton>
        </div>
      )}
      <div className="flex items-end gap-3">
        {esquema === "lados" && <Boton entrada={entrada} accion="abajo" etiqueta="Frenar" className="h-16 w-16 text-xs font-bold">FRENO</Boton>}
        {esquema === "lados" ? (
          <Boton entrada={entrada} accion="a" etiqueta="Nitro" className="h-20 w-20 border-ambar/60 bg-ambar/25"><Zap className="h-8 w-8" /></Boton>
        ) : (
          <Boton entrada={entrada} accion="a" etiqueta="Saltar" className="h-20 w-20 border-cian/60 bg-cian/20"><Circle className="h-8 w-8" /></Boton>
        )}
      </div>
    </div>
  );
}
