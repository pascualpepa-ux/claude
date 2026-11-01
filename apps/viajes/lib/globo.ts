// Dónde está cada destino en el globo de /explorar (centro de la ciudad) y su aeropuerto principal.
// Los puntos de los continentes (tierra.json) salen de un mapa del mundo de 256×128 (el de la librería cobe, MIT),
// muestreado en una espiral de Fibonacci para que queden parejos sobre la esfera.

export const UBICACIONES: Record<string, { lat: number; lon: number; iata: string }> = {
  "roma-3-dias": { lat: 41.9, lon: 12.5, iata: "FCO" },
  "paris-4-dias": { lat: 48.86, lon: 2.35, iata: "CDG" },
  "barcelona-3-dias": { lat: 41.39, lon: 2.17, iata: "BCN" },
  "madrid-3-dias": { lat: 40.42, lon: -3.7, iata: "MAD" },
  "lisboa-3-dias": { lat: 38.72, lon: -9.14, iata: "LIS" },
  "londres-4-dias": { lat: 51.51, lon: -0.13, iata: "LHR" },
  "nueva-york-5-dias": { lat: 40.71, lon: -74.0, iata: "JFK" },
  "miami-4-dias": { lat: 25.76, lon: -80.19, iata: "MIA" },
  "cancun-5-dias": { lat: 21.16, lon: -86.85, iata: "CUN" },
  "punta-cana-5-dias": { lat: 18.58, lon: -68.37, iata: "PUJ" },
  "rio-de-janeiro-4-dias": { lat: -22.91, lon: -43.17, iata: "GIG" },
  "japon-7-dias-cuanto-cuesta": { lat: 35.68, lon: 139.69, iata: "HND" },
  "pekin-5-dias": { lat: 39.9, lon: 116.4, iata: "PEK" },
  "bariloche-4-dias": { lat: -41.13, lon: -71.31, iata: "BRC" },
};

/**
 * Dónde cae en la pantalla un punto del globo (proyección ortográfica, con la Tierra girada phi y theta).
 * Devuelve x e y entre 0 y 1 (desde arriba a la izquierda) y z > 0 si está del lado que se ve.
 */
export function proyectar(lat: number, lon: number, phi: number, theta: number) {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  const m = [Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo)];
  const [cp, sp, ct, st] = [Math.cos(phi), Math.sin(phi), Math.cos(theta), Math.sin(theta)];
  const x = m[0] * cp + m[2] * sp;
  const y = m[0] * sp * st + m[1] * ct - m[2] * cp * st;
  const z = -m[0] * sp * ct + m[1] * st + m[2] * cp * ct;
  // El globo ocupa un radio de 0.8 del lienzo.
  return { x: (x * 0.8 + 1) / 2, y: (1 - y * 0.8) / 2, z };
}

/** Al revés que proyectar: de un punto de la pantalla (0 a 1) a latitud y longitud. null si cae fuera del globo. */
export function desproyectar(sx: number, sy: number, phi: number, theta: number): { lat: number; lon: number } | null {
  const x = (sx * 2 - 1) / 0.8;
  const y = (1 - sy * 2) / 0.8;
  const r2 = x * x + y * y;
  if (r2 > 1) return null;
  const z = Math.sqrt(1 - r2);
  const [cp, sp, ct, st] = [Math.cos(phi), Math.sin(phi), Math.cos(theta), Math.sin(theta)];
  const m0 = cp * x + sp * st * y - sp * ct * z;
  const m1 = ct * y + st * z;
  const m2 = sp * x - cp * st * y + cp * ct * z;
  return { lat: (Math.asin(Math.max(-1, Math.min(1, m1))) * 180) / Math.PI, lon: (Math.atan2(-m2, m0) * 180) / Math.PI };
}

/** Ángulos que dejan un punto en el centro, de frente. */
export function enfocar(lat: number, lon: number) {
  return { phi: (3 * Math.PI) / 2 - (lon * Math.PI) / 180, theta: (lat * Math.PI) / 180 };
}

export interface ClimaAhora {
  temperatura: number;
  codigo: number; // código WMO de Open-Meteo
  zona: string; // zona horaria (para mostrar la hora de allá)
}

/** Clima de este momento en cada lugar, en un solo pedido a Open-Meteo (https://open-meteo.com, CC BY 4.0). Se guarda 15 minutos. */
export async function climaAhora(lugares: { lat: number; lon: number }[]): Promise<(ClimaAhora | null)[]> {
  const url =
    "https://api.open-meteo.com/v1/forecast?current=temperature_2m,weather_code&timezone=auto" +
    `&latitude=${lugares.map((l) => l.lat).join(",")}&longitude=${lugares.map((l) => l.lon).join(",")}`;
  try {
    const res = await fetch(url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(3000) });
    if (!res.ok) return lugares.map(() => null);
    const json = (await res.json()) as { timezone: string; current?: { temperature_2m: number; weather_code: number } }[] | { timezone: string; current?: { temperature_2m: number; weather_code: number } };
    const lista = Array.isArray(json) ? json : [json];
    return lugares.map((_, i) => {
      const c = lista[i]?.current;
      return c ? { temperatura: Math.round(c.temperature_2m), codigo: c.weather_code, zona: lista[i].timezone } : null;
    });
  } catch {
    return lugares.map(() => null);
  }
}
