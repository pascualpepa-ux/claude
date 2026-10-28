import { codigoAerolinea } from "./aerolineas";
import type { Idioma } from "./idioma";
import { aeropuertosDeLaCiudad, distanciaAeropuertos } from "./lugares";
import { precioEstimado } from "./mock";
import type { Clase, OpcionVuelo, SegmentoVuelo, Tramo } from "./types";

// Agente de horarios reales (solo servidor), con AeroDataBox (https://aerodatabox.com, vía RapidAPI).
// Lee el tablero de salidas del aeropuerto (como las pantallas del aeropuerto) y se queda con los vuelos
// directos que van a destino: número de vuelo, aerolínea, avión y horarios reales. No trae precios:
// el precio sigue siendo un estimado por distancia, y así se muestra.
// Si la fecha del viaje está más lejos de lo que publica el tablero, usa el mismo día de la semana más cercano
// (los horarios de las aerolíneas se repiten cada semana) y lo avisa.

export interface PedidoHorarios {
  origen: string;
  destino: string;
  regreso: string;
  ida: string; // YYYY-MM-DD
  vuelta: string;
  clase: Clase;
  aerolinea: string;
  idioma: Idioma;
}

interface Movimiento {
  airport?: { iata?: string; name?: string };
  scheduledTime?: { local?: string; utc?: string };
  terminal?: string;
}
export interface SalidaAdb {
  number?: string;
  codeshareStatus?: string;
  isCargo?: boolean;
  airline?: { name?: string; iata?: string };
  aircraft?: { model?: string };
  departure?: Movimiento;
  arrival?: Movimiento;
  /** Formato anterior de la API: el aeropuerto del otro extremo. */
  movement?: Movimiento;
}

const CACHE_SEG = 12 * 3600;
const HOST = () => process.env.AERODATABOX_HOST || "aerodatabox.p.rapidapi.com";
const BASE = () => process.env.AERODATABOX_BASE || `https://${HOST()}`;

const TX = {
  es: {
    fuente: (semana: boolean) =>
      semana ? "Horario real de AeroDataBox (mismo día de la semana más cercano) · precio estimado" : "Horario real de AeroDataBox · precio estimado por distancia",
    equipaje: (a: string) => `Equipaje: según la tarifa de ${a}. Revisalo al reservar.`,
    valija: (a: string) => `Valija despachada: confirmá en ${a} si la tarifa la incluye`,
    cambios: (a: string) => `Cambios: según las reglas de la tarifa de ${a}`,
    reembolso: "Reembolso: se ve en las condiciones de la tarifa al reservar",
  },
  en: {
    fuente: (semana: boolean) =>
      semana ? "Real schedule from AeroDataBox (nearest same weekday) · estimated price" : "Real schedule from AeroDataBox · price estimated by distance",
    equipaje: (a: string) => `Baggage: according to ${a}'s fare. Check it when booking.`,
    valija: (a: string) => `Checked bag: confirm with ${a} whether the fare includes it`,
    cambios: (a: string) => `Changes: according to ${a}'s fare rules`,
    reembolso: "Refunds: shown in the fare conditions when booking",
  },
};

