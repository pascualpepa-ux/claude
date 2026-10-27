import { climaReal, type DatoClima } from "./clima-real";
import { enviar, revisarEntregasPendientes } from "./correo/envio";
import { correoAviso, enlaceBaja, type CambioAviso } from "./correo/redactor";
import { sql } from "./db";
import { usd } from "./dinero";
import { precioHotelAhora } from "./hoteles-reales";
import { estadiasPorCiudad } from "./mock";
import { diferenciaDias, formatoCorto, formatoDia, hoy } from "./fechas";
import type { Idioma } from "./idioma";
import { TEXTOS } from "./textos";
import type { Condicion, TripPlan } from "./types";

// Vigilancia de los viajes suscriptos. La llama una tarea programada cada 30 minutos (GitHub Actions) y,
// de respaldo, una vez por día Vercel Cron. Solo usa datos reales; cada cambio se confirma antes de avisar.
//  - Clima: desde 10 días antes del viaje. Un cambio se avisa recién si se repite en dos revisiones seguidas.
//  - Vuelos: estado real (AeroDataBox) desde 6 h antes de la salida; si hay un cambio se vuelve a consultar al instante.
//  - Hoteles: se suman cuando los hoteles del viaje sean reales (hoy son de ejemplo y no hay nada que vigilar).

const MINUTOS_ENTRE_RONDAS = 25; // aunque la llamen más seguido, no gasta cupos de las APIs

interface ClimaGuardado {
  condicion: Condicion;
  maxima: number;
  minima: number;
  probLluvia: number;
}
interface VueloGuardado {
  estado: string;
  salida: string; // hora local prevista "2026-12-10 23:55"
  puerta: string;
  terminal: string;
  utc?: string; // salida (prevista) en UTC, para saber cuándo volver a mirar
}
interface HotelGuardado {
  precio: number | null; // por noche con impuestos; null = sin disponibilidad
  revisado: string; // ISO
}
interface Vigilancia {
  clima?: Record<string, ClimaGuardado>;
  climaPendiente?: Record<string, ClimaGuardado>;
  vuelos?: Record<string, VueloGuardado>;
  hoteles?: Record<string, HotelGuardado>;
}

const TX = {
  es: {
    climaTitulo: "Cambió el pronóstico de tu viaje",
    lluvia: (p: number) => `probabilidad de lluvia ${p}%`,
    detalle: (o: string, d: string, ida: string, vuelta: string) => `Tu viaje de ${o} a ${d}, del ${ida} al ${vuelta}.`,
    dia: (ciudad: string, fecha: string) => `${ciudad}, ${fecha}`,
    vueloCancelado: (n: string) => `Tu vuelo ${n} fue cancelado`,
    vueloDemorado: (n: string) => `Tu vuelo ${n} está demorado`,
    vueloCambio: (n: string) => `Hay cambios en tu vuelo ${n}`,
    salida: (n: string, desde: string) => `Vuelo ${n}, salida de ${desde}`,
    puerta: (n: string) => `Vuelo ${n}, puerta de embarque`,
    estado: (n: string) => `Vuelo ${n}, estado`,
    sinDato: "Sin informar",
    hotelPrecio: (h: string) => `Cambió el precio de tu hotel ${h}`,
    hotelSinLugar: (h: string) => `Tu hotel ${h} ya no tiene lugar para tus fechas`,
    hotelVuelveLugar: (h: string) => `Tu hotel ${h} vuelve a tener lugar`,
    hotelQue: (h: string, ciudad: string, entrada: string, salida: string) => `${h}, ${ciudad}, del ${entrada} al ${salida}`,
    porNoche: (monto: string) => `${monto} por noche`,
    sinLugar: "Sin disponibilidad",
    estados: { Canceled: "Cancelado", CanceledUncertain: "Posiblemente cancelado", Diverted: "Desviado", Delayed: "Demorado", Expected: "Programado", Departed: "Despegó", Boarding: "Embarcando", GateClosed: "Puerta cerrada", CheckIn: "Check-in abierto", EnRoute: "En vuelo", Arrived: "Aterrizó", Approaching: "Aterrizando", Unknown: "Sin informar" } as Record<string, string>,
  },
  en: {
    climaTitulo: "The forecast for your trip changed",
    lluvia: (p: number) => `${p}% chance of rain`,
    detalle: (o: string, d: string, ida: string, vuelta: string) => `Your trip from ${o} to ${d}, ${ida} to ${vuelta}.`,
    dia: (ciudad: string, fecha: string) => `${ciudad}, ${fecha}`,
    vueloCancelado: (n: string) => `Your flight ${n} was canceled`,
    vueloDemorado: (n: string) => `Your flight ${n} is delayed`,
    vueloCambio: (n: string) => `There are changes to your flight ${n}`,
    salida: (n: string, desde: string) => `Flight ${n}, departure from ${desde}`,
    puerta: (n: string) => `Flight ${n}, boarding gate`,
    estado: (n: string) => `Flight ${n}, status`,
    sinDato: "Not announced",
    hotelPrecio: (h: string) => `The price of your hotel ${h} changed`,
    hotelSinLugar: (h: string) => `Your hotel ${h} has no availability for your dates anymore`,
    hotelVuelveLugar: (h: string) => `Your hotel ${h} has availability again`,
    hotelQue: (h: string, ciudad: string, entrada: string, salida: string) => `${h}, ${ciudad}, ${entrada} to ${salida}`,
    porNoche: (monto: string) => `${monto} per night`,
    sinLugar: "No availability",
    estados: { Canceled: "Canceled", CanceledUncertain: "Possibly canceled", Diverted: "Diverted", Delayed: "Delayed", Expected: "Scheduled", Departed: "Departed", Boarding: "Boarding", GateClosed: "Gate closed", CheckIn: "Check-in open", EnRoute: "In flight", Arrived: "Landed", Approaching: "Landing", Unknown: "Not announced" } as Record<string, string>,
  },
};

