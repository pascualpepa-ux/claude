import { describe, expect, it } from "vitest";
import { gastosDeMuestra, quienDebeAQuien, saldos } from "./gastos";

const V = ["Pascual", "Lucía", "Martín"];

describe("quién debe a quién", () => {
  it("calcula lo que puso cada uno, lo que le toca y el saldo", () => {
    const s = saldos(
      [
        { id: "1", descripcion: "Hotel", monto: 300, pagadoPor: "Pascual", entre: V },
        { id: "2", descripcion: "Cena", monto: 60, pagadoPor: "Lucía", entre: V },
      ],
      V,
    );
    expect(s).toEqual([
      { persona: "Pascual", pago: 300, leToca: 120, saldo: 180 },
      { persona: "Lucía", pago: 60, leToca: 120, saldo: -60 },
      { persona: "Martín", pago: 0, leToca: 120, saldo: -120 },
    ]);
    expect(quienDebeAQuien(s)).toEqual([
      { de: "Martín", a: "Pascual", monto: 120 },
      { de: "Lucía", a: "Pascual", monto: 60 },
    ]);
  });

  it("divide solo entre los que participaron y reparte los centavos para que cierre exacto", () => {
    const s = saldos([{ id: "1", descripcion: "Taxi", monto: 10, pagadoPor: "Lucía", entre: V }], V);
    expect(s.reduce((x, y) => x + y.leToca, 0)).toBeCloseTo(10, 5);
    expect(s.map((x) => x.leToca)).toEqual([3.34, 3.33, 3.33]);
    const solo2 = saldos([{ id: "1", descripcion: "Taxi", monto: 30, pagadoPor: "Lucía", entre: ["Lucía", "Martín"] }], V);
    expect(quienDebeAQuien(solo2)).toEqual([{ de: "Martín", a: "Lucía", monto: 15 }]);
  });

  it("si todos pusieron lo mismo, nadie le debe a nadie; el ejemplo cierra en cero", () => {
    const s = saldos(
      V.map((p, i) => ({ id: String(i), descripcion: "x", monto: 50, pagadoPor: p, entre: V })),
      V,
    );
    expect(quienDebeAQuien(s)).toEqual([]);
    const m = saldos(gastosDeMuestra(V, "es"), V);
    expect(m.reduce((x, y) => x + y.saldo, 0)).toBeCloseTo(0, 5);
    const tr = quienDebeAQuien(m);
    expect(tr.length).toBeLessThanOrEqual(2);
  });
});
