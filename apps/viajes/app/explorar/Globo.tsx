"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import TIERRA from "@/lib/tierra.json";
import { ArrowRight, Bed, BookOpenText, AirplaneTilt, X } from "@phosphor-icons/react/dist/ssr";
import { desproyectar, enfocar, proyectar } from "@/lib/globo";
import { BORDES, paisEn } from "@/lib/fronteras";
import { bandera, nombrePais, paisPorCodigo } from "@/lib/paises";
import { condicionWmo } from "@/lib/clima-real";
import { useIdioma } from "@/components/ProveedorIdioma";
import { IconoClima } from "@/components/IconoClima";
import type { Condicion } from "@/lib/types";

export interface PuntoGlobo {
  slug: string;
  nombre: string;
  pais: string;
  codigoPais: string;
  foto?: string;
  lat: number;
  lon: number;
  iata: string;
  dias: number;
  porDia: [number, number];
  descripcion: string;
  /** Clima de este momento allá (null si Open-Meteo no respondió). */
  clima: { temperatura: number; condicion: Condicion; zona: string } | null;
}

const T = {
  es: {
    titulo: "Explorá el mundo",
    bajada: "Girá el globo y tocá cualquier país para ver su clima de ahora y su guía.",
    elegi: "Tocá un punto del globo o elegí acá:",
    porDia: "por persona y por día, sin el vuelo",
    guia: (d: number) => `Guía de ${d} días`,
    hoteles: "Ver hoteles",
    vuelos: "Buscar vuelos",
    cerrar: "Cerrar",
    arrastra: "Arrastrá para girar",
    ahora: "Ahora",
    horaLocal: "hora de allá",
    enCapital: (c: string) => `en ${c}`,
    guiaPais: (n: string) => `Guía de ${n}`,
    cargando: "Buscando el clima…",
  },
  en: {
    titulo: "Explore the world",
    bajada: "Spin the globe and tap any country to see its weather right now and its guide.",
    elegi: "Tap a point on the globe or pick one here:",
    porDia: "per person per day, without flights",
    guia: (d: number) => `${d}-day guide`,
    hoteles: "See hotels",
    vuelos: "Search flights",
    cerrar: "Close",
    arrastra: "Drag to spin",
    ahora: "Now",
    horaLocal: "local time",
    enCapital: (c: string) => `in ${c}`,
    guiaPais: (n: string) => `${n} guide`,
    cargando: "Getting the weather…",
  },
};

const fechaEn = (dias: number) => new Date(Date.now() + dias * 86_400_000).toISOString().slice(0, 10);

