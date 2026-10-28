import { hoy, sumarDias } from "./fechas";

// Lectura de estadísticas de GoatCounter para la página de administración (solo servidor).
// API: https://www.goatcounter.com/help/api — límite de 4 pedidos por segundo.

export interface VisitasDia {
  dia: string; // YYYY-MM-DD
  visitas: number;
}

export interface Item {
  id: string;
  nombre: string;
  visitas: number;
}

export interface Estadisticas {
  dias: VisitasDia[];
  horasHoy: number[]; // 24 valores: visitantes por hora de hoy
  total: number;
  paginas: Item[];
  dispositivos: Item[]; // phone, tablet, desktop, desktophd, unknown
  sistemas: Item[];
  navegadores: Item[];
  paises: Item[]; // id = código ISO del país
  origenes: Item[]; // nombre "" = directo o sin referencia
  campanas: Item[];
  panel: string;
  /** Secciones que GoatCounter no pudo dar (se muestran vacías; el resto del panel sigue andando). */
  fallidas: string[];
}

export type ResultadoEstadisticas =
  | { estado: "sin_configurar" }
  | { estado: "error"; motivo: "clave" | "conexion" | "servidor"; status?: number; ruta?: string }
  | ({ estado: "ok" } & Estadisticas);

class ErrorGoatCounter extends Error {
  constructor(
    public motivo: "clave" | "conexion" | "servidor",
    public status?: number,
    public ruta = "",
  ) {
    super(`${motivo} ${status ?? ""} ${ruta}`);
  }
}

export async function estadisticas(cantidadDias = 30): Promise<ResultadoEstadisticas> {
  const codigo = process.env.GOATCOUNTER_CODE;
  const token = process.env.GOATCOUNTER_API_TOKEN;
  // GOATCOUNTER_URL permite usar un GoatCounter propio (o uno de prueba) en vez de goatcounter.com.
  const base = process.env.GOATCOUNTER_URL || (codigo ? `https://${codigo}.goatcounter.com` : "");
  if (!base || !token) return { estado: "sin_configurar" };

  const desde = sumarDias(hoy(), -(cantidadDias - 1));
  const rango = `start=${desde}T00:00:00Z&end=${new Date().toISOString().slice(0, 13)}:00:00Z`;

  async function pedir<T>(ruta: string): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${base}/api/v0/${ruta}${ruta.includes("?") ? "&" : "?"}${rango}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        // Se guarda 5 minutos: el panel carga rápido y no se pasa el límite de pedidos de GoatCounter.
        next: { revalidate: 300 },
      });
    } catch {
      throw new ErrorGoatCounter("conexion", undefined, ruta);
    }
    if (res.status === 401 || res.status === 403) throw new ErrorGoatCounter("clave", res.status, ruta);
    if (!res.ok) {
      console.error("GoatCounter:", res.status, ruta, (await res.text().catch(() => "")).slice(0, 300));
      throw new ErrorGoatCounter("servidor", res.status, ruta);
    }
    return (await res.json()) as T;
  }

  type Lista = { stats?: { id?: string; name?: string; count?: number }[] };
  const items = (l: Lista): Item[] =>
    (l.stats ?? [])
      .map((s) => ({ id: s.id ?? s.name ?? "", nombre: s.name ?? "", visitas: s.count ?? 0 }))
      .filter((s) => s.visitas > 0);

  try {
    // El total es imprescindible; si alguna de las demás secciones falla, esa queda vacía y el resto se muestra.
    const fallidas: string[] = [];
    const opcional = async <T,>(ruta: string, vacio: T): Promise<T> => {
      try {
        return await pedir<T>(ruta);
      } catch (e) {
        if (e instanceof ErrorGoatCounter && e.motivo === "clave") throw e;
        fallidas.push(ruta.split("?")[0]);
        return vacio;
      }
    };
    // En dos tandas para respetar el límite de 4 pedidos por segundo.
    const [total, hits, tamanos, sistemas] = await Promise.all([
      pedir<{ total?: number; stats?: { day: string; daily: number; hourly?: number[] }[] }>("stats/total"),
      opcional<{ hits?: { path: string; count: number }[] }>("stats/hits?limit=10", {}),
      opcional<Lista>("stats/sizes", {}),
      opcional<Lista>("stats/systems?limit=8", {}),
    ]);
    await new Promise((r) => setTimeout(r, 1000));
    const [navegadores, paises, origenes, campanas] = await Promise.all([
      opcional<Lista>("stats/browsers?limit=8", {}),
      opcional<Lista>("stats/locations?limit=10", {}),
      opcional<Lista>("stats/toprefs?limit=10", {}),
      opcional<Lista>("stats/campaigns?limit=10", {}),
    ]);

    const porDia = new Map((total.stats ?? []).map((s) => [s.day, s]));
    const dias = Array.from({ length: cantidadDias }, (_, i) => {
      const dia = sumarDias(desde, i);
      return { dia, visitas: porDia.get(dia)?.daily ?? 0 };
    });
    const horasHoy = porDia.get(hoy())?.hourly ?? Array(24).fill(0);

    return {
      estado: "ok",
      dias,
      horasHoy: Array.from({ length: 24 }, (_, h) => horasHoy[h] ?? 0),
      total: total.total ?? dias.reduce((s, d) => s + d.visitas, 0),
      paginas: (hits.hits ?? []).map((h) => ({ id: h.path, nombre: h.path, visitas: h.count })).filter((h) => h.visitas > 0),
      dispositivos: items(tamanos),
      sistemas: items(sistemas),
      navegadores: items(navegadores),
      paises: items(paises),
      origenes: (origenes.stats ?? []).map((s) => ({ id: s.name ?? "", nombre: s.name ?? "", visitas: s.count ?? 0 })).filter((s) => s.visitas > 0),
      campanas: items(campanas),
      panel: base,
      fallidas,
    };
  } catch (e) {
    if (e instanceof ErrorGoatCounter) return { estado: "error", motivo: e.motivo, status: e.status, ruta: e.ruta };
    return { estado: "error", motivo: "conexion" };
  }
}
