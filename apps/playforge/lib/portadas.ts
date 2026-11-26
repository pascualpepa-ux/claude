import { crearRng, entre, type Rng } from "./rng";
import { conAlfa, mezclarColor, temaPorId, type Tema } from "./temas";
import type { Juego } from "./catalogo/tipos";

/**
 * Portadas generadas por código (SVG, 320×200): mismo juego → misma portada.
 * Cada motor dibuja su escena y la temática pone colores y ambiente.
 */
const W = 320;
const H = 200;

function ambiente(t: Tema, rng: Rng): string {
  let s = "";
  const n = 26;
  for (let i = 0; i < n; i++) {
    const x = entre(rng, 0, W).toFixed(1);
    const y = entre(rng, 0, H).toFixed(1);
    const r = entre(rng, 0.6, 2.6).toFixed(1);
    const a = entre(rng, 0.25, 0.8).toFixed(2);
    switch (t.ambiente) {
      case "estrellas": s += `<circle cx="${x}" cy="${y}" r="${(+r * 0.6).toFixed(1)}" fill="#fff" opacity="${a}"/>`; break;
      case "burbujas": s += `<circle cx="${x}" cy="${y}" r="${(+r * 2.2).toFixed(1)}" fill="none" stroke="${t.primario}" stroke-width="1" opacity="${a}"/>`; break;
      case "nieve": s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${a}"/>`; break;
      case "brasas": s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${t.secundario}" opacity="${a}"/>`; break;
      case "hojas": s += `<ellipse cx="${x}" cy="${y}" rx="${(+r * 2).toFixed(1)}" ry="${r}" fill="${t.primario}" opacity="${a}" transform="rotate(${Math.floor(rng() * 180)} ${x} ${y})"/>`; break;
      case "lluvia": s += `<line x1="${x}" y1="${y}" x2="${(+x - 4).toFixed(1)}" y2="${(+y + 12).toFixed(1)}" stroke="${t.secundario}" stroke-width="1" opacity="${a}"/>`; break;
      case "pixeles": s += `<rect x="${x}" y="${y}" width="${(+r * 2).toFixed(1)}" height="${(+r * 2).toFixed(1)}" fill="${i % 2 ? t.primario : t.secundario}" opacity="${(+a * 0.6).toFixed(2)}"/>`; break;
      case "luciernagas": s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${t.acento}" opacity="${a}"/>`; break;
      case "polvo": s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${t.primario}" opacity="${(+a * 0.5).toFixed(2)}"/>`; break;
      case "niebla": s += `<ellipse cx="${x}" cy="${y}" rx="${(+r * 18).toFixed(0)}" ry="${(+r * 4).toFixed(0)}" fill="#fff" opacity="${(+a * 0.07).toFixed(3)}"/>`; break;
    }
  }
  return s;
}

const glow = (c: string) => `filter="url(#g)" style="color:${c}"`;

