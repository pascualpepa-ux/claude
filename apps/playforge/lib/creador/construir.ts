import { temaPorId } from "../temas";
import type { EspecJuego } from "./espec";
import { MOTOR_JS } from "./motor-html";

const escaparHtml = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");

/** Arma un juego HTML autocontenido (sin dependencias externas) a partir de la especificación. */
export function construirHtml(e: EspecJuego): string {
  const t = temaPorId(e.estilo);
  const tema = { fondo: t.fondo, fondo2: t.fondo2, primario: t.primario, secundario: t.secundario, acento: t.acento, peligro: t.peligro, texto: t.texto, escala: t.escala, tonica: t.tonica };
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<title>${escaparHtml(e.titulo)}</title>
<style>html,body{margin:0;height:100%;background:${t.fondo};overflow:hidden;touch-action:none;user-select:none}body{display:grid;place-items:center}canvas{display:block}</style>
</head><body><canvas id="c"></canvas>
<script>window.__ESPEC__=${json(e)};window.__TEMA__=${json(tema)};</script>
<script>${MOTOR_JS}</script>
</body></html>`;
}
