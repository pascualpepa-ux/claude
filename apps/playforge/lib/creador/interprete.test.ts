import { describe, expect, it } from "vitest";
import { interpretar } from "./interprete";
import { construirHtml } from "./construir";

describe("intérprete del creador", () => {
  it("crea y modifica un juego charlando", () => {
    const a = interpretar("un juego de naves donde esquivo meteoritos y junto monedas", null);
    expect(a.espec.genero).toBe("esquivar");
    expect(a.espec.jugador).toBe("nave");
    expect(a.espec.obstaculo).toBe("meteoritos");
    const b = interpretar("hacé la nave más rápida", a.espec);
    expect(b.espec.velocidadJugador).toBeGreaterThan(a.espec.velocidadJugador);
    const c = interpretar("agregá un jefe final", b.espec);
    expect(c.espec.jefe).toBe(true);
    const d = interpretar("cambiá los colores a neón", c.espec);
    expect(d.espec.estilo).toBe("neon");
    const e = interpretar("modo dos jugadores", d.espec);
    expect(e.espec.dosJugadores).toBe(true);
    expect(interpretar("bla bla", e.espec).entendido).toBe(false);
    const html = construirHtml(e.espec);
    expect(html).toContain("<canvas");
    expect(html).not.toContain("</script><script>alert");
  });
});
