"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Bed, CheckCircle, CircleNotch, Info, Star, Ticket, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { BuscadorCiudad } from "@/components/BuscadorCiudad";
import { useIdioma } from "@/components/ProveedorIdioma";
import { LOCALE, type Idioma } from "@/lib/idioma";
import type { Lugar } from "@/lib/lugares-tipos";
import type { Huesped, OfertaHotel } from "@/lib/hoteles";
import { guardarReserva } from "@/lib/almacen";

const T = {
  es: {
    titulo: "Reservá tu hotel",
    bajada: "Buscá, elegí y reservá sin salir de Rumbo Traveling.",
    prueba: "Modo prueba: las reservas son de mentira. No se cobra nada ni se reserva un hotel de verdad.",
    entrada: "Entrada",
    salida: "Salida",
    adultos: "Huéspedes",
    buscar: "Buscar hoteles",
    buscando: "Buscando hoteles con lugar…",
    sinHoteles: "No encontramos hoteles con lugar para esas fechas. Probá con otras.",
    elegir: "Elegir",
    verFotos: "Ver la habitación",
    ocultarFotos: "Ocultar fotos",
    laHabitacion: "La habitación",
    elHotel: "El hotel",
    sinFotos: "Este hotel no tiene fotos de la habitación.",
    noches: (n: number) => (n === 1 ? "1 noche" : `${n} noches`),
    reembolsable: "Cancelación gratis",
    noReembolsable: "No reembolsable",
    volver: "Volver a los hoteles",
    datos: "¿A nombre de quién?",
    nombre: "Nombre",
    apellido: "Apellido",
    email: "Email (te mandamos la reserva acá)",
    telefono: "Teléfono (opcional, con +34…)",
    pagar: (p: string) => `Pagar ${p} y reservar`,
    avisoEmail: "Te mandamos la confirmación a este email. También vas a recibir novedades y ofertas de Rumbo Traveling (te podés dar de baja cuando quieras).",
    sinNovedades: "No quiero recibir novedades",
    pagando: "Reservando el hotel…",
    pagoPrueba: "En modo prueba no se pide tarjeta: el pago es simulado.",
    listo: "¡Listo! Tu hotel está reservado",
    confirmando: "Estamos confirmando tu hotel",
    confirmandoAyuda: "Nuestro agente lo termina en unos minutos y te manda la reserva por email. No vuelvas a reservarlo.",
    codigo: "Código de reserva",
    codigoAyuda: "Mostralo al llegar al hotel.",
    otra: "Buscar otro hotel",
    errores: {
      datos: "Revisá los datos: destino, fechas y huéspedes.",
      faltan: "Completá nombre, apellido y email. Si ponés teléfono, que empiece con + y el código de país.",
      oferta: "Esa habitación ya no está disponible o cambió de precio. Elegí otra.",
      inactivo: "La reserva de hoteles todavía no está activa.",
      limite: "Hiciste muchas búsquedas seguidas. Esperá un rato.",
      general: "Algo falló. Probá de nuevo en un momento.",
    },
  },
  en: {
    titulo: "Book your hotel",
    bajada: "Search, choose and book without leaving Rumbo Traveling.",
    prueba: "Test mode: bookings are not real. Nothing is charged and no real hotel is booked.",
    entrada: "Check-in",
    salida: "Check-out",
    adultos: "Guests",
    buscar: "Search hotels",
    buscando: "Searching hotels with availability…",
    sinHoteles: "No hotels available for those dates. Try other dates.",
    elegir: "Select",
    verFotos: "See the room",
    ocultarFotos: "Hide photos",
    laHabitacion: "The room",
    elHotel: "The hotel",
    sinFotos: "This hotel has no room photos.",
    noches: (n: number) => (n === 1 ? "1 night" : `${n} nights`),
    reembolsable: "Free cancellation",
    noReembolsable: "Non-refundable",
    volver: "Back to hotels",
    datos: "Who is the booking for?",
    nombre: "First name",
    apellido: "Last name",
    email: "Email (we send the booking here)",
    telefono: "Phone (optional, with +34…)",
    pagar: (p: string) => `Pay ${p} and book`,
    avisoEmail: "We'll send the confirmation to this email. You'll also get Rumbo Traveling news and deals (unsubscribe any time).",
    sinNovedades: "I don't want news",
    pagando: "Booking the hotel…",
    pagoPrueba: "In test mode no card is needed: the payment is simulated.",
    listo: "Done! Your hotel is booked",
    confirmando: "We're confirming your hotel",
    confirmandoAyuda: "Our agent finishes it in a few minutes and emails you the booking. Don't book it again.",
    codigo: "Booking reference",
    codigoAyuda: "Show it when you arrive at the hotel.",
    otra: "Search another hotel",
    errores: {
      datos: "Check the details: destination, dates and guests.",
      faltan: "Fill in first name, last name and email. If you add a phone, start with + and the country code.",
      oferta: "That room is no longer available or its price changed. Choose another.",
      inactivo: "Hotel booking isn't active yet.",
      limite: "Too many searches in a row. Wait a bit.",
      general: "Something went wrong. Try again in a moment.",
    },
  },
} satisfies Record<Idioma, unknown>;

