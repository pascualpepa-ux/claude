"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { buscar, type Filtros, type Orden } from "@/lib/catalogo/consultas";
import { DIFICULTADES, NOMBRE_DURACION, NOMBRE_GENERO, type Duracion, type Genero } from "@/lib/catalogo/tipos";
import { TarjetaJuego } from "./TarjetaJuego";

const PAGINA = 48;
const GENEROS = Object.keys(NOMBRE_GENERO) as Genero[];
const GENEROS_CON_JUEGOS = new Set(buscar({}).flatMap((j) => j.generos));

function usarAncho(ref: React.RefObject<HTMLDivElement | null>) {
  const [w, setW] = useState(1200);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/** Catálogo con búsqueda instantánea, filtros y grilla virtualizada con scroll infinito. */
export function Explorador({ inicial }: { inicial: Filtros }) {
  const ruta = usePathname();
  const [f, setF] = useState<Filtros>(inicial);
  const [cantidad, setCantidad] = useState(PAGINA);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const grilla = useRef<HTMLDivElement>(null);
  const ancho = usarAncho(grilla);
  const [vista, setVista] = useState({ desde: 0, hasta: 12 });

  const resultados = useMemo(() => buscar(f), [f]);
  const visibles = Math.min(cantidad, resultados.length);
  const columnas = Math.max(2, Math.floor((ancho + 16) / (ancho < 640 ? 170 : 236)));
  const anchoTarjeta = (ancho - (columnas - 1) * 16) / columnas;
  const altoFila = anchoTarjeta * 0.625 + 70;
  const filas = Math.ceil(visibles / columnas);

  // Sincroniza la URL (sin recargar) para poder compartir la búsqueda
  useEffect(() => {
    const p = new URLSearchParams();
    if (f.q) p.set("q", f.q);
    if (f.genero) p.set("genero", f.genero);
    if (f.duracion) p.set("duracion", f.duracion);
    if (f.dificultad != null) p.set("dificultad", String(f.dificultad));
    if (f.multijugador) p.set("multijugador", "1");
    if (f.movil) p.set("movil", "1");
    if (f.orden && f.orden !== "popular") p.set("orden", f.orden);
    const t = setTimeout(() => window.history.replaceState(null, "", `${ruta}${p.size ? `?${p}` : ""}`), 250);
    setCantidad(PAGINA);
    return () => clearTimeout(t);
  }, [f, ruta]);

  // Virtualización con el scroll de la ventana + carga de más resultados cerca del final
  useEffect(() => {
    const calc = () => {
      const el = grilla.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const y = window.scrollY - top;
      const desde = Math.max(0, Math.floor(y / altoFila) - 2);
      const hasta = Math.ceil((y + window.innerHeight) / altoFila) + 3;
      setVista((v) => (v.desde === desde && v.hasta === hasta ? v : { desde, hasta }));
      if ((hasta + 4) * columnas >= cantidad && cantidad < resultados.length) setCantidad((c) => Math.min(resultados.length, c + PAGINA));
    };
    calc();
    window.addEventListener("scroll", calc, { passive: true });
    window.addEventListener("resize", calc);
    return () => { window.removeEventListener("scroll", calc); window.removeEventListener("resize", calc); };
  }, [altoFila, columnas, cantidad, resultados.length]);

  const cambiar = (c: Partial<Filtros>) => setF((x) => ({ ...x, ...c }));
  const activos = [f.genero, f.duracion, f.dificultad != null ? 1 : null, f.multijugador, f.movil].filter(Boolean).length;
  const chip = (activo: boolean) => `rounded-full border px-3 py-1.5 text-sm transition ${activo ? "border-marca bg-marca/20 text-texto" : "border-borde bg-capa-1 text-tenue hover:border-tenue hover:text-texto"}`;

  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-10 sm:px-6">
      <div className="pt-6">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Explorar</h1>
        <p className="mt-1 text-tenue">{resultados.length.toLocaleString("es")} juegos {f.q ? <>para «<span className="text-texto">{f.q}</span>»</> : "para jugar ya mismo"}</p>
      </div>

      <div className="sticky top-16 z-30 -mx-4 mt-4 border-b border-borde/60 bg-fondo/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tenue" />
            <input
              autoFocus={!!inicial.q}
              value={f.q ?? ""}
              onChange={(e) => cambiar({ q: e.target.value })}
              placeholder="Buscá por nombre, género, temática…"
              aria-label="Buscar en el catálogo"
              className="h-11 w-full rounded-xl border border-borde bg-capa-1 pl-10 pr-9 outline-none transition focus:border-marca focus:ring-4 focus:ring-marca/20"
            />
            {f.q && <button onClick={() => cambiar({ q: "" })} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-tenue hover:text-texto" aria-label="Borrar búsqueda"><X className="h-4 w-4" /></button>}
          </div>
          <select value={f.orden ?? "popular"} onChange={(e) => cambiar({ orden: e.target.value as Orden })} aria-label="Ordenar" className="h-11 rounded-xl border border-borde bg-capa-1 px-3 text-sm outline-none focus:border-marca">
            <option value="popular">Más populares</option>
            <option value="nuevo">Más nuevos</option>
            <option value="puntuacion">Mejor puntuados</option>
            {f.q && <option value="relevancia">Más relevantes</option>}
          </select>
          <button onClick={() => setFiltrosAbiertos((a) => !a)} className={`flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${filtrosAbiertos || activos ? "border-marca bg-marca/15" : "border-borde bg-capa-1 hover:bg-capa-2"}`} aria-expanded={filtrosAbiertos}>
            <SlidersHorizontal className="h-4 w-4" /> Filtros {activos > 0 && <span className="grid h-5 w-5 place-items-center rounded-full bg-marca text-xs">{activos}</span>}
          </button>
        </div>
        <div className="sin-scroll -mx-1 mt-3 flex gap-2 overflow-x-auto px-1">
          <button className={chip(!f.genero)} onClick={() => cambiar({ genero: "" })}>Todos</button>
          {GENEROS.filter((g) => GENEROS_CON_JUEGOS.has(g)).map((g) => (
            <button key={g} className={`${chip(f.genero === g)} shrink-0`} onClick={() => cambiar({ genero: f.genero === g ? "" : g })}>{NOMBRE_GENERO[g]}</button>
          ))}
        </div>
        {filtrosAbiertos && (
          <div className="mt-3 grid gap-4 rounded-2xl border border-borde bg-capa-1 p-4 animate-entrar sm:grid-cols-2 lg:grid-cols-4">
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-tenue">Duración</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(NOMBRE_DURACION) as Duracion[]).map((d) => <button key={d} className={chip(f.duracion === d)} onClick={() => cambiar({ duracion: f.duracion === d ? "" : d })}>{NOMBRE_DURACION[d]}</button>)}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-tenue">Dificultad</legend>
              <div className="flex flex-wrap gap-2">
                {DIFICULTADES.map((d, i) => <button key={d} className={chip(f.dificultad === i)} onClick={() => cambiar({ dificultad: f.dificultad === i ? null : i })}>{d}</button>)}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-tenue">Jugadores</legend>
              <button className={chip(!!f.multijugador)} onClick={() => cambiar({ multijugador: !f.multijugador })}>Multijugador</button>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-tenue">Dispositivo</legend>
              <button className={chip(!!f.movil)} onClick={() => cambiar({ movil: !f.movil })}>Compatible con celular</button>
            </fieldset>
            {activos > 0 && <button onClick={() => cambiar({ genero: "", duracion: "", dificultad: null, multijugador: false, movil: false })} className="text-left text-sm text-marca-2 hover:underline">Limpiar filtros</button>}
          </div>
        )}
      </div>

      <div ref={grilla} className="relative mt-6" style={{ height: filas * altoFila }}>
        {Array.from({ length: Math.max(0, Math.min(filas, vista.hasta) - vista.desde) }, (_, k) => {
          const fila = vista.desde + k;
          return (
            <div key={fila} className="absolute inset-x-0 grid gap-4" style={{ top: fila * altoFila, gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}>
              {resultados.slice(fila * columnas, Math.min(visibles, (fila + 1) * columnas)).map((j) => <TarjetaJuego key={j.id} juego={j} />)}
            </div>
          );
        })}
      </div>
      {!resultados.length && (
        <div className="py-20 text-center">
          <p className="text-xl font-bold">No encontramos juegos con esos filtros</p>
          <p className="mt-2 text-tenue">Probá con otra palabra o sacá algún filtro.</p>
        </div>
      )}
    </div>
  );
}
