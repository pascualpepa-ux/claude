import { afterEach, describe, expect, it, vi } from "vitest";
import { BOLETOS } from "./__fixtures__/travelpayouts";
import { buscarTravelpayouts } from "./vuelos-travelpayouts";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const pedido = { origen: "AEP", destino: "MAD", regreso: "MAD", ida: "2026-11-26", vuelta: "2026-12-02", clase: "economica" as const, aerolinea: "Iberia", idioma: "es" as const };
const ZONAS: Record<string, string> = { "40.": "Europe/Madrid", "-34.": "America/Argentina/Buenos_Aires" };

function simular() {
  vi.stubEnv("TRAVELPAYOUTS_TOKEN", "prueba");
  vi.stubGlobal("fetch", async (url: string) => {
    const u = new URL(url);
    if (u.hostname === "api.open-meteo.com") {
      const lat = u.searchParams.get("latitude")!;
      return Response.json({ timezone: Object.entries(ZONAS).find(([k]) => lat.startsWith(k))?.[1] ?? "GMT" });
    }
    // Para AEP no hay datos; para EZE (el otro aeropuerto de Buenos Aires), sí.
    return Response.json(u.searchParams.get("origin") === "EZE" ? BOLETOS : { success: true, data: [] });
  });
}

describe("agente de vuelos reales (Aviasales)", () => {
  it("trae aerolínea, número de vuelo, salida, llegada en hora local, duración y precio real", async () => {
    simular();
    const vuelos = await buscarTravelpayouts(pedido);
    // La preferida (Iberia) primero; después la más barata (TAP, con escala) y otra aerolínea directa (Air Europa).
    expect(vuelos?.map((v) => v.aerolinea)).toEqual(["Iberia", "TAP Air Portugal", "Air Europa"]);
    const [ib, tp, ux] = vuelos!;
    expect(ib.ida.segmentos).toEqual([
      { numero: "IB 6856", aerolinea: "Iberia", desde: "EZE", hasta: "MAD", salida: "2026-11-26T13:15:00Z", llegada: "2026-11-27T05:30:00Z", duracionMin: 735 },
    ]);
    expect(ib.vuelta.salida).toBe("2026-12-02T23:55:00Z");
    expect(ib.vuelta.llegada).toBe("2026-12-03T08:50:00Z"); // 23:55 en Madrid + 12 h 55 min = 08:50 en Buenos Aires
    expect(ib.precioPorPersona).toBe(1185);
    expect(ib.linkReserva).toBe("https://www.aviasales.com/search/BUE2611MAD02121?t=IB1");
    expect(tp.ida.escalas).toEqual([""]);
    expect(tp.ida.segmentos).toBeUndefined(); // con escala solo se conoce el primer número
    expect(ux.ida.numeros).toEqual(["UX 42"]);
    // El boleto de otra fecha no se usa.
    expect(vuelos!.some((v) => v.aerolinea === "XX")).toBe(false);
  });

  it("sin clave o sin datos para esas fechas no inventa nada", async () => {
    expect(await buscarTravelpayouts(pedido)).toBeNull();
    simular();
    expect(await buscarTravelpayouts({ ...pedido, ida: "2026-11-20" })).toBeNull();
  });
});
