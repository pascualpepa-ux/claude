import { describe, expect, it } from "vitest";
import { control, leerMrz, paisDos, CODIGOS_PAIS } from "./pasaporte";

// Ejemplo oficial de la OACI (Doc 9303): pasaporte de "Utopia" (UTO). Se cambia el país por ESP para probar el mapeo.
const L1 = "P<ESPERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<";
const L2 = "L898902C36ESP7408122F1204159ZE184226B<<<<<10";

describe("pasaporte", () => {
  it("calcula el dígito de control", () => {
    expect(control("L898902C3")).toBe(6);
    expect(control("740812")).toBe(2);
    expect(control("120415")).toBe(9);
  });

  it("lee las dos líneas", () => {
    expect(leerMrz(`ruido arriba\n${L1}\n${L2}\n`)).toEqual({
      nombre: "Anna Maria",
      apellido: "Eriksson",
      numero: "L898902C3",
      pais: "ES",
      nacimiento: "1974-08-12",
      vence: "2012-04-15",
      genero: "f",
    });
  });

  it("tolera espacios y una O leída en vez de 0 en las fechas", () => {
    const l2 = L2.replace("7408122", "74O8122");
    expect(leerMrz(`${L1.replace(/</g, " < ").replace(/ /g, "")}\n${l2.slice(0, 20)} ${l2.slice(20)}`)?.nacimiento).toBe("1974-08-12");
  });

  it("descarta si un dígito de control no coincide", () => {
    expect(leerMrz(`${L1}\n${L2.replace("L898902C36", "L898902C37")}`)).toBeNull();
  });

  it("convierte países", () => {
    expect(paisDos("ITA")).toBe("IT");
    expect(paisDos("D<<")).toBe("DE");
    expect(paisDos("XXX")).toBeNull();
    expect(CODIGOS_PAIS).toContain("AR");
    expect(CODIGOS_PAIS.length).toBe(249);
  });
});
