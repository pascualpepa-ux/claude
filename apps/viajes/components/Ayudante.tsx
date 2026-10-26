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
          className={`fixed right-4 z-40 inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-3 font-medium text-white shadow-lg shadow-teal-900/25 transition hover:bg-teal-800 active:scale-[0.97] sm:right-6 dark:bg-teal-500 dark:text-zinc-950 dark:hover:bg-teal-400 ${elevar}`}
        >
          <ChatCircleDots size={22} weight="fill" aria-hidden />
          ¿Necesitás ayuda?
        </button>
      )}

      {abierto && (
        <section
          role="dialog"
          aria-label="Asistente de Rumbo"
          className="aparecer fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col rounded-t-2xl border border-zinc-200 bg-white shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:h-[min(600px,80dvh)] sm:w-96 sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-900"
        >
          <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <div>
              <h2 className="font-semibold">Asistente de Rumbo</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Respuestas generadas con IA. Pueden tener errores.</p>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="grid size-9 place-items-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label="Cerrar asistente"
            >
              <X size={18} />
            </button>
          </header>

          <div ref={lista} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {mensajes.length === 0 && (
              <div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  Hola. Te ayudo a usar Rumbo o con dudas de tu viaje. ¿Qué necesitás?
                </p>
                <ul className="mt-3 grid gap-2">
                  {SUGERENCIAS.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => enviar(s)}
                        className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-left text-sm transition hover:border-teal-600 hover:bg-teal-50/60 dark:border-zinc-700 dark:hover:border-teal-500 dark:hover:bg-teal-950/30"
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
                      ? "bg-teal-700 text-white dark:bg-teal-500 dark:text-zinc-950"
                      : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  }`}
                >
                  {m.content || <span className="inline-block animate-pulse text-zinc-500">Escribiendo...</span>}
                </p>
              </div>
            ))}
          </div>

          <form
            className="flex items-end gap-2 border-t border-zinc-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-800"
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
              className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-base placeholder:text-zinc-500 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30 dark:border-zinc-700 dark:bg-zinc-950"
            />
            <button
              type="submit"
              disabled={esperando || !borrador.trim()}
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-700 text-white transition hover:bg-teal-800 active:scale-95 disabled:opacity-40 dark:bg-teal-500 dark:text-zinc-950"
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
