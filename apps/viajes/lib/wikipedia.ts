import type { Idioma } from "./idioma";

// Resumen de Wikipedia de un tema (API REST pública, texto CC BY-SA 4.0: se muestra con el link a la fuente).
// Se guarda una semana para no pedirlo en cada visita.

export interface Resumen {
  texto: string;
  imagen: string | null;
  url: string;
}

export async function resumenWikipedia(titulo: string, idioma: Idioma): Promise<Resumen | null> {
  try {
    const res = await fetch(`https://${idioma}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titulo.replace(/ /g, "_"))}`, {
      headers: { "User-Agent": "RumboTraveling/1.0 (+https://rumbotraveling.com; info@rumbotraveling.com)" },
      next: { revalidate: 7 * 24 * 3600 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { type?: string; extract?: string; thumbnail?: { source: string }; originalimage?: { source: string }; content_urls?: { desktop?: { page?: string } } };
    // Una página de desambiguación ("Georgia" puede ser el país o el estado) no sirve.
    if (j.type !== "standard" || !j.extract) return null;
    return { texto: j.extract, imagen: j.thumbnail?.source ?? null, url: j.content_urls?.desktop?.page ?? `https://${idioma}.wikipedia.org/wiki/${encodeURIComponent(titulo)}` };
  } catch {
    return null;
  }
}
