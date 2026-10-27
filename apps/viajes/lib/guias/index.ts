import type { Idioma } from "../idioma";
import { barcelona } from "./barcelona-3-dias";
import { japon } from "./japon-7-dias";
import { lisboa } from "./lisboa-3-dias";
import { londres } from "./londres-4-dias";
import { madrid } from "./madrid-3-dias";
import { nuevaYork } from "./nueva-york-5-dias";
import { paris } from "./paris-4-dias";
import { pekin } from "./pekin-5-dias";
import { rio } from "./rio-de-janeiro-4-dias";
import { roma } from "./roma-3-dias";
import type { Guia, Rango } from "./tipos";

export type { Guia } from "./tipos";

/** Todas las guías, en el orden en que aparecen en /guias. Para sumar una, ver _plantilla.ts. */
export const GUIAS: Guia[] = [roma, paris, madrid, barcelona, londres, nuevaYork, pekin, japon, lisboa, rio];

export function guiaPorSlug(slug: string): Guia | undefined {
  return GUIAS.find((g) => g.slug === slug);
}

/** Total por persona del viaje entero (sin vuelo) para un rango por día. */
export function totalViaje(g: Guia, r: Rango): Rango {
  return [r[0] * g.dias, r[1] * g.dias];
}

/** Guías para recomendar al final de otra (las siguientes de la lista). */
export function relacionadas(g: Guia, cantidad = 3): Guia[] {
  const i = GUIAS.indexOf(g);
  return Array.from({ length: cantidad }, (_, k) => GUIAS[(i + 1 + k) % GUIAS.length]).filter((x) => x !== g);
}

export function textoGuia(g: Guia, idioma: Idioma) {
  return { titulo: g.titulo[idioma], descripcion: g.descripcion[idioma] };
}

const SITIO = "https://rumbotraveling.com";
const normal = (s: string) =>
  ` ${s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim()} `;

/** La guía de la que habla una pregunta del chat (si nombra uno de los destinos). */
export function guiaMencionada(pregunta: string): Guia | undefined {
  const q = normal(pregunta);
  return GUIAS.find((g) => g.claves.some((c) => q.includes(` ${c} `)));
}

const ETIQUETAS = {
  es: { estilos: ["Económico", "Equilibrado", "Premium"], presupuesto: "Presupuesto por persona y por día, sin vuelo", precios: "Algunos precios", ver: "Guía completa", aviso: "Los precios son aproximados: confirmalos en la web oficial antes de pagar." },
  en: { estilos: ["Budget", "Balanced", "Premium"], presupuesto: "Budget per person per day, excluding flights", precios: "Some prices", ver: "Full guide", aviso: "Prices are approximate: confirm them on the official website before paying." },
} as const;

/** Resumen de una guía en texto plano para el chat de ayuda. */
export function guiaComoTexto(g: Guia, idioma: Idioma): string {
  const E = ETIQUETAS[idioma];
  const dolares = (n: number) => `US$ ${n}`;
  const dias = g.itinerario.map((d) => `${d.titulo[idioma]}: ${d.actividades.map((a) => a[idioma].replace(/\.$/, "")).join("; ")}.`);
  const precios = g.precios.slice(0, 4).map((p) => `• ${p.concepto[idioma]}: ${p.monto[idioma]}`);
  const estilos = (["economico", "equilibrado", "premium"] as const).map(
    (e, i) => `• ${E.estilos[i]}: ${dolares(g.porDia[e][0])}–${dolares(g.porDia[e][1])}`,
  );
  return [
    g.titulo[idioma],
    ...dias,
    "",
    `${E.precios}:`,
    ...precios,
    "",
    `${E.presupuesto}:`,
    ...estilos,
    "",
    E.aviso,
    `${E.ver}: ${SITIO}/guias/${g.slug}${idioma === "en" ? "?lang=en" : ""}`,
  ].join("\n");
}

/** Todas las guías, para que la IA del chat pueda contestar sobre ellas. */
export function guiasComoTexto(idioma: Idioma): string {
  return GUIAS.map((g) => guiaComoTexto(g, idioma)).join("\n\n---\n\n");
}
