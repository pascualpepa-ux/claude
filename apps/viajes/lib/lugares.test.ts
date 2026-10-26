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
});
