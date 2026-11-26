import { NextResponse } from "next/server";
import { listarComunidad, obtenerComunidad, publicarComunidad } from "@/lib/comunidad";
import { construirHtml } from "@/lib/creador/construir";
import type { EspecJuego } from "@/lib/creador/espec";
import { ipDe, permitir } from "@/lib/limite";
import { esOfensivo, limpiarTexto, pareceSpam } from "@/lib/moderacion";
import { TEMAS } from "@/lib/temas";

export async function GET() {
  return NextResponse.json(await listarComunidad(100));
}

export async function POST(req: Request) {
  if (!permitir(`pub:${ipDe(req)}`, 10, 86_400_000)) return NextResponse.json({ error: "Llegaste al límite de publicaciones de hoy." }, { status: 429 });
  let c: { titulo?: string; descripcion?: string; autor?: string; html?: string; espec?: EspecJuego | null; remixDe?: string | null };
  try { c = await req.json(); } catch { return NextResponse.json({ error: "Pedido inválido" }, { status: 400 }); }
  const titulo = limpiarTexto(c.titulo ?? "", 60);
  const descripcion = limpiarTexto(c.descripcion ?? "", 300);
  const autor = limpiarTexto(c.autor ?? "", 30) || "Anónimo";
  if (titulo.length < 2) return NextResponse.json({ error: "Poné un nombre para tu juego." }, { status: 400 });
  if ([titulo, descripcion, autor].some((t) => esOfensivo(t) || pareceSpam(t))) return NextResponse.json({ error: "El nombre o la descripción tienen palabras no permitidas." }, { status: 400 });
  const espec = c.espec && typeof c.espec === "object" ? c.espec : null;
  const html = espec ? construirHtml({ ...espec, titulo }) : String(c.html ?? "");
  if (html.length < 50 || html.length > 450_000) return NextResponse.json({ error: "El juego está vacío o es demasiado grande." }, { status: 400 });
  const original = c.remixDe ? await obtenerComunidad(c.remixDe) : null;
  const estilo = espec?.estilo && TEMAS.some((t) => t.id === espec.estilo) ? espec.estilo : TEMAS[Math.floor(Math.random() * TEMAS.length)].id;
  const j = await publicarComunidad({
    titulo, descripcion, autor, html, espec, estilo, genero: espec?.genero ?? "esquivar",
    remixDe: original ? { id: original.id, titulo: original.titulo, autor: original.autor } : null,
  });
  return NextResponse.json({ id: j.id });
}
