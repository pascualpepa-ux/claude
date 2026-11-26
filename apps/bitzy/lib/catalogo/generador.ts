import { crearRng, elegir, hashTexto } from "../rng";
import { TEMAS, temaPorId } from "../temas";
import { normalizar, sumarDias } from "../texto";
import { MOTORES, motorPorId } from "./motores";
import { DIFICULTADES, type Genero, type Juego, type MetaMotor } from "./tipos";

/** Ejes de variación: cada combinación es un juego distinto. */
export const EJES = { temas: TEMAS.length, dificultades: 5, modos: 3, mapas: 6 } as const;
export const VARIANTES_POR_MOTOR = EJES.temas * EJES.dificultades * EJES.modos * EJES.mapas; // 1.080
const PRIMO = 7919; // coprimo con 1.080: recorre todas las combinaciones sin repetir

/** Fecha en la que cada motor empezó a publicar variantes (los nuevos motores se suman después). */
const ESTRENO_BASE = "2025-01-06";
const DIAS_PUBLICACION = 320;

const SUBTITULOS = [
  "Turbo", "Deluxe", "Extremo", "Infinito", "Legendario", "Supremo", "Remix", "Mega", "Ultra", "Cero",
  "Reloaded", "Origen", "Furia", "Eclipse", "Prime", "Rush", "Max", "Zen", "Caos", "Fénix", "Titán",
  "Nova", "Hiper", "Dorado", "Salvaje", "Eterno", "Rebelde", "Arcano", "Atómico", "Clásico",
];
const NUMERALES = ["", " II", " III", " IV", " V", " VI", " VII", " VIII", " IX", " X", " XI", " XII"];

const cachePorMotor = new Map<string, Juego[]>();

function rellenar(frase: string, tema: (typeof TEMAS)[number], rng: () => number): string {
  return frase
    .replace("{lugar}", elegir(rng, tema.lugares))
    .replace("{palabra}", `de estilo ${tema.nombre.toLowerCase()}`)
    .replace("{tema}", tema.nombre.toLowerCase());
}

function crearVariante(motor: MetaMotor, posMotor: number, k: number): Omit<Juego, "nombre" | "orden"> & { nombreBase: string } {
  const total = motor.variantes ?? VARIANTES_POR_MOTOR;
  const desfase = hashTexto(motor.id) % total;
  const p = (k * PRIMO + desfase) % total;
  const tema = TEMAS[p % EJES.temas];
  const dificultad = Math.floor(p / EJES.temas) % EJES.dificultades;
  const modo = Math.floor(p / (EJES.temas * EJES.dificultades)) % EJES.modos;
  const mapa = Math.floor(p / (EJES.temas * EJES.dificultades * EJES.modos)) % EJES.mapas;
  const semilla = hashTexto(`${motor.id}:${k}`);
  const rng = crearRng(semilla);

  const cabeza = elegir(rng, motor.cabezas);
  const palabra = elegir(rng, tema.palabras);
  const lugar = elegir(rng, tema.lugares);
  const forma = Math.floor(rng() * 4);
  const sub = elegir(rng, SUBTITULOS);
  const nombreBase =
    forma === 0 ? `${cabeza} ${palabra}` :
    forma === 1 ? `${cabeza} en ${lugar}` :
    forma === 2 ? `${cabeza} ${palabra}: ${sub}` :
    `${palabra} ${sub}: ${cabeza}`;

  const modoInfo = motor.modos[modo];
  const descripcion = [
    rellenar(elegir(rng, motor.frases), tema, rng),
    modoInfo.descripcion,
    `Dificultad ${DIFICULTADES[dificultad].toLowerCase()}, temática ${tema.nombre.toLowerCase()} y mapa ${mapa + 1} de 6.`,
  ].join(" ");

  const velocidad = Math.round([0.9, 1, 1.05, 1.1, 1.2, 0.95][mapa] * (0.95 + rng() * 0.1) * 100) / 100;
  // Popularidad simulada estable (se suma a las partidas reales registradas).
  const partidas = Math.round(Math.exp(3.5 + rng() * 7.2 + (modo === 0 ? 0.6 : 0)));
  const estrellas = Math.round((3.4 + rng() * 1.5 - dificultad * 0.05) * 10) / 10;
  const estreno = sumarDias(ESTRENO_BASE, posMotor * 21);
  const lanzamiento = sumarDias(estreno, Math.floor((k / total) * DIAS_PUBLICACION));

  const generos: Genero[] = [...motor.generos];
  if (modoInfo.multijugador && modoInfo.multijugador !== "no" && !generos.includes("multijugador")) generos.push("multijugador");
  if (tema.id === "terror" && !generos.includes("terror")) generos.push("terror");

  return {
    id: `${motor.id}-${k}`,
    motor: motor.id,
    indice: k,
    descripcion,
    tema: tema.id,
    dificultad,
    modo,
    mapa,
    semilla,
    velocidad,
    generos,
    duracion: modoInfo.duracion,
    multijugador: modoInfo.multijugador ?? "no",
    movil: motor.movil,
    partidas,
    estrellas: Math.min(5, estrellas),
    lanzamiento,
    nombreBase,
  };
}

/** Todas las variantes de un motor, con nombres únicos dentro del motor. */
export function variantesDe(motorId: string): Juego[] {
  const enCache = cachePorMotor.get(motorId);
  if (enCache) return enCache;
  const pos = MOTORES.findIndex((m) => m.id === motorId);
  const motor = MOTORES[pos];
  if (!motor) return [];
  const total = motor.variantes ?? VARIANTES_POR_MOTOR;
  const usados = new Map<string, number>();
  const lista: Juego[] = [];
  for (let k = 0; k < total; k++) {
    const { nombreBase, ...v } = crearVariante(motor, pos, k);
    const clave = normalizar(nombreBase);
    const n = usados.get(clave) ?? 0;
    usados.set(clave, n + 1);
    const nombre = nombreBase + (NUMERALES[n] ?? ` ${n + 1}`);
    lista.push({ ...v, nombre, orden: 0 });
  }
  cachePorMotor.set(motorId, lista);
  return lista;
}

let cacheCatalogo: Juego[] | null = null;

/** Catálogo completo, intercalando motores para que el orden por defecto sea variado. */
export function catalogo(): Juego[] {
  if (cacheCatalogo) return cacheCatalogo;
  const listas = MOTORES.map((m) => variantesDe(m.id));
  const max = Math.max(...listas.map((l) => l.length));
  const todo: Juego[] = [];
  for (let k = 0; k < max; k++) {
    for (const l of listas) if (k < l.length) todo.push({ ...l[k], orden: todo.length });
  }
  cacheCatalogo = todo;
  return todo;
}

export function totalJuegos(): number {
  return MOTORES.reduce((s, m) => s + (m.variantes ?? VARIANTES_POR_MOTOR), 0);
}

/** Busca un juego por id ("serpiente-42") sin generar todo el catálogo. */
export function juegoPorId(id: string): Juego | undefined {
  const m = /^([a-z0-9]+)-(\d+)$/.exec(id);
  if (!m || !motorPorId(m[1])) return undefined;
  return variantesDe(m[1])[Number(m[2])];
}

export function temaDe(j: Juego) {
  return temaPorId(j.tema);
}
