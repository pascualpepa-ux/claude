import { describe, expect, it } from "vitest";
import { calcular, responderCuenta } from "./calculadora";

describe("calculadora del guía", () => {
  it("resuelve cuentas con números y con palabras", () => {
    expect(responderCuenta("2+2", "es")).toBe("2 + 2 = 4");
    expect(responderCuenta("¿Cuánto es 2 más 2?", "es")).toBe("2 + 2 = 4");
    expect(responderCuenta("cuanto es 15 por 3", "es")).toBe("15 × 3 = 45");
    expect(responderCuenta("10 dividido 4", "es")).toBe("10 ÷ 4 = 2,5");
    expect(responderCuenta("what is 7 times 8?", "en")).toBe("7 × 8 = 56");
    expect(responderCuenta("(3+2)^2", "es")).toBe("(3 + 2)^2 = 25");
    expect(responderCuenta("20% de 150", "es")).toBe("20 ÷ 100 × 150 = 30");
    expect(responderCuenta("1.500 menos 250", "es")).toBe("1500 − 250 = 1.250");
    expect(responderCuenta("2,5 x 4", "es")).toBe("2.5 × 4 = 10");
  });

  it("respeta el orden de las operaciones", () => {
    expect(calcular("2+3*4")).toBe(14);
    expect(calcular("(2+3)*4")).toBe(20);
    expect(calcular("2^3^2")).toBe(512);
    expect(calcular("-3+5")).toBe(2);
  });

  it("no confunde preguntas normales con cuentas", () => {
    expect(responderCuenta("¿Cómo armo mi viaje?", "es")).toBeNull();
    expect(responderCuenta("viajo el 10 de diciembre", "es")).toBeNull();
    expect(responderCuenta("somos 4 personas", "es")).toBeNull();
    expect(responderCuenta("1/0", "es")).toBeNull();
    expect(responderCuenta("2+", "es")).toBeNull();
  });
});
