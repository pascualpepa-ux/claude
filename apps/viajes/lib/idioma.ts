export type Idioma = "es" | "en";

export const IDIOMAS: Idioma[] = ["es", "en"];
export const COOKIE_IDIOMA = "rumbo_idioma";

/** Locale de Intl para fechas y números. */
export const LOCALE: Record<Idioma, string> = { es: "es-AR", en: "en-US" };

export function esIdioma(valor: unknown): valor is Idioma {
  return valor === "es" || valor === "en";
}

/** Idioma inicial: el que eligió la persona (cookie); si no eligió, el del navegador; si no, español. */
export function idiomaInicial(cookie: string | undefined, acceptLanguage: string | null): Idioma {
  if (esIdioma(cookie)) return cookie;
  const primero = acceptLanguage?.split(",")[0]?.trim().toLowerCase() ?? "";
  return primero.startsWith("en") ? "en" : "es";
}

/** Elige entre singular y plural. */
export const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);
