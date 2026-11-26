import { NextResponse } from "next/server";
import { almacen } from "@/lib/almacen";
import type { JuegoComunidad } from "@/lib/comunidad";
import { ipDe, permitir } from "@/lib/limite";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { quitar } = (await req.json().catch(() => ({}))) as { quitar?: boolean };
  if (!permitir(`like:${ipDe(req)}:${id}`, 4, 86_400_000)) return NextResponse.json({ ok: false }, { status: 429 });
  const d = await almacen().obtener<JuegoComunidad>("comunidad", id);
  if (!d) return NextResponse.json({ ok: false });
  const likes = Math.max(0, d.datos.likes + (quitar ? -1 : 1));
  await almacen().guardar("comunidad", id, { ...d.datos, likes });
  return NextResponse.json({ ok: true, likes });
}