export function Globo({ puntos }: { puntos: PuntoGlobo[] }) {
  const { idioma } = useIdioma();
  const t = T[idioma];
  const caja = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const etiquetas = useRef<(HTMLButtonElement | null)[]>([]);
  const angulos = useRef({ phi: enfocar(30, -20).phi, theta: 0.3 });
  const objetivo = useRef<{ phi: number; theta: number } | null>(null);
  const arrastre = useRef<{ x: number; y: number; phi: number; theta: number } | null>(null);
  const [ancho, setAncho] = useState(0);
  const [elegido, setElegido] = useState<PuntoGlobo | null>(null);
  const [reloj, setReloj] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setReloj(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const elegidoRef = useRef<string | null>(null);
  elegidoRef.current = elegido?.slug ?? null;
  // País tocado en el globo (cualquiera, tenga o no una guía nuestra) y su clima de ahora en la capital.
  const [pais, setPais] = useState<string | null>(null);
  const paisRef = useRef<string | null>(null);
  paisRef.current = pais;
  const [climaPais, setClimaPais] = useState<{ temperatura: number; condicion: Condicion; zona: string } | null | "cargando">(null);
  useEffect(() => {
    const p = pais ? paisPorCodigo(pais) : null;
    if (!p) return;
    let vivo = true;
    setClimaPais("cargando");
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,weather_code&timezone=auto`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => vivo && setClimaPais(j?.current ? { temperatura: Math.round(j.current.temperature_2m), condicion: condicionWmo(j.current.weather_code), zona: j.timezone } : null))
      .catch(() => vivo && setClimaPais(null));
    return () => {
      vivo = false;
    };
  }, [pais]);

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => setAncho(Math.round(e.contentRect.width)));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const lz = lienzo.current;
    const ctx = lz?.getContext("2d");
    if (!ancho || !lz || !ctx) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ppp = Math.min(2, window.devicePixelRatio || 1);
    lz.width = lz.height = ancho * ppp;
    ctx.scale(ppp, ppp);
    const c = ancho / 2;
    const r = ancho * 0.4;
    let cuadro = 0;
    let vivo = true;
    // Cada punto de tierra como vector 3D, calculado una sola vez.
    const vectores = new Float32Array((TIERRA as [number, number][]).flatMap(([lat, lon]) => {
      const la = (lat * Math.PI) / 180;
      const lo = (lon * Math.PI) / 180;
      return [Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo)];
    }));
    const medidas = etiquetas.current.map((b) => [b?.offsetWidth ?? 0, b?.offsetHeight ?? 0]);

    const dibujar = () => {
      if (!vivo) return;
      const a = angulos.current;
      if (objetivo.current) {
        // Gira suave hasta dejar el destino elegido de frente (por el camino más corto).
        let d = objetivo.current.phi - a.phi;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        a.phi += d * 0.08;
        a.theta += (objetivo.current.theta - a.theta) * 0.08;
        if (Math.abs(d) < 0.001 && Math.abs(objetivo.current.theta - a.theta) < 0.001) objetivo.current = null;
      } else if (!arrastre.current && !elegidoRef.current && !paisRef.current && !quieto) {
        a.phi += 0.003;
      }
      cuadro++;
      ctx.clearRect(0, 0, ancho, ancho);

      // Brillo alrededor y el océano, con luz desde arriba a la izquierda.
      const halo = ctx.createRadialGradient(c, c, r * 0.9, c, c, r * 1.25);
      halo.addColorStop(0, "rgba(140,170,110,0.35)");
      halo.addColorStop(1, "rgba(140,170,110,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, ancho, ancho);
      const mar = ctx.createRadialGradient(c - r * 0.35, c - r * 0.4, r * 0.1, c, c, r);
      mar.addColorStop(0, "#3f5236");
      mar.addColorStop(1, "#151c12");
      ctx.fillStyle = mar;
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.fill();

      // Continentes: puntitos color crema, más claros cuanto más de frente (5 tonos, un trazo por tono).
      const punto = Math.max(1.4, ancho / 360);
      const [cp, sp, ct, st] = [Math.cos(a.phi), Math.sin(a.phi), Math.cos(a.theta), Math.sin(a.theta)];
      const tonos = Array.from({ length: 5 }, () => new Path2D());
      for (let k = 0; k < vectores.length; k += 3) {
        const [mx, my, mz] = [vectores[k], vectores[k + 1], vectores[k + 2]];
        const z = -mx * sp * ct + my * st + mz * cp * ct;
        if (z <= 0) continue;
        const x = mx * cp + mz * sp;
        const y = mx * sp * st + my * ct - mz * cp * st;
        tonos[Math.min(4, Math.floor(z * 5))].rect(c + x * r - punto / 2, c - y * r - punto / 2, punto, punto);
      }
      ctx.fillStyle = "#efe6cf";
      tonos.forEach((camino, n) => {
        ctx.globalAlpha = 0.3 + 0.7 * ((n + 0.5) / 5);
        ctx.fill(camino);
      });
      ctx.globalAlpha = 1;

      // País tocado: relleno y borde dorados (solo la parte que se ve de este lado del globo).
      if (paisRef.current && BORDES[paisRef.current]) {
        const borde = new Path2D();
        for (const anillo of BORDES[paisRef.current]) {
          let abierto = false;
          for (const [lon, lat] of anillo) {
            const q = proyectar(lat, lon, a.phi, a.theta);
            if (q.z <= 0) {
              abierto = false;
              continue;
            }
            if (abierto) borde.lineTo(q.x * ancho, q.y * ancho);
            else borde.moveTo(q.x * ancho, q.y * ancho);
            abierto = true;
          }
          if (abierto) borde.closePath();
        }
        ctx.fillStyle = "rgba(252,211,77,0.3)";
        ctx.fill(borde);
        ctx.strokeStyle = "#fcd34d";
        ctx.lineWidth = 1.5;
        ctx.stroke(borde);
      }

      // Destinos: puntos dorados; el elegido late.
      const ocupadas: [number, number, number, number][] = [];
      const orden = puntos.map((p, i) => ({ p, i, q: proyectar(p.lat, p.lon, a.phi, a.theta) }))
        .sort((x, y) => (x.p.slug === elegidoRef.current ? -1 : y.p.slug === elegidoRef.current ? 1 : y.q.z - x.q.z));
      for (const { p, i, q } of orden) {
        const b = etiquetas.current[i];
        const visible = q.z > 0.12;
        const x = q.x * ancho;
        const y = q.y * ancho;
        if (q.z > 0) {
          const es = p.slug === elegidoRef.current;
          if (es) {
            const fase = (cuadro % 90) / 90;
            ctx.strokeStyle = `rgba(252,211,77,${1 - fase})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 6 + fase * 18, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.globalAlpha = Math.min(1, q.z * 2);
          ctx.fillStyle = "#fcd34d";
          ctx.beginPath();
          ctx.arc(x, y, es ? 6 : 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        if (!b) continue;
        // Los nombres flotan sobre cada punto. Si se pisan con otro, se muestra solo el de adelante.
        const [w, h] = medidas[i];
        const caja: [number, number, number, number] = [x - w / 2, y - h * 1.3, x + w / 2, y - h * 0.3];
        const pisa = ocupadas.some(([x1, y1, x2, y2]) => caja[0] < x2 && caja[2] > x1 && caja[1] < y2 && caja[3] > y1);
        const mostrar = visible && !pisa;
        if (mostrar) ocupadas.push(caja);
        b.style.transform = `translate(${x}px, ${y}px) translate(-50%, -130%)`;
        b.style.opacity = mostrar ? String(Math.min(1, (q.z - 0.12) * 4)) : "0";
        b.style.pointerEvents = mostrar ? "auto" : "none";
        b.tabIndex = mostrar ? 0 : -1;
      }
      requestAnimationFrame(dibujar);
    };
    requestAnimationFrame(dibujar);
    lz.style.opacity = "1";
    return () => {
      vivo = false;
    };
  }, [ancho, puntos]);

  /** Tocar el globo cerca de un punto dorado lo elige (aunque su nombre esté tapado). */
  const tocar = (cx: number, cy: number) => {
    const rect = caja.current?.getBoundingClientRect();
    if (!rect) return;
    const { phi, theta } = angulos.current;
    let mejor: { p: PuntoGlobo; d: number } | null = null;
    for (const p of puntos) {
      const q = proyectar(p.lat, p.lon, phi, theta);
      if (q.z <= 0) continue;
      const d = Math.hypot(q.x * ancho - (cx - rect.left), q.y * ancho - (cy - rect.top));
      if (d < 28 && (!mejor || d < mejor.d)) mejor = { p, d };
    }
    if (mejor) return elegir(mejor.p);
    // Si no tocó un destino nuestro, se fija qué país hay ahí.
    const punto = desproyectar((cx - rect.left) / ancho, (cy - rect.top) / ancho, phi, theta);
    const codigo = punto && paisEn(punto.lat, punto.lon);
    if (codigo) elegirPais(codigo);
  };

  const elegirPais = (codigo: string) => {
    const p = paisPorCodigo(codigo);
    if (!p) return;
    setElegido(null);
    setPais(codigo);
    objetivo.current = enfocar(p.lat, p.lon);
  };

  const elegir = (p: PuntoGlobo) => {
    setPais(null);
    setElegido(p);
    objetivo.current = enfocar(p.lat, p.lon);
  };

  const entrada = fechaEn(30);
  const salida = (p: PuntoGlobo) => fechaEn(30 + p.dias);
  const usd = (n: number) => `US$ ${n.toLocaleString(idioma === "es" ? "es-ES" : "en-US")}`;

  const chips = (
    <ul className="flex flex-wrap gap-2">
      {puntos.map((p) => (
        <li key={p.slug}>
          <button
            type="button"
            onClick={() => elegir(p)}
            aria-pressed={elegido?.slug === p.slug}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition ${
              elegido?.slug === p.slug ? "border-amber-300 bg-amber-300 text-arena-950" : "border-white/20 text-white hover:border-amber-300 hover:bg-amber-300 hover:text-arena-950"
            }`}
          >
            {p.nombre} <ArrowRight size={12} weight="bold" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <>
    <div className="text-white">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t.titulo}</h1>
      <p className="mt-3 max-w-[48ch] text-lg text-arena-300">{t.bajada}</p>
    </div>
    <div className="mt-6 grid items-center gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div
        ref={caja}
        className="relative mx-auto aspect-square w-full max-w-[640px] cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          arrastre.current = { x: e.clientX, y: e.clientY, ...angulos.current };
          objetivo.current = null;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = arrastre.current;
          if (!d || !ancho) return;
          angulos.current.phi = d.phi + ((e.clientX - d.x) / ancho) * Math.PI;
          angulos.current.theta = Math.max(-1, Math.min(1, d.theta + ((e.clientY - d.y) / ancho) * Math.PI));
        }}
        onPointerUp={(e) => {
          const d = arrastre.current;
          arrastre.current = null;
          if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) tocar(e.clientX, e.clientY);
        }}
        onPointerCancel={() => (arrastre.current = null)}
      >
        <canvas ref={lienzo} className="size-full opacity-0 transition-opacity duration-1000" aria-label={t.titulo} role="img" />
        {puntos.map((p, i) => (
          <button
            key={p.slug}
            ref={(el) => {
              etiquetas.current[i] = el;
            }}
            type="button"
            onClick={() => elegir(p)}
            className={`absolute top-0 left-0 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap shadow-lg transition-colors ${
              elegido?.slug === p.slug ? "bg-amber-300 text-arena-950" : "bg-arena-950/80 text-white ring-1 ring-white/20 hover:bg-amber-300 hover:text-arena-950"
            }`}
            style={{ opacity: 0 }}
          >
            {p.nombre}
            {p.clima && <span className="ml-1 font-normal opacity-80">{p.clima.temperatura}°</span>}
          </button>
        ))}
        <p className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-xs text-arena-400">{t.arrastra}</p>
      </div>

      <div>
        {elegido ? (
          <article key={elegido.slug} className="aparecer overflow-hidden rounded-3xl bg-papel text-arena-900 shadow-2xl dark:bg-arena-900 dark:text-arena-100">
            <div className="relative h-48 bg-gradient-to-br from-oliva-600 to-oliva-900 sm:h-56">
              {elegido.foto && <Image src={elegido.foto} alt={elegido.nombre} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <button
                type="button"
                onClick={() => setElegido(null)}
                aria-label={t.cerrar}
                className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
              >
                <X size={18} weight="bold" />
              </button>
              <div className="absolute bottom-4 left-5 text-white">
                <p className="text-sm opacity-90">{elegido.pais}</p>
                <h2 className="text-3xl font-bold tracking-tight">{elegido.nombre}</h2>
              </div>
            </div>
            <div className="p-5">
              {elegido.clima && (
                <p className="mb-4 flex items-center gap-3 rounded-2xl bg-arena-100 px-4 py-3 dark:bg-arena-800">
                  <IconoClima condicion={elegido.clima.condicion} size={36} />
                  <span>
                    <span className="block text-2xl leading-none font-bold tabular-nums">{elegido.clima.temperatura}°C</span>
                    <span className="text-sm text-arena-600 dark:text-arena-400">
                      {t.ahora} · {reloj.toLocaleTimeString(idioma === "es" ? "es-ES" : "en-GB", { timeZone: elegido.clima.zona, hour: "2-digit", minute: "2-digit" })} {t.horaLocal}
                    </span>
                  </span>
                </p>
              )}
              <p className="text-sm text-arena-600 dark:text-arena-400">{elegido.descripcion}</p>
              <Link href={`/pais/${elegido.codigoPais.toLowerCase()}`} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-oliva-700 hover:underline dark:text-oliva-300">
                {bandera(elegido.codigoPais)} {t.guiaPais(nombrePais(elegido.codigoPais, idioma))} <ArrowRight size={14} aria-hidden />
              </Link>
              <p className="mt-4">
                <span className="text-2xl font-bold tabular-nums text-oliva-700 dark:text-oliva-300">
                  {usd(elegido.porDia[0])}–{elegido.porDia[1].toLocaleString(idioma === "es" ? "es-ES" : "en-US")}
                </span>{" "}
                <span className="text-sm text-arena-600 dark:text-arena-400">{t.porDia}</span>
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <Link href={`/guias/${elegido.slug}`} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-arena-300 px-3 py-2.5 text-sm font-semibold transition hover:bg-arena-100 dark:border-arena-700 dark:hover:bg-arena-800">
                  <BookOpenText size={18} aria-hidden /> {t.guia(elegido.dias)}
                </Link>
                {process.env.NEXT_PUBLIC_RESERVAS === "1" && (
                  <>
                    <Link
                      href={`/reservar?tipo=hotel&destino=${elegido.iata}&entrada=${entrada}&salida=${salida(elegido)}&adultos=2`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-arena-300 px-3 py-2.5 text-sm font-semibold transition hover:bg-arena-100 dark:border-arena-700 dark:hover:bg-arena-800"
                    >
                      <Bed size={18} aria-hidden /> {t.hoteles}
                    </Link>
                    <Link href="/reservar" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-oliva-700 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-oliva-800 dark:bg-oliva-300 dark:text-arena-950">
                      <AirplaneTilt size={18} aria-hidden /> {t.vuelos}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </article>
        ) : pais ? (
          <TarjetaPais codigo={pais} clima={climaPais} t={t} idioma={idioma} reloj={reloj} destinos={puntos.filter((p) => p.codigoPais === pais)} onDestino={elegir} onCerrar={() => setPais(null)} />
        ) : (
          <p className="mb-3 text-sm text-arena-400">{t.elegi}</p>
        )}
        <div className={elegido || pais ? "mt-6" : ""}>{chips}</div>
      </div>
    </div>
    </>
  );
}

type Textos = (typeof T)["es"] | (typeof T)["en"];

/** Tarjeta de cualquier país tocado en el globo: bandera, clima de ahora en la capital y link a su guía. */
function TarjetaPais({
  codigo,
  clima,
  t,
  idioma,
  reloj,
  destinos,
  onDestino,
  onCerrar,
}: {
  codigo: string;
  clima: { temperatura: number; condicion: Condicion; zona: string } | null | "cargando";
  t: Textos;
  idioma: "es" | "en";
  reloj: Date;
  destinos: PuntoGlobo[];
  onDestino: (p: PuntoGlobo) => void;
  onCerrar: () => void;
}) {
  const p = paisPorCodigo(codigo)!;
  const nombre = nombrePais(codigo, idioma);
  let hora = "";
  if (clima && clima !== "cargando") {
    try {
      hora = reloj.toLocaleTimeString(idioma === "es" ? "es-ES" : "en-GB", { timeZone: clima.zona, hour: "2-digit", minute: "2-digit" });
    } catch {}
  }
  return (
    <article key={codigo} className="aparecer relative overflow-hidden rounded-3xl bg-papel p-6 text-arena-900 shadow-2xl dark:bg-arena-900 dark:text-arena-100">
      <button
        type="button"
        onClick={onCerrar}
        aria-label={t.cerrar}
        className="absolute top-3 right-3 grid size-9 place-items-center rounded-full text-arena-500 transition hover:bg-arena-100 dark:hover:bg-arena-800"
      >
        <X size={18} weight="bold" />
      </button>
      <p className="text-5xl" aria-hidden>
        {bandera(codigo)}
      </p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight">{nombre}</h2>
      <div className="mt-4 flex min-h-16 items-center gap-3 rounded-2xl bg-arena-100 px-4 py-3 dark:bg-arena-800">
        {clima === "cargando" ? (
          <span className="animate-pulse text-sm text-arena-500">{t.cargando}</span>
        ) : clima ? (
          <>
            <IconoClima condicion={clima.condicion} size={36} />
            <span>
              <span className="block text-2xl leading-none font-bold tabular-nums">{clima.temperatura}°C</span>
              <span className="text-sm text-arena-600 dark:text-arena-400">
                {t.ahora} {p.capital && t.enCapital(p.capital)}
                {hora && ` · ${hora} ${t.horaLocal}`}
              </span>
            </span>
          </>
        ) : (
          <span className="text-sm text-arena-500">—</span>
        )}
      </div>
      {destinos.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {destinos.map((d) => (
            <li key={d.slug}>
              <button type="button" onClick={() => onDestino(d)} className="rounded-full bg-amber-300 px-3 py-1.5 text-sm font-semibold text-arena-950 transition hover:bg-amber-200">
                {d.nombre} · {t.guia(d.dias)}
              </button>
            </li>
          ))}
        </ul>
      )}
      <Link
        href={`/pais/${codigo.toLowerCase()}`}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-oliva-700 px-4 py-3 font-semibold text-white transition hover:bg-oliva-800 dark:bg-oliva-300 dark:text-arena-950"
      >
        <BookOpenText size={20} aria-hidden /> {t.guiaPais(nombre)}
      </Link>
    </article>
  );
}
