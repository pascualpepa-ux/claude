import { armarSitemap, rutasPublicas } from "@/lib/sitemap";

// Se genera al publicar (estático): lista las páginas públicas en los dos idiomas.
export const dynamic = "force-static";

export function GET() {
  return new Response(armarSitemap(rutasPublicas()), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
