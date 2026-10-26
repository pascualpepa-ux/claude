import { describe, expect, it } from "vitest";
import { sumarDias } from "./fechas";
import { generarViaje, repartirNoches, viajeDeMuestra } from "./mock";
import { calcularResumen } from "./presupuesto";

describe("repartirNoches", () => {
  it("reparte todas las noches respetando el peso", () => {
    expect(repartirNoches([3, 2], 5)).toEqual([3, 2]);
    expect(repartirNoches([3, 2, 2], 10).reduce((s, n) => s + n, 0)).toBe(10);
  });

  it("da al menos una noche por ciudad y no usa más ciudades que noches", () => {
    expect(repartirNoches([3, 2, 2], 2)).toHaveLength(2);
    expect(repartirNoches([3, 2, 2], 3)).toEqual([1, 1, 1]);
  });
});

describe("generarViaje", () => {
  it("con solo el país sugiere ciudades: 5 días en China son Beijing y Shanghái", () => {
    const plan = generarViaje(viajeDeMuestra());
    expect(plan.rutaSugerida).toBe(true);
    expect(plan.ruta.map((r) => r.ciudad)).toEqual(["Beijing", "Shanghái"]);
    expect(plan.dias).toHaveLength(6);
    expect(plan.traslados).toHaveLength(1);
  });

  it("con una ciudad no sugiere ruta", () => {
    const plan = generarViaje({ ...viajeDeMuestra(), destino: "Lisboa" });
    expect(plan.rutaSugerida).toBe(false);
    expect(plan.ruta).toEqual([{ ciudad: "Lisboa", dias: 5 }]);
  });

  it("no pone actividades al aire libre en días de lluvia", () => {
    const base = viajeDeMuestra();
    for (let i = 0; i < 20; i++) {
      const ida = sumarDias(base.fechaIda, i * 7);
      const plan = generarViaje({ ...base, fechaIda: ida, fechaVuelta: sumarDias(ida, 9), destino: "Japón" });
      for (const dia of plan.dias) {
        if (dia.clima.condicion !== "lluvia" && dia.clima.condicion !== "tormenta") continue;
        for (const id of dia.actividades) {
          expect(plan.actividades.find((a) => a.id === id)?.aireLibre).toBe(false);
        }
      }
    }
  });

  it("marca como no verificado el hotel preferido que no se pudo confirmar", () => {
    const plan = generarViaje({ ...viajeDeMuestra(), destino: "Roma", hotelPreferido: "Hotel Artemide" });
    const elegido = plan.hoteles.Roma.find((h) => h.id === plan.hotelElegido.Roma);
    expect(elegido?.nombre).toBe("Hotel Artemide");
    expect(elegido?.origen.estado).toBe("no_verificado");
  });

  it("es determinístico para el mismo pedido", () => {
    const input = viajeDeMuestra();
    const a = generarViaje(input);
    const b = generarViaje(input);
    expect(a.vuelos.map((v) => v.precioPorPersona)).toEqual(b.vuelos.map((v) => v.precioPorPersona));
  });
});

describe("calcularResumen", () => {
  it("el total es la suma de las líneas y se divide por persona", () => {
    const plan = generarViaje(viajeDeMuestra());
    const r = calcularResumen(plan);
    expect(r.total).toBeCloseTo(r.lineas.reduce((s, l) => s + l.monto, 0));
    expect(r.porPersona).toBeCloseTo(r.total / 3);
  });

  it("avisa cuando el viaje se pasa del presupuesto", () => {
    const plan = generarViaje({ ...viajeDeMuestra(), presupuestoMin: 100, presupuestoMax: 500 });
    const r = calcularResumen(plan);
    expect(r.rango.estado).toBe("excedido");
    expect(r.rango.diferencia).toBeCloseTo(r.porPersona - 500);
  });

  it("compara contra el total cuando el presupuesto es por grupo", () => {
    const plan = generarViaje({ ...viajeDeMuestra(), modoPresupuesto: "total", presupuestoMin: 0, presupuestoMax: 1_000_000 });
    const r = calcularResumen(plan);
    expect(r.rango.comparado).toBeCloseTo(r.total);
    expect(r.rango.estado).toBe("dentro");
  });
});
