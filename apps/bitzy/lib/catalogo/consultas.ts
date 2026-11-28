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

/**
 * Clave fonética simple (español + inglés pronunciado a la criolla): «heat» y «hit»,
 * «carro» y «karro», «velocidad» y «belosidad» dan la misma clave. Sirve para
 * encontrar juegos aunque el nombre esté mal escrito.
 */
export function clave(palabra: string): string {
  return normalizar(palabra)
    .replace(/[^a-z0-9ñ]/g, "")
    .replace(/ee|ea|ie(?=[^nr]|$)/g, "i").replace(/oo|ou/g, "u")
    .replace(/ph/g, "f").replace(/th/g, "t").replace(/ck|qu|c(?=[aou])|q/g, "k").replace(/c(?=[ei])|z/g, "s")
    .replace(/v/g, "b").replace(/ll|y(?=[aeiou])/g, "y").replace(/w/g, "u").replace(/j/g, "h").replace(/y$/, "i").replace(/h/g, "")
    .replace(/(.)\1+/g, "$1");
}

/** Sinónimos: la gente busca «autos» o «carros» y el género se llama «coches». */
const SINONIMOS: Record<string, string> = {
  auto: "coches", autos: "coches", carro: "coches", carros: "coches", coche: "coches", car: "coches", cars: "coches", policia: "fuga", policias: "fuga", persecucion: "fuga",
  nave: "naves", espacial: "naves", disparo: "disparos", tiros: "disparos", vibora: "serpiente", snake: "serpiente", musica: "ritmo", baile: "ritmo",
  futbol: "hockey", deporte: "deportes", rompecabezas: "puzzles", puzle: "puzzles", joyas: "gemas", torres: "defensa", ladrillos: "rompebloques", saltos: "plataformas", correr: "corredor", estacionamiento: "estaciona", parking: "estaciona", miedo: "terror",
};

