import { describe, expect, it } from "vitest";
import { cambioDeClimaImportante, compararVuelo, describirClima, tocaConsultar } from "./vigilancia";

describe("vigilancia del clima", () => {
  const seco = { condicion: "soleado" as const, maxima: 22, minima: 13, probLluvia: 5 };
  it("avisa solo cambios importantes", () => {
    expect(cambioDeClimaImportante(seco, { ...seco, maxima: 24 })).toBe(false);
    expect(cambioDeClimaImportante(seco, { ...seco, condicion: "parcial" })).toBe(false);
    expect(cambioDeClimaImportante(seco, { ...seco, condicion: "lluvia", probLluvia: 80 })).toBe(true);
    expect(cambioDeClimaImportante(seco, { ...seco, maxima: 16 })).toBe(true);
  });
  it("describe el clima en el idioma del suscriptor", () => {
    expect(describirClima(seco, "es")).toBe("Soleado, 22° / 13°, probabilidad de lluvia 5%");
    expect(describirClima(seco, "en")).toMatch(/^Sunny/);
  });
});

describe("vigilancia de vuelos", () => {
  const ahora = { estado: "Expected", salida: "2026-12-10 23:55", puerta: "B12", terminal: "4", programada: "2026-12-10 23:55", desde: "MAD", utc: "2026-12-10T22:55Z" };
  it("detecta demoras, cancelaciones y cambio de puerta con el antes y el ahora", () => {
    const base = { estado: "Expected", salida: "2026-12-10 23:55", puerta: "B12", terminal: "4" };
    expect(compararVuelo("UX 41", base, ahora, "es").cambios).toEqual([]);
    const demora = compararVuelo("UX 41", base, { ...ahora, estado: "Delayed", salida: "2026-12-11 01:40" }, "es");
    expect(demora.titulo).toBe("Tu vuelo UX 41 está demorado");
    expect(demora.cambios[0]).toEqual({ que: "Vuelo UX 41, salida de MAD", antes: "23:55", ahora: "01:40" });
    const puerta = compararVuelo("UX 41", base, { ...ahora, puerta: "C3" }, "en");
    expect(puerta.cambios).toEqual([{ que: "Flight UX 41, boarding gate", antes: "B12", ahora: "C3" }]);
    const cancelado = compararVuelo("UX 41", base, { ...ahora, estado: "Canceled" }, "es");
    expect(cancelado.titulo).toBe("Tu vuelo UX 41 fue cancelado");
    expect(cancelado.cambios[0]).toMatchObject({ antes: "Programado", ahora: "Cancelado" });
  });
  it("avisa cuando se asigna la puerta y cuando empieza el embarque, con número, terminal, salida y embarque", () => {
    const sinPuerta = { estado: "Expected", salida: "2026-12-10 23:55", puerta: "", terminal: "" };
    const asignada = compararVuelo("UX 41", sinPuerta, ahora, "es", 765);
    expect(asignada.titulo).toBe("Tu vuelo UX 41 sale por la puerta B12");
    expect(asignada.cambios).toEqual([
      { que: "Vuelo UX 41, puerta de embarque", antes: "Sin informar", ahora: "B12" },
      { que: "Vuelo UX 41, terminal", antes: "Sin informar", ahora: "4" },
      { que: "Vuelo UX 41, salida y embarque aprox.", antes: "—", ahora: "sale 23:55 · embarque aprox. 23:05" },
    ]);
    const conPuerta = { ...sinPuerta, puerta: "B12", terminal: "4" };
    const embarcando = compararVuelo("UX 41", conPuerta, { ...ahora, estado: "Boarding" }, "en", 765);
    expect(embarcando.titulo).toBe("Your flight UX 41 is boarding at gate B12");
    expect(embarcando.cambios[0]).toEqual({ que: "Flight UX 41, status", antes: "Scheduled", ahora: "Boarding" });
  });
  it("consulta poco: el día antes y desde 6 h antes de salir, y deja de consultar al despegar", () => {
    const salida = Date.parse("2026-12-10T22:55:00Z");
    const g = { estado: "Expected", salida: "2026-12-10 23:55", puerta: "", terminal: "", utc: "2026-12-10T22:55Z" };
    expect(tocaConsultar(g, "2026-12-10T23:55", salida - 8 * 3600_000)).toBe(false);
    expect(tocaConsultar(g, "2026-12-10T23:55", salida - 5 * 3600_000)).toBe(true);
    expect(tocaConsultar({ ...g, estado: "Departed" }, "2026-12-10T23:55", salida)).toBe(false);
    expect(tocaConsultar(undefined, "2026-12-10T23:55", salida - 30 * 3600_000)).toBe(true);
    expect(tocaConsultar(undefined, "2026-12-10T23:55", salida - 3 * 24 * 3600_000)).toBe(false);
  });
});

describe("vigilancia de hoteles", () => {
  it("avisa cambios de precio de 5% o más y cuando se pierde o vuelve la disponibilidad", async () => {
    const { cambioDeHotel } = await import("./vigilancia");
    expect(cambioDeHotel(100, 104)).toBe(false);
    expect(cambioDeHotel(100, 106)).toBe(true);
    expect(cambioDeHotel(100, 90)).toBe(true);
    expect(cambioDeHotel(100, null)).toBe(true);
    expect(cambioDeHotel(null, 120)).toBe(true);
    expect(cambioDeHotel(null, null)).toBe(false);
  });

  it("calcula las fechas de hotel de cada ciudad del viaje", async () => {
    const { estadiasPorCiudad, generarViaje, viajeDeMuestra } = await import("./mock");
    const plan = generarViaje(viajeDeMuestra());
    const e = estadiasPorCiudad(plan);
    expect(e[0].entrada).toBe(plan.input.fechaIda);
    expect(e.at(-1)!.salida).toBe(plan.input.fechaVuelta);
    for (let i = 1; i < e.length; i++) expect(e[i].entrada).toBe(e[i - 1].salida);
  });
});
