import { describe, expect, it } from "vitest";
import { entenderViaje } from "./viaje-texto";

const HOY = "2026-11-01";
const viaje = (t: string | string[], idioma: "es" | "en" = "es") => {
  const r = entenderViaje(Array.isArray(t) ? t : [t], idioma, HOY);
  return r?.tipo === "viaje" ? r.viaje : r;
};

describe("entenderViaje", () => {
  it("el ejemplo de la sugerencia", () => {
    expect(viaje("Quiero ir de Madrid a Roma 4 días en diciembre, somos 2")).toMatchObject({ origen: "MAD", destino: "FCO", ida: "2026-12-10", vuelta: "2026-12-14", adultos: 2 });
  });

  it("día puntual, en palabras y en inglés", () => {
    expect(viaje("de Barcelona a Londres el 5 de enero, cinco días, somos tres")).toMatchObject({ origen: "BCN", ida: "2027-01-05", vuelta: "2027-01-10", adultos: 3 });
    expect(viaje("I want to go from London to Paris for 3 days in March, 2 people", "en")).toMatchObject({ origen: "LHR", destino: "CDG", ida: "2027-03-10", vuelta: "2027-03-13", adultos: 2 });
  });

  it("sin fecha: dentro de un mes, 4 días, 1 persona", () => {
    expect(viaje("viaje de Madrid a Lisboa")).toMatchObject({ ida: "2026-12-01", vuelta: "2026-12-05", adultos: 1 });
  });

  it("si falta de dónde sale, lo pregunta; y lo junta con el mensaje siguiente", () => {
    expect(entenderViaje(["quiero ir a Roma en diciembre"], "es", HOY)?.tipo).toBe("falta_origen");
    expect(viaje(["quiero ir a Roma en diciembre", "desde Madrid"])).toMatchObject({ origen: "MAD", destino: "FCO", ida: "2026-12-10" });
  });

  it("no inventa viajes en preguntas comunes", () => {
    expect(entenderViaje(["¿Cómo armo mi viaje?"], "es", HOY)).toBeNull();
    expect(entenderViaje(["¿Los precios son reales?"], "es", HOY)).toBeNull();
    expect(entenderViaje(["cuánto es 2 más 2"], "es", HOY)).toBeNull();
  });

  it("la respuesta trae la línea de la tarjeta", () => {
    const r = entenderViaje(["de Madrid a Roma"], "es", HOY);
    expect(r?.respuesta).toMatch(/\[\[VIAJE MAD\|FCO\|2026-12-01\|2026-12-05\|1\|Roma\]\]$/);
  });
});
