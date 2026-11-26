import { obtenerComunidad, sumarPartidaComunidad } from "@/lib/comunidad";

/**
 * Sirve el HTML de un juego de la comunidad con una política de seguridad estricta:
 * sin red, sin acceso al sitio (el iframe además usa sandbox="allow-scripts").
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const j = await obtenerComunidad(id);
  if (!j) return new Response("No encontrado", { status: 404 });
  if (new URL(req.url).searchParams.has("jugar")) void sumarPartidaComunidad(id).catch(() => undefined);
  return new Response(j.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src 'none'; frame-ancestors *",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=300",
    },
  });
}
