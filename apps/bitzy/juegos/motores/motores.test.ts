import { describe, expect, it, vi } from "vitest";
import { MOTORES } from "@/lib/catalogo/motores";
import { variantesDe } from "@/lib/catalogo/generador";
import { CARGADORES } from "./index";
import { parametros, simular } from "../simulador";

vi.stubGlobal("window", { devicePixelRatio: 1 });

describe("motores", () => {
  it("cada motor del catálogo tiene código", () => {
    for (const m of MOTORES) expect(CARGADORES[m.id], m.id).toBeDefined();
  });

  for (const m of MOTORES) {
    it(`${m.id}: 12 variantes juegan 75 s sin errores`, async () => {
      const mod = (await CARGADORES[m.id]()).default;
      const vs = variantesDe(m.id);
      let terminadas = 0;
      for (let i = 0; i < 12; i++) {
        const v = vs[(i * 97) % vs.length];
        const r = simular(mod, parametros(v), 75, i + 1);
        expect(r.error, `${v.id} modo ${v.modo}`).toBeUndefined();
        if (r.terminado) terminadas++;
      }
      console.log(`${m.id}: ${terminadas}/12 partidas terminaron con entradas al azar`);
    }, 60_000);
  }
});
