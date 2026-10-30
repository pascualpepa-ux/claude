import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { GUIAS } from "./guias";
import { IDIOMAS } from "./idioma";
import { urlEnIdioma } from "./seo";

// /sitemap.xml: se arma solo, recorriendo las páginas de la app (cada carpeta con page.tsx).
// Una página nueva aparece sola; las privadas se excluyen acá y también en robots.txt.
// Se escribe a mano (no con el sitemap de Next.js) para escapar bien las direcciones: un "&" sin escapar
// (ej. "/viaje?ejemplo=1&lang=en") rompe el XML y Google no puede leerlo.

/** Carpetas privadas: administración, confirmación y baja de emails, la pausa y el viaje de cada persona. */
export const PRIVADAS = ["/admin", "/suscripcion", "/pausa", "/viaje", "/api", "/concurso", "/reservar"];

/** Páginas públicas que no son una carpeta propia: el viaje de ejemplo y cada guía (ruta dinámica). */
const EXTRA = ["/viaje?ejemplo=1", ...GUIAS.map((g) => `/guias/${g.slug}`)];

const PRIORIDAD: Record<string, number> = { "/": 1, "/planificar": 0.9 };

function paginas(dir: string, ruta = ""): string[] {
  const salida: string[] = [];
  for (const nombre of readdirSync(dir)) {
    const completo = path.join(dir, nombre);
    if (statSync(completo).isDirectory()) {
      // Grupos "(x)", rutas dinámicas "[x]", privadas "_x", archivos como "sitemap.xml" y recursos no son páginas.
      if (/^[[_.]/.test(nombre) || nombre.includes(".") || nombre === "fuentes") continue;
      const sub = nombre.startsWith("(") ? ruta : `${ruta}/${nombre}`;
      salida.push(...paginas(completo, sub));
    } else if (/^page\.(tsx|ts|jsx|js|mdx)$/.test(nombre)) {
      salida.push(ruta || "/");
    }
  }
  return salida;
}

export function rutasPublicas(dirApp = path.join(process.cwd(), "app")) {
  const publicas = paginas(dirApp).filter((r) => !PRIVADAS.some((p) => r === p || r.startsWith(`${p}/`)));
  return [...new Set([...publicas, ...EXTRA])].sort((a, b) => (PRIORIDAD[b] ?? 0.5) - (PRIORIDAD[a] ?? 0.5) || a.localeCompare(b));
}

/** Escapa los 5 caracteres especiales de XML (& primero, para no escapar dos veces). */
export function escaparXml(texto: string) {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function armarSitemap(rutas: string[], fecha = new Date()): string {
  const lastmod = fecha.toISOString();
  const urls = rutas.flatMap((ruta) => {
    // Cada página, en cada idioma, con sus alternativas (hreflang) en los dos idiomas y la versión por defecto.
    const alternativas = [
      ...IDIOMAS.map((i) => [i, urlEnIdioma(ruta, i)]),
      ["x-default", urlEnIdioma(ruta, "es")],
    ]
      .map(([lang, href]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${escaparXml(href)}" />`)
      .join("\n");
    return IDIOMAS.map(
      (idioma) =>
        // Orden del estándar: loc, lastmod, changefreq, priority y recién después las etiquetas de otros espacios (xhtml:link).
        `<url>\n<loc>${escaparXml(urlEnIdioma(ruta, idioma))}</loc>\n<lastmod>${lastmod}</lastmod>\n` +
        `<changefreq>${ruta === "/" ? "daily" : "weekly"}</changefreq>\n<priority>${PRIORIDAD[ruta] ?? 0.6}</priority>\n${alternativas}\n</url>`,
    );
  });
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${urls.join("\n")}\n</urlset>\n`
  );
}
