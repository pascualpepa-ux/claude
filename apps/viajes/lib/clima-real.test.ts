import { describe, expect, it } from "vitest";
import { coinciden, condicionMet, condicionWmo, resumirMet } from "./clima-real";

describe("agentes del clima", () => {
  it("traduce los códigos de las dos fuentes", () => {
    expect(condicionWmo(0)).toBe("soleado");
    expect(condicionWmo(2)).toBe("parcial");
    expect(condicionWmo(45)).toBe("nublado");
    expect(condicionWmo(63)).toBe("lluvia");
    expect(condicionWmo(73)).toBe("nieve");
    expect(condicionWmo(95)).toBe("tormenta");
    expect(condicionMet("partlycloudy_day")).toBe("parcial");
    expect(condicionMet("fair_night")).toBe("soleado");
    expect(condicionMet("lightrainshowers_day")).toBe("lluvia");
    expect(condicionMet("heavysnow")).toBe("nieve");
    expect(condicionMet("rainandthunder")).toBe("tormenta");
    expect(condicionMet("fog")).toBe("nublado");
  });

  it("el verificador arma el día en hora local", () => {
    const serie = Array.from({ length: 24 }, (_, h) => ({
      time: `2026-11-02T${String(h).padStart(2, "0")}:00:00Z`,
      data: { instant: { details: { air_temperature: 10 + (h % 12) } }, next_1_hours: { summary: { symbol_code: h > 12 ? "rain" : "cloudy" } } },
    }));
    const dias = resumirMet({ properties: { timeseries: serie } }, 0);
    expect(dias.get("2026-11-02")).toEqual({ maxima: 21, minima: 10, condicion: "lluvia" });
  });

  it("verifica solo si las dos fuentes coinciden", () => {
    const a = { maxima: 20, minima: 12, condicion: "soleado" as const, probLluvia: 5 };
    expect(coinciden(a, { maxima: 21.5, minima: 11, condicion: "parcial" })).toBe(true);
    expect(coinciden(a, { maxima: 26, minima: 12, condicion: "soleado" })).toBe(false);
    expect(coinciden(a, { maxima: 20, minima: 12, condicion: "lluvia" })).toBe(false);
  });
});
