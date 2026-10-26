import aeropuertosJson from "@/data/lugares/aeropuertos.json";
import ciudadesJson from "@/data/lugares/ciudades.json";
import type { AeropuertoCercano, Lugar } from "./lugares-tipos";

export type { AeropuertoCercano, Lugar };

// Solo para el servidor: los datos pesan ~2,5 MB y no deben llegar al navegador.
// Fuentes: GeoNames (ciudades, CC BY 4.0) y OurAirports (aeropuertos, dominio público).
// Se regeneran con scripts/datos-lugares.mjs.

type FilaAeropuerto = [iata: string, nombre: string, ciudad: string, pais: string, lat: number, lon: number, grande: number];
type FilaCiudad = [nombre: string, ascii: string, otros: string[], pais: string, lat: number, lon: number, poblacion: number, region: string];

const AEROPUERTOS = aeropuertosJson as FilaAeropuerto[];
const CIUDADES = ciudadesJson as FilaCiudad[];

const normalizar = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

// Índice de búsqueda: cada ciudad con todos sus nombres normalizados.
const INDICE = CIUDADES.map((c) => ({ c, nombres: [c[0], c[1], ...c[2]].map(normalizar) }));

/** Distancia en km entre dos puntos (fórmula del haversine). */
export function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

/** Aeropuertos con vuelos regulares más cercanos a un punto (hasta `max`, dentro de `radioKm`). */
export function aeropuertosCercanos(lat: number, lon: number, max = 3, radioKm = 250): AeropuertoCercano[] {
  return AEROPUERTOS.map((a) => ({ a, d: distanciaKm(lat, lon, a[4], a[5]) }))
    .filter(({ d }) => d <= radioKm)
    .sort((x, y) => x.d - y.d)
    .slice(0, max)
    .map(({ a, d }) => ({ iata: a[0], nombre: a[1], ciudad: a[2], distanciaKm: Math.round(d) }));
}

/** Busca ciudades por nombre (en cualquier idioma con alfabeto latino) y les agrega sus aeropuertos cercanos. */
export function buscarLugares(texto: string, max = 6): Lugar[] {
  const q = normalizar(texto);
  if (q.length < 2) return [];
  const resultados: { c: FilaCiudad; nombre: string; puntaje: number }[] = [];
  for (const { c, nombres } of INDICE) {
    let mejor = -1;
    let nombreVisible = c[0];
    nombres.forEach((n, i) => {
      // Coincidencia exacta > empieza con > alguna palabra empieza con
      const p = n === q ? 3 : n.startsWith(q) ? 2 : n.includes(` ${q}`) ? 1 : -1;
      if (p > mejor) {
        mejor = p;
        // Si coincidió con un nombre alternativo (ej. "Nueva York"), se muestra ese.
        nombreVisible = i >= 2 ? c[2][i - 2] : c[0];
      }
    });
    if (mejor >= 0) resultados.push({ c, nombre: nombreVisible, puntaje: mejor });
  }
  return resultados
    .sort((x, y) => y.puntaje - x.puntaje || y.c[6] - x.c[6])
    .slice(0, max)
    .map(({ c, nombre }) => ({ ciudad: nombre, region: c[7], pais: c[3], aeropuertos: aeropuertosCercanos(c[4], c[5]) }));
}