function escena(motor: string, t: Tema, rng: Rng, mapa: number): string {
  const p = t.primario, s2 = t.secundario, a = t.acento, d = t.peligro;
  switch (motor) {
    case "serpiente": {
      let path = "";
      let x = 40 + rng() * 30, y = 70 + rng() * 60;
      const pts: string[] = [];
      for (let i = 0; i < 9; i++) { pts.push(`${x.toFixed(0)},${y.toFixed(0)}`); x += 26; y += Math.sin(i * 1.1 + mapa) * 26; }
      path = `<polyline points="${pts.join(" ")}" fill="none" stroke="${p}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" ${glow(p)}/>`;
      const [hx, hy] = pts[pts.length - 1].split(",").map(Number);
      return `${path}<circle cx="${hx}" cy="${hy}" r="14" fill="${s2}"/><circle cx="${hx + 4}" cy="${hy - 4}" r="3" fill="#111"/><circle cx="${Math.min(W - 24, hx + 40)}" cy="${Math.max(30, Math.min(H - 20, hy + Math.round(rng() * 40 - 20)))}" r="9" fill="${d}" ${glow(d)}/>`;
    }
    case "corredor": {
      let s = `<rect x="0" y="150" width="${W}" height="50" fill="${conAlfa(p, 0.25)}"/><line x1="0" y1="150" x2="${W}" y2="150" stroke="${p}" stroke-width="3"/>`;
      for (let i = 0; i < 3; i++) { const ox = 150 + i * 60 + rng() * 20; s += `<rect x="${ox}" y="${120 + rng() * 10}" width="18" height="40" rx="3" fill="${d}"/>`; }
      s += `<g transform="translate(70 96)" ${glow(s2)}><circle cx="14" cy="8" r="9" fill="${s2}"/><path d="M14 18 L10 38 L0 52 M10 38 L22 52 M12 24 L-2 30 M12 24 L28 18" stroke="${s2}" stroke-width="6" stroke-linecap="round" fill="none"/></g>`;
      for (let i = 0; i < 5; i++) s += `<circle cx="${120 + i * 34}" cy="${70 + Math.sin(i) * 10}" r="6" fill="${a}"/>`;
      return s;
    }
    case "plataformas": {
      let s = "";
      for (let i = 0; i < 5; i++) { const px = 10 + i * 64 + rng() * 10; const py = 170 - i * 22 - rng() * 14; s += `<rect x="${px}" y="${py}" width="${50 + rng() * 20}" height="14" rx="4" fill="${p}" opacity="0.9"/>`; if (i % 2) s += `<path d="M${px + 20} ${py} l6 -9 l6 9z" fill="${a}"/>`; }
      s += `<rect x="70" y="118" width="26" height="26" rx="6" fill="${s2}" ${glow(s2)}/><circle cx="88" cy="128" r="3" fill="#111"/>`;
      s += `<line x1="292" y1="40" x2="292" y2="88" stroke="#fff" stroke-width="3"/><path d="M292 40 l22 8 l-22 8z" fill="${a}"/>`;
      return s;
    }
    case "naves": {
      let s = "";
      for (let i = 0; i < 6; i++) { const ex = 40 + i * 48 + rng() * 10; const ey = 30 + (i % 2) * 26 + rng() * 10; s += `<path d="M${ex} ${ey} l12 -8 l12 8 l-6 10 h-12z" fill="${d}"/>`; }
      for (let i = 0; i < 5; i++) s += `<rect x="${158}" y="${70 + i * 16}" width="4" height="10" rx="2" fill="${a}"/>`;
      s += `<path d="M160 120 l26 50 l-26 -10 l-26 10z" fill="${p}" ${glow(p)}/><circle cx="160" cy="146" r="5" fill="${s2}"/>`;
      return s;
    }
    case "rompebloques": {
      let s = "";
      const cols = [p, s2, a, d];
      for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) if (rng() > 0.15) s += `<rect x="${14 + c * 33}" y="${20 + r * 16}" width="30" height="12" rx="3" fill="${cols[(r + mapa) % 4]}" opacity="0.92"/>`;
      s += `<rect x="120" y="176" width="80" height="10" rx="5" fill="#fff"/><circle cx="${150 + rng() * 40}" cy="140" r="7" fill="#fff" ${glow("#fff")}/>`;
      return s;
    }
    case "defensa": {
      const s = `<path d="M-10 60 H110 V150 H220 V40 H330" fill="none" stroke="${conAlfa(s2, 0.55)}" stroke-width="26" stroke-linejoin="round"/>`;
      let t2 = "";
      const torres = [[70, 110], [160, 110], [260, 90], [180, 60]];
      for (const [x, y] of torres) t2 += `<circle cx="${x}" cy="${y}" r="15" fill="${p}" ${glow(p)}/><rect x="${x - 3}" y="${y - 22}" width="6" height="16" fill="${a}"/>`;
      for (let i = 0; i < 4; i++) t2 += `<circle cx="${20 + i * 26}" cy="60" r="7" fill="${d}"/>`;
      return s + t2;
    }
    case "gemas": {
      let s = "";
      const cols = [p, s2, a, d, "#ffffff"];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) {
        const x = 52 + c * 36, y = 36 + r * 36; const col = cols[Math.floor(rng() * cols.length)];
        s += `<path d="M${x} ${y - 13} l13 13 l-13 13 l-13 -13z" fill="${col}" opacity="0.95"/><path d="M${x} ${y - 13} l13 13 h-13z" fill="#fff" opacity="0.25"/>`;
      }
      return s;
    }
    case "carreras": {
      let s = `<path d="M130 70 L190 70 L300 200 L20 200 Z" fill="${conAlfa("#000000", 0.45)}"/>`;
      for (let i = 0; i < 4; i++) s += `<rect x="${157 - i * 2}" y="${80 + i * 30}" width="${6 + i * 4}" height="${10 + i * 6}" fill="${a}"/>`;
      s += `<rect x="0" y="62" width="${W}" height="10" fill="${conAlfa(p, 0.4)}"/>`;
      s += `<g ${glow(s2)}><rect x="128" y="150" width="64" height="34" rx="9" fill="${s2}"/><rect x="138" y="140" width="44" height="18" rx="5" fill="${mezclarColor(s2, "#000000", 0.35)}"/><rect x="122" y="174" width="12" height="14" rx="3" fill="#111"/><rect x="186" y="174" width="12" height="14" rx="3" fill="#111"/></g>`;
      s += `<rect x="${90 + rng() * 30}" y="98" width="24" height="16" rx="4" fill="${d}"/>`;
      return s;
    }
    case "ritmo": {
      let s = "";
      const cols = [p, s2, a, d];
      for (let i = 0; i < 4; i++) {
        s += `<rect x="${70 + i * 46}" y="0" width="40" height="${H}" fill="${conAlfa(cols[i], 0.12)}"/>`;
        for (let k = 0; k < 3; k++) if (rng() > 0.3) s += `<rect x="${74 + i * 46}" y="${20 + k * 50 + rng() * 20}" width="32" height="12" rx="6" fill="${cols[i]}" ${glow(cols[i])}/>`;
      }
      s += `<rect x="64" y="160" width="192" height="4" fill="#fff" opacity="0.8"/>`;
      return s;
    }
    case "hockey": {
      let s = `<rect x="30" y="22" width="260" height="156" rx="30" fill="${conAlfa("#ffffff", 0.06)}" stroke="${p}" stroke-width="3"/>`;
      s += `<line x1="160" y1="22" x2="160" y2="178" stroke="${p}" stroke-width="2" opacity="0.6"/><circle cx="160" cy="100" r="26" fill="none" stroke="${p}" stroke-width="2" opacity="0.6"/>`;
      s += `<rect x="24" y="76" width="8" height="48" fill="${a}"/><rect x="288" y="76" width="8" height="48" fill="${a}"/>`;
      s += `<circle cx="90" cy="${90 + rng() * 20}" r="16" fill="${s2}" ${glow(s2)}/><circle cx="236" cy="${90 + rng() * 20}" r="16" fill="${d}" ${glow(d)}/><circle cx="${150 + rng() * 30}" cy="${80 + rng() * 40}" r="8" fill="#fff"/>`;
      return s;
    }
    default:
      return `<circle cx="160" cy="100" r="40" fill="${p}" ${glow(p)}/>`;
  }
}

