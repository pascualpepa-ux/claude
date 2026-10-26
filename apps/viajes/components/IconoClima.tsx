"use client";

import { Cloud, CloudLightning, CloudRain, CloudSun, Sun } from "@phosphor-icons/react/dist/ssr";
import type { Condicion } from "@/lib/types";
import { useIdioma } from "./ProveedorIdioma";

const ICONOS = { soleado: Sun, parcial: CloudSun, nublado: Cloud, lluvia: CloudRain, tormenta: CloudLightning };

export function IconoClima({ condicion, size = 28 }: { condicion: Condicion; size?: number }) {
  const { t } = useIdioma();
  const Icono = ICONOS[condicion];
  const color =
    condicion === "soleado" || condicion === "parcial"
      ? "text-amber-500 dark:text-amber-400"
      : condicion === "tormenta"
        ? "text-arena-700 dark:text-arena-300"
        : "text-sky-600 dark:text-sky-400";
  return <Icono size={size} weight="duotone" className={color} aria-label={t.clima[condicion]} />;
}
