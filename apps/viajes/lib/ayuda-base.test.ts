import { describe, expect, it } from "vitest";
import { BASE_AYUDA, buscarAyuda } from "./ayuda-base";

describe("ficha de ayuda", () => {
  it("responde las preguntas sugeridas tal cual", () => {
    for (const idioma of ["es", "en"] as const) {
      for (const e of BASE_AYUDA[idioma]) expect(buscarAyuda(e.pregunta, idioma)?.id).toBe(e.id);
    }
  });

  it("entiende preguntas escritas de otra forma", () => {
    expect(buscarAyuda("como hago para empezar a planificar?", "es")?.id).toBe("armar");
    expect(buscarAyuda("Necesito visa para ir a China?", "es")?.id).toBe("requisitos");
    expect(buscarAyuda("se puede pagar con tarjeta aca", "es")?.id).toBe("reservar");
    expect(buscarAyuda("puedo mandarle el viaje a mis amigos por whatsapp", "es")?.id).toBe("guardar");
    expect(buscarAyuda("cual es el aeropuerto mas cercano a mi casa", "es")?.id).toBe("aeropuerto");
    expect(buscarAyuda("is it free?", "en")?.id).toBe("gratis");
    expect(buscarAyuda("Do I need a visa?", "en")?.id).toBe("requisitos");
    expect(buscarAyuda("cuanto sale un vuelo a madrid", "es")?.id).toBe("ejemplo");
    expect(buscarAyuda("puedo ir con mis hijos?", "es")?.id).toBe("ninos");
    expect(buscarAyuda("que hago en paris", "es")?.id).toBe("recomendaciones");
    expect(buscarAyuda("hay hoteles baratos?", "es")?.id).toBe("alojamiento");
    expect(buscarAyuda("se puede poner varios destinos", "es")?.id).toBe("pais");
    expect(buscarAyuda("hola!", "es")?.id).toBe("saludo");
    expect(buscarAyuda("buenas tardes, como armo un viaje?", "es")?.id).toBe("armar");
    expect(buscarAyuda("hi, can you help me plan a trip", "en")?.id).toBe("armar");
  });

  it("no inventa cuando no sabe", () => {
    expect(buscarAyuda("cual es la capital de mongolia", "es")).toBeNull();
    expect(buscarAyuda("", "es")).toBeNull();
  });

  it("es y en tienen los mismos temas", () => {
    expect(BASE_AYUDA.en.map((e) => e.id)).toEqual(BASE_AYUDA.es.map((e) => e.id));
  });
});
