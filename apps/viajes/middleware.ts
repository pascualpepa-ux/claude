import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_PAUSA } from "@/lib/groserias";

/** Mientras dura la pausa (por malas palabras en el chat de ayuda), toda la web lleva a la cuenta regresiva. */
export function middleware(req: NextRequest) {
  const hasta = Number(req.cookies.get(COOKIE_PAUSA)?.value);
  if (hasta > Date.now()) return NextResponse.redirect(new URL("/pausa", req.url));
  return NextResponse.next();
}

export const config = {
  // Solo páginas: sin la propia pausa, la API, el admin ni los archivos de la web.
  matcher: ["/((?!pausa|api|admin|_next|marca|fuentes|icon|apple-icon|favicon).*)"],
};
