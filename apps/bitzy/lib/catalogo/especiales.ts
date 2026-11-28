import { normalizar } from "../texto";
import { clave } from "./consultas";

/**
 * Juegos especiales: juegos completos hechos aparte (no salen de un motor con variantes).
 * Heat City es el mundo abierto en 3D: se sirve desde /public/heat-city.
 */
export interface JuegoEspecial {
  id: string;
  nombre: string;
  bajada: string;
  descripcion: string;
  url: string;
  etiquetas: string[];
  palabras: string[];
}

export const ESPECIALES: JuegoEspecial[] = [
  {
    id: "heat-city",
    nombre: "Heat City",
    bajada: "Mundo abierto en 3D",
    descripcion: "Una ciudad costera en 3D para recorrer a pie o en auto: robá autos, comprá en las tiendas, conseguí propiedades, atendé el teléfono y escapá de la policía. Tu partida se guarda con tu nombre.",
    url: "/heat-city/index.html",
    etiquetas: ["Mundo abierto", "Coches", "3D", "Acción"],
    palabras: ["heat", "city", "heatcity", "mundo", "abierto", "3d", "gta", "ciudad", "policia", "autos", "coches", "carros"],
  },
];

/** Busca entre los especiales con la misma tolerancia del buscador (por sonido y con errores). */
export function buscarEspeciales(q: string): JuegoEspecial[] {
  const palabras = normalizar(q).split(/[^a-z0-9ñ]+/).filter(Boolean);
  if (!palabras.length) return [];
  return ESPECIALES.filter((e) => {
    const claves = [...normalizar(e.nombre).split(/\s+/), ...e.palabras].map(clave);
    const unido = clave(e.nombre.replace(/\s+/g, ""));
    return palabras.every((p) => {
      const k = clave(p);
      if (!k) return false;
      if (unido.startsWith(k) || claves.some((c) => c.startsWith(k) || (k.startsWith(c) && c.length >= 3))) return true;
      return k.length >= 3 && claves.some((c) => c.length >= 3 && casiIgual(c, k)); // «siri» ≈ «city» (un error)
    });
  });
}

/** ¿Difieren en una sola letra (cambiada, sobrante o faltante)? */
function casiIgual(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, errores = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++errores > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return errores + (a.length - i) + (b.length - j) <= 1;
}