type Paso = "buscar" | "elegir" | "datos" | "listo";
const dia = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

/** Fotos de la habitación (y del hotel), cargadas recién cuando se piden. */
function Galeria({ hotelId, habitacion, t }: { hotelId: string; habitacion: string; t: (typeof T)["es"] }) {
  const [fotos, setFotos] = useState<{ habitacion: string[]; hotel: string[]; nombreHabitacion: string } | null>(null);
  useEffect(() => {
    let vivo = true;
    fetch(`/api/reservas/hoteles/fotos?hotelId=${encodeURIComponent(hotelId)}&habitacion=${encodeURIComponent(habitacion)}`)
      .then((r) => r.json())
      .then((j) => vivo && setFotos({ habitacion: j.habitacion ?? [], hotel: j.hotel ?? [], nombreHabitacion: j.nombreHabitacion ?? "" }))
      .catch(() => vivo && setFotos({ habitacion: [], hotel: [], nombreHabitacion: "" }));
    return () => {
      vivo = false;
    };
  }, [hotelId, habitacion]);
  if (!fotos) return <p className="flex items-center gap-2 text-sm text-arena-500"><CircleNotch size={16} className="animate-spin motion-reduce:animate-none" aria-hidden />…</p>;
  const tira = (titulo: string, urls: string[]) =>
    urls.length ? (
      <div>
        <p className="mb-2 text-sm font-semibold">{titulo}</p>
        <ul className="flex snap-x gap-2 overflow-x-auto pb-2">
          {urls.map((u) => (
            <li key={u} className="shrink-0 snap-start">
              <img src={u} alt="" loading="lazy" className="h-36 w-52 rounded-xl object-cover sm:h-44 sm:w-64" />
            </li>
          ))}
        </ul>
      </div>
    ) : null;
  return (
    <div className="grid gap-3">
      {fotos.habitacion.length ? tira(`${t.laHabitacion}${fotos.nombreHabitacion ? ` · ${fotos.nombreHabitacion}` : ""}`, fotos.habitacion) : <p className="text-sm text-arena-500">{t.sinFotos}</p>}
      {tira(t.elHotel, fotos.hotel)}
    </div>
  );
}

export interface InicialHotel {
  destino: string;
  entrada: string;
  salida: string;
  adultos: number;
}

