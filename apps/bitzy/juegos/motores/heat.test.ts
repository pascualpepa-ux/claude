import { describe, expect, it, vi } from "vitest";
import { variantesDe } from "@/lib/catalogo/generador";
import { parametros, simular } from "../simulador";
import type { ApiJuego } from "../runtime/tipos";
import heat from "./heatcity";

vi.stubGlobal("window", { devicePixelRatio: 1 });
const C = 230;

/** Piloto que maneja por las calles (de esquina en esquina) hacia el objetivo. */
export function pilotoCalles() {
  let destino: [number, number] | null = null;
  let lento = 0, reversa = 0;
  return (api: ApiJuego, _t: number, s?: Record<string, number | boolean>) => {
    const e = api.entrada; e.desactivar("izq"); e.desactivar("der"); e.desactivar("abajo");
    // si quedó trabado contra un edificio, marcha atrás un momento (como haría una persona)
    if (reversa > 0) { reversa -= 1 / 60; e.activar("abajo"); e.activar(reversa > 0.4 ? "izq" : "der"); return; }
    lento = (s!.v as number) < 50 ? lento + 1 / 60 : 0;
    if (lento > 0.8) { lento = 0; reversa = 0.9; destino = null; return; }
    const x = s!.x as number, y = s!.y as number;
    const ni = Math.round(x / C), nj = Math.round(y / C);
    const ti = Math.round((s!.ox as number) / C), tj = Math.round((s!.oy as number) / C);
    if (!destino || Math.hypot(destino[0] * C - x, destino[1] * C - y) < 45) {
      const di = Math.sign(ti - ni), dj = Math.sign(tj - nj);
      destino = di === 0 && dj === 0 ? [ni, nj] : Math.abs(ti - ni) >= Math.abs(tj - nj) ? [ni + di, nj] : [ni, nj + dj];
    }
    let tx = destino[0] * C, ty = destino[1] * C;
    if (Math.abs(ti - ni) + Math.abs(tj - nj) <= 1) { tx = s!.ox as number; ty = s!.oy as number; }
    let d = Math.atan2(ty - y, tx - x) - (s!.ang as number);
    while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    if (d > 0.1) e.activar("der"); else if (d < -0.1) e.activar("izq");
    if (Math.abs(d) > 0.7 && (s!.v as number) > 220) e.activar("abajo");
  };
}

describe("Heat City", () => {
  it("juega sin errores; un piloto que maneja por las calles a veces gana y a veces pierde", () => {
    const vs = variantesDe("heatcity");
    const res: string[] = [];
    let ganadas = 0;
    for (let k = 0; k < 18; k++) {
      const v = vs.filter((x) => x.dificultad <= 1)[(k * 37) % 400];
      const r = simular(heat, parametros(v), 300, k + 1, pilotoCalles());
      expect(r.error, v.id).toBeUndefined();
      if (r.gano) ganadas++;
      res.push(`${v.id} m${v.modo} d${v.dificultad}: ${r.terminado ? (r.gano ? "GANÓ" : "perdió") : "sigue"} ${r.segundos}s ${r.puntos}pts ${r.mensaje ?? ""}`);
    }
    console.log(res.join("\n"));
    expect(ganadas).toBeGreaterThan(0);
  });
});
