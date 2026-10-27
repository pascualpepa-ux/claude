import { describe, expect, it } from "vitest";
import { correoRespuestaAutomatica } from "./redactor";
import { adivinarIdioma, direccion, esAutomatico } from "./respuestas";
import { verificarCorreo } from "./verificador";

describe("respuestas a los emails", () => {
  it("lee la dirección y no contesta a robots ni a nosotros mismos", () => {
    expect(direccion("Ana Pérez <Ana@Ejemplo.com>")).toBe("ana@ejemplo.com");
    expect(esAutomatico("ana@ejemplo.com")).toBe(false);
    expect(esAutomatico("info@rumbotraveling.com")).toBe(true);
    expect(esAutomatico("respuestas@reply.rumbotraveling.com")).toBe(true);
    expect(esAutomatico("mailer-daemon@icloud.com")).toBe(true);
    expect(esAutomatico("ana@ejemplo.com", { "Auto-Submitted": "auto-replied" })).toBe(true);
    expect(esAutomatico("ana@ejemplo.com", { "Auto-Submitted": "no" })).toBe(false);
  });

  it("contesta en el idioma de la persona", () => {
    expect(adivinarIdioma("Hola, gracias por el email, me suscribo")).toBe("es");
    expect(adivinarIdioma("Hi, thanks for the email, is this free?")).toBe("en");
    const es = correoRespuestaAutomatica("es", "Pascual te invita a Rumbo Traveling");
    expect(es.asunto).toBe("Re: Pascual te invita a Rumbo Traveling");
    expect(es.texto).toContain("se lo vamos a informar a nuestro jefe");
    expect(es.html).not.toContain("Darme de baja");
    expect(verificarCorreo(es, "es")).toEqual([]);
    const en = correoRespuestaAutomatica("en", "Re: hello");
    expect(en.asunto).toBe("Re: hello");
    expect(verificarCorreo(en, "en")).toEqual([]);
  });
});
