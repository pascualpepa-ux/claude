import { describe, expect, it, vi } from "vitest";
import { crearRng } from "@/lib/rng";
import { variantesDe } from "@/lib/catalogo/generador";
import { parametros, simular } from "../simulador";
import { chocan, generar, vertices } from "./estacionar";
import montana from "./montana";
import derrape from "./derrape";

vi.stubGlobal("window", { devicePixelRatio: 1 });

describe("juegos de coches", () => {
  it("estacioná: en todos los niveles el lugar objetivo está libre y el auto arranca sin chocar", () => {
    for (let s = 0; s < 120; s++) for (let n = 0; n < 6; n++) {
      const nv = generar(crearRng(s * 31 + 7), n, s % 5, ["#f00"]);
      const l = nv.lugar;
      const auto = vertices({ x: l.x, y: l.y, w: 54, h: 28, ang: l.sentido ?? l.ang });
      expect(nv.obst.some((o) => chocan(auto, vertices(o))), `semilla ${s} nivel ${n}: lugar ocupado`).toBe(false);
      const inicio = vertices({ x: nv.inicio.x, y: nv.inicio.y, w: 54, h: 28, ang: nv.inicio.ang });
      expect(nv.obst.some((o) => chocan(inicio, vertices(o))), `semilla ${s} nivel ${n}: arranque bloqueado`).toBe(false);
    }
  });

  it("subida extrema: un piloto cuidadoso gana las variantes fáciles", () => {
    const fáciles = variantesDe("montana").filter((v) => v.dificultad <= 1 && v.modo === 0).slice(0, 6);
    let ganadas = 0;
    for (const v of fáciles) {
      const r = simular(montana, parametros(v), 240, 1, (api, _t, s) => {
        const e = api.entrada; e.desactivar("der"); e.desactivar("izq");
        const d = (s!.a as number) - (s!.pend as number);
        if (s!.aire) { if (d > 0.25) e.activar("der"); else if (d < -0.35) e.activar("izq"); }
        else if (d > -0.55) e.activar("der");
      });
      expect(r.error).toBeUndefined();
      if (r.gano) ganadas++;
    }
    expect(ganadas).toBeGreaterThanOrEqual(4);
  });

  it("derrape GP: un piloto que sigue la pista completa la carrera", () => {
    const v = variantesDe("derrape").find((x) => x.modo === 0 && x.dificultad === 0)!;
    const r = simular(derrape, parametros(v), 300, 1, (api, _t, s) => {
      const e = api.entrada; e.desactivar("izq"); e.desactivar("der");
      let d = (s!.objAng as number) - (s!.ang as number);
      while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      if (d > 0.08) e.activar("der"); else if (d < -0.08) e.activar("izq");
    });
    expect(r.terminado).toBe(true);
    expect(r.gano).toBe(true);
  });
});
