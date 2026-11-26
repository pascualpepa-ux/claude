import { juegoPorId } from "@/lib/catalogo/generador";
import { obtenerComunidad } from "@/lib/comunidad";
import { portadaComunidadSvg, portadaSvg } from "@/lib/portadas";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const juego = juegoPorId(id);
  let svg: string | null = null;
  if (juego) svg = portadaSvg(juego);
  else {
    const c = await obtenerComunidad(id);
    if (c) svg = portadaComunidadSvg(c);
  }
  if (!svg) return new Response("No encontrado", { status: 404 });
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": juego ? "public, max-age=31536000, immutable" : "public, max-age=3600" } });
}
