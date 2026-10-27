import { diferenciaDias, hoy, sumarDias } from "./fechas";
import { coordenadasAeropuerto } from "./lugares";
import type { Condicion, Verificacion } from "./types";

// Agentes del clima (solo servidor).
// - Buscador: Open-Meteo, pronóstico de hasta 16 días (https://open-meteo.com, CC BY 4.0).
// - Verificador: MET Norway, pronóstico propio de ~9 días (https://api.met.no). Si los dos coinciden, queda "verificado".
// - Más allá de 16 días no hay pronóstico: se usa el promedio de los últimos años para esas fechas (Open-Meteo histórico).

export type TipoClima = "pronostico" | "historico" | "sin_datos";

export interface DatoClima {
  fecha: string;
  tipo: TipoClima;
  condicion: Condicion;
  maxima: number;
  minima: number;
  probLluvia: number;
  estado: Verificacion;
  fuente: string;
  consultadoEn: string;
}

const DIAS_PRONOSTICO = 16;
const ANIOS_HISTORICO = 5;
const AGENTE = "RumboTraveling/1.0 (+https://rumbotraveling.com)";

/** Códigos WMO de Open-Meteo a las condiciones de la web. */
export function condicionWmo(codigo: number): Condicion {
  if (codigo <= 1) return "soleado";
  if (codigo === 2) return "parcial";
  if (codigo === 3 || codigo === 45 || codigo === 48) return "nublado";
  if ((codigo >= 71 && codigo <= 77) || codigo === 85 || codigo === 86) return "nieve";
  if (codigo >= 95) return "tormenta";
  return "lluvia"; // llovizna (51-57), lluvia (61-67) y chaparrones (80-82)
}

/** Símbolos de MET Norway ("partlycloudy_day", "lightrain"...) a las condiciones de la web. */
export function condicionMet(simbolo: string): Condicion {
  if (simbolo.includes("thunder")) return "tormenta";
  if (simbolo.includes("snow")) return "nieve";
  if (simbolo.includes("rain") || simbolo.includes("sleet")) return "lluvia";
  if (simbolo.startsWith("partlycloudy")) return "parcial";
  if (simbolo.startsWith("clearsky") || simbolo.startsWith("fair")) return "soleado";
  return "nublado"; // cloudy, fog
}

const mojada = (c: Condicion) => c === "lluvia" || c === "tormenta" || c === "nieve";

async function pedir<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": AGENTE }, next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.error ? null : (json as T);
  } catch {
    return null;
  }
}

