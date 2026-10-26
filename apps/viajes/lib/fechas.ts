import { LOCALE, type Idioma } from "./idioma";

// Las fechas se manejan como "YYYY-MM-DD" en UTC para evitar corrimientos por zona horaria.

export function parseFecha(fecha: string): Date {
  return new Date(`${fecha}T00:00:00Z`);
}

export function sumarDias(fecha: string, dias: number): string {
  const d = parseFecha(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function diferenciaDias(desde: string, hasta: string): number {
  return Math.round((parseFecha(hasta).getTime() - parseFecha(desde).getTime()) / 86_400_000);
}

export function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function formateador(opciones: Intl.DateTimeFormatOptions) {
  const cache = new Map<Idioma, Intl.DateTimeFormat>();
  return (idioma: Idioma) => {
    if (!cache.has(idioma)) cache.set(idioma, new Intl.DateTimeFormat(LOCALE[idioma], opciones));
    return cache.get(idioma)!;
  };
}

const fmtDia = formateador({ weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const fmtCorto = formateador({ day: "numeric", month: "short", timeZone: "UTC" });
const fmtHora = formateador({ hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const fmtConsulta = formateador({ day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const formatoDia = (fecha: string, idioma: Idioma = "es") => fmtDia(idioma).format(parseFecha(fecha));
export const formatoCorto = (fecha: string, idioma: Idioma = "es") => fmtCorto(idioma).format(parseFecha(fecha));
export const formatoHora = (iso: string, idioma: Idioma = "es") => fmtHora(idioma).format(new Date(iso));
export const formatoConsulta = (iso: string, idioma: Idioma = "es") => fmtConsulta(idioma).format(new Date(iso));

export function formatoDuracion(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
