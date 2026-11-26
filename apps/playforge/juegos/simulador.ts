import { crearRng } from "@/lib/rng";
import { Entrada, type Accion } from "./runtime/entrada";
import { Particulas } from "./runtime/dibujo";
import type { ApiJuego, ModuloMotor, ParametrosVariante } from "./runtime/tipos";

/** Contexto 2D falso: acepta cualquier llamada (para probar motores sin navegador). */
export function contextoFalso(): CanvasRenderingContext2D {
  const gradiente = { addColorStop() {} };
  const h: ProxyHandler<object> = {
    get(_t, prop) {
      if (prop === "createLinearGradient" || prop === "createRadialGradient") return () => gradiente;
      if (prop === "measureText") return () => ({ width: 10 });
      return () => undefined;
    },
    set() { return true; },
  };
  return new Proxy({}, h) as CanvasRenderingContext2D;
}

export { parametros } from "./parametros";

export interface ResultadoSimulacion { terminado: boolean; gano: boolean; puntos: number; segundos: number; error?: string }

/**
 * Juega una partida automáticamente con entradas pseudoaleatorias (o un "piloto" propio)
 * para comprobar que el motor no se rompe, que la partida termina y cuánto dura.
 */
export function simular(modulo: ModuloMotor, p: ParametrosVariante, segundos = 90, semillaPiloto = 1, piloto?: (api: ApiJuego, t: number) => void): ResultadoSimulacion {
  const entrada = new Entrada();
  entrada.dosJugadores = !!modulo.dosJugadores?.(p.modo);
  const rngPiloto = crearRng(semillaPiloto);
  let tiempo = 0, puntos = 0;
  let fin: { gano: boolean } | null = null;
  const sonidoFalso = new Proxy({ ctx: null, ahora: 0 }, { get: (t, k) => (k in t ? (t as Record<string, unknown>)[k as string] : () => undefined) }) as unknown as ApiJuego["sonido"];
  const api: ApiJuego = {
    W: modulo.ancho, H: modulo.alto, p, tema: p.tema, rng: crearRng(p.semilla ^ 0x9e3779b9), entrada, sonido: sonidoFalso, particulas: new Particulas(),
    get tiempo() { return tiempo; }, get puntos() { return puntos; },
    sumar(n) { puntos = Math.max(0, Math.round(puntos + n)); }, fijarPuntos(n) { puntos = n; },
    hud() {}, aviso() {}, temblor() {}, fin(r) { if (!fin) fin = r; },
  };
  const g = contextoFalso();
  try {
    const juego = modulo.crear(api);
    const acciones: Accion[] = ["izq", "der", "arriba", "abajo", "a", "b", "izq2", "der2", "arriba2", "abajo2"];
    const teclas = ["KeyD", "KeyF", "KeyJ", "KeyK", "ArrowLeft", "ArrowDown", "ArrowUp", "ArrowRight", "Space"];
    for (let paso = 0; paso < segundos * 60 && !fin; paso++) {
      if (piloto) piloto(api, tiempo);
      else {
        if (rngPiloto() < 0.08) { const a = acciones[Math.floor(rngPiloto() * acciones.length)]; if (entrada.presionado(a)) entrada.desactivar(a); else entrada.activar(a); }
        if (rngPiloto() < 0.06) { const k = teclas[Math.floor(rngPiloto() * teclas.length)]; entrada.tecla(k, !entrada.teclas.has(k)); }
        if (rngPiloto() < 0.05) {
          const x = rngPiloto() * modulo.ancho, y = rngPiloto() * modulo.alto;
          entrada.puntero = { x, y, abajo: true, pulsado: true, soltado: false, activo: true };
          const t = { id: 1, x, y, inicioX: x, inicioY: y };
          entrada.toques.set(1, t); entrada.toquesNuevos.push(t);
        } else if (rngPiloto() < 0.05) { entrada.puntero.abajo = false; entrada.puntero.soltado = true; entrada.toques.clear(); }
        else if (entrada.puntero.abajo) { entrada.puntero.x += (rngPiloto() - 0.5) * 40; entrada.puntero.y += (rngPiloto() - 0.5) * 40; }
      }
      juego.actualizar(1 / 60);
      api.particulas.actualizar(1 / 60);
      if (paso % 10 === 0) juego.dibujar(g);
      entrada.finCuadro();
      tiempo += 1 / 60;
    }
  } catch (e) {
    return { terminado: false, gano: false, puntos, segundos: tiempo, error: (e as Error).stack ?? String(e) };
  }
  const f = fin as { gano: boolean } | null;
  return { terminado: !!f, gano: !!f?.gano, puntos, segundos: Math.round(tiempo) };
}
