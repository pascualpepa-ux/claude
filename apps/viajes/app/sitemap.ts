import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { IDIOMAS } from "@/lib/idioma";
import { urlEnIdioma } from "@/lib/seo";

// /sitemap.xml: se arma solo al publicar, recorriendo las páginas de la app (cada carpeta con page.tsx).
// Una página nueva aparece sola; las privadas se excluyen acá y también en robots.txt.

export const dynamic = "force-static";

/** Carpetas privadas: administración, confirmación y baja de emails, la pausa y el viaje de cada persona. */
export const PRIVADAS = ["/admin", "/suscripcion", "/pausa", "/viaje", "/api"];

/** Páginas públicas que no son una carpeta propia (el viaje de ejemplo usa la página de viaje). */
const EXTRA = ["/viaje?ejemplo=1"];

const PRIORIDAD: Record<string, number> = { "/": 1, "/planificar": 0.9 };

function paginas(dir: string, ruta = ""): string[] {
  const salida: string[] = [];
  for (const nombre of readdirSync(dir)) {
    const completo = path.join(dir, nombre);
    if (statSync(completo).isDirectory()) {
      // Grupos "(x)", rutas dinámicas "[x]", privadas "_x" y carpetas de recursos no son páginas sueltas.
      if (/^[[_.]/.test(nombre) || nombre === "fuentes") continue;
      const sub = nombre.startsWith("(") ? ruta : `${ruta}/${nombre}`;
      salida.push(...paginas(completo, sub));
    } else if (/^page\.(tsx|ts|jsx|js|mdx)$/.test(nombre)) {
      salida.push(ruta || "/");
    }
  }
  return salida;
}

export function rutasPublicas() {
  const todas = paginas(path.join(process.cwd(), "app"));
  const publicas = todas.filter((r) => !PRIVADAS.some((p) => r === p || r.startsWith(`${p}/`)));
  return [...new Set([...publicas, ...EXTRA])].sort((a, b) => (PRIORIDAD[b] ?? 0.5) - (PRIORIDAD[a] ?? 0.5) || a.localeCompare(b));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date();
  // Una entrada por página y por idioma, cada una con sus alternativas (hreflang) en el otro idioma.
  return rutasPublicas().flatMap((ruta) =>
    IDIOMAS.map((idioma) => ({
      url: urlEnIdioma(ruta, idioma),
      lastModified: ahora,
      changeFrequency: ruta === "/" ? ("daily" as const) : ("weekly" as const),
      priority: PRIORIDAD[ruta] ?? 0.6,
      alternates: {
        languages: {
          ...Object.fromEntries(IDIOMAS.map((i) => [i, urlEnIdioma(ruta, i)])),
          "x-default": urlEnIdioma(ruta, "es"),
        },
      },
    })),
  );
}
