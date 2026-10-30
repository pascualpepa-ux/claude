"use client";

import { useEffect, useState } from "react";
import { AirplaneTakeoff, ArrowLeft, CheckCircle, CircleNotch, Info, Ticket, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { BuscadorCiudad } from "@/components/BuscadorCiudad";
import { useIdioma } from "@/components/ProveedorIdioma";
import { LOCALE, type Idioma } from "@/lib/idioma";
import type { Lugar } from "@/lib/lugares-tipos";
import type { Oferta, Pasajero } from "@/lib/duffel";
import { guardarReserva } from "@/lib/almacen";
import { PagoTarjeta } from "@/components/PagoTarjeta";

const CON_TARJETA = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
import { CLAVE_OFERTA_VUELO } from "@/components/OfertasReales";

const T = {
  es: {
    titulo: "Comprá tu vuelo",
    bajada: "Buscá, elegí y pagá tu pasaje sin salir de Rumbo Traveling. El pasaje lo emite la aerolínea.",
    prueba: "Modo prueba: los vuelos y el pago son de mentira. No se cobra nada ni se emite un pasaje real.",
    ida: "Ida",
    vuelta: "Vuelta",
    soloIda: "Solo ida",
    adultos: "Pasajeros",
    buscar: "Buscar vuelos",
    buscando: "Buscando vuelos en las aerolíneas…",
    sinVuelos: "No encontramos vuelos para esa fecha. Probá con otro día.",
    elegir: "Elegir",
    recomendada: "Aerolínea recomendada",
    directo: "Directo",
    escalas: (n: number) => (n === 1 ? "1 escala" : `${n} escalas`),
    total: (n: number) => (n === 1 ? "total" : `total para ${n}`),
    volver: "Volver a los vuelos",
    datos: "Datos de los pasajeros",
    datosAyuda: "Tal como figuran en el pasaporte o DNI.",
    pasajero: (n: number) => `Pasajero ${n}`,
    nombre: "Nombre",
    apellido: "Apellido",
    nacimiento: "Fecha de nacimiento",
    genero: "Sexo",
    hombre: "Hombre",
    mujer: "Mujer",
    email: "Email (te mandamos el pasaje acá)",
    telefono: "Teléfono con código de país (+34…)",
    telefonoOpcional: "Teléfono (opcional, con +34…)",
    pagar: (p: string) => `Pagar ${p} y reservar`,
    avisoEmail: "Te mandamos la confirmación a este email. También vas a recibir novedades y ofertas de Rumbo Traveling (te podés dar de baja cuando quieras).",
    sinNovedades: "No quiero recibir novedades",
    pagando: "Emitiendo el pasaje…",
    pagoPrueba: "En modo prueba no se pide tarjeta: el pago es simulado.",
    continuarPago: "Continuar al pago",
    listo: "¡Listo! Tu vuelo está reservado",
    confirmando: "Estamos confirmando tu pasaje con la aerolínea",
    confirmandoAyuda: "Nuestro agente lo termina en unos minutos y te manda el código de reserva por email. No vuelvas a comprarlo.",
    codigo: "Código de reserva",
    codigoAyuda: "Con este código hacés el check-in en la web de la aerolínea.",
    otra: "Buscar otro vuelo",
    errores: {
      datos: "Revisá los datos: ciudades, fechas y pasajeros.",
      faltan: "Completá todos los datos de cada pasajero. El teléfono va con + y el código de país.",
      oferta: "Ese precio ya no está disponible. Volvé a buscar el vuelo.",
      aerolinea: "La aerolínea no pudo emitir este pasaje. Probá con otro vuelo.",
      pago: "El pago no se completó. No se te cobró nada.",
      inactivo: "La compra de vuelos todavía no está activa.",
      limite: "Hiciste muchas búsquedas seguidas. Esperá un rato.",
      general: "Algo falló. Probá de nuevo en un momento.",
    },
  },
  en: {
    titulo: "Book your flight",
    bajada: "Search, choose and pay for your ticket without leaving Rumbo Traveling. The airline issues the ticket.",
    prueba: "Test mode: flights and payment are not real. Nothing is charged and no real ticket is issued.",
    ida: "Departure",
    vuelta: "Return",
    soloIda: "One way",
    adultos: "Passengers",
    buscar: "Search flights",
    buscando: "Searching airlines…",
    sinVuelos: "No flights found for that date. Try another day.",
    elegir: "Select",
    recomendada: "Recommended airline",
    directo: "Direct",
    escalas: (n: number) => (n === 1 ? "1 stop" : `${n} stops`),
    total: (n: number) => (n === 1 ? "total" : `total for ${n}`),
    volver: "Back to flights",
    datos: "Passenger details",
    datosAyuda: "Exactly as shown on the passport or ID.",
    pasajero: (n: number) => `Passenger ${n}`,
    nombre: "First name",
    apellido: "Last name",
    nacimiento: "Date of birth",
    genero: "Sex",
    hombre: "Male",
    mujer: "Female",
    email: "Email (we send the ticket here)",
    telefono: "Phone with country code (+34…)",
    telefonoOpcional: "Phone (optional, with +34…)",
    pagar: (p: string) => `Pay ${p} and book`,
    avisoEmail: "We'll send the confirmation to this email. You'll also get Rumbo Traveling news and deals (unsubscribe any time).",
    sinNovedades: "I don't want news",
    pagando: "Issuing the ticket…",
    pagoPrueba: "In test mode no card is needed: the payment is simulated.",
    continuarPago: "Continue to payment",
    listo: "Done! Your flight is booked",
    confirmando: "We're confirming your ticket with the airline",
    confirmandoAyuda: "Our agent finishes it in a few minutes and emails you the booking reference. Don't buy it again.",
    codigo: "Booking reference",
    codigoAyuda: "Use this code to check in on the airline's website.",
    otra: "Search another flight",
    errores: {
      datos: "Check the details: cities, dates and passengers.",
      faltan: "Fill in every passenger's details. The phone starts with + and the country code.",
      oferta: "That price is no longer available. Search the flight again.",
      aerolinea: "The airline couldn't issue this ticket. Try another flight.",
      pago: "The payment wasn't completed. You weren't charged.",
      inactivo: "Flight booking isn't active yet.",
      limite: "Too many searches in a row. Wait a bit.",
      general: "Something went wrong. Try again in a moment.",
    },
  },
} satisfies Record<Idioma, unknown>;

type Paso = "buscar" | "elegir" | "datos" | "listo";
const vacio = (): Pasajero => ({ nombre: "", apellido: "", nacimiento: "", genero: "m", tratamiento: "mr", email: "", telefono: "" });
const manana = () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

/** "PT2H35M" → "2 h 35 min" */
function duracion(iso: string | null) {
  if (!iso) return "";
  const m = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return "";
  const h = Number(m[1] ?? 0) * 24 + Number(m[2] ?? 0);
  return `${h ? `${h} h ` : ""}${m[3] ? `${Number(m[3])} min` : ""}`.trim();
}

export interface InicialVuelo {
  origen: string;
  destino: string;
  ida: string;
  vuelta: string;
  adultos: number;
}

export function Reservar({ prueba, telefonoOpcional = false, inicial }: { prueba: boolean; telefonoOpcional?: boolean; inicial?: InicialVuelo }) {
  const { idioma } = useIdioma();
  const t = T[idioma];
  const [paso, setPaso] = useState<Paso>("buscar");
  const [origen, setOrigen] = useState({ texto: inicial?.origen ?? "", lugar: null as Lugar | null, aeropuerto: inicial?.origen ?? "" });
  const [destino, setDestino] = useState({ texto: inicial?.destino ?? "", lugar: null as Lugar | null, aeropuerto: inicial?.destino ?? "" });
  const [ida, setIda] = useState(inicial?.ida ?? manana());
  const [vuelta, setVuelta] = useState(inicial?.vuelta ?? "");
  const [soloIda, setSoloIda] = useState(!!inicial && !inicial.vuelta);
  const [adultos, setAdultos] = useState(inicial?.adultos ?? 1);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [elegida, setElegida] = useState<Oferta | null>(null);
  const [pasajeros, setPasajeros] = useState<Pasajero[]>([vacio()]);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [sinNovedades, setSinNovedades] = useState(false);
  const [pago, setPago] = useState<{ reserva: string; clientSecret: string; prueba: boolean } | null>(null);

  const dinero = (n: number, moneda: string) => n.toLocaleString(LOCALE[idioma], { style: "currency", currency: moneda });
  const hora = (iso: string) => iso.slice(11, 16);
  const dia = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(LOCALE[idioma], { weekday: "short", day: "numeric", month: "short" });
  const mensajeError = (e?: string) => t.errores[(e ?? "general") as keyof typeof t.errores] ?? t.errores.general;

  // Si viene de un viaje armado, busca solo apenas abre.
  useEffect(() => {
    if (!inicial) return;
    // Viene de "Comprar" en el viaje armado: abre directo en los datos del pasajero, sin volver a buscar.
    try {
      const guardada = new URLSearchParams(window.location.search).get("elegida") ? sessionStorage.getItem(CLAVE_OFERTA_VUELO) : null;
      if (guardada) {
        sessionStorage.removeItem(CLAVE_OFERTA_VUELO);
        const o = JSON.parse(guardada) as Oferta;
        setOfertas([o]);
        elegir(o);
        return;
      }
    } catch {}
    void buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buscar = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!origen.aeropuerto || !destino.aeropuerto || !ida || (!soloIda && !vuelta)) return setError(t.errores.datos);
    setOcupado(true);
    setPaso("elegir");
    setOfertas([]);
    try {
      const r = await fetch("/api/reservas/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origen: origen.aeropuerto, destino: destino.aeropuerto, ida, vuelta: soloIda ? undefined : vuelta, adultos }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(mensajeError(j.error));
        setPaso("buscar");
      } else setOfertas(j.ofertas ?? []);
    } catch {
      setError(t.errores.general);
      setPaso("buscar");
    }
    setOcupado(false);
  };

  const elegir = (o: Oferta) => {
    setElegida(o);
    setPasajeros((ps) => Array.from({ length: adultos }, (_, i) => ps[i] ?? { ...vacio(), email: ps[0]?.email ?? "", telefono: ps[0]?.telefono ?? "" }));
    setError(null);
    setPaso("datos");
    window.scrollTo({ top: 0 });
  };

  /** La compra salió (o quedó en manos del vigilante): se guarda en el dispositivo y se muestra el código. */
  const terminar = (j: { codigo?: string; precio?: number; moneda?: string }) => {
    if (!elegida) return;
    setCodigo(j.codigo ?? "");
    // Se guarda solo en el dispositivo (y el viaje armado, si venía de uno).
    if (j.codigo) {
      const ida = elegida.tramos[0];
      guardarReserva({
        codigo: j.codigo,
        tipo: "vuelo",
        titulo: `${ida.segmentos[0].desde} → ${ida.segmentos[ida.segmentos.length - 1].hasta}`,
        detalle: `${elegida.aerolinea} · ${ida.salida.slice(0, 10)}${elegida.tramos[1] ? ` – ${elegida.tramos[1].salida.slice(0, 10)}` : ""}`,
        precio: elegida.precio,
        moneda: elegida.moneda,
        creado: new Date().toISOString(),
        viaje: {
          fecha: ida.salida.slice(0, 10),
          ciudad: destino.lugar?.ciudad || destino.texto || ida.segmentos[ida.segmentos.length - 1].hasta,
          iata: ida.segmentos[ida.segmentos.length - 1].hasta,
        },
      });
    }
    setPaso("listo");
    window.scrollTo({ top: 0 });
  };

  const pagar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!elegida) return;
    const lista = pasajeros.map((p, i) => ({ ...p, email: p.email || pasajeros[0].email, telefono: (p.telefono || pasajeros[0].telefono).replace(/[\s-]/g, ""), tratamiento: p.genero === "m" ? "mr" : "ms" }) as Pasajero);
    const telefonoMal = (tel: string) => (tel ? !/^\+\d{7,15}$/.test(tel) : !telefonoOpcional);
    if (lista.some((p) => !p.nombre.trim() || !p.apellido.trim() || !p.nacimiento || telefonoMal(p.telefono) || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.email))) {
      return setError(t.errores.faltan);
    }
    setError(null);
    setOcupado(true);
    try {
      const r = await fetch("/api/reservas/emitir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ofertaId: elegida.id, novedades: !sinNovedades, pasajeros: lista.map((p) => ({ ...p, nombre: p.nombre.trim(), apellido: p.apellido.trim() })) }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.pago) {
        // Con tarjeta: se muestra el recuadro de Stripe; la compra se hace cuando la tarjeta se acepta.
        setPago(j.pago);
      } else if (r.ok) terminar(j);
      else setError(mensajeError(j.error));
    } catch {
      setError(t.errores.general);
    }
    setOcupado(false);
  };

  const campo = "h-11 w-full rounded-xl border border-arena-300 bg-papel px-3 text-base focus:border-oliva-600 focus:ring-2 focus:ring-oliva-600/30 focus:outline-none dark:border-arena-700 dark:bg-arena-950";
  const botonPrincipal = "inline-flex items-center justify-center gap-2 rounded-xl bg-oliva-700 px-5 py-3 font-semibold text-white transition hover:bg-oliva-800 active:scale-[0.98] disabled:opacity-60 dark:bg-oliva-300 dark:text-arena-950";

  const Vuelo = ({ o }: { o: Oferta }) => (
    <div className="grid gap-3">
      {o.tramos.map((tr, i) => (
        <div key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <span className="text-xs font-medium tracking-wide text-arena-500 uppercase">{i === 0 ? t.ida : t.vuelta}</span>
          <div>
            <p className="font-semibold tabular-nums">
              {hora(tr.salida)} {tr.segmentos[0].desde} → {hora(tr.llegada)} {tr.segmentos[tr.segmentos.length - 1].hasta}
            </p>
            <p className="text-sm text-arena-600 dark:text-arena-400">
              {dia(tr.salida)} · {duracion(tr.duracion)} · {tr.escalas === 0 ? t.directo : t.escalas(tr.escalas)} · {tr.segmentos.map((s) => s.vuelo).join(", ")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight md:text-4xl">
        <AirplaneTakeoff size={34} weight="duotone" className="text-oliva-700 dark:text-oliva-300" aria-hidden />
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
            tipo="origen"
            texto={origen.texto}
            lugar={origen.lugar}
            aeropuerto={origen.aeropuerto}
            onTexto={(texto) => setOrigen({ texto, lugar: null, aeropuerto: "" })}
            onLugar={(lugar) => setOrigen({ texto: lugar.ciudad, lugar, aeropuerto: lugar.aeropuertos[0]?.iata ?? "" })}
            onAeropuerto={(iata) => setOrigen((o) => ({ ...o, aeropuerto: iata }))}
          />
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
              {t.ida}
              <input type="date" required min={manana()} value={ida} onChange={(e) => setIda(e.target.value)} className={campo} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              {t.vuelta}
              <input type="date" disabled={soloIda} min={ida} value={soloIda ? "" : vuelta} onChange={(e) => setVuelta(e.target.value)} className={`${campo} disabled:opacity-50`} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              {t.adultos}
              <select value={adultos} onChange={(e) => setAdultos(Number(e.target.value))} className={campo}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={soloIda} onChange={(e) => setSoloIda(e.target.checked)} className="size-4 accent-oliva-700" />
            {t.soloIda}
          </label>
          <button type="submit" className={botonPrincipal}>{t.buscar}</button>
        </form>
      )}

      {paso === "elegir" && (
        <section className="mt-8">
          <button type="button" onClick={() => setPaso("buscar")} className="inline-flex items-center gap-1.5 text-sm font-medium text-oliva-700 hover:underline dark:text-oliva-300">
            <ArrowLeft size={16} aria-hidden />
            {origen.aeropuerto} → {destino.aeropuerto}
          </button>
          {ocupado ? (
            <p className="mt-8 flex items-center gap-3 text-arena-600 dark:text-arena-400" role="status">
              <CircleNotch size={24} className="animate-spin motion-reduce:animate-none" aria-hidden />
              {t.buscando}
            </p>
          ) : ofertas.length === 0 ? (
            <p className="mt-8 text-arena-600 dark:text-arena-400">{t.sinVuelos}</p>
          ) : (
            <ul className="mt-5 grid gap-3">
              {ofertas.map((o) => (
                <li key={o.id} className="grid gap-4 rounded-2xl border border-arena-200 bg-papel p-4 sm:grid-cols-[1fr_auto] sm:items-center md:p-5 dark:border-arena-800 dark:bg-arena-900">
                  <div>
                    <p className="mb-2 flex items-center gap-2 font-semibold">
                      {o.logo && <img src={o.logo} alt="" width={22} height={22} className="size-[22px]" />}
                      {o.aerolinea}
                      {o.recomendada && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">⭐ {t.recomendada}</span>}
                    </p>
                    <Vuelo o={o} />
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <p className="text-right">
                      <span className="block text-2xl font-bold tabular-nums">{dinero(o.precio, o.moneda)}</span>
                      <span className="text-xs text-arena-500">{t.total(adultos)}</span>
                    </p>
                    <button type="button" onClick={() => elegir(o)} className={botonPrincipal}>{t.elegir}</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {paso === "datos" && elegida && (
        <form onSubmit={pagar} className="mt-8 grid gap-6">
          <button type="button" onClick={() => setPaso("elegir")} className="inline-flex items-center gap-1.5 justify-self-start text-sm font-medium text-oliva-700 hover:underline dark:text-oliva-300">
            <ArrowLeft size={16} aria-hidden />
            {t.volver}
          </button>
          <div className="rounded-2xl border border-arena-200 bg-papel p-5 dark:border-arena-800 dark:bg-arena-900">
            <p className="mb-3 font-semibold">{elegida.aerolinea}</p>
            <Vuelo o={elegida} />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{t.datos}</h2>
            <p className="text-sm text-arena-600 dark:text-arena-400">{t.datosAyuda}</p>
          </div>
          {pasajeros.map((p, i) => {
            const cambiar = (c: Partial<Pasajero>) => setPasajeros((ps) => ps.map((x, k) => (k === i ? { ...x, ...c } : x)));
            return (
              <fieldset key={i} className="grid gap-4 rounded-2xl border border-arena-200 p-5 sm:grid-cols-2 dark:border-arena-800">
                <legend className="px-1 font-semibold">{t.pasajero(i + 1)}</legend>
                <label className="grid gap-1.5 text-sm font-medium">
                  {t.nombre}
                  <input required autoComplete={i === 0 ? "given-name" : "off"} value={p.nombre} onChange={(e) => cambiar({ nombre: e.target.value })} className={campo} />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  {t.apellido}
                  <input required autoComplete={i === 0 ? "family-name" : "off"} value={p.apellido} onChange={(e) => cambiar({ apellido: e.target.value })} className={campo} />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  {t.nacimiento}
                  <input required type="date" max={new Date().toISOString().slice(0, 10)} value={p.nacimiento} onChange={(e) => cambiar({ nacimiento: e.target.value })} className={campo} />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  {t.genero}
                  <select value={p.genero} onChange={(e) => cambiar({ genero: e.target.value as "m" | "f" })} className={campo}>
                    <option value="m">{t.hombre}</option>
                    <option value="f">{t.mujer}</option>
                  </select>
                </label>
                {i === 0 && (
                  <>
                    <label className="grid gap-1.5 text-sm font-medium">
                      {t.email}
                      <input required type="email" autoComplete="email" value={p.email} onChange={(e) => cambiar({ email: e.target.value })} className={campo} />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                      {telefonoOpcional ? t.telefonoOpcional : t.telefono}
                      <input required={!telefonoOpcional} type="tel" autoComplete="tel" placeholder="+34 600 000 000" value={p.telefono} onChange={(e) => cambiar({ telefono: e.target.value })} className={campo} />
                    </label>
                  </>
                )}
              </fieldset>
            );
          })}
          <div className="grid gap-2 text-sm text-arena-600 dark:text-arena-400">
            <p>{t.avisoEmail}</p>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={sinNovedades} onChange={(e) => setSinNovedades(e.target.checked)} className="size-4 accent-oliva-700" />
              {t.sinNovedades}
            </label>
          </div>
          {prueba && !CON_TARJETA && <p className="text-sm text-arena-600 dark:text-arena-400">{t.pagoPrueba}</p>}
          {pago ? (
            <PagoTarjeta
              clientSecret={pago.clientSecret}
              reserva={pago.reserva}
              prueba={pago.prueba}
              total={dinero(elegida.precio, elegida.moneda)}
              onResultado={(r) => (r.error ? (setPago(null), setError(mensajeError(r.error))) : terminar(r))}
            />
          ) : (
          <button type="submit" disabled={ocupado} className={`${botonPrincipal} text-lg`}>
            {ocupado ? (
              <>
                <CircleNotch size={20} className="animate-spin motion-reduce:animate-none" aria-hidden />
                {t.pagando}
              </>
            ) : (
              CON_TARJETA ? t.continuarPago : t.pagar(dinero(elegida.precio, elegida.moneda))
            )}
          </button>
          )}
        </form>
      )}

      {paso === "listo" && elegida && (
        <section className="mt-8 rounded-3xl border border-oliva-200 bg-oliva-50 p-6 text-center md:p-10 dark:border-oliva-800 dark:bg-oliva-900/30" aria-live="polite">
          <CheckCircle size={56} weight="fill" className="mx-auto text-oliva-700 dark:text-oliva-300" aria-hidden />
          <h2 className="mt-4 text-2xl font-semibold">{codigo ? t.listo : t.confirmando}</h2>
          {codigo ? (
            <>
              <p className="mt-6 text-sm text-arena-600 dark:text-arena-400">{t.codigo}</p>
              <p className="mt-1 flex items-center justify-center gap-2 text-4xl font-bold tracking-widest">
                <Ticket size={32} weight="duotone" aria-hidden />
                {codigo}
              </p>
              <p className="mt-2 text-sm text-arena-600 dark:text-arena-400">{t.codigoAyuda}</p>
            </>
          ) : (
            <p className="mx-auto mt-3 max-w-md text-arena-600 dark:text-arena-400">{t.confirmandoAyuda}</p>
          )}
          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-papel p-4 text-left dark:bg-arena-900">
            <Vuelo o={elegida} />
          </div>
          <button
            type="button"
            onClick={() => {
              setPaso("buscar");
              setElegida(null);
              setCodigo("");
            }}
            className={`${botonPrincipal} mt-8`}
          >
            {t.otra}
          </button>
        </section>
      )}
    </main>
  );
}
