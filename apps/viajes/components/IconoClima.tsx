import { Cloud, CloudLightning, CloudRain, CloudSun, Sun } from "@phosphor-icons/react/dist/ssr";
import type { Condicion } from "@/lib/types";

const ICONOS = { soleado: Sun, parcial: CloudSun, nublado: Cloud, lluvia: CloudRain, tormenta: CloudLightning };

export const NOMBRE_CONDICION: Record<Condicion, string> = {
  soleado: "Soleado",
  parcial: "Parcialmente nublado",
  nublado: "Nublado",
  lluvia: "Lluvia",
  tormenta: "Tormenta",
};

export function IconoClima({ condicion, size = 28 }: { condicion: Condicion; size?: number }) {
  const Icono = ICONOS[condicion];
  const color =
    condicion === "soleado" || condicion === "parcial"
      ? "text-amber-500 dark:text-amber-400"
      : condicion === "tormenta"
        ? "text-zinc-700 dark:text-zinc-300"
        : "text-sky-600 dark:text-sky-400";
  return <Icono size={size} weight="duotone" className={color} aria-label={NOMBRE_CONDICION[condicion]} />;
}
