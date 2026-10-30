"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AirplaneTilt, Bed, CircleNotch, Star } from "@phosphor-icons/react/dist/ssr";
import { LOCALE } from "@/lib/idioma";
import type { Oferta } from "@/lib/duffel";
import type { OfertaHotel } from "@/lib/hoteles";
import { useIdioma } from "./ProveedorIdioma";

// Vuelos y hoteles que se pueden comprar ya, dentro del viaje armado: precio final (con nuestra comisión) y botón "Comprar".
// Al tocar "Comprar" se guarda la opción elegida y /reservar abre directo en los datos del pasajero.

export const CLAVE_OFERTA_VUELO = "rumbo:oferta-vuelo";
export const CLAVE_OFERTA_HOTEL = "rumbo:oferta-hotel";

const T = {
  es: {
    vuelos: "Comprá tu vuelo acá",
    hoteles: (c: string) => `Reservá tu hotel en ${c} acá`,
    bajada: "Precio final, con todo incluido. Se paga en Rumbo Traveling.",
    buscando: "Buscando precios reales…",
    nada: "No encontramos opciones para comprar en estas fechas.",
    comprar: "Comprar",
    reservar: "Reservar",
    mas: "Ver más opciones",
    directo: "Directo",
    escalas: (n: number) => (n === 1 ? "1 escala" : `${n} escalas`),
    total: (n: number) => (n === 1 ? "precio final" : `precio final para ${n}`),
    noches: (n: number) => (n === 1 ? "1 noche" : `${n} noches`),
  },
  en: {
    vuelos: "Buy your flight here",
    hoteles: (c: string) => `Book your hotel in ${c} here`,
    bajada: "Final price, everything included. Paid on Rumbo Traveling.",
    buscando: "Getting real prices…",
    nada: "No options to buy for these dates.",
    comprar: "Buy",
    reservar: "Book",
    mas: "See more options",
    directo: "Direct",
    escalas: (n: number) => (n === 1 ? "1 stop" : `${n} stops`),
    total: (n: number) => (n === 1 ? "final price" : `final price for ${n}`),
    noches: (n: number) => (n === 1 ? "1 night" : `${n} nights`),
  },
};

const caja = "mt-4 rounded-3xl border-2 border-oliva-700 bg-oliva-50 p-4 sm:p-5 dark:border-oliva-300 dark:bg-oliva-900/30";
const boton = "shrink-0 rounded-xl bg-oliva-700 px-5 py-2.5 font-semibold text-white transition hover:bg-oliva-800 active:scale-[0.98] dark:bg-oliva-300 dark:text-arena-950";

