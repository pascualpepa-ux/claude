import type { Rng } from "@/lib/rng";
import type { Tema } from "@/lib/temas";
import type { Entrada } from "./entrada";
import type { Sonido } from "./audio";
import type { Particulas } from "./dibujo";

/** Esquema de controles táctiles que muestra el reproductor en celulares. */
export type EsquemaTactil =
  | "cruceta" // 4 direcciones + botón A
  | "lados-salto" // izquierda/derecha + salto (A)
  | "lados" // izquierda/derecha + A + B
  | "puntero" // el juego usa toques/arrastres directos sobre el lienzo
  | "deslizar" // deslizar = direcciones, tocar = A
  | "toque"; // tocar en cualquier lado = A, deslizar abajo = abajo

export interface ParametrosVariante {
  id: string;
  semilla: number;
  tema: Tema;
  dificultad: number; // 0..4
  mult: number; // multiplicador de dificultad
  modo: number; // 0..2
  mapa: number; // 0..5
  velocidad: number;
}

export interface DatoHud {
  etiqueta: string;
  valor: string | number;
}

export interface ApiJuego {
  /** Tamaño lógico del lienzo (lo fija el motor) */
  readonly W: number;
  readonly H: number;
  readonly p: ParametrosVariante;
  readonly tema: Tema;
  /** RNG determinístico: misma variante → misma partida */
  readonly rng: Rng;
  readonly entrada: Entrada;
  readonly sonido: Sonido;
  readonly particulas: Particulas;
  /** Segundos desde que empezó la partida (sin contar pausas) */
  readonly tiempo: number;
  readonly puntos: number;
  sumar(n: number, x?: number, y?: number): void;
  fijarPuntos(n: number): void;
  hud(datos: DatoHud[]): void;
  aviso(texto: string, color?: string): void;
  temblor(fuerza: number): void;
  fin(r: { gano: boolean; mensaje?: string }): void;
}

export interface Juego {
  actualizar(dt: number): void;
  dibujar(g: CanvasRenderingContext2D): void;
}

export interface ModuloMotor {
  ancho: number;
  alto: number;
  tactil: EsquemaTactil;
  /** Si el modo es de 2 jugadores, el teclado se reparte (WASD = J2, flechas = J1) */
  dosJugadores?: (modo: number) => boolean;
  /** El motor maneja su propia música (juegos de ritmo) */
  musicaPropia?: boolean;
  crear(api: ApiJuego): Juego;
}
