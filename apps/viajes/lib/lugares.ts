import aeropuertosJson from "@/data/lugares/aeropuertos.json";
import ciudadesJson from "@/data/lugares/ciudades.json";
import type { AeropuertoCercano, CiudadPrincipal, Lugar } from "./lugares-tipos";

export type { AeropuertoCercano, CiudadPrincipal, Lugar };

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

/** Ubicación de un aeropuerto por su código IATA (para pedir el clima de la ciudad). */
export function coordenadasAeropuerto(iata: string): { lat: number; lon: number; pais: string } | null {
  const a = AEROPUERTOS.find((x) => x[0] === iata.toUpperCase());
  return a ? { lat: a[4], lon: a[5], pais: a[3] } : null;
}

/**
 * El aeropuerto elegido y los demás de la misma ciudad (a menos de 60 km), separados por coma:
 * "AEP" -> "AEP,EZE". Así la búsqueda de vuelos no se pierde los que llegan al otro aeropuerto.
 */
export function aeropuertosDeLaCiudad(iata: string): string {
  const a = coordenadasAeropuerto(iata);
  if (!a) return iata;
  // Los grandes de la zona (hasta 80 km), y si no hay, los demás cercanos (hasta 60 km).
  const zona = AEROPUERTOS.map((x) => ({ x, d: distanciaKm(a.lat, a.lon, x[4], x[5]) }))
    .filter(({ x, d }) => x[0] !== iata.toUpperCase() && x[3] === a.pais && (x[6] ? d <= 80 : d <= 60))
    .sort((p, q) => q.x[6] - p.x[6] || p.d - q.d);
  const grandes = zona.filter(({ x }) => x[6]);
  return [iata.toUpperCase(), ...(grandes.length ? grandes : zona).slice(0, 3).map(({ x }) => x[0])].join(",");
}

/** Distancia en km entre dos aeropuertos, o null si alguno no está en los datos. */
export function distanciaAeropuertos(a: string, b: string): number | null {
  const x = coordenadasAeropuerto(a);
  const y = coordenadasAeropuerto(b);
  return x && y ? Math.round(distanciaKm(x.lat, x.lon, y.lat, y.lon)) : null;
}

const aCercano = ({ a, d }: { a: FilaAeropuerto; d: number }): AeropuertoCercano => ({
  iata: a[0],
  nombre: a[1],
  ciudad: a[2],
  distanciaKm: Math.round(d),
  ...(a[6] ? { internacional: true } : {}),
});

/** Aeropuertos con vuelos regulares más cercanos a un punto (hasta `max`, dentro de `radioKm`). */
export function aeropuertosCercanos(lat: number, lon: number, max = 3, radioKm = 250): AeropuertoCercano[] {
  return AEROPUERTOS.map((a) => ({ a, d: distanciaKm(lat, lon, a[4], a[5]) }))
    .filter(({ d }) => d <= radioKm)
    .sort((x, y) => x.d - y.d)
    .slice(0, max)
    .map(aCercano);
}

/**
 * Aeropuertos para una ciudad: primero los grandes (internacionales) a menos de 100 km, del más cercano al más lejano,
 * y después los demás hasta completar `max`. Así Nueva York muestra JFK, LaGuardia y Newark antes que Teterboro.
 * Si hay aeropuertos del mismo país, no se mezclan los de otro (Buenos Aires no muestra Montevideo).
 */
export function aeropuertosDeCiudad(lat: number, lon: number, pais?: string, max = 5): AeropuertoCercano[] {
  let lista = AEROPUERTOS.map((a) => ({ a, d: distanciaKm(lat, lon, a[4], a[5]) }))
    .filter(({ d }) => d <= 250)
    .sort((x, y) => x.d - y.d);
  if (pais && lista.some(({ a, d }) => a[3] === pais && d <= 150)) lista = lista.filter(({ a }) => a[3] === pais);
  const grandes = lista.filter(({ a, d }) => a[6] && d <= 100);
  const resto = lista.filter((x) => !grandes.includes(x));
  return [...grandes, ...resto].slice(0, max).map(aCercano);
}

