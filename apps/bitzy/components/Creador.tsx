"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Check, Clock, ExternalLink, Loader2, MessageSquare, Mic, MicOff, Gamepad2, RotateCcw, Repeat2, Send, Sparkles, Upload, Wand2, X } from "lucide-react";
import type { EspecJuego } from "@/lib/creador/espec";
import { PLANTILLAS } from "@/lib/creador/espec";
import { leerLocal, escribirLocal } from "@/lib/cliente/local";
import { TEMAS } from "@/lib/temas";

interface Mensaje { rol: "usuario" | "ia"; texto: string; motor?: "ia" | "local" }
interface Version { n: number; pedido: string; titulo: string; descripcion: string; html: string; espec: EspecJuego | null; hora: string }
interface Remix { id: string; titulo: string; autor: string }

const SUGERENCIAS = [
  { t: "Agregar enemigos", p: "Agregá enemigos que me persigan" },
  { t: "Más difícil", p: "Hacelo más difícil" },
  { t: "Agregar música", p: "Agregá música de fondo" },
  { t: "Modo dos jugadores", p: "Agregá modo dos jugadores" },
  { t: "Cambiar estilo visual", p: "Cambiá el estilo visual" },
  { t: "Jefe final", p: "Agregá un jefe final" },
  { t: "Más rápido", p: "Hacé mi personaje más rápido" },
];

type Reconocimiento = { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null; onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null };

