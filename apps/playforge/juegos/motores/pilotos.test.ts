import { describe, expect, it, vi } from "vitest";
import { variantesDe } from "@/lib/catalogo/generador";
import { CARGADORES } from "./index";
import { parametros, simular } from "../simulador";
import type { ApiJuego } from "../runtime/tipos";

vi.stubGlobal("window", { devicePixelRatio: 1 });

function clic(api: ApiJuego, x: number, y: number) {
  const e = api.entrada;
  e.puntero = { x, y, abajo: true, pulsado: true, soltado: false, activo: true };
  const t = { id: 1, x, y, inicioX: x, inicioY: y };
  e.toques.set(1, t); e.toquesNuevos.push(t);
}
function soltar(api: ApiJuego) { api.entrada.puntero.abajo = false; api.entrada.puntero.soltado = true; api.entrada.toques.clear(); }

describe("pilotos automáticos", () => {
  it("gemas: intercambiar vecinas suma puntos y la partida avanza", async () => {
    const mod = (await CARGADORES.gemas()).default;
    const v = variantesDe("gemas").find((j) => j.modo === 0)!;
    let k = 0;
    const r = simular(mod, parametros(v), 240, 3, (api, t) => {
      const fase = Math.floor(t * 4);
      if (fase === k) return;
      k = fase;
      const par = Math.floor(fase / 2) % 56;
      const f = Math.floor(par / 7), c = par % 7;
      soltar(api);
      clic(api, 24 + (fase % 2 === 0 ? c : c + 1) * 62 + 31, 160 + f * 62 + 31);
    });
    expect(r.error).toBeUndefined();
    expect(r.puntos).toBeGreaterThan(0);
  });

  it("defensa: colocar torres frena oleadas", async () => {
    const mod = (await CARGADORES.defensa()).default;
    const v = variantesDe("defensa").find((j) => j.modo === 0 && j.dificultad === 0)!;
    let n = 0;
    const r = simular(mod, parametros(v), 400, 3, (api, t) => {
      const paso = Math.floor(t * 2);
      if (paso === n) { soltar(api); return; }
      n = paso;
      clic(api, ((paso * 3) % 16) * 50 + 25, ((paso * 5) % 9) * 50 + 25);
    });
    expect(r.error).toBeUndefined();
    expect(r.puntos).toBeGreaterThan(100);
    console.log("defensa", r);
  });

  it("corredor: saltar a tiempo suma metros", async () => {
    const mod = (await CARGADORES.corredor()).default;
    const v = variantesDe("corredor").find((j) => j.modo === 0)!;
    const r = simular(mod, parametros(v), 60, 1, (api, t) => { if (Math.floor(t * 60) % 40 === 0) api.entrada.activar("a"); else api.entrada.desactivar("a"); });
    expect(r.error).toBeUndefined();
    expect(r.puntos).toBeGreaterThan(20);
  });
});