export function Hoteles({ prueba, inicial }: { prueba: boolean; inicial?: InicialHotel }) {
  const { idioma } = useIdioma();
  const t = T[idioma];
  const [paso, setPaso] = useState<Paso>("buscar");
  const [destino, setDestino] = useState({ texto: inicial?.destino ?? "", lugar: null as Lugar | null, aeropuerto: inicial?.destino ?? "" });
  const [entrada, setEntrada] = useState(inicial?.entrada ?? dia(7));
  const [salida, setSalida] = useState(inicial?.salida ?? dia(10));
  const [adultos, setAdultos] = useState(inicial?.adultos ?? 2);
  const [hoteles, setHoteles] = useState<OfertaHotel[]>([]);
  const [elegido, setElegido] = useState<OfertaHotel | null>(null);
  const [huesped, setHuesped] = useState<Huesped>({ nombre: "", apellido: "", email: "", telefono: "" });
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [sinNovedades, setSinNovedades] = useState(false);
  const [conFotos, setConFotos] = useState<string | null>(null);

  const noches = Math.max(1, Math.round((Date.parse(salida) - Date.parse(entrada)) / 86_400_000));
  const dinero = (n: number, moneda: string) => n.toLocaleString(LOCALE[idioma], { style: "currency", currency: moneda });
  const mensajeError = (e?: string) => t.errores[(e ?? "general") as keyof typeof t.errores] ?? t.errores.general;

  // Si viene de un viaje armado, busca solo apenas abre.
  useEffect(() => {
    if (inicial) void buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buscar = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!destino.aeropuerto || !entrada || !salida || salida <= entrada) return setError(t.errores.datos);
    setOcupado(true);
    setPaso("elegir");
    setHoteles([]);
    try {
      const r = await fetch("/api/reservas/hoteles/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aeropuerto: destino.aeropuerto, entrada, salida, adultos }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(mensajeError(j.error));
        setPaso("buscar");
      } else setHoteles(j.hoteles ?? []);
    } catch {
      setError(t.errores.general);
      setPaso("buscar");
    }
    setOcupado(false);
  };

  const reservar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!elegido) return;
    const h = { nombre: huesped.nombre.trim(), apellido: huesped.apellido.trim(), email: huesped.email.trim(), telefono: huesped.telefono.replace(/[\s-]/g, "") };
    if (!h.nombre || !h.apellido || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(h.email) || (h.telefono && !/^\+\d{7,15}$/.test(h.telefono))) return setError(t.errores.faltan);
    setError(null);
    setOcupado(true);
    try {
      const r = await fetch("/api/reservas/hoteles/reservar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oferta: elegido, entrada, salida, adultos, huesped: h, novedades: !sinNovedades }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setCodigo(j.codigo ?? "");
        // Se guarda solo en el dispositivo (y el viaje armado, si venía de uno).
        if (j.codigo) {
          guardarReserva({
            codigo: j.codigo,
            tipo: "hotel",
            titulo: elegido.nombre,
            detalle: `${entrada} – ${salida} · ${t.noches(noches)}`,
            precio: j.precio ?? elegido.precio,
            moneda: j.moneda ?? elegido.moneda,
            creado: new Date().toISOString(),
          });
        }
        setPaso("listo");
        window.scrollTo({ top: 0 });
      } else setError(mensajeError(j.error));
    } catch {
      setError(t.errores.general);
    }
    setOcupado(false);
  };

  const campo = "h-11 w-full rounded-xl border border-arena-300 bg-papel px-3 text-base focus:border-oliva-600 focus:ring-2 focus:ring-oliva-600/30 focus:outline-none dark:border-arena-700 dark:bg-arena-950";
  const botonPrincipal = "inline-flex items-center justify-center gap-2 rounded-xl bg-oliva-700 px-5 py-3 font-semibold text-white transition hover:bg-oliva-800 active:scale-[0.98] disabled:opacity-60 dark:bg-oliva-300 dark:text-arena-950";

  const Ficha = ({ h }: { h: OfertaHotel }) => (
    <div className="flex gap-4">
      {h.foto ? (
        <img src={h.foto} alt="" className="h-24 w-28 shrink-0 rounded-xl object-cover sm:h-28 sm:w-36" loading="lazy" />
      ) : (
        <span className="grid h-24 w-28 shrink-0 place-items-center rounded-xl bg-oliva-100 text-oliva-700 sm:h-28 sm:w-36">
          <Bed size={32} weight="duotone" aria-hidden />
        </span>
      )}
      <div className="min-w-0">
        <p className="font-semibold text-balance">{h.nombre}</p>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-amber-600" aria-label={`${h.estrellas} estrellas`}>
          {Array.from({ length: Math.round(h.estrellas) }, (_, i) => (
            <Star key={i} size={14} weight="fill" aria-hidden />
          ))}
          {h.puntaje && <span className="ml-1.5 rounded bg-oliva-700 px-1.5 text-xs font-semibold text-white">{h.puntaje.toFixed(1)}</span>}
        </p>
        <p className="mt-1 text-sm text-arena-600 dark:text-arena-400">{h.habitacion} · {h.regimen}</p>
        <p className={`text-sm font-medium ${h.reembolsable ? "text-oliva-700 dark:text-oliva-300" : "text-arena-500"}`}>{h.reembolsable ? t.reembolsable : t.noReembolsable}</p>
      </div>
    </div>
  );

  return (
    <section>
      <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight md:text-4xl">
        <Bed size={34} weight="duotone" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
        {t.titulo}
      </h1>
      <p className="mt-3 text-arena-600 dark:text-arena-400">{t.bajada}</p>
      {prueba && (
        <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <Info size={20} weight="fill" className="shrink-0" aria-hidden />
          {t.prueba}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 flex gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
          <WarningCircle size={20} weight="fill" className="shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {paso === "buscar" && (
        <form onSubmit={buscar} className="mt-8 grid gap-5 rounded-3xl border border-arena-200 bg-papel p-5 md:p-7 dark:border-arena-800 dark:bg-arena-900">
          <BuscadorCiudad
            tipo="destino"
            texto={destino.texto}
            lugar={destino.lugar}
            aeropuerto={destino.aeropuerto}
            onTexto={(texto) => setDestino({ texto, lugar: null, aeropuerto: "" })}
            onLugar={(lugar) => setDestino({ texto: lugar.ciudad || lugar.pais, lugar, aeropuerto: lugar.aeropuertos[0]?.iata ?? lugar.ciudades?.[0]?.iata ?? "" })}
            onAeropuerto={(iata) => setDestino((d) => ({ ...d, aeropuerto: iata }))}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-1.5 text-sm font-medium">
              {t.entrada}
              <input type="date" required min={dia(1)} value={entrada} onChange={(e) => setEntrada(e.target.value)} className={campo} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              {t.salida}
              <input type="date" required min={entrada} value={salida} onChange={(e) => setSalida(e.target.value)} className={campo} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              {t.adultos}
              <select value={adultos} onChange={(e) => setAdultos(Number(e.target.value))} className={campo}>
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" className={botonPrincipal}>{t.buscar}</button>
        </form>
      )}

      {paso === "elegir" && (
        <div className="mt-8">
          <button type="button" onClick={() => setPaso("buscar")} className="inline-flex items-center gap-1.5 text-sm font-medium text-oliva-700 hover:underline dark:text-oliva-300">
            <ArrowLeft size={16} aria-hidden />
            {destino.texto} · {t.noches(noches)}
          </button>
          {ocupado ? (
            <p className="mt-8 flex items-center gap-3 text-arena-600 dark:text-arena-400" role="status">
              <CircleNotch size={24} className="animate-spin motion-reduce:animate-none" aria-hidden />
              {t.buscando}
            </p>
          ) : hoteles.length === 0 ? (
            <p className="mt-8 text-arena-600 dark:text-arena-400">{t.sinHoteles}</p>
          ) : (
            <ul className="mt-5 grid gap-3">
              {hoteles.map((h) => (
                <li key={h.ofertaId} className="grid gap-4 rounded-2xl border border-arena-200 bg-papel p-4 sm:grid-cols-[1fr_auto] sm:items-center dark:border-arena-800 dark:bg-arena-900">
                  <div>
                    <Ficha h={h} />
                    <button
                      type="button"
                      onClick={() => setConFotos((x) => (x === h.ofertaId ? null : h.ofertaId))}
                      aria-expanded={conFotos === h.ofertaId}
                      className="mt-3 text-sm font-medium text-oliva-700 underline underline-offset-2 dark:text-oliva-300"
                    >
                      📷 {conFotos === h.ofertaId ? t.ocultarFotos : t.verFotos}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <p className="text-right">
                      <span className="block text-2xl font-bold tabular-nums">{dinero(h.precio, h.moneda)}</span>
                      <span className="text-xs text-arena-500">{t.noches(noches)}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setElegido(h);
                        setError(null);
                        setPaso("datos");
                        window.scrollTo({ top: 0 });
                      }}
                      className={botonPrincipal}
                    >
                      {t.elegir}
                    </button>
                  </div>
                  {conFotos === h.ofertaId && (
                    <div className="sm:col-span-2">
                      <Galeria hotelId={h.hotelId} habitacion={h.habitacion} t={t as (typeof T)["es"]} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {paso === "datos" && elegido && (
        <form onSubmit={reservar} className="mt-8 grid gap-6">
          <button type="button" onClick={() => setPaso("elegir")} className="inline-flex items-center gap-1.5 justify-self-start text-sm font-medium text-oliva-700 hover:underline dark:text-oliva-300">
            <ArrowLeft size={16} aria-hidden />
            {t.volver}
          </button>
          <div className="grid gap-4 rounded-2xl border border-arena-200 bg-papel p-4 dark:border-arena-800 dark:bg-arena-900">
            <Ficha h={elegido} />
            <Galeria hotelId={elegido.hotelId} habitacion={elegido.habitacion} t={t as (typeof T)["es"]} />
          </div>
          <fieldset className="grid gap-4 rounded-2xl border border-arena-200 p-5 sm:grid-cols-2 dark:border-arena-800">
            <legend className="px-1 font-semibold">{t.datos}</legend>
            {(["nombre", "apellido"] as const).map((k) => (
              <label key={k} className="grid gap-1.5 text-sm font-medium">
                {t[k]}
                <input required autoComplete={k === "nombre" ? "given-name" : "family-name"} value={huesped[k]} onChange={(e) => setHuesped((h) => ({ ...h, [k]: e.target.value }))} className={campo} />
              </label>
            ))}
            <label className="grid gap-1.5 text-sm font-medium">
              {t.email}
              <input required type="email" autoComplete="email" value={huesped.email} onChange={(e) => setHuesped((h) => ({ ...h, email: e.target.value }))} className={campo} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              {t.telefono}
              <input type="tel" autoComplete="tel" placeholder="+34 600 000 000" value={huesped.telefono} onChange={(e) => setHuesped((h) => ({ ...h, telefono: e.target.value }))} className={campo} />
            </label>
          </fieldset>
          <div className="grid gap-2 text-sm text-arena-600 dark:text-arena-400">
            <p>{t.avisoEmail}</p>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={sinNovedades} onChange={(e) => setSinNovedades(e.target.checked)} className="size-4 accent-oliva-700" />
              {t.sinNovedades}
            </label>
          </div>
          {prueba && <p className="text-sm text-arena-600 dark:text-arena-400">{t.pagoPrueba}</p>}
          <button type="submit" disabled={ocupado} className={`${botonPrincipal} text-lg`}>
            {ocupado ? (
              <>
                <CircleNotch size={20} className="animate-spin motion-reduce:animate-none" aria-hidden />
                {t.pagando}
              </>
            ) : (
              t.pagar(dinero(elegido.precio, elegido.moneda))
            )}
          </button>
        </form>
      )}

      {paso === "listo" && elegido && (
        <div className="mt-8 rounded-3xl border border-oliva-200 bg-oliva-50 p-6 text-center md:p-10 dark:border-oliva-800 dark:bg-oliva-900/30" aria-live="polite">
          <CheckCircle size={56} weight="fill" className="mx-auto text-oliva-700 dark:text-oliva-300" aria-hidden />
          <h2 className="mt-4 text-2xl font-semibold">{codigo ? t.listo : t.confirmando}</h2>
          {codigo ? (
            <>
              <p className="mt-6 text-sm text-arena-600 dark:text-arena-400">{t.codigo}</p>
              <p className="mt-1 flex items-center justify-center gap-2 text-3xl font-bold tracking-widest">
                <Ticket size={30} weight="duotone" aria-hidden />
                {codigo}
              </p>
              <p className="mt-2 text-sm text-arena-600 dark:text-arena-400">{t.codigoAyuda}</p>
            </>
          ) : (
            <p className="mx-auto mt-3 max-w-md text-arena-600 dark:text-arena-400">{t.confirmandoAyuda}</p>
          )}
          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-papel p-4 text-left dark:bg-arena-900">
            <Ficha h={elegido} />
          </div>
          <button
            type="button"
            onClick={() => {
              setPaso("buscar");
              setElegido(null);
              setCodigo("");
            }}
            className={`${botonPrincipal} mt-8`}
          >
            {t.otra}
          </button>
        </div>
      )}
    </section>
  );
}
