"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import TIERRA from "@/lib/tierra.json";
import { ArrowRight, Bed, BookOpenText, AirplaneTilt, X } from "@phosphor-icons/react/dist/ssr";
import { enfocar, proyectar } from "@/lib/globo";
import { useIdioma } from "@/components/ProveedorIdioma";

export interface PuntoGlobo {
  slug: string;
  nombre: string;
  pais: string;
  foto?: string;
  lat: number;
  lon: number;
  iata: string;
  dias: number;
  porDia: [number, number];
  descripcion: string;
}

const T = {
  es: {
    titulo: "Explorá el mundo",
    bajada: "Girá el globo y tocá un destino para ver fotos, cuánto sale y reservar.",
    elegi: "Tocá un punto del globo o elegí acá:",
    porDia: "por persona y por día, sin el vuelo",
    guia: (d: number) => `Guía de ${d} días`,
    hoteles: "Ver hoteles",
    vuelos: "Buscar vuelos",
    cerrar: "Cerrar",
    arrastra: "Arrastrá para girar",
  },
  en: {
    titulo: "Explore the world",
    bajada: "Spin the globe and tap a destination to see photos, prices and book.",
    elegi: "Tap a point on the globe or pick one here:",
    porDia: "per person per day, without flights",
    guia: (d: number) => `${d}-day guide`,
    hoteles: "See hotels",
    vuelos: "Search flights",
    cerrar: "Close",
    arrastra: "Drag to spin",
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
  const elegidoRef = useRef<string | null>(null);
  elegidoRef.current = elegido?.slug ?? null;

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
      } else if (!arrastre.current && !elegidoRef.current && !quieto) {
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
    if (mejor) elegir(mejor.p);
  };

  const elegir = (p: PuntoGlobo) => {
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
              <p className="text-sm text-arena-600 dark:text-arena-400">{elegido.descripcion}</p>
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
        ) : (
          <p className="mb-3 text-sm text-arena-400">{t.elegi}</p>
        )}
        <div className={elegido ? "mt-6" : ""}>{chips}</div>
      </div>
    </div>
    </>
  );
}
