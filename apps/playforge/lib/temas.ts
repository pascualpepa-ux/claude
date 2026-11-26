/**
 * Temáticas visuales. Cada variante de juego usa una: cambia colores, ambiente,
 * nombres y descripciones. Agregar una temática acá multiplica el catálogo.
 */
export type Ambiente = "estrellas" | "burbujas" | "nieve" | "brasas" | "hojas" | "lluvia" | "pixeles" | "luciernagas" | "polvo" | "niebla";

export interface Tema {
  id: string;
  nombre: string;
  fondo: string; // color de fondo base
  fondo2: string; // segundo color del degradé
  primario: string;
  secundario: string;
  acento: string;
  peligro: string;
  texto: string;
  ambiente: Ambiente;
  /** Palabras para armar nombres de juegos */
  palabras: string[];
  lugares: string[];
  /** Escala musical (semitonos sobre la tónica) */
  escala: number[];
  tonica: number; // Hz
}

const MAYOR = [0, 2, 4, 5, 7, 9, 11];
const MENOR = [0, 2, 3, 5, 7, 8, 10];
const PENTA = [0, 2, 4, 7, 9];
const DORICO = [0, 2, 3, 5, 7, 9, 10];
const FRIGIO = [0, 1, 3, 5, 7, 8, 10];

