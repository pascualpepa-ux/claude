import { hashTexto } from "../rng";
import { normalizar, hoyUTC } from "../texto";
import { catalogo, juegoPorId } from "./generador";
import { MOTORES } from "./motores";
import { NOMBRE_GENERO, type Duracion, type Genero, type Juego } from "./tipos";

export type Orden = "popular" | "nuevo" | "puntuacion" | "relevancia";

export interface Filtros {
  q?: string;
  genero?: Genero | "";
  duracion?: Duracion | "";
  dificultad?: number | null;
  multijugador?: boolean;
  movil?: boolean;
  orden?: Orden;
  motor?: string;
}

const indiceTexto = new WeakMap<Juego, string>();
function textoDe(j: Juego): string {
  let t = indiceTexto.get(j);
  if (!t) {
    const motor = MOTORES.find((m) => m.id === j.motor);
    t = normalizar(`${j.nombre} ${motor?.nombre ?? ""} ${j.generos.map((g) => NOMBRE_GENERO[g]).join(" ")} ${j.tema} ${motor?.modos[j.modo].nombre ?? ""}`);
    indiceTexto.set(j, t);
  }
  return t;
}

/** Popularidad reciente: partidas ponderadas por lo nuevo que es el juego. */
export function puntajeTendencia(j: Juego, hoy = hoyUTC()): number {
  const dias = Math.max(1, (Date.parse(hoy) - Date.parse(j.lanzamiento)) / 86_400_000);
  const ruido = (hashTexto(`${j.id}:${hoy}`) % 1000) / 1000; // rota un poco cada día
  return (j.partidas * (0.6 + ruido)) / Math.pow(dias + 7, 0.7);
}

export function buscar(f: Filtros, hoy = hoyUTC()): Juego[] {
  const palabras = f.q ? normalizar(f.q).split(/\s+/).filter(Boolean) : [];
  let lista = catalogo().filter((j) => {
    if (j.lanzamiento > hoy) return false;
    if (f.motor && j.motor !== f.motor) return false;
    if (f.genero && !j.generos.includes(f.genero)) return false;
    if (f.duracion && j.duracion !== f.duracion) return false;
    if (f.dificultad != null && j.dificultad !== f.dificultad) return false;
    if (f.multijugador && j.multijugador === "no") return false;
    if (f.movil && !j.movil) return false;
    if (palabras.length) {
      const t = textoDe(j);
      return palabras.every((p) => t.includes(p));
    }
    return true;
  });
  const orden = f.orden ?? (palabras.length ? "relevancia" : "popular");
  if (orden === "popular") lista = [...lista].sort((a, b) => b.partidas - a.partidas);
  else if (orden === "nuevo") lista = [...lista].sort((a, b) => b.lanzamiento.localeCompare(a.lanzamiento) || b.orden - a.orden);
  else if (orden === "puntuacion") lista = [...lista].sort((a, b) => b.estrellas - a.estrellas || b.partidas - a.partidas);
  else if (palabras.length) {
    const q = normalizar(f.q ?? "");
    lista = [...lista].sort((a, b) => {
      const pa = normalizar(a.nombre).startsWith(q) ? 1 : 0;
      const pb = normalizar(b.nombre).startsWith(q) ? 1 : 0;
      return pb - pa || b.partidas - a.partidas;
    });
  }
  return lista;
}

export function publicados(hoy = hoyUTC()): Juego[] {
  return catalogo().filter((j) => j.lanzamiento <= hoy);
}

export function tendencias(n = 18, hoy = hoyUTC()): Juego[] {
  return [...publicados(hoy)].sort((a, b) => puntajeTendencia(b, hoy) - puntajeTendencia(a, hoy)).slice(0, n);
}

export function masJugados(n = 18): Juego[] {
  return [...publicados()].sort((a, b) => b.partidas - a.partidas).slice(0, n);
}

export function nuevos(n = 18, hoy = hoyUTC()): Juego[] {
  return buscar({ orden: "nuevo" }, hoy).slice(0, n);
}

/** Mejor valorados de un género, variando motores. */
export function porGenero(g: Genero, n = 18): Juego[] {
  const lista = buscar({ genero: g, orden: "puntuacion" });
  const vistos = new Map<string, number>();
  const res: Juego[] = [];
  for (const j of lista) {
    const c = vistos.get(j.motor) ?? 0;
    if (c >= Math.ceil(n / 2)) continue;
    vistos.set(j.motor, c + 1);
    res.push(j);
    if (res.length >= n) break;
  }
  return res;
}

/** Desafío del día: el mismo juego para todos, cambia a las 00:00 UTC. */
export function desafioDelDia(fecha = hoyUTC()): Juego {
  const lista = publicados(fecha).filter((j) => j.multijugador === "no");
  return lista[hashTexto(`desafio:${fecha}`) % lista.length];
}

/** Juego destacado de la portada: rota cada día y siempre es un juego de coches bien valorado. */
export function destacado(fecha = hoyUTC()): Juego {
  const top = [...publicados(fecha)].filter((j) => j.generos.includes("coches") && j.estrellas >= 4.3).sort((a, b) => b.partidas - a.partidas).slice(0, 200);
  return top[hashTexto(`destacado:${fecha}`) % top.length];
}

export const MOTORES_COCHES = MOTORES.filter((m) => m.generos.includes("coches")).map((m) => m.id);

/** Juegos de coches: mezcla los motores de coches, priorizando los mejor valorados. */
export function coches(n = 18, orden: Orden = "puntuacion", motor?: string): Juego[] {
  const lista = buscar({ genero: "coches", orden, motor });
  if (motor) return lista.slice(0, n);
  const porMotor = MOTORES_COCHES.map((id) => lista.filter((j) => j.motor === id));
  const res: Juego[] = [];
  for (let i = 0; res.length < n && i < 500; i++) for (const l of porMotor) if (l[i] && res.length < n) res.push(l[i]);
  return res;
}

/** Desafío de coches del día (distinto del desafío general). */
export function desafioCoches(fecha = hoyUTC()): Juego {
  const lista = publicados(fecha).filter((j) => j.generos.includes("coches") && j.multijugador === "no");
  return lista[hashTexto(`coches:${fecha}`) % lista.length];
}

export function similares(j: Juego, n = 12): Juego[] {
  const r: Juego[] = [];
  const mismos = catalogo().filter((x) => x.motor === j.motor && x.id !== j.id && x.lanzamiento <= hoyUTC());
  const h = hashTexto(j.id);
  for (let i = 0; i < Math.ceil(n / 2) && mismos.length; i++) r.push(mismos[(h + i * 131) % mismos.length]);
  const otros = buscar({ genero: j.generos[0], orden: "puntuacion" }).filter((x) => x.motor !== j.motor);
  for (let i = 0; r.length < n && i < otros.length; i++) r.push(otros[(h + i * 17) % otros.length]);
  return [...new Map(r.map((x) => [x.id, x])).values()].slice(0, n);
}

export function azar(): Juego {
  const lista = publicados();
  return lista[Math.floor(Math.random() * lista.length)];
}

export { juegoPorId };
