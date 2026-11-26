export type Accion =
  | "izq" | "der" | "arriba" | "abajo" | "a" | "b"
  | "izq2" | "der2" | "arriba2" | "abajo2" | "a2";

const TECLAS_UNO: Record<string, Accion> = {
  ArrowLeft: "izq", ArrowRight: "der", ArrowUp: "arriba", ArrowDown: "abajo",
  KeyA: "izq", KeyD: "der", KeyW: "arriba", KeyS: "abajo",
  Space: "a", Enter: "a", KeyZ: "a", KeyJ: "a", KeyX: "b", KeyK: "b", ShiftLeft: "b", ShiftRight: "b",
};
const TECLAS_DOS: Record<string, Accion> = {
  ArrowLeft: "izq", ArrowRight: "der", ArrowUp: "arriba", ArrowDown: "abajo", Enter: "a", Slash: "a",
  KeyA: "izq2", KeyD: "der2", KeyW: "arriba2", KeyS: "abajo2", Space: "a2", KeyF: "a2",
};

export interface Toque {
  id: number;
  x: number;
  y: number;
  inicioX: number;
  inicioY: number;
}

/**
 * Estado de controles unificado: teclado, mouse, toques y botones en pantalla.
 * Los motores consultan `presionado` (se mantiene) y `pulsado` (sólo el cuadro en que empezó).
 */
export class Entrada {
  private abajo = new Set<Accion>();
  private nuevos = new Set<Accion>();
  private soltados = new Set<Accion>();
  /** Teclas crudas (para juegos de ritmo: D F J K) */
  teclas = new Set<string>();
  teclasNuevas = new Set<string>();
  dosJugadores = false;
  puntero = { x: 0, y: 0, abajo: false, pulsado: false, soltado: false, activo: false };
  toques = new Map<number, Toque>();
  toquesNuevos: Toque[] = [];
  deslizar: "izq" | "der" | "arriba" | "abajo" | null = null;

  presionado(a: Accion) { return this.abajo.has(a); }
  pulsado(a: Accion) { return this.nuevos.has(a); }
  soltado(a: Accion) { return this.soltados.has(a); }
  eje(neg: Accion, pos: Accion) { return (this.abajo.has(pos) ? 1 : 0) - (this.abajo.has(neg) ? 1 : 0); }

  activar(a: Accion) {
    if (!this.abajo.has(a)) this.nuevos.add(a);
    this.abajo.add(a);
  }
  desactivar(a: Accion) {
    if (this.abajo.has(a)) this.soltados.add(a);
    this.abajo.delete(a);
  }

  tecla(code: string, baja: boolean): boolean {
    const mapa = this.dosJugadores ? TECLAS_DOS : TECLAS_UNO;
    if (baja) { if (!this.teclas.has(code)) this.teclasNuevas.add(code); this.teclas.add(code); }
    else this.teclas.delete(code);
    const acc = mapa[code];
    if (!acc) return false;
    if (baja) this.activar(acc); else this.desactivar(acc);
    return true;
  }

  /** Se llama al terminar cada cuadro de lógica */
  finCuadro() {
    this.nuevos.clear();
    this.soltados.clear();
    this.teclasNuevas.clear();
    this.puntero.pulsado = false;
    this.puntero.soltado = false;
    this.toquesNuevos = [];
    if (this.deslizar) { this.desactivar(this.deslizar); this.deslizar = null; }
  }

  limpiar() {
    for (const a of [...this.abajo]) this.desactivar(a);
    this.teclas.clear();
    this.toques.clear();
    this.puntero.abajo = false;
  }
}
