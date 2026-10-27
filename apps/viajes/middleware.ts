import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_PAUSA } from "@/lib/groserias";
import { COOKIE_IDIOMA, esIdioma } from "@/lib/idioma";
import { HEADER_IDIOMA, PARAM_IDIOMA } from "@/lib/seo";

/**
 * - Pausa: mientras dura (por malas palabras en el chat de ayuda), toda la web lleva a la cuenta regresiva.
 * - Idioma: ?lang=en o ?lang=es muestra la página en ese idioma (así Google tiene una dirección por idioma)
 *   y lo recuerda en la cookie de idioma para las páginas siguientes.
 */
export function middleware(req: NextRequest) {
  const hasta = Number(req.cookies.get(COOKIE_PAUSA)?.value);
  if (hasta > Date.now()) return NextResponse.redirect(new URL("/pausa", req.url));

  const pedido = req.nextUrl.searchParams.get(PARAM_IDIOMA);
  if (!esIdioma(pedido)) return NextResponse.next();
  const encabezados = new Headers(req.headers);
  encabezados.set(HEADER_IDIOMA, pedido);
  const res = NextResponse.next({ request: { headers: encabezados } });
  res.cookies.set(COOKIE_IDIOMA, pedido, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}

export const config = {
  // Solo páginas: sin la propia pausa, la API, el admin ni los archivos de la web.
  matcher: ["/((?!pausa|api|admin|_next|marca|og|iconos|fuentes|icon|apple-icon|favicon|manifest|robots|sitemap).*)"],
};
