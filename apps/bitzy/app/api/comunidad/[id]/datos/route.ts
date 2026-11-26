import { NextResponse } from "next/server";
import { obtenerComunidad } from "@/lib/comunidad";

/** Datos para hacer un Remix (copia editable en el Creador). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const j = await obtenerComunidad((await params).id);
  if (!j) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ id: j.id, titulo: j.titulo, descripcion: j.descripcion, autor: j.autor, espec: j.espec ?? null, html: j.espec ? null : j.html });
}
