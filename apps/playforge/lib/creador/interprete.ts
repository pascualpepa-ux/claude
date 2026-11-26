import { normalizar } from "../texto";
import { TEMAS } from "../temas";
import { ESPEC_BASE, type EspecJuego } from "./espec";

/**
 * "IA local": entiende pedidos comunes en español y modifica la especificación.
 * Se usa cuando no hay clave de API o como respaldo si la IA remota falla.
 */
const ESTILOS: [RegExp, string][] = [
  [/neon|fluo/, "neon"], [/retro|8 ?bits|pixel|arcade/, "retro"], [/pastel|caramelo|dulce|rosa/, "caramelo"],
  [/selva|jungla/, "selva"], [/oceano|mar\b|agua|submarin/, "oceano"], [/volcan|lava|fuego/, "volcan"],
  [/hielo|nieve|polar|invierno/, "hielo"], [/desierto|arena|egipt/, "desierto"], [/espacio|galax|estrell|cosm/, "espacio"],
  [/otono|bosque/, "otono"], [/cyber|futur/, "cyber"], [/terror|miedo|oscur|halloween|embruj/, "terror"],
];
const COLORES: [RegExp, string][] = [
  [/roj[oa]/, "#ff4757"], [/azul/, "#3b82f6"], [/verde/, "#22c55e"], [/amarill/, "#facc15"], [/violeta|morad|lila/, "#a855f7"],
  [/naranja/, "#fb923c"], [/rosa/, "#f472b6"], [/blanc/, "#f8fafc"], [/celeste|cian/, "#22d3ee"], [/dorad|oro/, "#fbbf24"],
];

function capitalizar(t: string) { return t.charAt(0).toUpperCase() + t.slice(1); }

export function especInicial(pedido: string): EspecJuego {
  const n = normalizar(pedido);
  const e: EspecJuego = { ...ESPEC_BASE };
  if (/dispar|shooter|alien|invasor|marcian|balas/.test(n)) { e.genero = "disparos"; e.enemigos = true; }
  else if (/salt|plataforma|brinc/.test(n)) { e.genero = "plataformas"; e.jugador = "personaje"; }
  else if (/atrap|caen|cae |recog|canasta/.test(n)) { e.genero = "atrapar"; e.jugador = "pelota"; }
  if (/auto|coche|carro|ruta|carrera|transito|trafico/.test(n)) { e.jugador = "auto"; e.estilo = "cyber"; e.obstaculo = "autos"; }
  if (/pez|peces|tiburon|buceo/.test(n)) { e.jugador = "pez"; e.estilo = "oceano"; }
  if (/dragon/.test(n)) e.jugador = "dragon";
  if (/nave|cohete/.test(n)) e.jugador = "nave";
  if (/fantasma|zombi|monstruo|vampir/.test(n)) { e.enemigos = true; e.estilo = "terror"; }
  for (const [re, id] of ESTILOS) if (re.test(n)) { e.estilo = id; break; }
  const esq = /esquiv\w* (?:a |los |las |unos |unas )?([a-zñ]+)/.exec(n);
  if (esq) e.obstaculo = esq[1];
  const junta = /(?:junt|recog|agarr|atrap|coleccion)\w* (?:los |las |unos |unas )?([a-zñ]+)/.exec(n);
  if (junta) e.objeto = junta[1];
  if (/jefe/.test(n)) e.jefe = true;
  if (/dos jugadores|2 jugadores|multijugador/.test(n)) e.dosJugadores = true;
  const tema = TEMAS.find((t) => t.id === e.estilo)!;
  const nucleo = { esquivar: "Lluvia de", disparos: "Invasión de", plataformas: "Saltos en", atrapar: "Atrapa" }[e.genero];
  e.titulo = e.genero === "plataformas" ? `${nucleo} ${tema.lugares[0].replace(/^(la|el|las|los) /, "")}` : `${nucleo} ${capitalizar(e.genero === "disparos" ? (e.enemigos ? "Aliens" : capitalizar(e.obstaculo)) : e.genero === "atrapar" ? e.objeto : e.obstaculo)}`;
  e.descripcion = descripcionDe(e);
  return e;
}

