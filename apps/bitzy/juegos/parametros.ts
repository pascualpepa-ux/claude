import { temaPorId } from "@/lib/temas";
import { MULT_DIFICULTAD, type Juego } from "@/lib/catalogo/tipos";
import type { ParametrosVariante } from "./runtime/tipos";

export function parametros(j: Pick<Juego, "id" | "semilla" | "tema" | "dificultad" | "modo" | "mapa" | "velocidad">): ParametrosVariante {
  return { id: j.id, semilla: j.semilla, tema: temaPorId(j.tema), dificultad: j.dificultad, mult: MULT_DIFICULTAD[j.dificultad], modo: j.modo, mapa: j.mapa, velocidad: j.velocidad };
}