/** Busca ciudades por nombre (en cualquier idioma con alfabeto latino) y les agrega sus aeropuertos cercanos. */
// Países: los que tienen ciudades en los datos, con su nombre en español e inglés para buscarlos.
const NOMBRES_PAIS = {
  es: new Intl.DisplayNames(["es"], { type: "region" }),
  en: new Intl.DisplayNames(["en"], { type: "region" }),
};
const PAISES = [...new Set(CIUDADES.map((c) => c[3]))].map((codigo) => ({
  codigo,
  nombres: [NOMBRES_PAIS.es.of(codigo), NOMBRES_PAIS.en.of(codigo)].filter((n): n is string => Boolean(n)).map(normalizar),
}));

function puntaje(nombre: string, q: string) {
  // Coincidencia exacta > empieza con > alguna palabra empieza con
  return nombre === q ? 3 : nombre.startsWith(q) ? 2 : nombre.includes(` ${q}`) ? 1 : -1;
}

/** Las ciudades más pobladas de un país que tienen aeropuerto cerca (sin repetir aeropuerto). */
export function ciudadesPrincipales(pais: string, max = 3): CiudadPrincipal[] {
  const res: CiudadPrincipal[] = [];
  const usados = new Set<string>();
  for (const c of CIUDADES) {
    if (c[3] !== pais) continue;
    const [aeropuerto] = aeropuertosCercanos(c[4], c[5], 1, 80);
    if (!aeropuerto || usados.has(aeropuerto.iata)) continue;
    usados.add(aeropuerto.iata);
    res.push({ ciudad: c[0], iata: aeropuerto.iata });
    if (res.length >= max) break;
  }
  return res;
}

/**
 * Busca ciudades por nombre (en cualquier idioma con alfabeto latino) y les agrega sus aeropuertos cercanos.
 * Con `incluirPaises`, también devuelve países (para el destino: si se elige un país se sugieren ciudades).
 */
export function buscarLugares(texto: string, max = 6, incluirPaises = false): Lugar[] {
  const q = normalizar(texto);
  if (q.length < 2) return [];

  const paises: Lugar[] = incluirPaises
    ? PAISES.map((p) => ({ p, puntaje: Math.max(...p.nombres.map((n) => puntaje(n, q))) }))
        .filter(({ puntaje }) => puntaje >= 2)
        .sort((x, y) => y.puntaje - x.puntaje)
        .slice(0, 2)
        .map(({ p }) => ({ tipo: "pais", ciudad: "", region: "", pais: p.codigo, aeropuertos: [], ciudades: ciudadesPrincipales(p.codigo) }))
    : [];

  const resultados: { c: FilaCiudad; nombre: string; puntaje: number }[] = [];
  for (const { c, nombres } of INDICE) {
    let mejor = -1;
    let nombreVisible = c[0];
    nombres.forEach((n, i) => {
      // El nombre propio de la ciudad pesa un poco más que sus nombres alternativos:
      // "Cancun" es Cancún (México), no Changchun (China), que lo tiene como transliteración.
      const base = puntaje(n, q);
      const p = base >= 0 && i < 2 ? base + 0.5 : base;
      if (p > mejor) {
        mejor = p;
        // Si coincidió con un nombre alternativo (ej. "Nueva York"), se muestra ese.
        nombreVisible = i >= 2 ? c[2][i - 2] : c[0];
      }
    });
    if (mejor >= 0) resultados.push({ c, nombre: nombreVisible, puntaje: mejor });
  }
  const ciudades: Lugar[] = resultados
    .sort((x, y) => y.puntaje - x.puntaje || y.c[6] - x.c[6])
    .slice(0, max - paises.length)
    .map(({ c, nombre }) => ({ tipo: "ciudad", ciudad: nombre, region: c[7], pais: c[3], aeropuertos: aeropuertosDeCiudad(c[4], c[5], c[3]) }));

  return [...paises, ...ciudades];
}
