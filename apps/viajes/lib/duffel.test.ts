import { afterEach, describe, expect, it, vi } from "vitest";
import { conComision } from "./duffel";

afterEach(() => vi.unstubAllEnvs());

describe("conComision", () => {
  it("suma 10% por defecto", () => {
    expect(conComision(200)).toBe(220);
  });
  it("se configura en Vercel", () => {
    vi.stubEnv("RESERVAS_COMISION_PORCENTAJE", "10");
    vi.stubEnv("RESERVAS_COMISION_FIJA", "0");
    expect(conComision(80)).toBe(88);
  });
});
