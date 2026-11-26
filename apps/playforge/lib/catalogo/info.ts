import { juegoPorId } from "./generador";
import { similares } from "./consultas";
import { MOTORES } from "./motores";
import type { InfoReproductor } from "@/components/Reproductor";

export function infoReproductor(id: string): InfoReproductor | null {
  const juego = juegoPorId(id);
  if (!juego) return null;
  const m = MOTORES.find((x) => x.id === juego.motor)!;
  const sig = similares(juego, 1)[0];
  return { juego, modoNombre: `${m.nombre} · ${m.modos[juego.modo].nombre}`, controles: m.controles, controlesTactiles: m.controlesTactiles, siguiente: sig ? { id: sig.id, nombre: sig.nombre } : null };
}
