"use client";

import { createContext, useContext } from "react";
import type { Idioma } from "@/lib/idioma";
import { TEXTOS, type Textos } from "@/lib/textos";

const Contexto = createContext<{ idioma: Idioma; t: Textos }>({ idioma: "es", t: TEXTOS.es });

export function ProveedorIdioma({ idioma, children }: { idioma: Idioma; children: React.ReactNode }) {
  return <Contexto.Provider value={{ idioma, t: TEXTOS[idioma] }}>{children}</Contexto.Provider>;
}

/** Idioma y textos actuales, para componentes del navegador. */
export function useIdioma() {
  return useContext(Contexto);
}
