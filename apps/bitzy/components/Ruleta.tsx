"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dices, X } from "lucide-react";
import { publicados } from "@/lib/catalogo/consultas";
import { urlPortada } from "@/lib/portadas";
import type { Juego } from "@/lib/catalogo/tipos";

const ANCHO = 168;
const CANTIDAD = 42;

/** Ruleta animada que elige un juego al azar de todo el catálogo. */
export function Ruleta({ abierta, cerrar }: { abierta: boolean; cerrar: () => void }) {
  const router = useRouter();
  const [tira, setTira] = useState<Juego[]>([]);
  const [desplazo, setDesplazo] = useState(0);
  const [elegido, setElegido] = useState<Juego | null>(null);
  const cont = useRef<HTMLDivElement>(null);

  const lista = useMemo(() => (abierta ? publicados() : []), [abierta]);

  useEffect(() => {
    if (!abierta || !lista.length) return;
    const t: Juego[] = [];
    for (let i = 0; i < CANTIDAD; i++) t.push(lista[Math.floor(Math.random() * lista.length)]);
    setTira(t);
    setElegido(null);
    setDesplazo(0);
    const ancho = cont.current?.clientWidth ?? 600;
    const meta = (CANTIDAD - 4) * ANCHO - ancho / 2 + ANCHO / 2 + (Math.random() - 0.5) * 60;
    const a = requestAnimationFrame(() => requestAnimationFrame(() => setDesplazo(meta)));
    const fin = setTimeout(() => setElegido(t[CANTIDAD - 4]), 3300);
    return () => { cancelAnimationFrame(a); clearTimeout(fin); };
  }, [abierta, lista]);

  useEffect(() => {
    if (!elegido) return;
    const ir = setTimeout(() => { cerrar(); router.push(`/juego/${elegido.id}`); }, 1300);
    return () => clearTimeout(ir);
  }, [elegido, cerrar, router]);

  useEffect(() => {
    if (!abierta) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [abierta, cerrar]);

  if (!abierta) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-entrar" role="dialog" aria-modal="true" aria-label="Juego al azar">
      <div className="relative w-full max-w-3xl rounded-3xl border border-borde bg-capa-1 p-6 shadow-2xl shadow-marca/20">
        <button onClick={cerrar} className="absolute right-4 top-4 rounded-full p-2 text-tenue hover:bg-capa-3 hover:text-texto" aria-label="Cerrar">
          <X className="h-5 w-5" />
        </button>
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-marca to-cian"><Dices className="h-6 w-6" /></span>
          <div>
            <h2 className="text-xl font-bold">Jugar algo al azar</h2>
            <p className="text-sm text-tenue">Girando entre {lista.length.toLocaleString("es")} juegos…</p>
          </div>
        </div>
        <div ref={cont} className="relative overflow-hidden rounded-2xl border border-borde bg-capa-2 py-4">
          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-[3px] -translate-x-1/2 bg-ambar shadow-[0_0_20px_4px] shadow-ambar/60" />
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-capa-2" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-capa-2" />
          <div
            className="flex"
            style={{ transform: `translateX(${-desplazo}px)`, transition: desplazo ? "transform 3.2s cubic-bezier(0.12, 0.8, 0.12, 1)" : "none" }}
          >
            {tira.map((j, i) => (
              <div key={i} className="shrink-0 px-1.5" style={{ width: ANCHO }}>
                <div className={`overflow-hidden rounded-xl border transition-all duration-500 ${elegido && i === CANTIDAD - 4 ? "scale-105 border-ambar shadow-lg shadow-ambar/30" : "border-borde"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urlPortada(j.id)} alt="" className="aspect-[16/10] w-full" />
                </div>
                <p className="mt-1.5 truncate text-xs text-tenue">{j.nombre}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-5 h-7 text-center text-lg font-semibold" aria-live="polite">
          {elegido ? <span className="animate-entrar inline-block">🎉 ¡{elegido.nombre}!</span> : <span className="text-tenue">Preparate…</span>}
        </p>
      </div>
    </div>
  );
}
