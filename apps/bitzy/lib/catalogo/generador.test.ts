import { describe, expect, it } from "vitest";
import { catalogo, juegoPorId, totalJuegos, variantesDe } from "./generador";
import { buscar, desafioDelDia, publicados } from "./consultas";
import { MOTORES } from "./motores";
import { portadaSvg } from "../portadas";

describe("catálogo", () => {
  it("tiene al menos 10.535 juegos publicados", () => {
    expect(totalJuegos()).toBeGreaterThanOrEqual(10535);
    expect(catalogo().length).toBe(totalJuegos());
    expect(publicados("2026-11-26").length).toBeGreaterThanOrEqual(10535);
  });

  it("ids únicos y nombres únicos dentro de cada motor", () => {
    const ids = new Set(catalogo().map((j) => j.id));
    expect(ids.size).toBe(catalogo().length);
    for (const m of MOTORES) {
      const nombres = new Set(variantesDe(m.id).map((j) => j.nombre.toLowerCase()));
      expect(nombres.size).toBe(variantesDe(m.id).length);
    }
  });

  it("cada variante es determinística", () => {
    const a = juegoPorId("serpiente-42")!;
    expect(a).toBeDefined();
    expect(a.nombre).toBe(variantesDe("serpiente")[42].nombre);
    expect(portadaSvg(a)).toBe(portadaSvg(juegoPorId("serpiente-42")!));
    expect(juegoPorId("nada-1")).toBeUndefined();
    expect(juegoPorId("serpiente-99999")).toBeUndefined();
  });

  it("cubre todas las combinaciones de ejes por motor", () => {
    const combos = new Set(variantesDe("naves").map((j) => `${j.tema}|${j.dificultad}|${j.modo}|${j.mapa}`));
    expect(combos.size).toBe(1080);
  });

  it("búsqueda y desafío diario", () => {
    expect(buscar({ q: "serpiente" }).length).toBeGreaterThan(0);
    expect(buscar({ genero: "ritmo" }).every((j) => j.generos.includes("ritmo"))).toBe(true);
    expect(desafioDelDia("2026-11-26").id).toBe(desafioDelDia("2026-11-26").id);
    expect(desafioDelDia("2026-11-26").id).not.toBe(desafioDelDia("2026-11-27").id);
  });
});

describe("buscador tolerante", () => {
  it("encuentra Heat City aunque se escriba mal", async () => {
    const { buscar } = await import("./consultas");
    for (const q of ["hit city", "Hit City", "heat city", "jit siti", "heatcity", "heat"]) {
      const r = buscar({ q });
      expect(r.length, q).toBeGreaterThan(0);
      expect(r[0].motor, q).toBe("heatcity");
    }
  });
  it("entiende sinónimos y errores de tipeo", async () => {
    const { buscar } = await import("./consultas");
    expect(buscar({ q: "autos" }).every((j) => j.generos.includes("coches"))).toBe(true);
    expect(buscar({ q: "serpinte" })[0].motor).toBe("serpiente");
    expect(buscar({ q: "estacionar" })[0].motor).toBe("estacionar");
    expect(buscar({ q: "zzzzqqq" }).length).toBe(0);
  });
});
