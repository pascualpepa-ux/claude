import "server-only";
import { almacen } from "./almacen";
import { hashTexto } from "./rng";
import { construirHtml } from "./creador/construir";
import { PLANTILLAS } from "./creador/espec";
import type { EspecJuego } from "./creador/espec";

export interface JuegoComunidad {
  id: string;
  titulo: string;
  descripcion: string;
  autor: string;
  estilo: string; // temática para la portada
  genero: string;
  html: string;
  espec?: EspecJuego | null;
  remixDe?: { id: string; titulo: string; autor: string } | null;
  likes: number;
  partidas: number;
  creado: string;
}

export type ResumenComunidad = Omit<JuegoComunidad, "html" | "espec">;

const COL = "comunidad";

/** Juegos de muestra del estudio para que la sección nunca esté vacía. */
function semillas(): JuegoComunidad[] {
  return PLANTILLAS.slice(0, 4).map((p, i) => ({
    id: `estudio-${p.id}`,
    titulo: p.espec.titulo,
    descripcion: p.espec.descripcion,
    autor: "Bitzy Studio",
    estilo: p.espec.estilo,
    genero: p.espec.genero,
    html: construirHtml(p.espec),
    espec: p.espec,
    remixDe: null,
    likes: 40 + (hashTexto(p.id) % 200),
    partidas: 900 + (hashTexto(p.id + "p") % 5000),
    creado: new Date(Date.UTC(2026, 9, 1 + i)).toISOString(),
  }));
}

const resumir = ({ html: _h, espec: _e, ...r }: JuegoComunidad): ResumenComunidad => r;

export async function listarComunidad(limite = 60): Promise<ResumenComunidad[]> {
  let propios: JuegoComunidad[] = [];
  try {
    propios = (await almacen().listar<JuegoComunidad>(COL, limite)).map((d) => d.datos);
  } catch {}
  return [...propios, ...semillas()].slice(0, limite).map(resumir);
}

export async function obtenerComunidad(id: string): Promise<JuegoComunidad | null> {
  const s = semillas().find((x) => x.id === id);
  if (s) return s;
  try {
    return (await almacen().obtener<JuegoComunidad>(COL, id))?.datos ?? null;
  } catch {
    return null;
  }
}

export async function publicarComunidad(j: Omit<JuegoComunidad, "id" | "likes" | "partidas" | "creado">): Promise<JuegoComunidad> {
  const id = `c${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
  const completo: JuegoComunidad = { ...j, id, likes: 0, partidas: 0, creado: new Date().toISOString() };
  await almacen().guardar(COL, id, completo);
  return completo;
}

export async function sumarPartidaComunidad(id: string) {
  const j = await almacen().obtener<JuegoComunidad>(COL, id);
  if (j) await almacen().guardar(COL, id, { ...j.datos, partidas: j.datos.partidas + 1 });
}
