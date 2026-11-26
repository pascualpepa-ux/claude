import { normalizar } from "./texto";

/** Moderación básica: bloquea insultos comunes y spam de enlaces. */
const PROHIBIDAS = [
  "puta", "puto", "pelotudo", "boludo de mierda", "mierda", "concha", "verga", "pija", "culiao", "forro", "hdp", "hijo de puta",
  "idiota", "estupido", "imbecil", "mogolico", "retrasado", "nazi", "maricon", "trolo", "negro de mierda", "fuck", "shit", "bitch",
  "porno", "sexo", "droga", "matate", "suicid",
];

export function esOfensivo(texto: string): boolean {
  const n = ` ${normalizar(texto).replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ")} `;
  return PROHIBIDAS.some((p) => n.includes(` ${p} `) || n.includes(` ${p}s `));
}

export function pareceSpam(texto: string): boolean {
  return (texto.match(/https?:\/\//g)?.length ?? 0) > 1 || /(.)\1{9,}/.test(texto);
}

export function limpiarTexto(texto: string, max: number): string {
  return texto.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
