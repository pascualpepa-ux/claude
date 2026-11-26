"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Maximize, Minimize, Music, Pause, Play, RotateCcw, Trophy, Volume2, VolumeX } from "lucide-react";
import { CARGADORES } from "@/juegos/motores";
import { Partida } from "@/juegos/runtime/partida";
import { Sonido } from "@/juegos/runtime/audio";
import type { DatoHud, ModuloMotor } from "@/juegos/runtime/tipos";
import { parametros } from "@/juegos/parametros";
import type { Juego } from "@/lib/catalogo/tipos";
import { agregarHistorial, ajustes, guardarAjustes, record, registrarPartida } from "@/lib/cliente/local";
import { urlPortada } from "@/lib/portadas";
import { LogoMarca } from "./Logo";
import { ControlesTactiles } from "./ControlesTactiles";

type Estado = "cargando" | "listo" | "jugando" | "pausa" | "fin";
interface Fin { gano: boolean; mensaje?: string; puntos: number; segundos: number; nuevoRecord: boolean }

export interface InfoReproductor {
  juego: Juego;
  modoNombre: string;
  controles: string;
  controlesTactiles: string;
  siguiente?: { id: string; nombre: string } | null;
}

export function Reproductor({ info, embebido = false, onFin }: { info: InfoReproductor; embebido?: boolean; onFin?: (r: Fin) => void }) {
  const { juego } = info;
  const router = useRouter();
  const contenedor = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const partida = useRef<Partida | null>(null);
  const sonido = useRef<Sonido | null>(null);
  const modulo = useRef<ModuloMotor | null>(null);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [progreso, setProgreso] = useState(0);
  const [puntos, setPuntos] = useState(0);
  const [hud, setHud] = useState<DatoHud[]>([]);
  const [mejor, setMejor] = useState(0);
  const [fin, setFin] = useState<Fin | null>(null);
  const [silencio, setSilencio] = useState(false);
  const [musica, setMusica] = useState(true);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [tactil, setTactil] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  // Carga diferida del código del motor
  useEffect(() => {
    let vivo = true;
    const a = ajustes();
    setSilencio(a.silencio);
    setMusica(a.musica);
    setTactil(window.matchMedia("(pointer: coarse)").matches);
    setMejor(record(juego.id)?.puntos ?? 0);
    agregarHistorial(juego.id);
    const t0 = performance.now();
    const anim = setInterval(() => setProgreso((p) => Math.min(92, p + (100 - p) * 0.12)), 60);
    CARGADORES[juego.motor]()
      .then((m) => {
        if (!vivo) return;
        modulo.current = m.default;
        const espera = Math.max(0, 450 - (performance.now() - t0));
        setTimeout(() => { if (vivo) { setProgreso(100); clearInterval(anim); setTimeout(() => vivo && setEstado("listo"), 180); } }, espera);
      })
      .catch(() => { clearInterval(anim); setError("No se pudo cargar el juego. Revisá tu conexión."); });
    return () => { vivo = false; clearInterval(anim); };
  }, [juego.id, juego.motor]);

  const iniciar = useCallback(() => {
    if (!modulo.current || !lienzo.current) return;
    partida.current?.destruir();
    if (!sonido.current) sonido.current = new Sonido();
    const s = sonido.current;
    s.iniciar();
    s.silenciar(ajustes().silencio);
    s.musicaActiva = ajustes().musica;
    setPuntos(0);
    setHud([]);
    setFin(null);
    const p = new Partida(lienzo.current, modulo.current, parametros(juego), {
      puntos: setPuntos,
      hud: setHud,
      fin: (r) => {
        const nuevoRecord = registrarPartida(juego.id, r.puntos, r.gano);
        if (nuevoRecord) setMejor(r.puntos);
        const f = { ...r, nuevoRecord };
        setFin(f);
        setEstado("fin");
        onFin?.(f);
      },
    }, s);
    p.eventosPausa = () => { p.pausar(); setEstado((e) => (e === "jugando" ? "pausa" : e)); };
    partida.current = p;
    p.iniciar();
    setEstado("jugando");
    setIntento((n) => n + 1);
    lienzo.current.focus();
  }, [juego, onFin]);

  useEffect(() => () => { partida.current?.destruir(); sonido.current?.cerrar(); }, []);

  const pausar = useCallback(() => { partida.current?.pausar(); setEstado("pausa"); }, []);
  const reanudar = useCallback(() => { partida.current?.reanudar(); setEstado("jugando"); lienzo.current?.focus(); }, []);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.code === "Escape" || e.code === "KeyP") { if (estado === "jugando") pausar(); else if (estado === "pausa") reanudar(); }
      else if ((e.code === "Enter" || e.code === "Space") && (estado === "listo" || estado === "fin")) { e.preventDefault(); iniciar(); }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [estado, pausar, reanudar, iniciar]);

  useEffect(() => {
    const f = () => setPantallaCompleta(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);

  const alternarSilencio = () => { const s = !silencio; setSilencio(s); sonido.current?.silenciar(s); guardarAjustes({ silencio: s, musica }); };
  const alternarMusica = () => { const m = !musica; setMusica(m); sonido.current?.alternarMusica(m); guardarAjustes({ silencio, musica: m }); };
  const alternarPantalla = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else { await contenedor.current?.requestFullscreen(); await (screen.orientation as unknown as { lock?: (o: string) => Promise<void> })?.lock?.(modulo.current && modulo.current.ancho > modulo.current.alto ? "landscape" : "portrait").catch(() => undefined); }
    } catch {}
  };
  const volver = () => (window.history.length > 1 ? router.back() : router.push(`/juego/${juego.id}`));

  const boton = "grid h-10 w-10 place-items-center rounded-xl text-white/80 transition hover:bg-white/10 hover:text-white";
  return (
    <div ref={contenedor} className="fixed inset-0 z-[60] flex flex-col bg-[#05050a] text-texto">
      {/* Barra superior */}
      <div className="relative z-30 flex h-14 shrink-0 items-center gap-2 border-b border-white/5 bg-black/40 px-2 backdrop-blur sm:px-3">
        {!embebido ? <button onClick={volver} className={boton} aria-label="Volver"><ArrowLeft className="h-5 w-5" /></button> : <Link href={`/juego/${juego.id}`} target="_blank" className="px-2"><LogoMarca className="h-7 w-7" /></Link>}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight">{juego.nombre}</p>
          <p className="truncate text-[11px] text-tenue">{info.modoNombre}</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          {hud.map((d) => (
            <div key={d.etiqueta} className="hidden text-center sm:block"><p className="text-[10px] uppercase tracking-wider text-tenue">{d.etiqueta}</p><p className="text-sm font-bold tabular-nums">{d.valor}</p></div>
          ))}
          <div className="text-center"><p className="text-[10px] uppercase tracking-wider text-tenue">Puntos</p><p key={puntos} className="text-base font-black tabular-nums text-ambar">{puntos.toLocaleString("es")}</p></div>
          <div className="hidden text-center sm:block"><p className="text-[10px] uppercase tracking-wider text-tenue">Récord</p><p className="text-sm font-bold tabular-nums">{Math.max(mejor, 0).toLocaleString("es")}</p></div>
        </div>
        <div className="flex items-center">
          <button onClick={alternarSilencio} className={boton} aria-label={silencio ? "Activar sonido" : "Silenciar"}>{silencio ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button>
          <button onClick={alternarPantalla} className={`${boton} hidden sm:grid`} aria-label="Pantalla completa">{pantallaCompleta ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}</button>
          {estado === "jugando" && <button onClick={pausar} className={boton} aria-label="Pausa"><Pause className="h-5 w-5" /></button>}
        </div>
      </div>
      {/* HUD extra en celular */}
      {hud.length > 0 && estado === "jugando" && (
        <div className="pointer-events-none absolute left-1/2 top-16 z-20 flex -translate-x-1/2 gap-2 sm:hidden">
          {hud.map((d) => <span key={d.etiqueta} className="rounded-full bg-black/50 px-2.5 py-1 text-[11px] backdrop-blur"><span className="text-tenue">{d.etiqueta}</span> <strong className="tabular-nums">{d.valor}</strong></span>)}
        </div>
      )}

      {/* Lienzo */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <canvas ref={lienzo} tabIndex={0} className="block touch-none select-none rounded-sm outline-none" aria-label={`Juego ${juego.nombre}`} />
        {estado === "listo" && tactil && modulo.current && modulo.current.ancho > modulo.current.alto * 1.2 && <AvisoGirar />}
        {estado === "jugando" && tactil && partida.current && modulo.current && <ControlesTactiles key={intento} esquema={modulo.current.tactil} entrada={partida.current.entrada} />}

        {/* Pantalla de carga */}
        {estado === "cargando" && (
          <div className="absolute inset-0 grid place-items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlPortada(juego.id)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 blur-xl" />
            <div className="relative flex w-72 flex-col items-center text-center">
              <LogoMarca className="h-14 w-14 animate-flotar drop-shadow-[0_0_30px_rgba(124,92,255,.6)]" />
              <p className="mt-5 font-bold">{error ?? `Cargando ${juego.nombre}…`}</p>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-marca to-cian transition-[width] duration-150" style={{ width: `${progreso}%` }} /></div>
            </div>
          </div>
        )}

        {/* Inicio */}
        {estado === "listo" && (
          <div className="absolute inset-0 grid place-items-center bg-black/55 p-4 backdrop-blur-sm animate-entrar">
            <div className="w-full max-w-md text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urlPortada(juego.id)} alt="" className="mx-auto aspect-[16/10] w-56 rounded-2xl border border-white/10 shadow-2xl" />
              <h1 className="mt-5 text-2xl font-black">{juego.nombre}</h1>
              <p className="mt-2 text-sm text-tenue">{tactil ? info.controlesTactiles : info.controles}</p>
              <button onClick={iniciar} autoFocus className="mx-auto mt-6 flex h-14 items-center gap-2 rounded-2xl bg-white px-10 text-lg font-extrabold text-fondo shadow-2xl transition hover:scale-105 active:scale-95">
                <Play className="h-6 w-6" fill="currentColor" /> Jugar
              </button>
              {mejor > 0 && <p className="mt-4 text-sm text-tenue">Tu récord: <strong className="text-ambar">{mejor.toLocaleString("es")}</strong></p>}
            </div>
          </div>
        )}

        {/* Pausa */}
        {estado === "pausa" && (
          <div className="absolute inset-0 z-30 grid place-items-center bg-black/65 p-4 backdrop-blur-md animate-entrar" role="dialog" aria-label="Pausa">
            <div className="w-full max-w-xs rounded-3xl border border-borde bg-capa-1/95 p-6 text-center">
              <h2 className="text-2xl font-black">Pausa</h2>
              <div className="mt-5 grid gap-2.5">
                <button onClick={reanudar} autoFocus className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white font-bold text-fondo transition hover:scale-[1.02]"><Play className="h-5 w-5" fill="currentColor" /> Continuar</button>
                <button onClick={iniciar} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-borde bg-capa-2 font-semibold hover:bg-capa-3"><RotateCcw className="h-5 w-5" /> Reiniciar</button>
                <div className="grid grid-cols-2 gap-2.5">
                  <button onClick={alternarSilencio} className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-borde bg-capa-2 text-sm hover:bg-capa-3">{silencio ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />} Sonido</button>
                  <button onClick={alternarMusica} className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm ${musica ? "border-marca/60 bg-marca/15" : "border-borde bg-capa-2"}`}><Music className="h-4 w-4" /> Música</button>
                </div>
                {!embebido && <button onClick={volver} className="h-11 rounded-xl text-sm text-tenue hover:text-texto">Salir del juego</button>}
              </div>
            </div>
          </div>
        )}

        {/* Fin de partida */}
        {estado === "fin" && fin && (
          <div className="absolute inset-0 z-30 grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md animate-entrar" role="dialog" aria-label="Fin de la partida">
            {fin.nuevoRecord && <Confeti />}
            <div className="relative w-full max-w-sm rounded-3xl border border-borde bg-capa-1/95 p-6 text-center">
              <p className={`text-sm font-bold uppercase tracking-widest ${fin.gano ? "text-lima" : "text-rojo"}`}>{fin.gano ? "¡Victoria!" : "Fin de la partida"}</p>
              {fin.mensaje && <p className="mt-2 text-tenue">{fin.mensaje}</p>}
              <p className="mt-4 text-5xl font-black tabular-nums">{fin.puntos.toLocaleString("es")}</p>
              <p className="text-sm text-tenue">puntos · {fin.segundos} s</p>
              {fin.nuevoRecord ? (
                <p className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full bg-ambar/20 px-3 py-1 text-sm font-bold text-ambar"><Trophy className="h-4 w-4" /> ¡Nuevo récord personal!</p>
              ) : (
                <p className="mt-3 text-sm text-tenue">Récord: {mejor.toLocaleString("es")}</p>
              )}
              <div className="mt-6 grid gap-2.5">
                <button onClick={iniciar} autoFocus className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white font-bold text-fondo transition hover:scale-[1.02]"><RotateCcw className="h-5 w-5" /> Jugar de nuevo</button>
                {info.siguiente && !embebido && <Link href={`/jugar/${info.siguiente.id}`} className="flex h-12 items-center justify-center rounded-xl border border-borde bg-capa-2 px-3 text-sm font-semibold hover:bg-capa-3"><span className="truncate">Siguiente: {info.siguiente.nombre}</span></Link>}
                {!embebido && <Link href={`/juego/${juego.id}`} className="h-10 pt-2 text-sm text-tenue hover:text-texto">Ver ficha del juego</Link>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** En celulares verticales, sugiere girar la pantalla para los juegos horizontales. */
function AvisoGirar() {
  const [vertical, setVertical] = useState(false);
  useEffect(() => {
    const f = () => setVertical(window.innerHeight > window.innerWidth);
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  if (!vertical) return null;
  return <p className="absolute bottom-6 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-4 py-2 text-xs backdrop-blur">📱↻ Girá el celular para jugar más grande</p>;
}

function Confeti() {
  const colores = ["#7c5cff", "#22d3ee", "#a3e635", "#f472b6", "#fbbf24"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 60 }, (_, i) => (
        <span key={i} className="absolute top-[-5%] h-3 w-2 rounded-sm" style={{ left: `${(i * 37) % 100}%`, background: colores[i % 5], animation: `caer ${1.6 + (i % 7) * 0.25}s ${(i % 10) * 0.08}s ease-in forwards`, transform: `rotate(${i * 23}deg)` }} />
      ))}
      <style>{`@keyframes caer{to{transform:translateY(110vh) rotate(720deg);opacity:.2}}`}</style>
    </div>
  );
}
