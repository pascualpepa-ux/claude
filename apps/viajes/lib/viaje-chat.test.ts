import { describe, expect, it } from "vitest";
import { diasHasta, separarViaje } from "./viaje-chat";

const HOY = "2026-10-30";

describe("separarViaje", () => {
  it("saca la línea y devuelve el viaje", () => {
    const r = separarViaje("¡Buen plan!\n[[VIAJE MAD|CPH|2026-12-10|2026-12-14|2|Copenhague]]", HOY);
    expect(r.texto).toBe("¡Buen plan!");
    expect(r.viaje).toEqual({ origen: "MAD", destino: "CPH", ida: "2026-12-10", vuelta: "2026-12-14", adultos: 2, ciudad: "Copenhague" });
  });

  it("acepta minúsculas y espacios", () => {
    const r = separarViaje("Dale [[ VIAJE mad | fco | 2026-11-20 | 2026-11-23 | 1 | Roma ]]", HOY);
    expect(r.viaje?.destino).toBe("FCO");
    expect(r.viaje?.ciudad).toBe("Roma");
  });

  it("descarta fechas pasadas o al revés", () => {
    expect(separarViaje("[[VIAJE MAD|CPH|2026-10-01|2026-10-05|1|X]]", HOY).viaje).toBeNull();
    expect(separarViaje("[[VIAJE MAD|CPH|2026-12-10|2026-12-01|1|X]]", HOY).viaje).toBeNull();
  });

  it("descarta códigos inválidos o iguales", () => {
    expect(separarViaje("[[VIAJE Madrid|CPH|2026-12-10|2026-12-14|1|X]]", HOY).viaje).toBeNull();
    expect(separarViaje("[[VIAJE CPH|CPH|2026-12-10|2026-12-14|1|X]]", HOY).viaje).toBeNull();
  });

  it("esconde una línea a medio escribir", () => {
    expect(separarViaje("Te armo esto:\n[[VIAJE MAD|CP", HOY)).toEqual({ texto: "Te armo esto:", viaje: null });
  });

  it("limita los adultos", () => {
    expect(separarViaje("[[VIAJE MAD|CPH|2026-12-10|2026-12-14|20|X]]", HOY).viaje?.adultos).toBe(6);
  });
});

describe("diasHasta", () => {
  it("cuenta días de calendario", () => {
    expect(diasHasta("2026-11-02", new Date(2026, 9, 30, 23, 0))).toBe(3);
    expect(diasHasta("2026-10-30", new Date(2026, 9, 30, 8, 0))).toBe(0);
  });
});
