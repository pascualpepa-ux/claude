export type Genero =
  | "plataformas" | "carreras" | "disparos" | "puzzles" | "defensa" | "parkour" | "deportes"
  | "estrategia" | "clics" | "roguelike" | "logica" | "ritmo" | "sandbox" | "simulacion"
  | "terror" | "multijugador" | "cartas" | "trivia" | "snake" | "corredores" | "arcade";

export const NOMBRE_GENERO: Record<Genero, string> = {
  plataformas: "Plataformas", carreras: "Carreras", disparos: "Disparos arcade", puzzles: "Puzzles",
  defensa: "Defensa de torres", parkour: "Parkour", deportes: "Deportes", estrategia: "Estrategia",
  clics: "Clics", roguelike: "Roguelike", logica: "Lógica", ritmo: "Ritmo", sandbox: "Sandbox",
  simulacion: "Simuladores", terror: "Terror suave", multijugador: "Multijugador local", cartas: "Cartas y mesa",
  trivia: "Trivia", snake: "Tipo snake", corredores: "Corredores infinitos", arcade: "Arcade",
};

export type Duracion = "corta" | "media" | "larga";
export const NOMBRE_DURACION: Record<Duracion, string> = { corta: "Menos de 5 min", media: "5 a 15 min", larga: "Más de 15 min" };

export type Multijugador = "no" | "local" | "online";

export interface ModoMotor {
  nombre: string;
  descripcion: string;
  duracion: Duracion;
  multijugador?: Multijugador;
}

/** Datos livianos de un motor (sin el código del juego, que se descarga al jugar). */
export interface MetaMotor {
  id: string;
  nombre: string;
  generos: Genero[];
  /** Núcleos de nombre: "Serpiente", "Víbora"... */
  cabezas: string[];
  /** Exactamente 3 modos */
  modos: [ModoMotor, ModoMotor, ModoMotor];
  /** Frases de descripción con {lugar}, {palabra}, {tema} */
  frases: string[];
  controles: string;
  controlesTactiles: string;
  movil: boolean;
  /** Variantes que aporta al catálogo (temas × dificultades × modos × mapas) */
  variantes?: number;
}

export interface Juego {
  id: string;
  motor: string;
  indice: number;
  orden: number;
  nombre: string;
  descripcion: string;
  tema: string;
  dificultad: number; // 0..4
  modo: number; // 0..2
  mapa: number; // 0..5
  semilla: number;
  velocidad: number;
  generos: Genero[];
  duracion: Duracion;
  multijugador: Multijugador;
  movil: boolean;
  partidas: number;
  estrellas: number;
  lanzamiento: string; // YYYY-MM-DD
}

export const DIFICULTADES = ["Fácil", "Normal", "Difícil", "Experto", "Pesadilla"] as const;
export const MULT_DIFICULTAD = [0.72, 1, 1.25, 1.5, 1.85];
