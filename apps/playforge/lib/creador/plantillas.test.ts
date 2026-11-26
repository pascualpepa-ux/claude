import { expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { PLANTILLAS } from "./espec";
import { construirHtml } from "./construir";

it("todas las plantillas generan un HTML jugable (y se pueden exportar para probar en navegador)", () => {
  const casos = PLANTILLAS.flatMap((p) => [[p.id, construirHtml(p.espec)], [`${p.id}-2j-jefe`, construirHtml({ ...p.espec, dosJugadores: true, jefe: true, enemigos: true, dificultad: 5 })]]);
  for (const [, html] of casos) expect(html).toMatch(/<canvas id="c"><\/canvas>[\s\S]*__ESPEC__/);
  if (process.env.EXPORTAR_PLANTILLAS) writeFileSync(process.env.EXPORTAR_PLANTILLAS, JSON.stringify(casos));
});
