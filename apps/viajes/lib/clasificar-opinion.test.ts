import { describe, expect, it } from "vitest";
import { clasificarOpinion } from "./clasificar-opinion";

describe("agente clasificador de opiniones", () => {
  it("separa problemas, mejoras y elogios", () => {
    expect(clasificarOpinion("El buscador no anda en el celular", 3)).toEqual({ categoria: "problema", prioridad: "alta" });
    expect(clasificarOpinion("Estaría bueno que agreguen trenes", 4)).toEqual({ categoria: "mejora", prioridad: "media" });
    expect(clasificarOpinion("Please add trains", 4).categoria).toBe("mejora");
    expect(clasificarOpinion("¡Me encanta, excelente!", 5)).toEqual({ categoria: "elogio", prioridad: "baja" });
    expect(clasificarOpinion("", 5)).toEqual({ categoria: "sin_texto", prioridad: "baja" });
    expect(clasificarOpinion("meh", 1)).toEqual({ categoria: "problema", prioridad: "alta" });
    expect(clasificarOpinion("Lo usé para Roma", 4).categoria).toBe("comentario");
  });
});