function distancia(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let minFila = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      minFila = Math.min(minFila, cur[j]);
    }
    if (minFila > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

interface Indice { texto: string; claves: string[] }
const indiceTexto = new WeakMap<Juego, Indice>();
function indiceDe(j: Juego): Indice {
  let t = indiceTexto.get(j);
  if (!t) {
    const motor = MOTORES.find((m) => m.id === j.motor);
    const texto = normalizar(`${j.nombre} ${motor?.nombre ?? ""} ${j.generos.map((g) => NOMBRE_GENERO[g]).join(" ")} ${j.tema} ${motor?.modos[j.modo].nombre ?? ""} ${motor?.id ?? ""}`);
    t = { texto, claves: [...new Set(texto.split(/[^a-z0-9ñ]+/).filter(Boolean).map(clave))] };
    indiceTexto.set(j, t);
  }
  return t;
}

/** ¿La palabra buscada aparece en el juego? Exacta, por sonido o con un error de tipeo. */
function coincide(j: Juego, palabra: string, k: string): number {
  const ix = indiceDe(j);
  if (ix.texto.includes(palabra)) return 3;
  if (k.length >= 2 && ix.claves.some((c) => c.startsWith(k))) return 2;
  if (k.length >= 4) { const max = k.length >= 7 ? 2 : 1; if (ix.claves.some((c) => distancia(c.slice(0, k.length + 1), k, max) <= max || distancia(c, k, max) <= max)) return 1; }
  return 0;
}

/** Popularidad reciente: partidas ponderadas por lo nuevo que es el juego. */
export function puntajeTendencia(j: Juego, hoy = hoyUTC()): number {
  const dias = Math.max(1, (Date.parse(hoy) - Date.parse(j.lanzamiento)) / 86_400_000);
  const ruido = (hashTexto(`${j.id}:${hoy}`) % 1000) / 1000; // rota un poco cada día
  return (j.partidas * (0.6 + ruido)) / Math.pow(dias + 7, 0.7);
}

export function buscar(f: Filtros, hoy = hoyUTC()): Juego[] {
  const palabras = f.q ? normalizar(f.q).split(/[^a-z0-9ñ]+/).filter(Boolean).flatMap((p) => (SINONIMOS[p] ? SINONIMOS[p].split(" ") : [p])) : [];
  const claves = palabras.map(clave);
  const puntaje = new Map<Juego, number>();
  let lista = catalogo().filter((j) => {
    if (j.lanzamiento > hoy) return false;
    if (f.motor && j.motor !== f.motor) return false;
    if (f.genero && !j.generos.includes(f.genero)) return false;
    if (f.duracion && j.duracion !== f.duracion) return false;
    if (f.dificultad != null && j.dificultad !== f.dificultad) return false;
    if (f.multijugador && j.multijugador === "no") return false;
    if (f.movil && !j.movil) return false;
    if (palabras.length) {
      let total = 0;
      for (let i = 0; i < palabras.length; i++) { const c = coincide(j, palabras[i], claves[i]); if (!c) return false; total += c; }
      puntaje.set(j, total);
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
      return (puntaje.get(b) ?? 0) - (puntaje.get(a) ?? 0) || pb - pa || b.partidas - a.partidas;
    });
  }
  return lista;
}

export function publicados(hoy = hoyUTC()): Juego[] {
  return catalogo().filter((j) => j.lanzamiento <= hoy);
}

/** Evita que una fila quede llena de un solo tipo de juego: como máximo `max` por motor. */
export function diversificar(lista: Juego[], n: number, max = 2): Juego[] {
  // Rondas: primero uno de cada motor, después un segundo de cada uno, etc.
  const cuenta = new Map<string, number>();
  const usados = new Set<Juego>();
  const res: Juego[] = [];
  for (let tope = 1; tope <= max && res.length < n; tope++) {
    for (const j of lista) {
      if (res.length >= n) break;
      if (usados.has(j) || (cuenta.get(j.motor) ?? 0) >= tope) continue;
      cuenta.set(j.motor, (cuenta.get(j.motor) ?? 0) + 1);
      usados.add(j);
      res.push(j);
    }
  }
  return res;
}

export function tendencias(n = 18, hoy = hoyUTC()): Juego[] {
  return diversificar([...publicados(hoy)].sort((a, b) => puntajeTendencia(b, hoy) - puntajeTendencia(a, hoy)), n);
}

export function masJugados(n = 18): Juego[] {
  return diversificar([...publicados()].sort((a, b) => b.partidas - a.partidas), n, 3);
}

export function nuevos(n = 18, hoy = hoyUTC()): Juego[] {
  return diversificar(buscar({ orden: "nuevo" }, hoy), n);
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

/** Juego destacado de la portada: rota cada día entre TODOS los motores (uno distinto por día). */
export function destacado(fecha = hoyUTC()): Juego {
  const dia = Math.floor(Date.parse(fecha) / 86_400_000);
  const motor = MOTORES[dia % MOTORES.length].id;
  const top = [...publicados(fecha)].filter((j) => j.motor === motor && j.estrellas >= 4.2).sort((a, b) => b.partidas - a.partidas).slice(0, 60);
  return top[hashTexto(`destacado:${fecha}`) % top.length];
}

/** Una mezcla variada: un juego bien valorado de cada motor, en orden rotativo. */
export function variados(n = 18, semilla = hoyUTC()): Juego[] {
  const lista: Juego[] = [];
  const motores = [...MOTORES].sort((a, b) => hashTexto(semilla + a.id) - hashTexto(semilla + b.id));
  for (let ronda = 0; lista.length < n && ronda < 5; ronda++) for (const m of motores) {
    const top = buscar({ motor: m.id, orden: "puntuacion" });
    const j = top[(hashTexto(semilla + m.id) + ronda * 7) % Math.min(60, top.length)];
    if (j && lista.length < n) lista.push(j);
  }
  return lista;
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
