import path from "node:path";
import { describe, expect, it } from "vitest";
import { armarSitemap, escaparXml, rutasPublicas } from "./sitemap";

describe("sitemap.xml", () => {
  const rutas = rutasPublicas(path.join(__dirname, "..", "app"));
  const xml = armarSitemap(rutas);

  it("escapa los & de las direcciones (Google no lee un & suelto)", () => {
    expect(escaparXml("/viaje?ejemplo=1&lang=en")).toBe("/viaje?ejemplo=1&amp;lang=en");
    // Fuera de las entidades válidas no puede quedar ningún & ni < suelto.
    expect(xml.replace(/&(amp|lt|gt|quot|apos);/g, "")).not.toMatch(/&/);
    expect(xml).toContain("<loc>https://rumbotraveling.com/viaje?ejemplo=1&amp;lang=en</loc>");
  });

  it("tiene el formato de sitemaps.org y las etiquetas cerradas", () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')).toBe(true);
    expect(xml.match(/<url>/g)!.length).toBe(xml.match(/<\/url>/g)!.length);
    expect(xml.match(/<loc>/g)!.length).toBe(rutas.length * 2);
    expect(xml.trim().endsWith("</urlset>")).toBe(true);
  });

  it("incluye las guías y deja afuera las páginas privadas", () => {
    expect(rutas).toContain("/guias/roma-3-dias");
    expect(rutas).toContain("/opinar");
    expect(rutas.some((r) => r.startsWith("/admin") || r.startsWith("/api") || r === "/viaje")).toBe(false);
    expect(rutas).not.toContain("/sitemap.xml");
  });
});
