import { codigoAerolinea } from "./aerolineas";
import type { Idioma } from "./idioma";
import { aeropuertosDeLaCiudad, coordenadasAeropuerto, distanciaAeropuertos } from "./lugares";
import type { Clase, Equipaje, OpcionVuelo, Tramo, Verificacion } from "./types";

// Agentes de vuelos (solo servidor), con Google Flights a través de SerpApi (https://serpapi.com/google-flights-api).
// Google Flights recibe las tarifas de las mismas aerolíneas: son los precios y números de vuelo reales.
// - Buscador: vuelos de la aerolínea preferida (si la hay) y la mejor alternativa de otra aerolínea.
// - Verificador: vuelve a cotizar cada opción con la vuelta elegida y, para la preferida, pide el precio
//   en la web de la propia aerolínea. Si el precio no coincide, queda "No verificado" con el precio nuevo.

export interface PedidoVuelos {
  origen: string; // IATA
  destino: string; // IATA de llegada
  regreso: string; // IATA desde donde se vuelve (puede ser otra ciudad)
  ida: string; // YYYY-MM-DD
  vuelta: string;
  clase: Clase;
  aerolinea: string; // como la escribió la persona ("" = cualquiera)
  equipaje: Equipaje;
  idioma: Idioma;
}

export type ResultadoVuelos =
  | { estado: "ok"; vuelos: OpcionVuelo[] }
  | { estado: "sin_clave" | "sin_cupo" | "sin_resultados" | "error"; distanciaIda: number | null; distanciaVuelta: number | null };

const CLASE: Record<Clase, number> = { economica: 1, premium: 2, business: 3 };
const MIN_CUPO = 8; // búsquedas que deja libres el plan de SerpApi antes de cortar
const CACHE_SEG = 6 * 3600;

const TX = {
  es: {
    fuente: "Google Flights",
    enAerolinea: (a: string) => `Google Flights, precio confirmado en ${a}`,
    equipaje: (a: string) => `Equipaje de mano: según la tarifa de ${a}. Revisalo al reservar.`,
    valijaPaga: "La valija despachada se paga aparte",
    valijaIncluida: "Incluye valija despachada",
    valijaRevisar: (a: string) => `Valija despachada: confirmá en ${a} si la tarifa la incluye`,
    cambios: (a: string) => `Cambios: según las reglas de la tarifa de ${a}`,
    reembolso: "Reembolso: se ve en las condiciones de la tarifa al reservar",
  },
  en: {
    fuente: "Google Flights",
    enAerolinea: (a: string) => `Google Flights, price confirmed with ${a}`,
    equipaje: (a: string) => `Carry-on: according to ${a}'s fare. Check it when booking.`,
    valijaPaga: "Checked bag costs extra",
    valijaIncluida: "Checked bag included",
    valijaRevisar: (a: string) => `Checked bag: confirm with ${a} whether the fare includes it`,
    cambios: (a: string) => `Changes: according to ${a}'s fare rules`,
    reembolso: "Refunds: shown in the fare conditions when booking",
  },
};

interface Segmento {
  departure_airport: { id: string; time: string };
  arrival_airport: { id: string; time: string };
  airline: string;
  flight_number: string;
}
interface Grupo {
  flights: Segmento[];
  layovers?: { id: string }[];
  total_duration: number;
  price?: number;
  extensions?: string[];
  departure_token?: string;
  booking_token?: string;
}
interface Respuesta {
  best_flights?: Grupo[];
  other_flights?: Grupo[];
  booking_options?: { together?: { book_with?: string; price?: number } }[];
  search_metadata?: { google_flights_url?: string };
  error?: string;
}

async function serpapi(params: Record<string, string>, clave: string): Promise<Respuesta | null> {
  const url = `https://serpapi.com/search.json?${new URLSearchParams({ engine: "google_flights", ...params, api_key: clave })}`;
  try {
    const res = await fetch(url, { next: { revalidate: CACHE_SEG } });
    if (!res.ok) return null;
    const json = (await res.json()) as Respuesta;
    return json.error && !json.best_flights && !json.other_flights ? null : json;
  } catch {
    return null;
  }
}

async function cupoLibre(clave: string): Promise<number> {
  try {
    const res = await fetch(`https://serpapi.com/account.json?api_key=${clave}`, { cache: "no-store" });
    const j = await res.json();
    return Number(j.total_searches_left ?? j.plan_searches_left ?? 0);
  } catch {
    return 0;
  }
}

/** Tramo de la web a partir de los segmentos de Google Flights. Las horas son locales de cada aeropuerto. */
function tramo(g: Grupo): Tramo {
  const primero = g.flights[0];
  const ultimo = g.flights[g.flights.length - 1];
  const iso = (t: string) => `${t.replace(" ", "T")}:00Z`; // hora local mostrada tal cual (la web formatea en UTC)
  return {
    desde: primero.departure_airport.id,
    hasta: ultimo.arrival_airport.id,
    salida: iso(primero.departure_airport.time),
    llegada: iso(ultimo.arrival_airport.time),
    escalas: (g.layovers ?? []).map((l) => l.id),
    duracionMin: g.total_duration,
    numeros: g.flights.map((s) => s.flight_number),
  };
}

const aerolineaDe = (g: Grupo) => [...new Set(g.flights.map((s) => s.airline))].join(" / ");
const todos = (r: Respuesta | null) => [...(r?.best_flights ?? []), ...(r?.other_flights ?? [])].filter((g) => g.price && g.flights?.length);

