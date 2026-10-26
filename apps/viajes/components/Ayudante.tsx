"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChatCircleDots, PaperPlaneRight, X } from "@phosphor-icons/react/dist/ssr";
import { CLAVE_VIAJE } from "@/lib/almacen";
import { LIMITES, type MensajeChat } from "@/lib/ayudante";
import type { TripPlan } from "@/lib/types";

const SUGERENCIAS = [
  "¿Cómo armo mi viaje?",
  "¿Qué significa precio estimado?",
  "¿Qué llevo para un viaje en invierno?",
];

/** Resumen de lo que la persona está mirando, para que las respuestas tengan contexto. */
function contexto(ruta: string) {
  const partes = [`Está en la página ${ruta}.`];
  try {
    const guardado = sessionStorage.getItem(CLAVE_VIAJE);
    if (guardado) {
      const { input } = JSON.parse(guardado) as TripPlan;
      partes.push(
        `Armó un viaje de ${input.origen} a ${input.destino}, del ${input.fechaIda} al ${input.fechaVuelta}, ` +
          `${input.viajeros.length} viajeros, plan ${input.plan}, presupuesto máximo US$ ${input.presupuestoMax} ` +
          `${input.modoPresupuesto === "persona" ? "por persona" : "para el grupo"}.`,
      );
    }
  } catch {}
  return partes.join(" ");
}

export function Ayudante() {
  const ruta = usePathname() ?? "/";
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [borrador, setBorrador] = useState("");
  const [esperando, setEsperando] = useState(false);
  const lista = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight });
  }, [mensajes]);

  useEffect(() => {
    if (abierto) campo.current?.focus();
  }, [abierto]);

  if (ruta.startsWith("/admin")) return null;

  const enviar = async (texto: string) => {
    const pregunta = texto.trim().slice(0, LIMITES.caracteres);
    if (!pregunta || esperando) return;
    const historial = [...mensajes, { role: "user" as const, content: pregunta }].slice(-LIMITES.mensajes + 1);
    setMensajes([...historial, { role: "assistant", content: "" }]);
    setBorrador("");
    setEsperando(true);
    try {
      const res = await fetch("/api/ayudante", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensajes: historial, contexto: contexto(ruta) }),
      });
      if (!res.body) throw new Error("sin respuesta");
      const lector = res.body.getReader();
      const dec = new TextDecoder();
      let respuesta = "";
      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        respuesta += dec.decode(value, { stream: true });
        setMensajes([...historial, { role: "assistant", content: respuesta }]);
      }
      if (!respuesta.trim()) throw new Error("vacía");
    } catch {
      setMensajes([
        ...historial,
        { role: "assistant", content: "No pude responder. Revisá tu conexión y probá de nuevo." },
      ]);
    } finally {
      setEsperando(false);
    }
  };

  // En la página del viaje, en celular, hay una barra fija abajo con el total.
  const elevar = ruta === "/viaje" ? "bottom-24 lg:bottom-6" : "bottom-6";

  return (
    <>
      {!abierto && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="¿Necesitás ayuda?"
          className={`fixed right-4 z-40 inline-flex size-14 items-center justify-center gap-2 rounded-full bg-oliva-700 font-medium sm:size-auto sm:px-4 sm:py-3 text-white shadow-lg shadow-oliva-900/25 transition hover:bg-oliva-800 active:scale-[0.97] sm:right-6 dark:bg-oliva-300 dark:text-arena-950 dark:hover:bg-oliva-200 ${elevar}`}
        >
          <ChatCircleDots size={24} weight="fill" aria-hidden />
          <span className="hidden sm:inline">¿Necesitás ayuda?</span>
        </button>
      )}

      {abierto && (
        <section
          role="dialog"
          aria-label="Asistente de Rumbo"
          className="aparecer fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col rounded-t-2xl border border-arena-200 bg-papel shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:h-[min(600px,80dvh)] sm:w-96 sm:rounded-2xl dark:border-arena-800 dark:bg-arena-900"
        >
          <header className="flex items-center justify-between border-b border-arena-200 px-4 py-3 dark:border-arena-800">
            <div>
              <h2 className="font-semibold">Asistente de Rumbo</h2>
              <p className="text-xs text-arena-500 dark:text-arena-400">Respuestas generadas con IA. Pueden tener errores.</p>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="grid size-9 place-items-center rounded-xl text-arena-500 transition hover:bg-arena-100 hover:text-arena-900 dark:hover:bg-arena-800 dark:hover:text-arena-100"
              aria-label="Cerrar asistente"
            >
              <X size={18} />
            </button>
          </header>

          <div ref={lista} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {mensajes.length === 0 && (
              <div>
                <p className="text-sm text-arena-700 dark:text-arena-300">
                  Hola. Te ayudo a usar Rumbo o con dudas de tu viaje. ¿Qué necesitás?
                </p>
                <ul className="mt-3 grid gap-2">
                  {SUGERENCIAS.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => enviar(s)}
                        className="w-full rounded-xl border border-arena-300 px-3 py-2 text-left text-sm transition hover:border-oliva-600 hover:bg-oliva-50/60 dark:border-arena-700 dark:hover:border-oliva-300 dark:hover:bg-oliva-950/30"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {mensajes.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <p
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-oliva-700 text-white dark:bg-oliva-300 dark:text-arena-950"
                      : "bg-arena-100 text-arena-900 dark:bg-arena-800 dark:text-arena-100"
                  }`}
                >
                  {m.content || <span className="inline-block animate-pulse text-arena-500">Escribiendo...</span>}
                </p>
              </div>
            ))}
          </div>

          <form
            className="flex items-end gap-2 border-t border-arena-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-arena-800"
            onSubmit={(e) => {
              e.preventDefault();
              enviar(borrador);
            }}
          >
            <label htmlFor="pregunta-ayudante" className="sr-only">
              Tu pregunta
            </label>
            <textarea
              id="pregunta-ayudante"
              ref={campo}
              rows={1}
              value={borrador}
              maxLength={LIMITES.caracteres}
              onChange={(e) => setBorrador(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviar(borrador);
                }
              }}
              placeholder="Escribí tu pregunta"
              className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-arena-300 bg-papel px-3 py-2.5 text-base placeholder:text-arena-500 focus:border-oliva-600 focus:outline-none focus:ring-2 focus:ring-oliva-600/30 dark:border-arena-700 dark:bg-arena-950"
            />
            <button
              type="submit"
              disabled={esperando || !borrador.trim()}
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-oliva-700 text-white transition hover:bg-oliva-800 active:scale-95 disabled:opacity-40 dark:bg-oliva-300 dark:text-arena-950"
              aria-label="Enviar"
            >
              <PaperPlaneRight size={20} weight="fill" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
