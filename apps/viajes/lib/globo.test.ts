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
