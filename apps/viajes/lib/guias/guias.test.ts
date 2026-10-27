import { describe, expect, it } from "vitest";
import { buscarLugares } from "../lugares";
import { IDIOMAS } from "../idioma";
import { GUIAS } from ".";
import type { Texto } from "./tipos";

const completo = (t: Texto) => IDIOMAS.every((i) => t[i]?.trim().length > 0);

describe("guías de viaje", () => {
  it("tienen slugs únicos y en minúscula", () => {
    const slugs = GUIAS.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
  });

  it.each(GUIAS.map((g) => [g.slug, g]))("%s está completa en todos los idiomas", (_, g) => {
    for (const t of [g.titulo, g.descripcion, g.intro]) expect(completo(t)).toBe(true);
    expect(g.itinerario.length).toBeGreaterThan(0);
    for (const d of g.itinerario) {
      expect(completo(d.titulo)).toBe(true);
      for (const a of d.actividades) expect(completo(a)).toBe(true);
    }
    for (const p of g.precios) expect(completo(p.concepto) && completo(p.monto)).toBe(true);
    for (const c of g.consejos) expect(completo(c)).toBe(true);
    for (const r of Object.values(g.porDia)) expect(r[0]).toBeLessThanOrEqual(r[1]);
    for (const p of g.precios.filter((x) => x.verificado)) expect(p.enlace).toMatch(/^https:\/\//);
    for (const i of IDIOMAS) expect(g.descripcion[i].length).toBeLessThanOrEqual(160);
  });

  it.each(GUIAS.map((g) => [g.slug, g]))("%s encuentra su destino en el buscador del asistente", (_, g) => {
    const { buscar, pais, tipo } = g.destino;
    const lugar = buscarLugares(buscar, 6, tipo === "pais").find((l) => l.pais === pais && l.tipo === tipo);
    expect(lugar).toBeDefined();
    if (tipo === "ciudad") expect(lugar!.aeropuertos.length).toBeGreaterThan(0);
  });
});

describe("guías en el chat de ayuda", () => {
  it("reconoce el destino y responde con la guía", async () => {
    const { guiaMencionada, guiaComoTexto } = await import(".");
    expect(guiaMencionada("¿Qué hago en Roma 3 días?")?.slug).toBe("roma-3-dias");
    expect(guiaMencionada("how much is Japan for a week")?.slug).toBe("japon-7-dias-cuanto-cuesta");
    expect(guiaMencionada("cuánto sale el Louvre")?.slug).toBe("paris-4-dias");
    expect(guiaMencionada("¿cómo armo mi viaje?")).toBeUndefined();
    const texto = guiaComoTexto(guiaMencionada("Barcelona")!, "es");
    expect(texto).toContain("Sagrada Família");
    expect(texto).toContain("https://rumbotraveling.com/guias/barcelona-3-dias");
  });
});
