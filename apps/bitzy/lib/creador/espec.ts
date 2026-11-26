/** Especificación de un juego del Creador (lo que la IA local modifica charlando). */
export type GeneroCreador = "esquivar" | "disparos" | "plataformas" | "atrapar";
export type FormaJugador = "nave" | "auto" | "personaje" | "pelota" | "pez" | "dragon";

export interface EspecJuego {
  titulo: string;
  descripcion: string;
  genero: GeneroCreador;
  jugador: FormaJugador;
  estilo: string; // id de temática (lib/temas.ts)
  velocidadJugador: number; // 0.5 .. 2.5
  velocidadJuego: number; // 0.5 .. 2.5
  dificultad: number; // 1 .. 5
  enemigos: boolean;
  jefe: boolean;
  monedas: boolean;
  musica: boolean;
  dosJugadores: boolean;
  vidas: number;
  niveles: number;
  obstaculo: string; // nombre visible: "meteoritos", "rocas"...
  objeto: string; // "monedas", "estrellas"...
  colorJugador?: string;
}

export const ESPEC_BASE: EspecJuego = {
  titulo: "Mi juego",
  descripcion: "Un juego hecho con el Creador de Bitzy.",
  genero: "esquivar",
  jugador: "nave",
  estilo: "espacio",
  velocidadJugador: 1,
  velocidadJuego: 1,
  dificultad: 2,
  enemigos: false,
  jefe: false,
  monedas: true,
  musica: true,
  dosJugadores: false,
  vidas: 3,
  niveles: 4,
  obstaculo: "meteoritos",
  objeto: "monedas",
};

export interface PlantillaCreador { id: string; nombre: string; emoji: string; prompt: string; espec: EspecJuego }

export const PLANTILLAS: PlantillaCreador[] = [
  { id: "naves", nombre: "Naves y meteoritos", emoji: "🚀", prompt: "Un juego de naves donde esquivo meteoritos y junto monedas", espec: { ...ESPEC_BASE, titulo: "Lluvia de Meteoritos", descripcion: "Pilotá tu nave entre meteoritos y juntá todas las monedas que puedas.", genero: "esquivar", jugador: "nave", estilo: "espacio" } },
  { id: "invasores", nombre: "Invasión galáctica", emoji: "👾", prompt: "Un shooter donde disparo a oleadas de aliens con un jefe final", espec: { ...ESPEC_BASE, titulo: "Invasión Galáctica", descripcion: "Disparale a las oleadas alienígenas y derrotá al jefe final.", genero: "disparos", jugador: "nave", estilo: "neon", enemigos: true, jefe: true, obstaculo: "asteroides", objeto: "cristales" } },
  { id: "saltos", nombre: "Saltos en la selva", emoji: "🐒", prompt: "Un juego de saltar plataformas en la selva juntando frutas", espec: { ...ESPEC_BASE, titulo: "Salto Selvático", descripcion: "Saltá de plataforma en plataforma y juntá frutas sin caerte.", genero: "plataformas", jugador: "personaje", estilo: "selva", obstaculo: "troncos", objeto: "frutas" } },
  { id: "atrapa", nombre: "Atrapá los dulces", emoji: "🍬", prompt: "Un juego de atrapar caramelos que caen y esquivar bombas", espec: { ...ESPEC_BASE, titulo: "Lluvia de Caramelos", descripcion: "Atrapá los caramelos que caen y esquivá las bombas.", genero: "atrapar", jugador: "pelota", estilo: "caramelo", obstaculo: "bombas", objeto: "caramelos" } },
  { id: "carretera", nombre: "Ruta peligrosa", emoji: "🏎️", prompt: "Un juego de autos esquivando tráfico en una ruta de noche", espec: { ...ESPEC_BASE, titulo: "Ruta Nocturna", descripcion: "Esquivá el tráfico a toda velocidad por la ruta de noche.", genero: "esquivar", jugador: "auto", estilo: "cyber", obstaculo: "autos", objeto: "bidones de nafta" } },
  { id: "policia", nombre: "Persecución policial", emoji: "🚓", prompt: "Un juego de autos donde escapo de la policía esquivando patrulleros", espec: { ...ESPEC_BASE, titulo: "Escape a Toda Velocidad", descripcion: "Escapá de la policía esquivando patrulleros y juntá bidones de nafta.", genero: "esquivar", jugador: "auto", estilo: "neon", enemigos: true, velocidadJuego: 1.3, obstaculo: "patrulleros", objeto: "bidones de nafta" } },
  { id: "terror", nombre: "Fantasmas", emoji: "👻", prompt: "Un juego de terror suave donde escapo de fantasmas en una mansión", espec: { ...ESPEC_BASE, titulo: "Mansión Embrujada", descripcion: "Escapá de los fantasmas y juntá las velas de la mansión.", genero: "esquivar", jugador: "personaje", estilo: "terror", enemigos: true, obstaculo: "calaveras", objeto: "velas" } },
];
