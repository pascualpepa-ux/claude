/** Minúsculas sin tildes, para buscar y para slugs. */
export function normalizar(t: string): string {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function slug(t: string): string {
  return normalizar(t).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export function formatoNumero(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(".", ",")} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(".", ",")} mil`;
  return String(n);
}

/** Fecha de hoy en UTC (YYYY-MM-DD): el desafío y el juego diario cambian a la misma hora para todos. */
export function hoyUTC(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