const mojada = (c: Condicion) => c === "lluvia" || c === "tormenta" || c === "nieve";

/** Un cambio de pronóstico vale un aviso si pasa de seco a lluvia (o al revés) o si la temperatura cambia 5° o más. */
export function cambioDeClimaImportante(antes: ClimaGuardado, ahora: ClimaGuardado) {
  return mojada(antes.condicion) !== mojada(ahora.condicion) || Math.abs(antes.maxima - ahora.maxima) >= 5 || Math.abs(antes.minima - ahora.minima) >= 5;
}

export function describirClima(c: ClimaGuardado, idioma: Idioma) {
  return `${TEXTOS[idioma].clima[c.condicion]}, ${c.maxima}° / ${c.minima}°, ${TX[idioma].lluvia(c.probLluvia)}`;
}

/** Revisa el pronóstico real de los días que faltan y devuelve los cambios confirmados (vistos dos veces seguidas). */
export async function vigilarClima(plan: TripPlan, v: Vigilancia, idioma: Idioma): Promise<CambioAviso[]> {
  const hoyStr = hoy();
  if (diferenciaDias(hoyStr, plan.input.fechaIda) > 10) return [];
  const dias = plan.dias.filter((d) => d.fecha >= hoyStr && diferenciaDias(hoyStr, d.fecha) <= 15);
  const pedidos = plan.ruta
    .map((r) => ({ iata: r.aeropuerto, fechas: dias.filter((d) => d.clave === r.clave).map((d) => d.fecha) }))
    .filter((p) => p.iata && p.fechas.length);
  if (!pedidos.length) return [];
  const datos = await climaReal(pedidos);
  v.clima ??= {};
  v.climaPendiente ??= {};
  const cambios: CambioAviso[] = [];
  for (const d of dias) {
    const iata = plan.ruta.find((r) => r.clave === d.clave)?.aeropuerto ?? "";
    const dato: DatoClima | undefined = datos[iata]?.[d.fecha];
    if (!dato || dato.tipo !== "pronostico" || dato.estado === "no_verificado") continue; // solo pronósticos confiables
    const clave = `${iata}|${d.fecha}`;
    const ahora: ClimaGuardado = { condicion: dato.condicion, maxima: dato.maxima, minima: dato.minima, probLluvia: dato.probLluvia };
    const antes = v.clima[clave];
    if (!antes) {
      v.clima[clave] = ahora; // primera vez: es la referencia, no un cambio
      continue;
    }
    if (!cambioDeClimaImportante(antes, ahora)) {
      delete v.climaPendiente[clave];
      continue;
    }
    const pendiente = v.climaPendiente[clave];
    // El verificador pide que el cambio se mantenga en la revisión siguiente (30 minutos después).
    if (pendiente && !cambioDeClimaImportante(pendiente, ahora)) {
      cambios.push({ que: TX[idioma].dia(d.ciudad, formatoDia(d.fecha, idioma)), antes: describirClima(antes, idioma), ahora: describirClima(ahora, idioma) });
      v.clima[clave] = ahora;
      delete v.climaPendiente[clave];
    } else {
      v.climaPendiente[clave] = ahora;
    }
  }
  return cambios;
}

