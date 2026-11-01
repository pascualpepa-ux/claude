import { describe, expect, it } from "vitest";
import { GUIAS } from "./guias";
import { enfocar, proyectar, UBICACIONES } from "./globo";

describe("globo", () => {
  it("cada guía tiene su lugar en el globo", () => {
    for (const g of GUIAS) expect(UBICACIONES[g.slug], g.slug).toBeDefined();
  });

  it("un punto enfocado queda en el centro y de frente", () => {
    for (const { lat, lon } of Object.values(UBICACIONES)) {
      const { phi, theta } = enfocar(lat, lon);
      const p = proyectar(lat, lon, phi, theta);
      expect(p.x).toBeCloseTo(0.5, 6);
      expect(p.y).toBeCloseTo(0.5, 6);
      expect(p.z).toBeCloseTo(1, 6);
    }
  });

  it("el lado de atrás no se ve", () => {
    const { phi, theta } = enfocar(40, -3.7); // Madrid de frente
    expect(proyectar(-35, 139, phi, theta).z).toBeLessThan(0); // Australia atrás
  });
});

describe("climaAhora", () => {
  it("lee la respuesta de varios lugares", async () => {
    const { climaAhora } = await import("./globo");
    const original = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify([
        { timezone: "Europe/Rome", current: { temperature_2m: 17.6, weather_code: 1 } },
        { timezone: "Asia/Tokyo" },
      ]))) as typeof fetch;
    try {
      expect(await climaAhora([{ lat: 41.9, lon: 12.5 }, { lat: 35.7, lon: 139.7 }])).toEqual([{ temperatura: 18, codigo: 1, zona: "Europe/Rome" }, null]);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("si falla, no inventa nada", async () => {
    const { climaAhora } = await import("./globo");
    const original = globalThis.fetch;
    globalThis.fetch = (async () => { throw new Error("sin red"); }) as typeof fetch;
    try {
      expect(await climaAhora([{ lat: 1, lon: 1 }])).toEqual([null]);
    } finally {
      globalThis.fetch = original;
    }
  });
});
