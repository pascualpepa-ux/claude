"use client";

/**
 * Datos del jugador guardados en el navegador (récords, historial, favoritos, ajustes).
 * Todo envuelto en try/catch: en modo privado localStorage puede fallar.
 */
function leer<T>(clave: string, defecto: T): T {
  try {
    const v = localStorage.getItem(clave);
    return v ? (JSON.parse(v) as T) : defecto;
  } catch {
    return defecto;
  }
}
function escribir(clave: string, valor: unknown) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch {}
}

export interface Record { puntos: number; fecha: string; partidas: number; victorias: number }

export function record(id: string): Record | null {
  return leer<Record | null>(`pf:record:${id}`, null);
}

/** Guarda la partida; devuelve true si es un récord nuevo. */
export function registrarPartida(id: string, puntos: number, gano: boolean): boolean {
  const r = record(id);
  const nuevo = !r || puntos > r.puntos;
  escribir(`pf:record:${id}`, {
    puntos: nuevo ? puntos : r!.puntos,
    fecha: nuevo ? new Date().toISOString() : r!.fecha,
    partidas: (r?.partidas ?? 0) + 1,
    victorias: (r?.victorias ?? 0) + (gano ? 1 : 0),
  });
  const total = leer<number>("pf:partidas", 0);
  escribir("pf:partidas", total + 1);
  return nuevo && puntos > 0;
}

export function historial(): string[] {
  return leer<string[]>("pf:historial", []);
}
export function agregarHistorial(id: string) {
  const h = historial().filter((x) => x !== id);
  h.unshift(id);
  escribir("pf:historial", h.slice(0, 40));
}

export function favoritos(): string[] {
  return leer<string[]>("pf:favoritos", []);
}
export function alternarFavorito(id: string): boolean {
  const f = favoritos();
  const esta = f.includes(id);
  escribir("pf:favoritos", esta ? f.filter((x) => x !== id) : [id, ...f]);
  return !esta;
}

export interface Ajustes { silencio: boolean; musica: boolean }
export function ajustes(): Ajustes {
  return leer<Ajustes>("pf:ajustes", { silencio: false, musica: true });
}
export function guardarAjustes(a: Ajustes) {
  escribir("pf:ajustes", a);
}

export function leerLocal<T>(clave: string, defecto: T) { return leer(clave, defecto); }
export function escribirLocal(clave: string, valor: unknown) { escribir(clave, valor); }
