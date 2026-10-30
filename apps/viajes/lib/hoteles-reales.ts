import type { Idioma } from "./idioma";
import { coordenadasAeropuerto } from "./lugares";
import type { OpcionHotel, TipoHotel, Verificacion } from "./types";

// Agentes de hoteles (solo servidor), con Google Hotels a través de SerpApi (https://serpapi.com/google-hotels-api).
// - Buscador: hoteles reales del tipo elegido en cada ciudad, con precio por noche, impuestos y horarios.
// - Verificador: vuelve a pedir el hotel elegido por su ficha (property_token) y compara el precio.
// Lo que Google no informa (desayuno, cancelación) no se inventa: se dice que hay que consultarlo al reservar.

export interface PedidoHoteles {
  ciudades: { clave: string; ciudad: string; iata: string; entrada: string; salida: string }[];
  viajeros: number;
  tipo: TipoHotel;
  preferido: string;
  idioma: Idioma;
}

export type ResultadoHoteles = { estado: "ok"; hoteles: Record<string, OpcionHotel[]> } | { estado: "sin_clave" | "sin_cupo" | "sin_resultados" | "error" };

const CACHE_SEG = 6 * 3600;

const TX = {
  es: {
    fuente: "Google Hotels",
    verificado: "Google Hotels, precio confirmado en la ficha del hotel",
    hostel: (c: string) => `hostel en ${c}`,
    hotel: (c: string) => `hoteles en ${c}`,
    desayunoSi: "Desayuno incluido",
    desayunoConsultar: "Desayuno: consultalo al reservar",
    cancelacionGratis: "Cancelación gratis (según la tarifa)",
    cancelacionConsultar: "Cancelación: consultá las condiciones al reservar",
    checkIn: (h: string) => `Check-in desde las ${h}`,
    checkOut: (h: string) => `Check-out hasta las ${h}`,
    checkInConsultar: "Check-in: horario según el hotel",
    checkOutConsultar: "Check-out: horario según el hotel",
  },
  en: {
    fuente: "Google Hotels",
    verificado: "Google Hotels, price confirmed on the hotel's page",
    hostel: (c: string) => `hostel in ${c}`,
    hotel: (c: string) => `hotels in ${c}`,
    desayunoSi: "Breakfast included",
    desayunoConsultar: "Breakfast: check when booking",
    cancelacionGratis: "Free cancellation (per the rate)",
    cancelacionConsultar: "Cancellation: check the conditions when booking",
    checkIn: (h: string) => `Check-in from ${h}`,
    checkOut: (h: string) => `Check-out until ${h}`,
    checkInConsultar: "Check-in: times set by the hotel",
    checkOutConsultar: "Check-out: times set by the hotel",
  },
};

interface Propiedad {
  name?: string;
  link?: string;
  property_token?: string;
  rate_per_night?: { extracted_lowest?: number; extracted_before_taxes_fees?: number };
  total_rate?: { extracted_lowest?: number };
  check_in_time?: string;
  check_out_time?: string;
  amenities?: string[];
  free_cancellation?: boolean;
  neighborhood?: string;
}
interface RespuestaHoteles {
  properties?: Propiedad[];
  error?: string;
  search_metadata?: { google_hotels_url?: string };
  // Pedido por property_token: la ficha de un hotel
  name?: string;
  rate_per_night?: Propiedad["rate_per_night"];
  total_rate?: Propiedad["total_rate"];
}

export async function serpapiHoteles(params: Record<string, string>, cache = true): Promise<RespuestaHoteles | null> {
  const clave = process.env.SERPAPI_API_KEY;
  if (!clave) return null;
  const url = `https://serpapi.com/search.json?${new URLSearchParams({ engine: "google_hotels", currency: "USD", ...params, api_key: clave })}`;
  try {
    const res = await fetch(url, cache ? { next: { revalidate: CACHE_SEG } } : { cache: "no-store" });
    if (!res.ok) return null;
    const j = (await res.json()) as RespuestaHoteles;
    return j.error && !j.properties && !j.name ? null : j;
  } catch {
    return null;
  }
}

export function habitacionesPara(tipo: TipoHotel, personas: number) {
  if (tipo === "hostel") return personas; // camas
  if (tipo === "depto") return Math.ceil(personas / 4);
  return Math.ceil(personas / 2);
}

const horaLocal = (h: string | undefined) => h?.match(/\d{1,2}:\d{2}/)?.[0];

