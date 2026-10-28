import { codigoAerolinea, NOMBRE_AEROLINEA } from "./aerolineas";
import type { Idioma } from "./idioma";
import { aeropuertosDeLaCiudad } from "./lugares";
import type { Clase, OpcionVuelo, SegmentoVuelo, Tramo } from "./types";
import { horaLocal, zonaHoraria } from "./zona-horaria";

// Agente de vuelos reales con la API de datos de Aviasales (Travelpayouts, https://www.travelpayouts.com).
// Devuelve los pasajes más baratos que la gente buscó de verdad en Aviasales en las últimas 48 horas para
// esas fechas: aerolínea, número de vuelo, horario de salida, duración, escalas y precio ida y vuelta.
// El link "Reservar" abre esa misma búsqueda en Aviasales. Si para esas fechas no hay datos, devuelve null
// y la web sigue con el agente siguiente (horarios reales o vuelo estimado).

export interface PedidoTp {
  origen: string;
  destino: string;
  regreso: string;
  ida: string;
  vuelta: string;
  clase: Clase;
  aerolinea: string;
  idioma: Idioma;
}

export interface BoletoTp {
  origin?: string;
  destination?: string;
  origin_airport?: string;
  destination_airport?: string;
  price?: number;
  airline?: string;
  flight_number?: string | number;
  departure_at?: string;
  return_at?: string;
  transfers?: number;
  return_transfers?: number;
  duration?: number;
  duration_to?: number;
  duration_back?: number;
  link?: string;
}

const BASE = () => process.env.TRAVELPAYOUTS_BASE || "https://api.travelpayouts.com";
const CACHE_SEG = 3 * 3600;

const TX = {
  es: {
    fuente: "Aviasales: precio real buscado en las últimas 48 h",
    equipaje: (a: string) => `Equipaje: según la tarifa de ${a}. Revisalo al reservar.`,
    valija: (a: string) => `Valija despachada: confirmá en ${a} si la tarifa la incluye`,
    cambios: (a: string) => `Cambios: según las reglas de la tarifa de ${a}`,
    reembolso: "Reembolso: se ve en las condiciones de la tarifa al reservar",
  },
  en: {
    fuente: "Aviasales: real price searched in the last 48 h",
    equipaje: (a: string) => `Baggage: according to ${a}'s fare. Check it when booking.`,
    valija: (a: string) => `Checked bag: confirm with ${a} whether the fare includes it`,
    cambios: (a: string) => `Changes: according to ${a}'s fare rules`,
    reembolso: "Refunds: shown in the fare conditions when booking",
  },
};

async function pedir(origen: string, destino: string, ida: string, vuelta: string, clave: string): Promise<BoletoTp[] | null> {
  const params = new URLSearchParams({
    origin: origen,
    destination: destino,
    departure_at: ida,
    return_at: vuelta,
    one_way: "false",
    unique: "false",
    sorting: "price",
    direct: "false",
    currency: "usd",
    limit: "30",
    page: "1",
  });
  try {
    const res = await fetch(`${BASE()}/aviasales/v3/prices_for_dates?${params}`, {
      headers: { "X-Access-Token": clave, "Accept-Encoding": "gzip" },
      next: { revalidate: CACHE_SEG },
    });
    if (!res.ok) {
      console.error("Travelpayouts:", res.status, (await res.text().catch(() => "")).slice(0, 200));
      return null;
    }
    const j = (await res.json()) as { success?: boolean; data?: BoletoTp[] };
    return j.success === false ? null : (j.data ?? []);
  } catch {
    return null;
  }
}

const local = (iso: string) => `${iso.slice(0, 16)}:00Z`; // hora local tal cual viene ("…T13:15:00-03:00")

/** Un tramo a partir de la salida (con su zona) y la duración; la llegada se pasa a la hora local del destino. */
export function armarTramo(
  desde: string,
  hasta: string,
  salidaIso: string,
  duracionMin: number,
  escalas: number,
  numero: string,
  aerolinea: string,
  zonaLlegada: string,
): Tramo {
  const llegada = horaLocal(new Date(Date.parse(salidaIso) + duracionMin * 60_000), zonaLlegada);
  const directo = escalas === 0;
  const segmento: SegmentoVuelo = { numero, aerolinea, desde, hasta, salida: local(salidaIso), llegada, duracionMin };
  return {
    desde,
    hasta,
    salida: local(salidaIso),
    llegada,
    escalas: Array(escalas).fill(""), // Aviasales no dice dónde son las escalas
    duracionMin,
    numeros: [numero],
    // Con escalas solo se conoce el número del primer vuelo: el detalle por vuelo se muestra únicamente si es directo.
    ...(directo && { segmentos: [segmento] }),
  };
}

