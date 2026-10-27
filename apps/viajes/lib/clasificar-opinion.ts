// Agente clasificador de opiniones: ordena cada una por tipo y prioridad para el admin,
// y decide qué asunto lleva el email al dueño (las sugerencias y los problemas van destacados).

export type Categoria = "problema" | "mejora" | "elogio" | "comentario" | "sin_texto";
export type Prioridad = "alta" | "media" | "baja";

const normal = (s: string) =>
  ` ${s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim()} `;

const PROBLEMA = [
  "no anda", "no funciona", "no carga", "no abre", "no me deja", "no puedo", "no aparece", "no sirve", "error", "errores", "falla", "fallo",
  "roto", "rota", "bug", "lento", "lenta", "se traba", "se cuelga", "incorrecto", "incorrecta", "equivocado", "equivocada", "mal", "mentira", "inventa",
  "doesn't work", "doesnt work", "not working", "won't load", "broken", "crash", "crashes", "slow", "wrong", "incorrect", "can't", "cant", "fails", "bug",
];
const MEJORA = [
  "deberia", "deberian", "podrian", "podria", "estaria bueno", "estaria bien", "agreguen", "agregar", "agregaria", "sumen", "sumar", "falta", "faltan",
  "mejorar", "mejoren", "mejoraria", "quisiera", "me gustaria", "ojala", "sugiero", "sugerencia", "propongo", "seria mejor", "seria bueno", "cambiar", "cambien",
  "should", "could you", "would be nice", "would be great", "please add", "add", "missing", "improve", "suggest", "suggestion", "wish", "it'd be", "i'd like", "feature",
];
const ELOGIO = [
  "excelente", "genial", "me encanta", "me encanto", "buenisimo", "buenisima", "perfecto", "perfecta", "increible", "muy bueno", "muy buena", "gracias", "lo mejor", "re bueno",
  "love", "loved", "great", "awesome", "amazing", "excellent", "perfect", "thanks", "thank you", "the best", "very good",
];

const tiene = (texto: string, lista: string[]) => lista.some((p) => texto.includes(` ${p} `));

export function clasificarOpinion(comentario: string, estrellas: number): { categoria: Categoria; prioridad: Prioridad } {
  const t = normal(comentario);
  let categoria: Categoria;
  if (!comentario.trim()) categoria = "sin_texto";
  else if (tiene(t, PROBLEMA)) categoria = "problema";
  else if (tiene(t, MEJORA)) categoria = "mejora";
  else if (tiene(t, ELOGIO) && estrellas >= 4) categoria = "elogio";
  else categoria = estrellas <= 2 ? "problema" : "comentario";
  const prioridad: Prioridad = categoria === "problema" || estrellas <= 2 ? "alta" : categoria === "mejora" ? "media" : "baja";
  return { categoria, prioridad };
}

export const ASUNTO_CATEGORIA: Record<Categoria, string> = {
  problema: "⚠️ Problema reportado",
  mejora: "💡 Sugerencia para mejorar",
  elogio: "Nueva opinión positiva",
  comentario: "Nueva opinión",
  sin_texto: "Nueva calificación",
};