/** Busca hoteles reales para cada ciudad. Devuelve hasta 3 opciones por ciudad. */
export async function buscarHoteles(p: PedidoHoteles): Promise<ResultadoHoteles> {
  if (!process.env.SERPAPI_API_KEY) return { estado: "sin_clave" };
  const t = TX[p.idioma];
  const ahora = new Date().toISOString();
  const habitaciones = habitacionesPara(p.tipo, p.viajeros);
  const resultado: Record<string, OpcionHotel[]> = {};

  for (const c of p.ciudades) {
    const pais = coordenadasAeropuerto(c.iata)?.pais.toLowerCase() ?? "us";
    const base: Record<string, string> = {
      check_in_date: c.entrada,
      check_out_date: c.salida,
      adults: String(Math.max(1, Math.min(4, Math.ceil(p.viajeros / habitaciones)))), // personas por habitación
      hl: p.idioma,
      gl: pais,
    };
    const filtros: Record<string, string> =
      p.tipo === "depto" ? { vacation_rentals: "true" } : p.tipo === "hostel" ? {} : { hotel_class: p.tipo };
    const q = p.tipo === "hostel" ? t.hostel(c.ciudad) : t.hotel(c.ciudad);
    const [general, preferido] = await Promise.all([
      serpapiHoteles({ ...base, ...filtros, q, sort_by: "3" }), // 3 = precio más bajo primero (público joven, presupuesto ajustado)
      p.preferido.trim() ? serpapiHoteles({ ...base, q: `${p.preferido.trim()} ${c.ciudad}` }) : Promise.resolve(null),
    ]);
    const candidatos = [...(preferido?.properties?.slice(0, 1) ?? []), ...(general?.properties ?? [])].filter(
      (x, i, todos) => x.name && x.rate_per_night?.extracted_lowest && todos.findIndex((y) => y.name === x.name) === i,
    );
    const elegidos = candidatos.slice(0, 3);
    const enlaceBusqueda = general?.search_metadata?.google_hotels_url ?? `https://www.google.com/travel/search?q=${encodeURIComponent(q)}`;

    resultado[c.clave] = await Promise.all(
      elegidos.map(async (h, i): Promise<OpcionHotel> => {
        const conImpuestos = h.rate_per_night!.extracted_lowest!;
        const sinImpuestos = h.rate_per_night?.extracted_before_taxes_fees ?? conImpuestos;
        let estado: Verificacion = "no_verificado";
        let fuente = t.fuente;
        // Verificador: la primera opción se vuelve a consultar en la ficha del hotel.
        if (i === 0 && h.property_token) {
          const ficha = await serpapiHoteles({ ...base, q, property_token: h.property_token });
          const precio = ficha?.rate_per_night?.extracted_lowest;
          if (precio) {
            estado = Math.abs(precio - conImpuestos) / precio <= 0.05 ? "verificado" : "no_verificado";
            fuente = estado === "verificado" ? t.verificado : t.fuente;
          }
        } else {
          estado = "estimado"; // precio real de Google, sin segunda consulta
        }
        const amenidades = (h.amenities ?? []).join(" ").toLowerCase();
        const entrada = horaLocal(h.check_in_time);
        const salida = horaLocal(h.check_out_time);
        return {
          id: `${c.clave}-hotel-real-${i}`,
          ciudad: c.ciudad,
          nombre: h.name!,
          tipo: p.tipo,
          zona: h.neighborhood ?? c.ciudad,
          precioNoche: Math.round(sinImpuestos),
          impuestosPct: sinImpuestos > 0 ? Math.max(0, Math.round((conImpuestos / sinImpuestos - 1) * 100)) : 0,
          habitaciones,
          condiciones: {
            desayuno: /breakfast|desayuno/.test(amenidades) ? t.desayunoSi : t.desayunoConsultar,
            cancelacion: h.free_cancellation ? t.cancelacionGratis : t.cancelacionConsultar,
            checkIn: entrada ? t.checkIn(entrada) : t.checkInConsultar,
            checkOut: salida ? t.checkOut(salida) : t.checkOutConsultar,
          },
          linkReserva: h.link ?? enlaceBusqueda,
          origen: { fuente, consultadoEn: ahora, estado },
          propiedad: h.property_token,
        };
      }),
    );
  }
  return Object.values(resultado).some((l) => l.length) ? { estado: "ok", hoteles: resultado } : { estado: "sin_resultados" };
}

/** Precio actual (por noche, con impuestos) de un hotel por su ficha, o null si ya no tiene disponibilidad. */
export async function precioHotelAhora(propiedad: string, entrada: string, salida: string, adultos: number, idioma: Idioma) {
  const r = await serpapiHoteles({ property_token: propiedad, q: "hotel", check_in_date: entrada, check_out_date: salida, adults: String(adultos), hl: idioma }, false);
  if (!r) return undefined; // sin respuesta: no se sabe
  return r.rate_per_night?.extracted_lowest ?? null; // null: sin precio para esas fechas = sin disponibilidad
}