function escapar(t: string) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function portadaSvg(j: Pick<Juego, "motor" | "tema" | "semilla" | "mapa" | "dificultad" | "nombre">, opciones: { titulo?: boolean } = {}): string {
  const t = temaPorId(j.tema);
  const rng = crearRng(j.semilla);
  const ang = Math.floor(rng() * 360);
  const titulo = opciones.titulo
    ? `<rect x="0" y="${H - 46}" width="${W}" height="46" fill="url(#sombra)"/><text x="14" y="${H - 16}" font-family="Outfit, system-ui, sans-serif" font-weight="800" font-size="19" fill="#fff">${escapar(j.nombre.length > 30 ? j.nombre.slice(0, 29) + "…" : j.nombre)}</text>`
    : "";
  const puntos = Array.from({ length: 5 }, (_, i) => `<circle cx="${W - 14 - i * 9}" cy="12" r="3" fill="${i < j.dificultad + 1 ? t.acento : "rgba(255,255,255,.25)"}"/>`).reverse().join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs><linearGradient id="f" gradientTransform="rotate(${ang} .5 .5)"><stop offset="0" stop-color="${t.fondo}"/><stop offset="1" stop-color="${t.fondo2}"/></linearGradient><radialGradient id="l" cx="${(0.3 + rng() * 0.4).toFixed(2)}" cy="0.35" r="0.7"><stop offset="0" stop-color="${t.primario}" stop-opacity="0.28"/><stop offset="1" stop-color="${t.primario}" stop-opacity="0"/></radialGradient><linearGradient id="sombra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.75"/></linearGradient><filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="${W}" height="${H}" fill="url(#f)"/><rect width="${W}" height="${H}" fill="url(#l)"/>${ambiente(t, rng)}${escena(j.motor, t, rng, j.mapa)}${puntos}${titulo}</svg>`;
}

export const urlPortada = (id: string) => `/api/portada/${id}`;

const MOTOR_POR_GENERO: Record<string, string> = { esquivar: "naves", disparos: "naves", plataformas: "plataformas", atrapar: "gemas" };

/** Portada de un juego de la comunidad (generada a partir de su estilo y título). */
export function portadaComunidadSvg(j: { id: string; titulo: string; estilo: string; genero: string }, conTitulo = true): string {
  return portadaSvg({ motor: MOTOR_POR_GENERO[j.genero] ?? "naves", tema: j.estilo, semilla: hashSimple(j.id), mapa: 2, dificultad: 1, nombre: j.titulo }, { titulo: conTitulo });
}

function hashSimple(t: string) {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  return h >>> 0;
}