export async function buscarTravelpayouts(p: PedidoTp): Promise<OpcionVuelo[] | null> {
  const clave = process.env.TRAVELPAYOUTS_TOKEN;
  if (!clave) return null;

  // Primero el aeropuerto elegido; si no hay datos, los otros de la misma ciudad (ej. AEP → EZE).
  const origenes = aeropuertosDeLaCiudad(p.origen).split(",");
  const destinos = aeropuertosDeLaCiudad(p.destino).split(",");
  let boletos: BoletoTp[] = [];
  buscar: for (const o of origenes)
    for (const d of destinos) {
      const r = await pedir(o, d, p.ida, p.vuelta, clave);
      if (r === null) return null; // clave mala o servicio caído: que siga el próximo agente
      boletos = r
        .filter((b) => b.price && b.airline && b.flight_number && b.departure_at?.startsWith(p.ida) && b.return_at?.startsWith(p.vuelta))
        .sort((x, y) => x.price! - y.price!);
      if (boletos.length) break buscar;
    }
  if (!boletos.length) return null;

  // Tres opciones de aerolíneas distintas: la preferida (si hay), la más barata y la directa más barata.
  const preferida = p.aerolinea.trim() ? codigoAerolinea(p.aerolinea) : null;
  const elegidos: BoletoTp[] = [];
  const sumar = (b?: BoletoTp) => b && elegidos.length < 3 && !elegidos.some((e) => e.airline === b.airline) && elegidos.push(b);
  if (preferida) sumar(boletos.find((b) => b.airline === preferida));
  sumar(boletos[0]);
  sumar(boletos.find((b) => !b.transfers));
  for (const b of boletos) sumar(b);

  const zonas = new Map<string, string | null>();
  const zona = async (iata: string) => {
    if (!zonas.has(iata)) zonas.set(iata, await zonaHoraria(iata));
    return zonas.get(iata)!;
  };

  const t = TX[p.idioma];
  const ahora = new Date().toISOString();
  const marcador = process.env.TRAVELPAYOUTS_MARKER;
  const opciones = await Promise.all(
    elegidos.map(async (b, i): Promise<OpcionVuelo | null> => {
      const desde = (b.origin_airport ?? b.origin ?? p.origen).toUpperCase();
      const hasta = (b.destination_airport ?? b.destination ?? p.destino).toUpperCase();
      const durIda = b.duration_to ?? 0;
      const durVuelta = b.duration_back ?? 0;
      const [zDestino, zOrigen] = await Promise.all([zona(hasta), zona(desde)]);
      if (!durIda || !durVuelta || !zDestino || !zOrigen) return null; // sin duración o zona no se puede dar la llegada real
      const nombre = NOMBRE_AEROLINEA[b.airline!] ?? b.airline!;
      const numero = `${b.airline} ${b.flight_number}`;
      const enlace = b.link
        ? `https://www.aviasales.com${b.link.startsWith("/") ? "" : "/"}${b.link}${marcador ? `${b.link.includes("?") ? "&" : "?"}marker=${marcador}` : ""}`
        : `https://www.aviasales.com/?origin=${desde}&destination=${hasta}`;
      return {
        id: `vuelo-tp-${i}`,
        aerolinea: nombre,
        clase: p.clase,
        ida: armarTramo(desde, hasta, b.departure_at!, durIda, b.transfers ?? 0, numero, nombre, zDestino),
        // De la vuelta Aviasales da la salida y la duración, pero no el número de vuelo.
        vuelta: { ...armarTramo(hasta, desde, b.return_at!, durVuelta, b.return_transfers ?? 0, "", nombre, zOrigen), numeros: [], segmentos: undefined },
        precioPorPersona: Math.round(b.price!),
        condiciones: { equipajeMano: t.equipaje(nombre), valija: t.valija(nombre), cambios: t.cambios(nombre), reembolso: t.reembolso },
        linkReserva: enlace,
        origen: { fuente: t.fuente, consultadoEn: ahora, estado: "no_verificado" },
      };
    }),
  );
  const vuelos = opciones.filter((o): o is OpcionVuelo => !!o);
  return vuelos.length ? vuelos : null;
}