export function descripcionDe(e: EspecJuego): string {
  const accion = { esquivar: `Esquivá ${e.obstaculo}`, disparos: `Disparale a ${e.enemigos ? "los enemigos" : `los ${e.obstaculo}`}`, plataformas: `Saltá entre plataformas`, atrapar: `Atrapá ${e.objeto} y esquivá ${e.obstaculo}` }[e.genero];
  const extra = [e.monedas && e.genero !== "atrapar" ? `juntá ${e.objeto}` : "", e.jefe ? "vencé al jefe final" : "", e.dosJugadores ? "jugá con un amigo" : ""].filter(Boolean);
  return `${accion}${extra.length ? ", " + extra.join(", ") : ""}. ${e.niveles} niveles de dificultad creciente.`;
}

export interface ResultadoInterprete { espec: EspecJuego; explicacion: string; entendido: boolean }

export function interpretar(pedido: string, actual: EspecJuego | null): ResultadoInterprete {
  if (!actual) {
    const espec = especInicial(pedido);
    const t = TEMAS.find((x) => x.id === espec.estilo)!;
    return { espec, entendido: true, explicacion: `¡Listo! Armé «${espec.titulo}»: un juego de ${{ esquivar: "esquivar", disparos: "disparos", plataformas: "plataformas", atrapar: "atrapar objetos" }[espec.genero]} con estilo ${t.nombre.toLowerCase()}, ${espec.niveles} niveles${espec.jefe ? " y jefe final" : ""}. Ya lo podés jugar a la derecha. Pedime cambios cuando quieras.` };
  }
  const n = normalizar(pedido);
  const e: EspecJuego = { ...actual };
  const cambios: string[] = [];
  const mas = /mas|aument|subi|super|muy/.test(n);
  const menos = /menos|baj|reduc|lent|facil/.test(n);

  if (/rapid|velocidad|veloz|lent/.test(n)) {
    const delta = /lent|menos/.test(n) ? -0.3 : 0.35;
    if (/nave|jugador|personaje|auto|pez|dragon|pelota|mueva|muevo|movimiento/.test(n)) { e.velocidadJugador = Math.max(0.5, Math.min(2.5, e.velocidadJugador + delta)); cambios.push(delta > 0 ? "tu personaje ahora se mueve más rápido" : "tu personaje se mueve más lento"); }
    else { e.velocidadJuego = Math.max(0.5, Math.min(2.5, e.velocidadJuego + delta)); cambios.push(delta > 0 ? "todo el juego va más rápido" : "el juego va más tranquilo"); }
  }
  if (/dificil|desafiante|complicad|duro/.test(n) || (/dificultad/.test(n) && mas)) { e.dificultad = Math.min(5, e.dificultad + 1); cambios.push(`subí la dificultad a ${e.dificultad}/5 (más obstáculos y más rápidos)`); }
  if (/facil|sencill/.test(n) || (/dificultad/.test(n) && menos)) { e.dificultad = Math.max(1, e.dificultad - 1); cambios.push(`bajé la dificultad a ${e.dificultad}/5`); }
  if (/jefe|boss/.test(n)) { const quitar = /sac|quit|sin |elimin|borr/.test(n); e.jefe = !quitar; cambios.push(quitar ? "saqué el jefe final" : "agregué un jefe final que aparece al completar el último nivel (y tu personaje dispara solo en esa pelea)"); }
  if (/enemig|monstru|zombi|fantasma|alien/.test(n) && !/jefe/.test(n)) { const quitar = /sac|quit|sin |elimin|borr/.test(n); e.enemigos = !quitar; cambios.push(quitar ? "saqué a los enemigos" : "agregué enemigos que te persiguen"); }
  if (/music|cancion|sonido de fondo/.test(n)) { const quitar = /sac|quit|sin |apag|silenc/.test(n); e.musica = !quitar; cambios.push(quitar ? "apagué la música" : "agregué música de fondo que acompaña la temática"); }
  if (/dos jugadores|2 jugadores|multijugador|amigo|cooperativ/.test(n)) { const quitar = /sac|quit|sin |un jugador|solo/.test(n); e.dosJugadores = !quitar; cambios.push(quitar ? "volví a un solo jugador" : "activé el modo dos jugadores: J1 con flechas, J2 con WASD (en celular cada uno usa su mitad de la pantalla)"); }
  if (/dispar|tiro|balas|arma/.test(n) && !/jefe/.test(n)) { const quitar = /sac|quit|sin /.test(n); if (!quitar) { e.genero = "disparos"; cambios.push("ahora tu personaje dispara automáticamente"); } else if (e.genero === "disparos") { e.genero = "esquivar"; cambios.push("saqué los disparos: ahora hay que esquivar"); } }
  if (/moneda|estrella|gema|coleccion/.test(n) && !/esquiv/.test(n)) { const quitar = /sac|quit|sin /.test(n); e.monedas = !quitar; cambios.push(quitar ? "saqué los objetos para juntar" : `agregué ${e.objeto} para juntar`); }
  const vidas = /(\d+) vidas/.exec(n);
  if (vidas) { e.vidas = Math.max(1, Math.min(9, +vidas[1])); cambios.push(`ahora empezás con ${e.vidas} vidas`); }
  else if (/vida/.test(n)) { e.vidas = Math.max(1, Math.min(9, e.vidas + (menos ? -1 : 2))); cambios.push(`ahora tenés ${e.vidas} vidas`); }
  const niveles = /(\d+) niveles/.exec(n);
  if (niveles) { e.niveles = Math.max(1, Math.min(12, +niveles[1])); cambios.push(`el juego tiene ${e.niveles} niveles`); }
  else if (/nivel/.test(n) && (mas || menos)) { e.niveles = Math.max(1, Math.min(12, e.niveles + (menos ? -1 : 2))); cambios.push(`el juego tiene ${e.niveles} niveles`); }

  let estiloCambiado = false;
  for (const [re, id] of ESTILOS) if (re.test(n) && /color|estilo|tema|ambient|pon|hac|cambi|que sea|visual/.test(n)) { e.estilo = id; estiloCambiado = true; cambios.push(`cambié el estilo visual a ${TEMAS.find((t) => t.id === id)!.nombre.toLowerCase()}`); break; }
  if (!estiloCambiado && /estilo|visual|colores|aspecto|apariencia/.test(n) && !COLORES.some(([re]) => re.test(n))) {
    const i = TEMAS.findIndex((t) => t.id === e.estilo);
    e.estilo = TEMAS[(i + 5) % TEMAS.length].id;
    cambios.push(`probé un estilo visual nuevo: ${TEMAS.find((t) => t.id === e.estilo)!.nombre.toLowerCase()}`);
  }
  for (const [re, hex] of COLORES) if (re.test(n) && /nave|jugador|personaje|auto|pez|dragon|pelota|color/.test(n) && !estiloCambiado) { e.colorJugador = hex; cambios.push("cambié el color de tu personaje"); break; }
  const titulo = /(?:llam\w*|titul\w*|nombre)\s+(?:a |el juego |como )?["«]?([^"»]{2,40})/.exec(pedido);
  if (titulo && /llam|titul|nombre/.test(n)) { e.titulo = titulo[1].trim().replace(/[.!]+$/, ""); cambios.push(`el juego ahora se llama «${e.titulo}»`); }
  if (/nave/.test(n) && /convert|cambi|que sea|ahora/.test(n) && e.jugador !== "nave") { e.jugador = "nave"; cambios.push("tu personaje ahora es una nave"); }
  if (/auto|coche/.test(n) && /convert|cambi|que sea|ahora/.test(n) && e.jugador !== "auto") { e.jugador = "auto"; cambios.push("tu personaje ahora es un auto"); }
  if (/dragon/.test(n) && e.jugador !== "dragon") { e.jugador = "dragon"; cambios.push("tu personaje ahora es un dragón"); }
  if (/pez/.test(n) && e.jugador !== "pez") { e.jugador = "pez"; cambios.push("tu personaje ahora es un pez"); }

  e.descripcion = descripcionDe(e);
  if (!cambios.length) {
    return { espec: actual, entendido: false, explicacion: "Mmm, no estoy segura de qué cambiar. Probá con algo como «hacé la nave más rápida», «agregá un jefe final», «cambiá los colores a neón», «más difícil», «agregá música» o «modo dos jugadores»." };
  }
  return { espec: e, entendido: true, explicacion: `Hecho: ${cambios.join("; ")}. Ya está actualizado en la vista previa.` };
}