export const TEMAS: Tema[] = [
  { id: "neon", nombre: "Neón", fondo: "#0b0221", fondo2: "#2a0a4a", primario: "#00f0ff", secundario: "#ff2bd6", acento: "#f8ff3a", peligro: "#ff3860", texto: "#f5f3ff", ambiente: "pixeles", palabras: ["Neón", "Láser", "Voltio", "Pulso", "Cromo"], lugares: ["Ciudad Neón", "la Red", "Sector 9", "el Circuito"], escala: MENOR, tonica: 220 },
  { id: "selva", nombre: "Selva", fondo: "#06210f", fondo2: "#0f3d1f", primario: "#7cf27c", secundario: "#ffb020", acento: "#ff6b3d", peligro: "#e0303a", texto: "#ecfff0", ambiente: "luciernagas", palabras: ["Jungla", "Liana", "Jaguar", "Tucán", "Esmeralda"], lugares: ["la Selva Perdida", "el Templo Verde", "el Río Salvaje", "la Cascada"], escala: PENTA, tonica: 196 },
  { id: "oceano", nombre: "Océano", fondo: "#021b33", fondo2: "#04406b", primario: "#4fd8ff", secundario: "#ffd166", acento: "#ff8fab", peligro: "#ff4d6d", texto: "#e6f9ff", ambiente: "burbujas", palabras: ["Coral", "Marea", "Abisal", "Perla", "Tiburón"], lugares: ["el Arrecife", "la Fosa Abisal", "la Bahía", "Atlántida"], escala: MAYOR, tonica: 233 },
  { id: "volcan", nombre: "Volcán", fondo: "#1a0505", fondo2: "#4a0e05", primario: "#ff7a1a", secundario: "#ffd23f", acento: "#ff3d3d", peligro: "#ff1f5a", texto: "#fff1e6", ambiente: "brasas", palabras: ["Magma", "Ígneo", "Ceniza", "Lava", "Infierno"], lugares: ["el Volcán", "la Forja", "el Cráter", "las Tierras Ardientes"], escala: FRIGIO, tonica: 174 },
  { id: "hielo", nombre: "Hielo", fondo: "#06182b", fondo2: "#123a5c", primario: "#a8e9ff", secundario: "#ffffff", acento: "#7c9cff", peligro: "#ff5c8a", texto: "#f0fbff", ambiente: "nieve", palabras: ["Glacial", "Escarcha", "Polar", "Cristal", "Ártico"], lugares: ["el Polo", "la Cumbre Helada", "el Glaciar", "la Tundra"], escala: DORICO, tonica: 246 },
  { id: "desierto", nombre: "Desierto", fondo: "#2b1607", fondo2: "#6b3a12", primario: "#ffc857", secundario: "#e9724c", acento: "#5bc0be", peligro: "#c5283d", texto: "#fff6e5", ambiente: "polvo", palabras: ["Duna", "Faraón", "Escarabajo", "Oasis", "Sol"], lugares: ["las Dunas", "la Pirámide", "el Oasis", "el Cañón"], escala: FRIGIO, tonica: 207 },
  { id: "espacio", nombre: "Espacio", fondo: "#03030f", fondo2: "#12123a", primario: "#8a7dff", secundario: "#4dfff3", acento: "#ffe066", peligro: "#ff4f6e", texto: "#eef0ff", ambiente: "estrellas", palabras: ["Galáctico", "Nebulosa", "Cometa", "Orbital", "Estelar"], lugares: ["la Galaxia", "la Luna", "Marte", "el Cinturón de Asteroides"], escala: DORICO, tonica: 185 },
  { id: "caramelo", nombre: "Caramelo", fondo: "#2a0b2e", fondo2: "#5c1a5e", primario: "#ff8ad8", secundario: "#7df9ff", acento: "#ffe45e", peligro: "#ff4b4b", texto: "#fff0fb", ambiente: "burbujas", palabras: ["Caramelo", "Chicle", "Gomita", "Algodón", "Azúcar"], lugares: ["Villa Dulce", "la Fábrica de Caramelos", "el Reino Golosina", "Isla Chicle"], escala: MAYOR, tonica: 262 },
  { id: "retro", nombre: "Retro", fondo: "#111111", fondo2: "#2b2b2b", primario: "#39ff14", secundario: "#ffcc00", acento: "#ff6ec7", peligro: "#ff3b30", texto: "#f2f2f2", ambiente: "pixeles", palabras: ["Retro", "8 Bits", "Arcade", "Píxel", "Clásico"], lugares: ["el Arcade", "la Consola", "1985", "el Salón de Juegos"], escala: PENTA, tonica: 220 },
  { id: "otono", nombre: "Bosque Otoñal", fondo: "#1f0f06", fondo2: "#4a2410", primario: "#ff9f43", secundario: "#feca57", acento: "#48dbfb", peligro: "#ee5253", texto: "#fff4e6", ambiente: "hojas", palabras: ["Otoño", "Roble", "Ardilla", "Cosecha", "Hojarasca"], lugares: ["el Bosque", "la Cabaña", "el Valle Dorado", "el Sendero"], escala: MAYOR, tonica: 196 },
  { id: "cyber", nombre: "Cyberpunk", fondo: "#0a0014", fondo2: "#1d0233", primario: "#fcee0a", secundario: "#00e5ff", acento: "#ff003c", peligro: "#ff003c", texto: "#f0f0ff", ambiente: "lluvia", palabras: ["Cyber", "Hacker", "Androide", "Glitch", "Turbo"], lugares: ["Neo-Tokio", "el Distrito 2077", "la Megaurbe", "el Mercado Negro"], escala: MENOR, tonica: 196 },
  { id: "terror", nombre: "Noche de Terror", fondo: "#07070a", fondo2: "#1c1424", primario: "#b8ff5c", secundario: "#a78bfa", acento: "#ff9f1c", peligro: "#ff2e2e", texto: "#ecebf5", ambiente: "niebla", palabras: ["Sombra", "Fantasma", "Calabaza", "Cripta", "Murciélago"], lugares: ["la Mansión Embrujada", "el Cementerio", "el Bosque Oscuro", "la Cripta"], escala: FRIGIO, tonica: 165 },
];

export const temaPorId = (id: string) => TEMAS.find((t) => t.id === id) ?? TEMAS[0];

/** Mezcla un color hex con otro (t=0 → a, t=1 → b). */
export function mezclarColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
  const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
  const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
}

export function conAlfa(hex: string, alfa: number): string {
  const p = parseInt(hex.slice(1), 16);
  return `rgba(${(p >> 16) & 255},${(p >> 8) & 255},${p & 255},${alfa})`;
}
