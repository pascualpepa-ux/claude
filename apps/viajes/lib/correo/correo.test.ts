import { describe, expect, it } from "vitest";
import { correoAviso, correoConfirmacion, enlaceBaja } from "./redactor";
import { verificarCorreo } from "./verificador";

const confirmar = "https://rumbotraveling.com/suscripcion/confirmar?t=abc123";

describe("redactor + verificador", () => {
  it("el email de confirmación sale en el idioma elegido y pasa el verificador", () => {
    const es = correoConfirmacion("es", confirmar, "baja1");
    expect(es.asunto).toBe("Confirmá tu suscripción a Rumbo");
    expect(es.html).toContain("¡Hola, bienvenido a Rumbo!");
    expect(es.html).toContain(">Confirmar</a>");
    expect(es.html).toContain("Un proyecto de Pascual Pepa");
    expect(es.html).toContain(enlaceBaja("baja1"));
    expect(es.html).toContain("/marca/logo-completo-oliva.png");
    expect(verificarCorreo(es, "es")).toEqual([]);

    const en = correoConfirmacion("en", confirmar, "baja1");
    expect(en.html).toContain("Hi, welcome to Rumbo!");
    expect(en.html).toContain(">Confirm</a>");
    expect(verificarCorreo(en, "en")).toEqual([]);
  });

  it("frena un email en el idioma equivocado o mezclado", () => {
    const es = correoConfirmacion("es", confirmar, "baja1");
    expect(verificarCorreo(es, "en").length).toBeGreaterThan(0);
    const mezclado = { ...es, html: es.html.replace("Darme de baja", "Unsubscribe") };
    expect(verificarCorreo(mezclado, "es").join(" ")).toMatch(/texto en en|falta en el HTML/);
  });

  it("frena un email con datos vacíos o sin el link de baja", () => {
    const es = correoConfirmacion("es", confirmar, "baja1");
    expect(verificarCorreo({ ...es, texto: es.texto + " undefined" }, "es")).toContain("tiene datos vacíos o sin completar");
    const sinBaja = { ...es, html: es.html.replaceAll(enlaceBaja("baja1"), "#") };
    expect(verificarCorreo(sinBaja, "es").some((p) => p.includes("falta el enlace"))).toBe(true);
  });

  it("el aviso dice qué cambió, cómo estaba y cómo está", () => {
    const aviso = correoAviso(
      "es",
      {
        titulo: "Tu vuelo UX 41 está demorado",
        detalle: "Madrid a Buenos Aires, 10 de diciembre",
        cambios: [{ que: "Salida de Madrid", antes: "Sale 23:55", ahora: "Sale 01:40 (1 h 45 min de demora)" }],
      },
      "baja1",
    );
    expect(aviso.html).toContain("Antes");
    expect(aviso.html).toContain("Sale 23:55");
    expect(aviso.html).toContain("Sale 01:40 (1 h 45 min de demora)");
    expect(verificarCorreo(aviso, "es")).toEqual([]);
  });

  it("escapa lo que viene de afuera (no se puede meter HTML en un email)", () => {
    const aviso = correoAviso("es", { titulo: "<script>x</script>", detalle: "a & b", cambios: [{ que: "x", antes: "1", ahora: "2" }] }, "b");
    expect(aviso.html).not.toContain("<script>");
    expect(aviso.html).toContain("&lt;script&gt;");
  });
});
