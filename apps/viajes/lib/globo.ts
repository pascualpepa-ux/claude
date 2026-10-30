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

/** Ángulos que dejan un punto en el centro, de frente. */
export function enfocar(lat: number, lon: number) {
  return { phi: (3 * Math.PI) / 2 - (lon * Math.PI) / 180, theta: (lat * Math.PI) / 180 };
}
