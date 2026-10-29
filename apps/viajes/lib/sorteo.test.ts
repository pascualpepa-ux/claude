import { describe, expect, it } from "vitest";
import { elegir } from "./sorteo";

const lista = [
  { email: "a", chances: 1 },
  { email: "b", chances: 3 },
  { email: "c", chances: 1 },
];

describe("elegir", () => {
  it("cada chance es un número del sorteo: b tiene los números 1, 2 y 3", () => {
    expect([0, 1, 2, 3, 4].map((n) => elegir(lista, () => n)!.email)).toEqual(["a", "b", "b", "b", "c"]);
  });
  it("sin participantes no hay ganador", () => {
    expect(elegir([], () => 0)).toBeNull();
  });
});
