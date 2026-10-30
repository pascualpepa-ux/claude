"use client";

import { useState } from "react";
import { ProveedorVentaja } from "@/components/juegos/comun";
import { CruzaLaCalle } from "@/components/juegos/CruzaLaCalle";
import { PajaroSaltarin } from "@/components/juegos/PajaroSaltarin";
import { MiniGolf } from "@/components/juegos/MiniGolf";
import { Penales } from "@/components/juegos/Penales";
import { DueloFlechas } from "@/components/juegos/DueloFlechas";

const JUEGOS = [
  { id: "flechas", nombre: "🏹 Duelo de flechas", Componente: DueloFlechas },
  { id: "calle", nombre: "🐥 Cruzá la calle", Componente: CruzaLaCalle },
  { id: "pajaro", nombre: "🐦 Pájaro saltarín", Componente: PajaroSaltarin },
  { id: "golf", nombre: "⛳ Mini golf", Componente: MiniGolf },
  { id: "penales", nombre: "⚽ Penales", Componente: Penales },
];

export function Juegos() {
  const [actual, setActual] = useState(JUEGOS[0].id);
  const juego = JUEGOS.find((x) => x.id === actual)!;
  return (
    <ProveedorVentaja>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Juegos">
        {JUEGOS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={x.id === actual}
            onClick={() => setActual(x.id)}
            className={`rounded-xl px-4 py-2 font-medium transition ${x.id === actual ? "bg-oliva-700 text-white dark:bg-oliva-300 dark:text-arena-950" : "border border-arena-300 hover:bg-arena-100 dark:border-arena-700 dark:hover:bg-arena-800"}`}
          >
            {x.nombre}
          </button>
        ))}
      </div>
      <div className="mt-6" role="tabpanel">
        {/* key: cada juego arranca de cero al cambiar de pestaña */}
        <juego.Componente key={juego.id} />
      </div>
    </ProveedorVentaja>
  );
}