interface DiarioOpenMeteo {
  utc_offset_seconds: number;
  daily: {
    time: string[];
    weather_code: (number | null)[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    precipitation_probability_max?: (number | null)[];
    precipitation_sum?: (number | null)[];
  };
}

interface Met {
  properties: {
    timeseries: {
      time: string;
      data: {
        instant: { details: { air_temperature?: number } };
        next_1_hours?: { summary: { symbol_code: string } };
        next_6_hours?: { summary: { symbol_code: string } };
      };
    }[];
  };
}

/** Resumen diario del verificador: máxima, mínima y si llueve en algún momento del día (hora local). */
export function resumirMet(met: Met, offsetSeg: number) {
  const dias = new Map<string, { temps: number[]; simbolos: string[] }>();
  for (const p of met.properties.timeseries) {
    const local = new Date(new Date(p.time).getTime() + offsetSeg * 1000);
    const fecha = local.toISOString().slice(0, 10);
    const hora = local.getUTCHours();
    const d = dias.get(fecha) ?? { temps: [], simbolos: [] };
    const t = p.data.instant.details.air_temperature;
    if (t !== undefined) d.temps.push(t);
    const s = (p.data.next_1_hours ?? p.data.next_6_hours)?.summary.symbol_code;
    if (s && hora >= 7 && hora <= 21) d.simbolos.push(s);
    dias.set(fecha, d);
  }
  const resumen = new Map<string, { maxima: number; minima: number; condicion: Condicion }>();
  for (const [fecha, d] of dias) {
    // Solo días con datos de casi todo el día (los últimos del pronóstico vienen cada 6 horas).
    if (d.temps.length < 4 || d.simbolos.length === 0) continue;
    const condiciones = d.simbolos.map(condicionMet);
    const peor = (["tormenta", "nieve", "lluvia"] as const).find((c) => condiciones.filter((x) => x === c).length >= 2);
    const frecuente = (["nublado", "parcial", "soleado"] as const)
      .map((c) => [c, condiciones.filter((x) => x === c).length] as const)
      .sort((a, b) => b[1] - a[1])[0][0];
    resumen.set(fecha, { maxima: Math.max(...d.temps), minima: Math.min(...d.temps), condicion: peor ?? frecuente });
  }
  return resumen;
}

/** Los dos agentes coinciden si las temperaturas están cerca y los dos dicen lo mismo sobre la lluvia. */
export function coinciden(
  a: { maxima: number; minima: number; condicion: Condicion; probLluvia: number },
  b: { maxima: number; minima: number; condicion: Condicion },
) {
  const lluviaA = mojada(a.condicion) || a.probLluvia >= 60;
  const secoA = !mojada(a.condicion) && a.probLluvia <= 30;
  const lluviaOk = (lluviaA && mojada(b.condicion)) || (secoA && !mojada(b.condicion)) || (!lluviaA && !secoA);
  return Math.abs(a.maxima - b.maxima) <= 3 && Math.abs(a.minima - b.minima) <= 3 && lluviaOk;
}

async function pronostico(lat: number, lon: number, fechas: string[], ahora: string): Promise<Map<string, DatoClima>> {
  const res = new Map<string, DatoClima>();
  if (!fechas.length) return res;
  const desde = fechas[0];
  const hasta = fechas[fechas.length - 1];
  const [om, met] = await Promise.all([
    pedir<DiarioOpenMeteo>(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto&start_date=${desde}&end_date=${hasta}` +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    ),
    pedir<Met>(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`),
  ]);
  if (!om) return res;
  const verificador = met ? resumirMet(met, om.utc_offset_seconds) : new Map();
  const pedidas = new Set(fechas);
  om.daily.time.forEach((fecha, i) => {
    if (!pedidas.has(fecha)) return;
    const codigo = om.daily.weather_code[i];
    const maxima = om.daily.temperature_2m_max[i];
    const minima = om.daily.temperature_2m_min[i];
    if (codigo == null || maxima == null || minima == null) return;
    const dato = {
      condicion: condicionWmo(codigo),
      maxima: Math.round(maxima),
      minima: Math.round(minima),
      probLluvia: Math.round(om.daily.precipitation_probability_max?.[i] ?? 0),
    };
    const otro = verificador.get(fecha);
    // Sin pronóstico del verificador para ese día (más de ~9 días): queda como estimado.
    const estado: Verificacion = !otro ? "estimado" : coinciden(dato, otro) ? "verificado" : "no_verificado";
    res.set(fecha, {
      fecha,
      tipo: "pronostico",
      ...dato,
      estado,
      fuente: otro ? "Open-Meteo + MET Norway" : "Open-Meteo",
      consultadoEn: ahora,
    });
  });
  return res;
}

async function historico(lat: number, lon: number, fechas: string[], ahora: string): Promise<Map<string, DatoClima>> {
  const res = new Map<string, DatoClima>();
  if (!fechas.length) return res;
  const anioActual = Number(hoy().slice(0, 4));
  const desde = fechas[0];
  const hasta = fechas[fechas.length - 1];
  const corrida = (fecha: string, anios: number) => `${Number(fecha.slice(0, 4)) - anios}${fecha.slice(4)}`;
  // Mismas fechas de los últimos años (sin el año en curso, que todavía no está completo en el archivo).
  const objetivos = Array.from({ length: ANIOS_HISTORICO }, (_, i) => anioActual - 1 - i);
  const anios = objetivos.map((a) => Number(desde.slice(0, 4)) - a);
  const respuestas = await Promise.all(
    anios.map((atras) =>
      pedir<DiarioOpenMeteo>(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&timezone=auto` +
          `&start_date=${corrida(desde, atras)}&end_date=${corrida(hasta, atras)}` +
          "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
      ),
    ),
  );
  const validas = respuestas.filter((r): r is DiarioOpenMeteo => !!r);
  if (!validas.length) return res;
  const primero = Math.min(...objetivos);
  const ultimo = Math.max(...objetivos);
  fechas.forEach((fecha) => {
    const i = diferenciaDias(desde, fecha);
    const maximas: number[] = [];
    const minimas: number[] = [];
    const condiciones: Condicion[] = [];
    let conLluvia = 0;
    for (const r of validas) {
      const mx = r.daily.temperature_2m_max[i];
      const mn = r.daily.temperature_2m_min[i];
      const cod = r.daily.weather_code[i];
      if (mx == null || mn == null || cod == null) continue;
      maximas.push(mx);
      minimas.push(mn);
      condiciones.push(condicionWmo(cod));
      if ((r.daily.precipitation_sum?.[i] ?? 0) >= 1) conLluvia++;
    }
    if (!maximas.length) return;
    const promedio = (xs: number[]) => Math.round(xs.reduce((s, x) => s + x, 0) / xs.length);
    const probLluvia = Math.round((conLluvia / maximas.length) * 100);
    const nieve = condiciones.filter((c) => c === "nieve").length > maximas.length / 2;
    const secas = condiciones.map((c) => (mojada(c) ? "nublado" : c));
    const frecuente = (["soleado", "parcial", "nublado"] as const)
      .map((c) => [c, secas.filter((x) => x === c).length] as const)
      .sort((a, b) => b[1] - a[1])[0][0];
    res.set(fecha, {
      fecha,
      tipo: "historico",
      condicion: nieve ? "nieve" : probLluvia >= 50 ? "lluvia" : frecuente,
      maxima: promedio(maximas),
      minima: promedio(minimas),
      probLluvia,
      estado: "estimado",
      fuente: `Open-Meteo (${primero}–${ultimo})`,
      consultadoEn: ahora,
    });
  });
  return res;
}

/** Clima de cada fecha pedida para cada aeropuerto: pronóstico verificado, promedio histórico o sin datos. */
export async function climaReal(pedidos: { iata: string; fechas: string[] }[]): Promise<Record<string, Record<string, DatoClima>>> {
  const ahora = new Date().toISOString();
  const limite = sumarDias(hoy(), DIAS_PRONOSTICO - 1);
  const salida: Record<string, Record<string, DatoClima>> = {};
  await Promise.all(
    pedidos.map(async ({ iata, fechas }) => {
      const ordenadas = [...new Set(fechas)].sort();
      const lugar = coordenadasAeropuerto(iata);
      const porFecha: Record<string, DatoClima> = {};
      if (lugar) {
        const cercanas = ordenadas.filter((f) => f >= hoy() && f <= limite);
        const lejanas = ordenadas.filter((f) => f > limite);
        const [p, h] = await Promise.all([
          pronostico(lugar.lat, lugar.lon, cercanas, ahora),
          historico(lugar.lat, lugar.lon, lejanas, ahora),
        ]);
        for (const m of [p, h]) for (const [f, d] of m) porFecha[f] = d;
      }
      // Lo que ningún agente pudo conseguir queda sin datos: no se inventa.
      for (const fecha of ordenadas) {
        porFecha[fecha] ??= {
          fecha,
          tipo: "sin_datos",
          condicion: "parcial",
          maxima: 0,
          minima: 0,
          probLluvia: 0,
          estado: "no_verificado",
          fuente: "Open-Meteo",
          consultadoEn: ahora,
        };
      }
      salida[iata] = porFecha;
    }),
  );
  return salida;
}
