import { cookies, headers } from "next/headers";
import { COOKIE_IDIOMA, idiomaInicial, type Idioma } from "./idioma";
import { TEXTOS } from "./textos";

/** Idioma de la página actual, leído en el servidor. */
export async function idiomaActual(): Promise<Idioma> {
  const [c, h] = await Promise.all([cookies(), headers()]);
  return idiomaInicial(c.get(COOKIE_IDIOMA)?.value, h.get("accept-language"));
}

export async function textosActuales() {
  const idioma = await idiomaActual();
  return { idioma, t: TEXTOS[idioma] };
}
