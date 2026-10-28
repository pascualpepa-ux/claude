import { coordenadasAeropuerto } from "./lugares";

// Zona horaria de cada aeropuerto (para pasar de hora UTC a hora local). Se la pide a Open-Meteo,
// la misma fuente del clima, con timezone=auto; se guarda un mes porque no cambia.

export async function zonaHoraria(iata: string): Promise<string | null> {
  const c = coordenadasAeropuerto(iata);
  if (!c) return null;
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&timezone=auto&forecast_days=1&daily=temperature_2m_max`,
      { next: { revalidate: 30 * 86_400 } },
    );
    if (!res.ok) return null;
    const j = (await res.json()) as { timezone?: string };
    return j.timezone && j.timezone !== "GMT" ? j.timezone : null;
  } catch {
    return null;
  }
}

/** Hora local de un instante en una zona, con el formato de la web: "AAAA-MM-DDTHH:MM:00Z" (hora local mostrada tal cual). */
export function horaLocal(instante: Date, zona: string): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(instante)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`;
}
