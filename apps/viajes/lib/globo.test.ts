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

describe("tocar el globo", () => {
  it("desproyectar deshace proyectar", async () => {
    const { desproyectar } = await import("./globo");
    for (const [lat, lon] of [[41.9, 12.5], [-34.6, -58.4], [35.7, 139.7]]) {
      // Girado un poco respecto de "de frente", para que el punto no quede justo en el centro.
      const { phi: p0, theta: t0 } = enfocar(lat, lon);
      const [phi, theta] = [p0 + 0.4, t0 - 0.3];
      const p = proyectar(lat, lon, phi, theta);
      expect(p.z).toBeGreaterThan(0);
      const v = desproyectar(p.x, p.y, phi, theta)!;
      expect(v.lat).toBeCloseTo(lat, 6);
      expect(v.lon).toBeCloseTo(lon, 6);
    }
    expect(desproyectar(0.02, 0.02, 0, 0)).toBeNull();
  });

  it("encuentra el país en un punto", async () => {
    const { paisEn } = await import("./fronteras");
    expect(paisEn(41.9, 12.5)).toBe("IT");
    expect(paisEn(-34.6, -58.4)).toBe("AR");
    expect(paisEn(40.4, -3.7)).toBe("ES");
    expect(paisEn(-29.6, 28.2)).toBe("LS"); // Lesoto, adentro de Sudáfrica
    expect(paisEn(64, 100)).toBe("RU");
    expect(paisEn(0, -30)).toBeNull(); // Atlántico
  });

  it("todos los países tienen datos y bandera", async () => {
    const { PAISES, bandera, nombrePais, paisPorCodigo } = await import("./paises");
    const { BORDES } = await import("./fronteras");
    expect(PAISES.length).toBe(250);
    for (const c of Object.keys(BORDES)) expect(paisPorCodigo(c), c).toBeDefined();
    expect(bandera("AR")).toBe("🇦🇷");
    expect(nombrePais("DK", "es")).toBe("Dinamarca");
    expect(paisPorCodigo("it")?.aeropuerto).toBe("FCO");
  });
});
