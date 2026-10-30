"use client";

import { useState } from "react";
import { AirplaneTilt, Bed } from "@phosphor-icons/react/dist/ssr";
import { useIdioma } from "@/components/ProveedorIdioma";
import { Reservar, type InicialVuelo } from "./Reservar";
import { Hoteles, type InicialHotel } from "./Hoteles";

/** Vuelos y hoteles en la misma página, cada uno en su pestaña. */
export function Pestanas({
  vuelos,
  hoteles,
  inicial,
}: {
  vuelos: { prueba: boolean; telefonoOpcional: boolean; inicial?: InicialVuelo } | null;
  hoteles: { prueba: boolean; inicial?: InicialHotel } | null;
  inicial: "vuelos" | "hoteles";
}) {
  const { idioma } = useIdioma();
  const [actual, setActual] = useState(inicial === "hoteles" && hoteles ? "hoteles" : vuelos ? "vuelos" : "hoteles");
  const boton = (id: "vuelos" | "hoteles", texto: string, Icono: typeof Bed) => (
    <button
      type="button"
      role="tab"
      aria-selected={actual === id}
      onClick={() => setActual(id)}
      className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold transition ${actual === id ? "bg-oliva-700 text-white dark:bg-oliva-300 dark:text-arena-950" : "border border-arena-300 hover:bg-arena-100 dark:border-arena-700 dark:hover:bg-arena-800"}`}
    >
      <Icono size={20} weight="duotone" aria-hidden />
      {texto}
    </button>
  );
  return (
    <>
      {vuelos && hoteles && (
        <div className="mx-auto flex max-w-3xl gap-2 px-4 pt-8" role="tablist">
          {boton("vuelos", idioma === "es" ? "Vuelos" : "Flights", AirplaneTilt)}
          {boton("hoteles", idioma === "es" ? "Hoteles" : "Hotels", Bed)}
        </div>
      )}
      {actual === "vuelos" && vuelos ? (
        <Reservar prueba={vuelos.prueba} telefonoOpcional={vuelos.telefonoOpcional} inicial={vuelos.inicial} />
      ) : hoteles ? (
        <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <Hoteles prueba={hoteles.prueba} inicial={hoteles.inicial} />
        </main>
      ) : null}
    </>
  );
}
