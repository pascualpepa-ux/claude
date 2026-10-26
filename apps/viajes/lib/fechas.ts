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

const fmtDia = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const fmtCorto = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });
const fmtHora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const fmtConsulta = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatoDia = (fecha: string) => fmtDia.format(parseFecha(fecha));
export const formatoCorto = (fecha: string) => fmtCorto.format(parseFecha(fecha));
export const formatoHora = (iso: string) => fmtHora.format(new Date(iso));
export const formatoConsulta = (iso: string) => fmtConsulta.format(new Date(iso));

export function formatoDuracion(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