function condiciones(g: Grupo, aerolinea: string, idioma: Idioma): OpcionVuelo["condiciones"] {
  const t = TX[idioma];
  const ext = (g.extensions ?? []).join(" ").toLowerCase();
  const valija = /checked bag.*(fee|extra)|bag.*for a fee/.test(ext)
    ? t.valijaPaga
    : /checked bag.*(included|free)|1 (free )?checked bag/.test(ext)
      ? t.valijaIncluida
      : t.valijaRevisar(aerolinea);
  return { equipajeMano: t.equipaje(aerolinea), valija, cambios: t.cambios(aerolinea), reembolso: t.reembolso };
}

/** Busca vuelos reales. Sin clave o sin cupo devuelve las distancias para que la web estime duraciones creíbles. */
export async function buscarVuelos(p: PedidoVuelos): Promise<ResultadoVuelos> {
  const distancias = { distanciaIda: distanciaAeropuertos(p.origen, p.destino), distanciaVuelta: distanciaAeropuertos(p.regreso, p.origen) };
  const clave = process.env.SERPAPI_API_KEY;
  if (!clave) return { estado: "sin_clave", ...distancias };
  if ((await cupoLibre(clave)) < MIN_CUPO) return { estado: "sin_cupo", ...distancias };

  const t = TX[p.idioma];
  const ahora = new Date().toISOString();
  const pais = coordenadasAeropuerto(p.origen)?.pais.toLowerCase() ?? "us";
  const idaYVuelta = p.destino === p.regreso;
  // Todos los aeropuertos de cada ciudad (Buenos Aires: AEP y EZE; Londres: LHR, LGW...).
  const [origen, destino, regreso] = [p.origen, p.destino, p.regreso].map(aeropuertosDeLaCiudad);
  const base: Record<string, string> = {
    currency: "USD",
    hl: p.idioma,
    gl: pais,
    adults: "1", // precios por persona
    travel_class: String(CLASE[p.clase]),
    deep_search: "true", // igual que Google Flights en el navegador: tarda más, pero es más exacto
    ...(idaYVuelta
      ? { type: "1", departure_id: origen, arrival_id: destino, outbound_date: p.ida, return_date: p.vuelta }
      : {
          type: "3",
          multi_city_json: JSON.stringify([
            { departure_id: origen, arrival_id: destino, date: p.ida },
            { departure_id: regreso, arrival_id: origen, date: p.vuelta },
          ]),
        }),
  };

  // 1) Buscador: la aerolínea preferida (si la conocemos) y todas las demás.
  const preferida = p.aerolinea.trim() ? codigoAerolinea(p.aerolinea) : null;
  const [deLaPreferida, generales] = await Promise.all([
    preferida ? serpapi({ ...base, include_airlines: preferida }, clave) : Promise.resolve(null),
    serpapi(base, clave),
  ]);
  const listaPreferida = todos(deLaPreferida);
  const listaGeneral = todos(generales);
  if (!listaGeneral.length && !listaPreferida.length) return { estado: generales ? "sin_resultados" : "error", ...distancias };

  // Hasta 2 de la preferida + 1 de otra aerolínea (la mejor según Google); sin preferida, las 3 mejores de aerolíneas distintas.
  const elegidos: Grupo[] = listaPreferida.slice(0, 2);
  for (const g of listaGeneral) {
    if (elegidos.length >= 3) break;
    const otra = !elegidos.some((e) => aerolineaDe(e) === aerolineaDe(g));
    if (otra) elegidos.push(g);
  }
  const enlace = (generales ?? deLaPreferida)?.search_metadata?.google_flights_url;

  // 2) Verificador: cotiza cada opción con su vuelta (precio final ida y vuelta).
  const opciones = await Promise.all(
    elegidos.map(async (g, i): Promise<OpcionVuelo | null> => {
      if (!g.departure_token) return null;
      const vueltas = todos(await serpapi({ ...base, departure_token: g.departure_token }, clave));
      const aerolinea = aerolineaDe(g);
      const v = vueltas.find((x) => aerolineaDe(x) === aerolinea) ?? vueltas[0];
      if (!v?.price) return null;
      let precio = v.price;
      let estado: Verificacion = Math.abs(v.price - (g.price ?? 0)) / v.price <= 0.03 ? "verificado" : "no_verificado";
      let fuente = t.fuente;
      // Para la aerolínea preferida, además se pide el precio en la web de la propia aerolínea.
      if (preferida && i === 0 && v.booking_token) {
        const reserva = await serpapi({ ...base, booking_token: v.booking_token }, clave);
        const directa = reserva?.booking_options?.map((o) => o.together).find((o) => o?.book_with && o.price && aerolinea.toLowerCase().includes(o.book_with.toLowerCase().split(" ")[0]));
        if (directa?.price) {
          estado = Math.abs(directa.price - v.price) / directa.price <= 0.03 ? "verificado" : "no_verificado";
          precio = directa.price;
          fuente = t.enAerolinea(directa.book_with!);
        }
      }
      return {
        id: `vuelo-real-${i}`,
        aerolinea,
        clase: p.clase,
        ida: tramo(g),
        vuelta: tramo(v),
        precioPorPersona: Math.round(precio),
        condiciones: condiciones(v, aerolinea, p.idioma),
        linkReserva: enlace ?? `https://www.google.com/travel/flights?hl=${p.idioma}`,
        origen: { fuente, consultadoEn: ahora, estado },
      };
    }),
  );
  const vuelos = opciones.filter((o): o is OpcionVuelo => !!o);
  return vuelos.length ? { estado: "ok", vuelos } : { estado: "sin_resultados", ...distancias };
}
