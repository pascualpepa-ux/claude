import { afterEach, describe, expect, it, vi } from "vitest";
import { IDA, VUELTA } from "./__fixtures__/serpapi-vuelos";
import { diasDespues, horaEmbarque } from "./embarque";
import { buscarVuelos } from "./vuelos-reales";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("vuelos reales (Google Flights vía SerpApi)", () => {
  it("arma cada vuelo con número, horarios, duración, avión y escala", async () => {
    vi.stubEnv("SERPAPI_API_KEY", "prueba");
    vi.stubGlobal("fetch", async (url: string) => {
      const u = new URL(url);
      if (u.pathname === "/account.json") return Response.json({ total_searches_left: 90 });
      const token = u.searchParams.get("departure_token");
      return Response.json(token ? VUELTA[token] : IDA);
    });
    const r = await buscarVuelos({ origen: "MAD", destino: "PEK", regreso: "PEK", ida: "2026-12-05", vuelta: "2026-12-12", clase: "economica", aerolinea: "", equipaje: "valija", idioma: "es" });
    expect(r.estado).toBe("ok");
    if (r.estado !== "ok") return;
    const [ca, lh] = r.vuelos;
    expect(ca.aerolinea).toBe("Air China");
    expect(ca.ida.segmentos).toEqual([
      { numero: "CA 908", aerolinea: "Air China", desde: "MAD", hasta: "PEK", salida: "2026-12-05T12:20:00Z", llegada: "2026-12-06T06:05:00Z", duracionMin: 645, avion: "Airbus A330" },
    ]);
    expect(ca.vuelta.numeros).toEqual(["CA 907"]);
    expect(ca.precioPorPersona).toBe(990);
    expect(lh.ida.escalas).toEqual(["FRA"]);
    expect(lh.ida.segmentos?.[0].escalaMin).toBe(95);
    expect(lh.ida.segmentos?.map((s) => s.numero)).toEqual(["LH 1115", "LH 720"]);
  });

  it("sin clave no inventa vuelos: devuelve solo las distancias", async () => {
    vi.stubEnv("SERPAPI_API_KEY", "");
    const r = await buscarVuelos({ origen: "MAD", destino: "PEK", regreso: "PEK", ida: "2026-12-05", vuelta: "2026-12-12", clase: "economica", aerolinea: "", equipaje: "valija", idioma: "es" });
    expect(r.estado).toBe("sin_clave");
  });

  it("calcula el embarque aproximado y los días de diferencia", () => {
    expect(horaEmbarque("2026-12-05T12:20:00Z", 645)).toBe("2026-12-05T11:30:00.000Z"); // vuelo largo: 50 min antes
    expect(horaEmbarque("2026-12-05T09:40:00Z", 160)).toBe("2026-12-05T09:05:00.000Z"); // vuelo corto: 35 min antes
    expect(diasDespues("2026-12-05T12:20:00Z", "2026-12-06T06:05:00Z")).toBe(1);
  });
});