export function VuelosAComprar({ origen, destino, ida, vuelta, adultos }: { origen: string; destino: string; ida: string; vuelta: string; adultos: number }) {
  const { idioma } = useIdioma();
  const t = T[idioma];
  const router = useRouter();
  const [ofertas, setOfertas] = useState<Oferta[] | null>(null);
  const consulta = `origen=${origen}&destino=${destino}&ida=${ida}&vuelta=${vuelta}&adultos=${adultos}`;
  useEffect(() => {
    let vivo = true;
    fetch("/api/reservas/buscar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ origen, destino, ida, vuelta, adultos }) })
      .then((r) => r.json())
      .then((j) => vivo && setOfertas(j.ofertas ?? []))
      .catch(() => vivo && setOfertas([]));
    return () => {
      vivo = false;
    };
  }, [origen, destino, ida, vuelta, adultos]);
  const dinero = (n: number, m: string) => n.toLocaleString(LOCALE[idioma], { style: "currency", currency: m });
  const comprar = (o: Oferta) => {
    try {
      sessionStorage.setItem(CLAVE_OFERTA_VUELO, JSON.stringify(o));
    } catch {}
    router.push(`/reservar?${consulta}&elegida=1`);
  };
  return (
    <div className={caja}>
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <AirplaneTilt size={22} weight="duotone" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
        {t.vuelos}
      </h3>
      <p className="text-sm text-arena-600 dark:text-arena-400">{t.bajada}</p>
      {ofertas === null ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-arena-600" role="status">
          <CircleNotch size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />
          {t.buscando}
        </p>
      ) : ofertas.length === 0 ? (
        <p className="mt-4 text-sm text-arena-600 dark:text-arena-400">{t.nada}</p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {ofertas.slice(0, 3).map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-papel p-3 sm:p-4 dark:bg-arena-900">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold">
                  {o.logo && <img src={o.logo} alt="" width={20} height={20} className="size-5" />}
                  {o.aerolinea}
                </p>
                {o.tramos.map((tr, i) => (
                  <p key={i} className="text-sm text-arena-600 tabular-nums dark:text-arena-400">
                    {tr.salida.slice(11, 16)} {tr.segmentos[0].desde} → {tr.llegada.slice(11, 16)} {tr.segmentos[tr.segmentos.length - 1].hasta} ·{" "}
                    {tr.escalas === 0 ? t.directo : t.escalas(tr.escalas)}
                  </p>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-right">
                  <span className="block text-xl font-bold tabular-nums">{dinero(o.precio, o.moneda)}</span>
                  <span className="text-xs text-arena-500">{t.total(adultos)}</span>
                </p>
                <button type="button" onClick={() => comprar(o)} className={boton}>
                  {t.comprar}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <a href={`/reservar?${consulta}`} className="mt-3 inline-block text-sm font-medium text-oliva-700 underline underline-offset-2 dark:text-oliva-300">
        {t.mas}
      </a>
    </div>
  );
}

export function HotelesAReservar({ ciudad, aeropuerto, entrada, salida, adultos }: { ciudad: string; aeropuerto: string; entrada: string; salida: string; adultos: number }) {
  const { idioma } = useIdioma();
  const t = T[idioma];
  const router = useRouter();
  const [hoteles, setHoteles] = useState<OfertaHotel[] | null>(null);
  const consulta = `tipo=hotel&destino=${aeropuerto}&entrada=${entrada}&salida=${salida}&adultos=${adultos}`;
  const noches = Math.max(1, Math.round((Date.parse(salida) - Date.parse(entrada)) / 86_400_000));
  useEffect(() => {
    let vivo = true;
    fetch("/api/reservas/hoteles/buscar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aeropuerto, entrada, salida, adultos }) })
      .then((r) => r.json())
      .then((j) => vivo && setHoteles(j.hoteles ?? []))
      .catch(() => vivo && setHoteles([]));
    return () => {
      vivo = false;
    };
  }, [aeropuerto, entrada, salida, adultos]);
  const dinero = (n: number, m: string) => n.toLocaleString(LOCALE[idioma], { style: "currency", currency: m });
  const reservar = (h: OfertaHotel) => {
    try {
      sessionStorage.setItem(CLAVE_OFERTA_HOTEL, JSON.stringify(h));
    } catch {}
    router.push(`/reservar?${consulta}&elegida=1`);
  };
  // Los 3 más baratos (ya vienen ordenados por precio desde la búsqueda) — público joven, prioridad es ahorrar.
  const lista = (hoteles ?? []).slice(0, 3);
  return (
    <div className={caja}>
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <Bed size={22} weight="duotone" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
        {t.hoteles(ciudad)}
      </h3>
      <p className="text-sm text-arena-600 dark:text-arena-400">{t.bajada}</p>
      {hoteles === null ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-arena-600" role="status">
          <CircleNotch size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />
          {t.buscando}
        </p>
      ) : lista.length === 0 ? (
        <p className="mt-4 text-sm text-arena-600 dark:text-arena-400">{t.nada}</p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {lista.map((h) => (
            <li key={h.ofertaId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-papel p-3 dark:bg-arena-900">
              <div className="flex min-w-0 items-center gap-3">
                {h.foto && <img src={h.foto} alt="" loading="lazy" className="h-16 w-20 shrink-0 rounded-xl object-cover" />}
                <div className="min-w-0">
                  <p className="font-semibold">{h.nombre}</p>
                  <p className="flex items-center gap-1 text-sm text-amber-600">
                    {Array.from({ length: Math.round(h.estrellas) }, (_, i) => (
                      <Star key={i} size={12} weight="fill" aria-hidden />
                    ))}
                    {h.puntaje && <span className="ml-1 rounded bg-oliva-700 px-1.5 text-xs font-semibold text-white">{h.puntaje.toFixed(1)}</span>}
                  </p>
                  <p className="text-sm text-arena-600 dark:text-arena-400">{h.habitacion}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-right">
                  <span className="block text-xl font-bold tabular-nums">{dinero(h.precio, h.moneda)}</span>
                  <span className="text-xs text-arena-500">{t.noches(noches)}</span>
                </p>
                <button type="button" onClick={() => reservar(h)} className={boton}>
                  {t.reservar}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <a href={`/reservar?${consulta}`} className="mt-3 inline-block text-sm font-medium text-oliva-700 underline underline-offset-2 dark:text-oliva-300">
        {t.mas}
      </a>
    </div>
  );
}
