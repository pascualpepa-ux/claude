import type { ModuloMotor } from "../runtime/tipos";

/**
 * Carga diferida: el código de cada motor se descarga sólo cuando alguien va a jugar.
 * Para sumar un motor: agregalo acá y en lib/catalogo/motores.ts.
 */
export const CARGADORES: Record<string, () => Promise<{ default: ModuloMotor }>> = {
  serpiente: () => import("./serpiente"),
  corredor: () => import("./corredor"),
  plataformas: () => import("./plataformas"),
  naves: () => import("./naves"),
  rompebloques: () => import("./rompebloques"),
  defensa: () => import("./defensa"),
  gemas: () => import("./gemas"),
  carreras: () => import("./carreras"),
  ritmo: () => import("./ritmo"),
  hockey: () => import("./hockey"),
  montana: () => import("./montana"),
  derrape: () => import("./derrape"),
  estacionar: () => import("./estacionar"),
};
