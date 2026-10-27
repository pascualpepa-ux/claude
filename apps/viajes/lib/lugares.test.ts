import { describe, expect, it } from "vitest";
import { buscarLugares } from "./lugares";

describe("buscarLugares", () => {
  it("encuentra la ciudad y su aeropuerto más cercano", () => {
    const [ba] = buscarLugares("Buenos Aires");
    expect(ba.pais).toBe("AR");
    expect(ba.aeropuertos.map((a) => a.iata)).toContain("AEP");
    expect(ba.aeropuertos.map((a) => a.iata)).toContain("EZE");
  });

  it("acepta nombres en español y sin tildes", () => {
    expect(buscarLugares("nueva york")[0].pais).toBe("US");
    expect(buscarLugares("Cordoba").some((l) => l.pais === "AR")).toBe(true);
  });

  it("para una ciudad sin aeropuerto propio sugiere el más cercano con su distancia", () => {
    const [pilar] = buscarLugares("Pilar");
    expect(pilar.aeropuertos.length).toBeGreaterThan(0);
    expect(pilar.aeropuertos[0].distanciaKm).toBeGreaterThan(0);
  });

  it("no busca con menos de 2 letras", () => {
    expect(buscarLugares("b")).toEqual([]);
  });

  it("para el destino también encuentra países, en español o inglés, con sus ciudades principales", () => {
    const [peru] = buscarLugares("Perú", 6, true);
    expect(peru.tipo).toBe("pais");
    expect(peru.pais).toBe("PE");
    expect(peru.ciudades?.[0].ciudad).toBe("Lima");
    expect(buscarLugares("Japan", 6, true)[0].pais).toBe("JP");
  });

  it("para el origen no devuelve países", () => {
    expect(buscarLugares("Peru").every((l) => l.tipo === "ciudad")).toBe(true);
  });
});

describe("aeropuertos de la ciudad", () => {
  it("suma los otros aeropuertos cercanos de la misma ciudad", async () => {
    const { aeropuertosDeLaCiudad } = await import("./lugares");
    expect(aeropuertosDeLaCiudad("AEP").split(",")).toContain("EZE");
    expect(aeropuertosDeLaCiudad("AEP").startsWith("AEP")).toBe(true);
    expect(aeropuertosDeLaCiudad("MAD")).toBe("MAD");
  });
});
