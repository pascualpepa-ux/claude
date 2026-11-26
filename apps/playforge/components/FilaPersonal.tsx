"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { juegoPorId } from "@/lib/catalogo/generador";
import { similares } from "@/lib/catalogo/consultas";
import type { Juego } from "@/lib/catalogo/tipos";
import { historial } from "@/lib/cliente/local";
import { ANCHO_TARJETA, Fila } from "./Fila";
import { TarjetaJuego } from "./TarjetaJuego";

/** "Porque jugaste…" y "Seguir jugando": usa el historial guardado en el navegador. */
export function FilaPersonal() {
  const [datos, setDatos] = useState<{ base: Juego; recomendados: Juego[]; recientes: Juego[] } | null>(null);
  useEffect(() => {
    const ids = historial();
    const recientes = ids.map((id) => juegoPorId(id)).filter((j): j is Juego => !!j);
    if (!recientes.length) return;
    const base = recientes[0];
    setDatos({ base, recomendados: similares(base, 14).filter((j) => !ids.includes(j.id)), recientes: recientes.slice(0, 14) });
  }, []);
  if (!datos) return null;
  return (
    <>
      {datos.recientes.length > 1 && (
        <Fila titulo="Seguir jugando" icono={<History className="h-5 w-5 text-cian" />}>
          {datos.recientes.map((j) => <TarjetaJuego key={j.id} juego={j} ancho={ANCHO_TARJETA} />)}
        </Fila>
      )}
      <Fila titulo={`Porque jugaste ${datos.base.nombre}`} subtitulo="Juegos parecidos que te pueden gustar">
        {datos.recomendados.map((j) => <TarjetaJuego key={j.id} juego={j} ancho={ANCHO_TARJETA} />)}
      </Fila>
    </>
  );
}
