import { afterEach, describe, expect, it, vi } from "vitest";
import { TABLEROS } from "./__fixtures__/aerodatabox";
import { buscarHorarios } from "./horarios-reales";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const pedido = { origen: "AEP", destino: "MAD", regreso: "MAD", ida: "2026-11-26", vuelta: "2026-12-02", clase: "economica" as const, aerolinea: "", idioma: "es" as const };

describe("horarios reales (AeroDataBox)", () => {
  it("arma vuelos directos reales con número, avión, horarios y duración", async () => {
    vi.stubEnv("AERODATABOX_API_KEY", "prueba");
    const pedidos: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      pedidos.push(url);
      const iata = url.match(/airports\/iata\/([A-Z]{3})\//)![1];
      // Cada tablero se pide en dos ventanas de 12 h: la de la tarde trae los vuelos.
      return Response.json({ departures: url.includes("T12:00") ? TABLEROS[iata] ?? [] : [] });
    });
    const vuelos = await buscarHorarios(pedido);
    expect(vuelos?.map((v) => v.aerolinea)).toEqual(["Iberia", "Air Europa", "Aerolíneas Argentinas"]);
    const [ib] = vuelos!;
    expect(ib.ida.segmentos).toEqual([
      { numero: "IB 6856", aerolinea: "Iberia", desde: "EZE", hasta: "MAD", salida: "2026-11-26T13:15:00Z", llegada: "2026-11-27T05:30:00Z", duracionMin: 735, avion: "Airbus A350-900" },
    ]);
    expect(ib.vuelta.numeros).toEqual(["IB 6855"]);
    expect(ib.precioEstimado).toBe(true);
    expect(ib.origen.estado).toBe("estimado");
    expect(ib.precioPorPersona).toBeGreaterThan(0);
    // Busca en los dos aeropuertos de Buenos Aires (AEP y EZE); los codeshare y otros destinos quedan afuera.
    expect(pedidos.some((u) => u.includes("/iata/EZE/"))).toBe(true);
    expect(vuelos!.flatMap((v) => v.ida.numeros)).not.toContain("IB 4321");
  });

  it("sin clave o sin vuelos directos no inventa nada", async () => {
    vi.stubEnv("AERODATABOX_API_KEY", "");
    expect(await buscarHorarios(pedido)).toBeNull();
    vi.stubEnv("AERODATABOX_API_KEY", "prueba");
    vi.stubGlobal("fetch", async () => Response.json({ departures: [] }));
    expect(await buscarHorarios(pedido)).toBeNull();
  });
});