/* ---------- Vuelos (AeroDataBox, https://aerodatabox.com) ---------- */

interface FlightAdb {
  status?: string;
  departure?: {
    airport?: { iata?: string };
    scheduledTime?: { local?: string; utc?: string };
    revisedTime?: { local?: string; utc?: string };
    predictedTime?: { local?: string; utc?: string };
    gate?: string;
    terminal?: string;
  };
}

async function estadoVuelo(numero: string, fecha: string): Promise<VueloGuardado & { programada: string; desde: string } | null> {
  const clave = process.env.AERODATABOX_API_KEY;
  if (!clave) return null;
  const host = process.env.AERODATABOX_HOST || "aerodatabox.p.rapidapi.com";
  try {
    const res = await fetch(`https://${host}/flights/number/${encodeURIComponent(numero.replace(/\s+/g, ""))}/${fecha}?withAircraftImage=false&withLocation=false`, {
      headers: { "X-RapidAPI-Key": clave, "X-RapidAPI-Host": host },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const lista = (await res.json()) as FlightAdb[];
    const f = Array.isArray(lista) ? lista[0] : null;
    if (!f?.departure?.scheduledTime?.local) return null;
    const corta = (t?: string) => (t ? t.slice(0, 16) : "");
    const programada = corta(f.departure.scheduledTime.local);
    return {
      estado: f.status ?? "Unknown",
      programada,
      salida: corta(f.departure.revisedTime?.local ?? f.departure.predictedTime?.local) || programada,
      puerta: f.departure.gate ?? "",
      terminal: f.departure.terminal ?? "",
      desde: f.departure.airport?.iata ?? "",
      utc: (f.departure.revisedTime?.utc ?? f.departure.predictedTime?.utc ?? f.departure.scheduledTime.utc ?? "").replace(" ", "T"),
    };
  } catch {
    return null;
  }
}

const minutos = (a: string, b: string) => Math.round((new Date(`${b.replace(" ", "T")}Z`).getTime() - new Date(`${a.replace(" ", "T")}Z`).getTime()) / 60000);

/** Compara el estado real de un vuelo con el último visto. Devuelve los cambios y el título del aviso. */
export function compararVuelo(numero: string, antes: VueloGuardado | undefined, ahora: VueloGuardado & { programada: string; desde: string }, idioma: Idioma) {
  const t = TX[idioma];
  const hora = (s: string) => s.slice(11, 16);
  const ref: VueloGuardado = antes ?? { estado: "Expected", salida: ahora.programada, puerta: "", terminal: "" };
  const cambios: CambioAviso[] = [];
  const cancelado = /Canceled|Diverted/.test(ahora.estado) && ahora.estado !== ref.estado;
  if (cancelado) cambios.push({ que: t.estado(numero), antes: t.estados[ref.estado] ?? ref.estado, ahora: t.estados[ahora.estado] ?? ahora.estado });
  const demora = minutos(ref.salida, ahora.salida);
  if (!cancelado && Math.abs(demora) >= 15) {
    cambios.push({ que: t.salida(numero, ahora.desde), antes: hora(ref.salida), ahora: hora(ahora.salida) });
  }
  if (ref.puerta && ahora.puerta && ref.puerta !== ahora.puerta) {
    cambios.push({ que: t.puerta(numero), antes: ref.puerta, ahora: ahora.puerta });
  }
  const titulo = cancelado ? t.vueloCancelado(numero) : demora >= 15 ? t.vueloDemorado(numero) : t.vueloCambio(numero);
  return { cambios, titulo };
}

const TERMINADO = /Departed|EnRoute|Approaching|Arrived|Canceled|Diverted/;

/**
 * Cuándo consultar cada vuelo (cuida el cupo gratis de AeroDataBox):
 * una vez el día anterior (con eso se sabe la hora exacta en UTC) y después cada ronda de 30 minutos
 * desde 6 h antes de la salida hasta que despega o se cancela.
 */
export function tocaConsultar(guardado: VueloGuardado | undefined, salidaLocal: string, ahoraMs = Date.now()) {
  if (guardado && TERMINADO.test(guardado.estado)) return false;
  if (guardado?.utc) {
    const salida = new Date(guardado.utc).getTime();
    return ahoraMs >= salida - 6 * 3600_000 && ahoraMs <= salida + 2 * 3600_000;
  }
  // Sin la hora UTC todavía: la hora local puede estar corrida hasta ±14 h, así que la ventana es amplia.
  const salida = new Date(`${salidaLocal}:00Z`).getTime();
  return ahoraMs >= salida - 38 * 3600_000 && ahoraMs <= salida + 14 * 3600_000;
}

/** Consulta el estado real del primer vuelo de la ida y de la vuelta y devuelve los avisos confirmados. */
export async function vigilarVuelos(plan: TripPlan, v: Vigilancia, idioma: Idioma): Promise<{ titulo: string; cambios: CambioAviso[] }[]> {
  if (!plan.vuelosReales || !process.env.AERODATABOX_API_KEY) return [];
  const vuelo = plan.vuelos.find((x) => x.id === plan.vueloElegido);
  if (!vuelo) return [];
  v.vuelos ??= {};
  const avisos: { titulo: string; cambios: CambioAviso[] }[] = [];
  for (const tramo of [vuelo.ida, vuelo.vuelta]) {
    const numero = tramo.numeros?.[0];
    if (!numero) continue;
    const antes = v.vuelos[numero];
    if (!tocaConsultar(antes, tramo.salida.slice(0, 16))) continue;
    const fecha = tramo.salida.slice(0, 10);
    const ahora = await estadoVuelo(numero, fecha);
    if (!ahora) continue;
    const { cambios, titulo } = compararVuelo(numero, antes, ahora, idioma);
    if (cambios.length) {
      // Verificador: consulta de nuevo antes de avisar; si el dato no se repite, espera a la próxima ronda.
      const otra = await estadoVuelo(numero, fecha);
      if (!otra || otra.estado !== ahora.estado || otra.salida !== ahora.salida || otra.puerta !== ahora.puerta) continue;
      avisos.push({ titulo, cambios });
    }
    v.vuelos[numero] = { estado: ahora.estado, salida: ahora.salida, puerta: ahora.puerta, terminal: ahora.terminal, utc: ahora.utc };
  }
  return avisos;
}

/* ---------- Hoteles (Google Hotels vía SerpApi) ---------- */

/** Un cambio de hotel vale un aviso si el precio cambia 5% o más, o si deja de haber (o vuelve a haber) lugar. */
export function cambioDeHotel(antes: number | null, ahora: number | null) {
  if (antes === null || ahora === null) return antes !== ahora;
  return Math.abs(ahora - antes) / antes >= 0.05;
}

/**
 * Una vez por día (el cupo gratis de SerpApi no da para más), desde 30 días antes hasta el check-in,
 * consulta el precio real del hotel elegido en cada ciudad. Si cambió, el verificador lo vuelve a pedir antes de avisar.
 */
export async function vigilarHoteles(plan: TripPlan, v: Vigilancia, idioma: Idioma): Promise<{ titulo: string; cambios: CambioAviso[] }[]> {
  if (!plan.hotelesReales || !process.env.SERPAPI_API_KEY) return [];
  if (diferenciaDias(hoy(), plan.input.fechaIda) > 30) return [];
  v.hoteles ??= {};
  const t = TX[idioma];
  const avisos: { titulo: string; cambios: CambioAviso[] }[] = [];
  for (const e of estadiasPorCiudad(plan)) {
    if (e.entrada < hoy()) continue;
    const hotel = plan.hoteles[e.clave]?.find((h) => h.id === plan.hotelElegido[e.clave]);
    if (!hotel?.propiedad) continue;
    const guardado = v.hoteles[hotel.propiedad];
    if (guardado && Date.now() - Date.parse(guardado.revisado) < 23 * 3600_000) continue;
    const adultos = Math.max(1, Math.min(4, Math.ceil(plan.input.viajeros.length / hotel.habitaciones)));
    const ahora = await precioHotelAhora(hotel.propiedad, e.entrada, e.salida, adultos, idioma);
    if (ahora === undefined) continue; // sin respuesta: no se sabe nada, se prueba otro día
    const antes = guardado ? guardado.precio : Math.round(hotel.precioNoche * (1 + hotel.impuestosPct / 100));
    if (cambioDeHotel(antes, ahora)) {
      const otra = await precioHotelAhora(hotel.propiedad, e.entrada, e.salida, adultos, idioma);
      const confirma = otra !== undefined && (otra === null || ahora === null ? otra === ahora : Math.abs(otra - ahora) / ahora < 0.01);
      if (!confirma) continue;
      const precio = (n: number | null) => (n === null ? t.sinLugar : t.porNoche(usd(n, idioma)));
      avisos.push({
        titulo: ahora === null ? t.hotelSinLugar(hotel.nombre) : antes === null ? t.hotelVuelveLugar(hotel.nombre) : t.hotelPrecio(hotel.nombre),
        cambios: [{ que: t.hotelQue(hotel.nombre, e.ciudad, formatoCorto(e.entrada, idioma), formatoCorto(e.salida, idioma)), antes: precio(antes), ahora: precio(ahora) }],
      });
    }
    v.hoteles[hotel.propiedad] = { precio: ahora, revisado: new Date().toISOString() };
  }
  return avisos;
}

/* ---------- Ronda completa ---------- */

interface FilaViaje {
  id: string;
  plan: TripPlan;
  vigilancia: Vigilancia;
  suscriptor_id: string;
  email: string;
  idioma: Idioma;
  token_baja: string;
}

/** Una ronda de vigilancia. Devuelve un resumen para el registro. */
export async function vigilar(forzar = false): Promise<{ omitida?: true; viajes: number; avisos: number }> {
  // Una sola ronda cada 25 minutos aunque la llamen más (así nadie puede gastar los cupos de las APIs).
  const turno = await sql(
    `insert into vigilancias (id, ultima) values (1, now())
     on conflict (id) do update set ultima = now()
     where vigilancias.ultima < now() - interval '${MINUTOS_ENTRE_RONDAS} minutes' or $1
     returning id`,
    [forzar],
  );
  if (!turno.length) return { omitida: true, viajes: 0, avisos: 0 };

  await revisarEntregasPendientes();
  await sql(`update viajes_seguidos set estado = 'terminado' where estado = 'activo' and (plan->'input'->>'fechaVuelta') < $1`, [hoy()]);

  const viajes = await sql<FilaViaje>(
    `select v.id, v.plan, v.vigilancia, s.id as suscriptor_id, s.email, s.idioma, s.token_baja
     from viajes_seguidos v join suscriptores s on s.id = v.suscriptor_id
     where v.estado = 'activo' and s.estado = 'activo' order by v.revisado nulls first limit 40`,
  );
  let avisos = 0;
  for (const fila of viajes) {
    const { plan, idioma } = fila;
    const v = fila.vigilancia ?? {};
    const t = TX[idioma];
    const detalle = t.detalle(plan.input.origen, plan.input.destino, formatoCorto(plan.input.fechaIda, idioma), formatoCorto(plan.input.fechaVuelta, idioma));
    const pendientes: { tipo: string; titulo: string; cambios: CambioAviso[] }[] = [];
    try {
      const clima = await vigilarClima(plan, v, idioma);
      if (clima.length) pendientes.push({ tipo: "aviso_clima", titulo: t.climaTitulo, cambios: clima });
      for (const a of await vigilarVuelos(plan, v, idioma)) pendientes.push({ tipo: "aviso_vuelo", ...a });
      for (const a of await vigilarHoteles(plan, v, idioma)) pendientes.push({ tipo: "aviso_hotel", ...a });
    } catch (e) {
      console.error("vigilancia:", fila.id, e);
    }
    for (const p of pendientes) {
      const ok = await enviar({
        para: fila.email,
        suscriptorId: fila.suscriptor_id,
        tipo: p.tipo,
        idiomaSuscriptor: idioma,
        correo: correoAviso(idioma, { titulo: p.titulo, detalle, cambios: p.cambios }, fila.token_baja),
        enlaceBaja: enlaceBaja(fila.token_baja),
      });
      if (ok) avisos++;
    }
    await sql(`update viajes_seguidos set vigilancia = $2, revisado = now() where id = $1`, [fila.id, v]);
  }
  return { viajes: viajes.length, avisos };
}
