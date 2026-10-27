"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { CLAVE_BORRADOR } from "@/lib/almacen";
import type { Lugar } from "@/lib/lugares-tipos";
import { useIdioma } from "./ProveedorIdioma";

/** Abre el asistente con el destino y la cantidad de días de la guía ya completados. */
export function PlanearGuia({ lugar, nombre, dias }: { lugar: Lugar | null; nombre: string; dias: number }) {
  const { t } = useIdioma();
  const router = useRouter();
  const [abriendo, setAbriendo] = useState(false);

  const planear = () => {
    setAbriendo(true);
    try {
      const previo = JSON.parse(sessionStorage.getItem(CLAVE_BORRADOR) ?? "{}");
      sessionStorage.setItem(
        CLAVE_BORRADOR,
        JSON.stringify({
          ...previo,
          destino: nombre,
          lugarDestino: lugar,
          aeropuertoDestino: lugar?.aeropuertos[0]?.iata ?? "",
          ciudadesDestino: [],
          modoFechas: "dias",
          cantidadDias: String(dias),
        }),
      );
    } catch {}
    router.push("/planificar");
  };

  return (
    <button
      type="button"
      onClick={planear}
      disabled={abriendo}
      className="inline-flex items-center gap-2 rounded-xl bg-oliva-700 px-5 py-3 font-medium text-white shadow-sm shadow-oliva-900/20 transition hover:bg-oliva-800 active:scale-[0.98] disabled:opacity-70 dark:bg-oliva-300 dark:text-arena-950 dark:hover:bg-oliva-200"
    >
      {abriendo ? t.guias.abriendo : t.guias.planear}
      <ArrowRight size={18} weight="bold" aria-hidden />
    </button>
  );
}
