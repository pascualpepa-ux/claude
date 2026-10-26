import { hoy, sumarDias } from "./fechas";

export interface VisitasDia {
  dia: string; // YYYY-MM-DD
  visitas: number;
}

export type ResultadoVisitas =
  | { estado: "sin_configurar" }
  | { estado: "error"; mensaje: string }
  | { estado: "ok"; dias: VisitasDia[]; total: number; panel: string };

/** Visitas por día de los últimos `cantidad` días, leídas de la API de GoatCounter. */
export async function visitasPorDia(cantidad = 30): Promise<ResultadoVisitas> {
  const codigo = process.env.GOATCOUNTER_CODE;
  const token = process.env.GOATCOUNTER_API_TOKEN;
  // GOATCOUNTER_URL permite usar un GoatCounter propio (o uno de prueba) en vez de goatcounter.com.
  const base = process.env.GOATCOUNTER_URL || (codigo ? `https://${codigo}.goatcounter.com` : "");
  if (!base || !token) return { estado: "sin_configurar" };

  const desde = sumarDias(hoy(), -(cantidad - 1));
  const url = `${base}/api/v0/stats/total?start=${desde}T00:00:00Z&end=${new Date().toISOString().slice(0, 13)}:00:00Z`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) {
      return { estado: "error", mensaje: "GoatCounter rechazó la clave de API. Revisá que tenga permiso para leer estadísticas." };
    }
    if (!res.ok) return { estado: "error", mensaje: `GoatCounter respondió con un error (${res.status}). Probá de nuevo en un rato.` };
    const datos = (await res.json()) as { total?: number; stats?: { day: string; daily: number }[] };
    const porDia = new Map((datos.stats ?? []).map((s) => [s.day, s.daily ?? 0]));
    const dias = Array.from({ length: cantidad }, (_, i) => {
      const dia = sumarDias(desde, i);
      return { dia, visitas: porDia.get(dia) ?? 0 };
    });
    return { estado: "ok", dias, total: datos.total ?? dias.reduce((s, d) => s + d.visitas, 0), panel: base };
  } catch {
    return { estado: "error", mensaje: "No se pudo conectar con GoatCounter. Probá de nuevo en un rato." };
  }
}