export function Creador({ remixId }: { remixId?: string }) {
  const router = useRouter();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [versiones, setVersiones] = useState<Version[]>([]);
  const [actual, setActual] = useState<number>(-1);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [vozDisponible, setVozDisponible] = useState(false);
  const [pestana, setPestana] = useState<"chat" | "juego">("chat");
  const [verVersiones, setVerVersiones] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [remix, setRemix] = useState<Remix | null>(null);
  const [iaAvanzada, setIaAvanzada] = useState<boolean | null>(null);
  const [recarga, setRecarga] = useState(0);
  const lista = useRef<HTMLDivElement>(null);
  const reco = useRef<Reconocimiento | null>(null);
  const v = actual >= 0 ? versiones[actual] : null;

  // Borrador guardado y remix
  useEffect(() => {
    setVozDisponible(!!((window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition));
    fetch("/api/creador").then((r) => r.json()).then((d) => setIaAvanzada(!!d.ia)).catch(() => setIaAvanzada(false));
    if (remixId) {
      fetch(`/api/comunidad/${remixId}/datos`).then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => {
        const base: Version = { n: 1, pedido: `Remix de «${d.titulo}»`, titulo: `${d.titulo} (Remix)`, descripcion: d.descripcion, html: d.html ?? "", espec: d.espec ? { ...d.espec, titulo: `${d.titulo} (Remix)` } : null, hora: new Date().toISOString() };
        if (!base.html && base.espec) {
          fetch("/api/creador", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedido: "dejalo igual", espec: base.espec, motor: "local" }) }).then((r) => r.json()).then((x) => { base.html = x.html; setVersiones([base]); setActual(0); });
        } else { setVersiones([base]); setActual(0); }
        setRemix({ id: d.id, titulo: d.titulo, autor: d.autor });
        setMensajes([{ rol: "ia", texto: `Abrí una copia de «${d.titulo}» de ${d.autor}. Es tuya para modificar: pedime cambios y publicá tu versión (se va a mostrar el crédito al original).` }]);
      }).catch(() => setMensajes([{ rol: "ia", texto: "No encontré el juego para hacer el remix. Podés empezar uno nuevo." }]));
      return;
    }
    const b = leerLocal<{ mensajes: Mensaje[]; versiones: Version[]; actual: number } | null>("pf:creador", null);
    if (b?.versiones?.length) { setMensajes(b.mensajes); setVersiones(b.versiones); setActual(b.actual); }
  }, [remixId]);

  useEffect(() => {
    if (!versiones.length || remixId) return;
    escribirLocal("pf:creador", { mensajes: mensajes.slice(-40), versiones: versiones.slice(-12), actual: Math.min(actual, versiones.slice(-12).length - 1) });
  }, [mensajes, versiones, actual, remixId]);

  useEffect(() => { lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: "smooth" }); }, [mensajes, pensando]);

  const enviar = useCallback(async (pedido: string) => {
    const p = pedido.trim();
    if (!p || pensando) return;
    setTexto("");
    setMensajes((m) => [...m, { rol: "usuario", texto: p }]);
    setPensando(true);
    try {
      const r = await fetch("/api/creador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido: p, espec: v?.espec ?? null, html: v?.espec ? null : v?.html ?? null, historial: mensajes.slice(-8).map(({ rol, texto }) => ({ rol, texto })) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Error");
      setMensajes((m) => [...m, { rol: "ia", texto: d.explicacion, motor: d.motor }]);
      if (d.entendido !== false && d.html) {
        setVersiones((vs) => {
          const nueva: Version = { n: (vs[vs.length - 1]?.n ?? 0) + 1, pedido: p, titulo: d.titulo, descripcion: d.descripcion, html: d.html, espec: d.espec ?? null, hora: new Date().toISOString() };
          const res = [...vs, nueva];
          setActual(res.length - 1);
          return res;
        });
        if (window.matchMedia("(max-width: 1023px)").matches) setTimeout(() => setPestana("juego"), 600);
      }
    } catch (e) {
      setMensajes((m) => [...m, { rol: "ia", texto: `Uy, algo falló (${(e as Error).message}). Probá de nuevo.` }]);
    } finally {
      setPensando(false);
    }
  }, [pensando, v, mensajes]);

  const microfono = () => {
    if (escuchando) { reco.current?.stop(); return; }
    const C = (window as unknown as { SpeechRecognition?: new () => Reconocimiento; webkitSpeechRecognition?: new () => Reconocimiento }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Reconocimiento }).webkitSpeechRecognition;
    if (!C) return;
    const r = new C();
    r.lang = "es-AR"; r.interimResults = true; r.continuous = false;
    let final = "";
    r.onresult = (e) => {
      let parcial = "";
      for (let i = 0; i < e.results.length; i++) { const res = e.results[i]; if (res.isFinal) final = res[0].transcript; else parcial += res[0].transcript; }
      setTexto(final || parcial);
    };
    r.onend = () => { setEscuchando(false); if (final.trim()) void enviar(final); };
    r.onerror = () => setEscuchando(false);
    reco.current = r;
    setEscuchando(true);
    r.start();
  };

  const nuevo = () => { setMensajes([]); setVersiones([]); setActual(-1); setRemix(null); escribirLocal("pf:creador", null); if (remixId) router.replace("/crear"); };

  // ---------- Pantalla inicial ----------
  if (!v && !remixId) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-10 text-center sm:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-marca/40 bg-marca/10 px-3 py-1 text-xs font-semibold text-marca-2"><Sparkles className="h-3.5 w-3.5" /> Creador con IA</span>
        <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-6xl"><span className="texto-degrade">¿Qué juego querés crear?</span></h1>
        <p className="mx-auto mt-4 max-w-xl text-tenue">Describilo con tus palabras (o hablale con el micrófono). La IA lo arma en segundos y después lo vas cambiando charlando.</p>
        <form onSubmit={(e) => { e.preventDefault(); void enviar(texto); }} className="relative mx-auto mt-8 max-w-2xl rounded-3xl border border-borde bg-capa-1 p-2 text-left shadow-2xl shadow-marca/10 focus-within:border-marca">
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void enviar(texto); } }} rows={3} placeholder="Por ejemplo: un juego de naves donde esquivo meteoritos y junto monedas" className="w-full resize-none bg-transparent p-3 text-lg outline-none placeholder:text-tenue/60" aria-label="Describí tu juego" />
          <div className="flex items-center justify-between gap-2 p-1">
            {vozDisponible ? <button type="button" onClick={microfono} className={`flex h-11 items-center gap-2 rounded-xl px-3 text-sm transition ${escuchando ? "bg-rojo/20 text-rojo" : "text-tenue hover:bg-capa-3 hover:text-texto"}`}>{escuchando ? <><MicOff className="h-5 w-5 animate-pulse" /> Escuchando…</> : <><Mic className="h-5 w-5" /> Hablar</>}</button> : <span />}
            <button disabled={!texto.trim() || pensando} className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-marca to-cian px-5 font-bold transition hover:scale-[1.03] disabled:opacity-40">{pensando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />} Crear juego</button>
          </div>
        </form>
        {pensando && <p className="mt-6 animate-pulse text-tenue">La IA está construyendo tu juego…</p>}
        <h2 className="mt-14 text-left text-lg font-bold">O arrancá con una plantilla</h2>
        <div className="mt-4 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
          {PLANTILLAS.map((p) => {
            const t = TEMAS.find((x) => x.id === p.espec.estilo)!;
            return (
              <button key={p.id} onClick={() => void enviar(p.prompt)} disabled={pensando} className="group rounded-2xl border border-borde p-4 text-left transition hover:-translate-y-0.5 hover:border-marca/60" style={{ background: `linear-gradient(135deg, ${t.fondo2}, ${t.fondo})` }}>
                <span className="text-3xl">{p.emoji}</span>
                <p className="mt-2 font-bold">{p.nombre}</p>
                <p className="mt-1 text-sm text-white/60">{p.prompt}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------- Editor dividido ----------
  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col lg:h-[calc(100dvh-4rem)]">
      {/* Pestañas en celular */}
      <div className="flex border-b border-borde lg:hidden">
        {(["chat", "juego"] as const).map((p) => (
          <button key={p} onClick={() => setPestana(p)} className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold ${pestana === p ? "border-b-2 border-marca text-texto" : "text-tenue"}`}>
            {p === "chat" ? <><MessageSquare className="h-4 w-4" /> Chat</> : <><Gamepad2 className="h-4 w-4" /> Jugar</>}
          </button>
        ))}
      </div>
      <div className="flex min-h-0 flex-1">
        {/* Chat */}
        <section className={`${pestana === "chat" ? "flex" : "hidden"} w-full flex-col border-r border-borde bg-capa-1/50 lg:flex lg:w-[430px] lg:shrink-0`}>
          <div className="flex items-center gap-2 border-b border-borde px-4 py-3">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-marca to-cian"><Bot className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{v?.titulo ?? "Creando…"}</p>
              <p className="text-[11px] text-tenue">{iaAvanzada ? "IA avanzada activa" : iaAvanzada === false ? "Generador rápido" : "…"}{remix && <> · Remix de «{remix.titulo}» de {remix.autor}</>}</p>
            </div>
            <button onClick={() => setVerVersiones((x) => !x)} className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs ${verVersiones ? "bg-capa-3" : "text-tenue hover:bg-capa-2"}`}><Clock className="h-3.5 w-3.5" /> v{v?.n ?? 0}</button>
            <button onClick={nuevo} className="rounded-lg px-2 py-1.5 text-xs text-tenue hover:bg-capa-2" title="Empezar otro juego">Nuevo</button>
          </div>
          {verVersiones && (
            <div className="max-h-56 overflow-y-auto border-b border-borde bg-capa-2/60 p-2 animate-entrar">
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-tenue">Historial de versiones</p>
              {[...versiones].reverse().map((x) => {
                const i = versiones.indexOf(x);
                return (
                  <button key={x.n} onClick={() => { setActual(i); setRecarga((r) => r + 1); }} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${i === actual ? "bg-marca/20" : "hover:bg-capa-3"}`}>
                    <span className="w-8 shrink-0 font-mono text-xs text-tenue">v{x.n}</span>
                    <span className="min-w-0 flex-1 truncate">{x.pedido}</span>
                    {i === actual ? <Check className="h-4 w-4 text-lima" /> : <RotateCcw className="h-3.5 w-3.5 text-tenue" />}
                  </button>
                );
              })}
            </div>
          )}
          <div ref={lista} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {mensajes.map((m, i) => (
              <div key={i} className={`flex ${m.rol === "usuario" ? "justify-end" : "justify-start"} animate-entrar`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.rol === "usuario" ? "rounded-br-md bg-marca text-white" : "rounded-bl-md border border-borde bg-capa-2"}`}>
                  {m.texto}
                </div>
              </div>
            ))}
            {pensando && (
              <div className="flex justify-start"><div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-borde bg-capa-2 px-4 py-3">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-marca-2" style={{ animationDelay: `${i * 0.15}s` }} />)}</div></div>
            )}
          </div>
          <div className="border-t border-borde p-3">
            <div className="sin-scroll mb-2 flex gap-2 overflow-x-auto">
              {SUGERENCIAS.map((s) => <button key={s.t} onClick={() => void enviar(s.p)} disabled={pensando} className="shrink-0 rounded-full border border-borde bg-capa-2 px-3 py-1.5 text-xs transition hover:border-marca hover:text-texto disabled:opacity-50">{s.t}</button>)}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); void enviar(texto); }} className="flex items-end gap-2">
              <textarea value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void enviar(texto); } }} rows={1} placeholder={escuchando ? "Escuchando…" : "Pedí un cambio: «hacé la nave más rápida»"} aria-label="Mensaje para la IA" className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-borde bg-capa-2 px-3 py-2.5 text-sm outline-none focus:border-marca" />
              {vozDisponible && <button type="button" onClick={microfono} className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition ${escuchando ? "border-rojo bg-rojo/20 text-rojo" : "border-borde bg-capa-2 text-tenue hover:text-texto"}`} aria-label={escuchando ? "Dejar de escuchar" : "Hablar con el micrófono"}>{escuchando ? <MicOff className="h-5 w-5 animate-pulse" /> : <Mic className="h-5 w-5" />}</button>}
              <button disabled={!texto.trim() || pensando} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-marca transition hover:bg-marca-2 disabled:opacity-40" aria-label="Enviar">{pensando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</button>
            </form>
          </div>
        </section>

        {/* Vista previa */}
        <section className={`${pestana === "juego" ? "flex" : "hidden"} min-w-0 flex-1 flex-col lg:flex`}>
          <div className="flex items-center gap-2 border-b border-borde px-4 py-2.5">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-lima"><span className="h-2 w-2 animate-pulse rounded-full bg-lima" /> Vista previa en vivo</span>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => setRecarga((r) => r + 1)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-tenue hover:bg-capa-2 hover:text-texto"><RotateCcw className="h-3.5 w-3.5" /> Reiniciar</button>
              {v && <button onClick={() => { const w = window.open("", "_blank"); if (w) { w.document.write(v.html); w.document.close(); } }} className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-tenue hover:bg-capa-2 hover:text-texto sm:flex"><ExternalLink className="h-3.5 w-3.5" /> Abrir</button>}
              <button onClick={() => setPublicando(true)} disabled={!v} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-lima to-cian px-4 py-2 text-sm font-bold text-fondo transition hover:scale-[1.03] disabled:opacity-40"><Upload className="h-4 w-4" /> Publicar</button>
            </div>
          </div>
          <div className="relative min-h-0 flex-1 bg-black">
            {v ? (
              <iframe key={`${actual}-${recarga}`} title={`Vista previa de ${v.titulo}`} srcDoc={v.html} sandbox="allow-scripts" allow="autoplay" className="h-full w-full border-0" />
            ) : <div className="grid h-full place-items-center text-tenue"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            {pensando && <div className="absolute inset-0 grid place-items-center bg-black/50 backdrop-blur-sm"><div className="flex items-center gap-3 rounded-2xl border border-borde bg-capa-1 px-5 py-3"><Loader2 className="h-5 w-5 animate-spin text-marca-2" /> Aplicando cambios…</div></div>}
          </div>
        </section>
      </div>
      {publicando && v && <ModalPublicar version={v} remix={remix} cerrar={() => setPublicando(false)} />}
    </div>
  );
}

function ModalPublicar({ version, remix, cerrar }: { version: Version; remix: Remix | null; cerrar: () => void }) {
  const router = useRouter();
  const [titulo, setTitulo] = useState(version.titulo);
  const [descripcion, setDescripcion] = useState(version.descripcion);
  const [autor, setAutor] = useState(() => leerLocal("pf:apodo", ""));
  const [estado, setEstado] = useState<"" | "enviando" | "listo">("");
  const [error, setError] = useState("");
  const publicar = async () => {
    setEstado("enviando"); setError("");
    escribirLocal("pf:apodo", autor);
    try {
      const r = await fetch("/api/comunidad", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titulo, descripcion, autor, html: version.espec ? null : version.html, espec: version.espec ? { ...version.espec, titulo, descripcion } : null, remixDe: remix?.id ?? null }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setEstado("listo");
      setTimeout(() => router.push(`/comunidad/${d.id}`), 900);
    } catch (e) { setError((e as Error).message || "No se pudo publicar."); setEstado(""); }
  };
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur animate-entrar" role="dialog" aria-modal="true" aria-label="Publicar juego">
      <div className="w-full max-w-md rounded-3xl border border-borde bg-capa-1 p-6">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Publicar en Bitzy</h2><button onClick={cerrar} className="rounded-full p-1.5 hover:bg-capa-3" aria-label="Cerrar"><X className="h-5 w-5" /></button></div>
        <p className="mt-1 text-sm text-tenue">Tu juego va a aparecer en «Hechos por la comunidad» con su portada.</p>
        {remix && <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-rosa/10 px-3 py-2 text-xs text-rosa"><Repeat2 className="h-4 w-4" /> Remix de «{remix.titulo}» de {remix.autor}: el crédito se muestra automáticamente.</p>}
        <label className="mt-4 block text-sm font-medium">Nombre del juego<input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={60} className="mt-1 h-11 w-full rounded-xl border border-borde bg-capa-2 px-3 outline-none focus:border-marca" /></label>
        <label className="mt-3 block text-sm font-medium">Descripción<textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={300} rows={3} className="mt-1 w-full rounded-xl border border-borde bg-capa-2 p-3 outline-none focus:border-marca" /></label>
        <label className="mt-3 block text-sm font-medium">Tu apodo<input value={autor} onChange={(e) => setAutor(e.target.value)} maxLength={30} placeholder="Anónimo" className="mt-1 h-11 w-full rounded-xl border border-borde bg-capa-2 px-3 outline-none focus:border-marca" /></label>
        {error && <p className="mt-3 text-sm text-rojo">{error}</p>}
        <button onClick={publicar} disabled={estado !== "" || titulo.trim().length < 2} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lima to-cian font-bold text-fondo disabled:opacity-50">
          {estado === "enviando" ? <Loader2 className="h-5 w-5 animate-spin" /> : estado === "listo" ? <Check className="h-5 w-5" /> : <Upload className="h-5 w-5" />} {estado === "listo" ? "¡Publicado!" : "Publicar"}
        </button>
      </div>
    </div>
  );
}
