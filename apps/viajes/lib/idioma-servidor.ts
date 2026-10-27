import { cookies, headers } from "next/headers";
import { COOKIE_IDIOMA, esIdioma, idiomaInicial, type Idioma } from "./idioma";
import { HEADER_IDIOMA } from "./seo";
import { TEXTOS } from "./textos";

/** Idioma de la página actual, leído en el servidor. */
export async function idiomaActual(): Promise<Idioma> {
  const [c, h] = await Promise.all([cookies(), headers()]);
  // ?lang= en la dirección (lo pasa el middleware) manda sobre la cookie y el navegador.
  const deLaUrl = h.get(HEADER_IDIOMA);
  if (esIdioma(deLaUrl)) return deLaUrl;
  return idiomaInicial(c.get(COOKIE_IDIOMA)?.value, h.get("accept-language"));
}

export async function textosActuales() {
  const idioma = await idiomaActual();
  return { idioma, t: TEXTOS[idioma] };
}