const sumarDias = (fecha: string, n: number) => new Date(Date.parse(`${fecha}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** Tablero de salidas de un aeropuerto para un día (dos pedidos de 12 h, el máximo que acepta la API). */
async function salidasDelDia(iata: string, fecha: string, clave: string): Promise<SalidaAdb[] | null> {
  const ventanas = [
    [`${fecha}T00:00`, `${fecha}T11:59`],
    [`${fecha}T12:00`, `${fecha}T23:59`],
  ];
  const partes = await Promise.all(
    ventanas.map(async ([desde, hasta]) => {
      const params = new URLSearchParams({
        direction: "Departure",
        withLeg: "true", // trae también la llegada (aeropuerto y hora)
        withCancelled: "false",
        withCodeshared: "false", // un vuelo una sola vez, con el número de la aerolínea que lo opera
        withCargo: "false",
        withPrivate: "false",
        withLocation: "false",
      });
      try {
        const res = await fetch(`${BASE()}/flights/airports/iata/${iata}/${desde}/${hasta}?${params}`, {
          headers: { "X-RapidAPI-Key": clave, "X-RapidAPI-Host": HOST() },
          next: { revalidate: CACHE_SEG },
        });
        if (res.status === 204) return [];
        if (!res.ok) return null;
        const j = (await res.json()) as { departures?: SalidaAdb[] };
        return j.departures ?? [];
      } catch {
        return null;
      }
    }),
  );
  return partes.some((p) => p === null) ? null : partes.flat() as SalidaAdb[];
}

const iso = (local?: string) => (local ? `${local.slice(0, 16).replace(" ", "T")}:00Z` : ""); // hora local tal cual
const minutosEntre = (a?: Movimiento, b?: Movimiento) =>
  a?.scheduledTime?.utc && b?.scheduledTime?.utc
    ? Math.round((Date.parse(b.scheduledTime.utc.replace(" ", "T").replace(/Z?$/, "Z")) - Date.parse(a.scheduledTime.utc.replace(" ", "T").replace(/Z?$/, "Z"))) / 60000)
    : 0;

/** Vuelos directos de un día entre dos ciudades (todos sus aeropuertos). */
export function directos(salidas: SalidaAdb[], destinos: string[]): SegmentoVuelo[] {
  const vistos = new Set<string>();
  return salidas
    .filter((s) => !s.isCargo && s.codeshareStatus !== "IsCodeshared" && s.number && s.departure?.scheduledTime?.local)
    .filter((s) => destinos.includes((s.arrival?.airport?.iata ?? s.movement?.airport?.iata ?? "").toUpperCase()))
    .map((s) => {
      const llegada = s.arrival ?? s.movement;
      const duracion = minutosEntre(s.departure, llegada);
      return {
        numero: s.number!.trim(),
        aerolinea: s.airline?.name ?? "",
        desde: (s.departure?.airport?.iata ?? "").toUpperCase(),
        hasta: (llegada?.airport?.iata ?? "").toUpperCase(),
        salida: iso(s.departure!.scheduledTime!.local),
        llegada: iso(llegada?.scheduledTime?.local),
        duracionMin: duracion > 0 ? duracion : 0,
        ...(s.aircraft?.model && { avion: s.aircraft.model }),
      };
    })
    .filter((s) => s.desde && s.hasta && !vistos.has(s.numero) && vistos.add(s.numero))
    .sort((a, b) => a.salida.localeCompare(b.salida));
}

/** Busca el día pedido; si el tablero todavía no lo publica, el mismo día de la semana más cercano a hoy. */
async function vuelosDelDia(origenes: string[], destinos: string[], fecha: string, clave: string) {
  const hoy = new Date().toISOString().slice(0, 10);
  const dias = Math.round((Date.parse(fecha) - Date.parse(hoy)) / 86_400_000);
  const intentos = [fecha];
  if (dias > 6) intentos.push(sumarDias(fecha, -7 * Math.ceil((dias - 6) / 7)));
  for (const dia of intentos) {
    const tableros = await Promise.all(origenes.map((o) => salidasDelDia(o, dia, clave)));
    if (tableros.every((t) => t === null)) continue;
    const lista = directos(tableros.flatMap((t) => t ?? []), destinos);
    if (lista.length) return { lista, semana: dia !== fecha };
  }
  return null;
}

function aTramo(s: SegmentoVuelo, fechaReal: string, estimadoMin: number): Tramo {
  // Si se usó otra semana, se muestra con la fecha del viaje (misma hora local).
  const mover = (t: string) => (t ? `${sumarDias(fechaReal, Math.round((Date.parse(t.slice(0, 10)) - Date.parse(s.salida.slice(0, 10))) / 86_400_000))}${t.slice(10)}` : t);
  const seg: SegmentoVuelo = { ...s, salida: mover(s.salida), llegada: mover(s.llegada), duracionMin: s.duracionMin || estimadoMin };
  return {
    desde: seg.desde,
    hasta: seg.hasta,
    salida: seg.salida,
    llegada: seg.llegada || seg.salida,
    escalas: [],
    duracionMin: seg.duracionMin,
    numeros: [seg.numero],
    segmentos: [seg],
  };
}

/** Vuelos con número y horario reales (directos). null si no hay clave o no se encontró ninguno. */
export async function buscarHorarios(p: PedidoHorarios): Promise<OpcionVuelo[] | null> {
  const clave = process.env.AERODATABOX_API_KEY;
  if (!clave) return null;
  const lista = (x: string) => aeropuertosDeLaCiudad(x).split(",");
  const [ida, vuelta] = await Promise.all([
    vuelosDelDia(lista(p.origen), lista(p.destino), p.ida, clave),
    vuelosDelDia(lista(p.regreso), lista(p.origen), p.vuelta, clave),
  ]);
  // Sin vuelos directos en alguno de los dos sentidos, mejor el vuelo estimado que un horario a medias.
  if (!ida || !vuelta) return null;

  const kmIda = distanciaAeropuertos(p.origen, p.destino) ?? 0;
  const kmVuelta = distanciaAeropuertos(p.regreso, p.origen) ?? kmIda;
  const minutos = (km: number) => Math.round(((km / 820) * 60 + 30) / 5) * 5;
  const precio = precioEstimado(kmIda, kmVuelta, p.clase);
  const t = TX[p.idioma];
  const preferida = p.aerolinea.trim() ? codigoAerolinea(p.aerolinea) : null;
  const ahora = new Date().toISOString();

  // Una opción por aerolínea (la preferida primero), con la vuelta de la misma aerolínea si existe.
  const porAerolinea = new Map<string, SegmentoVuelo>();
  for (const s of ida.lista) if (!porAerolinea.has(s.aerolinea)) porAerolinea.set(s.aerolinea, s);
  const elegidos = [...porAerolinea.values()].sort((a, b) => Number(b.numero.startsWith(preferida ?? "~")) - Number(a.numero.startsWith(preferida ?? "~"))).slice(0, 3);

  return elegidos.map((s, i): OpcionVuelo => {
    const v = vuelta.lista.find((x) => x.aerolinea === s.aerolinea) ?? vuelta.lista[0];
    const tramoIda = aTramo(s, p.ida, minutos(kmIda));
    const tramoVuelta = aTramo(v, p.vuelta, minutos(kmVuelta));
    const aerolinea = v.aerolinea !== s.aerolinea ? `${s.aerolinea} / ${v.aerolinea}` : s.aerolinea;
    const buscar = `Flights from ${p.origen} to ${p.destino} on ${p.ida} through ${p.vuelta} ${s.numero}`;
    return {
      id: `vuelo-horario-${i}`,
      aerolinea,
      clase: p.clase,
      ida: tramoIda,
      vuelta: tramoVuelta,
      precioPorPersona: precio,
      condiciones: { equipajeMano: t.equipaje(s.aerolinea), valija: t.valija(s.aerolinea), cambios: t.cambios(s.aerolinea), reembolso: t.reembolso },
      linkReserva: `https://www.google.com/travel/flights?hl=${p.idioma}&q=${encodeURIComponent(buscar)}`,
      origen: { fuente: t.fuente(ida.semana || vuelta.semana), consultadoEn: ahora, estado: "estimado" },
      precioEstimado: true,
    };
  });
}
