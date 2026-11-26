import type { Rng } from "@/lib/rng";
import { conAlfa, type Tema } from "@/lib/temas";

interface Particula {
  x: number; y: number; vx: number; vy: number; vida: number; max: number; color: string; tam: number; g: number;
}

/** Sistema de partículas compartido (explosiones, chispas, polvo). Usa Math.random: no afecta la lógica. */
export class Particulas {
  lista: Particula[] = [];
  explotar(x: number, y: number, color: string, n = 16, vel = 160, tam = 3, gravedad = 200) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = vel * (0.3 + Math.random() * 0.7);
      const max = 0.35 + Math.random() * 0.45;
      this.lista.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: max, max, color, tam: tam * (0.5 + Math.random()), g: gravedad });
    }
    if (this.lista.length > 600) this.lista.splice(0, this.lista.length - 600);
  }
  actualizar(dt: number) {
    for (const p of this.lista) {
      p.vida -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.lista = this.lista.filter((p) => p.vida > 0);
  }
  dibujar(g: CanvasRenderingContext2D) {
    for (const p of this.lista) {
      g.globalAlpha = Math.max(0, p.vida / p.max);
      g.fillStyle = p.color;
      g.fillRect(p.x - p.tam / 2, p.y - p.tam / 2, p.tam, p.tam);
    }
    g.globalAlpha = 1;
  }
}

interface Mota { x: number; y: number; v: number; f: number; t: number }

/** Fondo animado según la temática (estrellas, nieve, burbujas, brasas...). */
export class FondoTema {
  private motas: Mota[] = [];
  private grad: CanvasGradient | null = null;
  constructor(private tema: Tema, private W: number, private H: number, rng: Rng, cantidad = 50) {
    for (let i = 0; i < cantidad; i++) this.motas.push({ x: rng() * W, y: rng() * H, v: 0.3 + rng(), f: rng() * Math.PI * 2, t: 0.5 + rng() * 2 });
  }
  dibujar(g: CanvasRenderingContext2D, tiempo: number, desplazX = 0) {
    const t = this.tema;
    if (!this.grad) {
      this.grad = g.createLinearGradient(0, 0, 0, this.H);
      this.grad.addColorStop(0, t.fondo);
      this.grad.addColorStop(1, t.fondo2);
    }
    g.fillStyle = this.grad;
    g.fillRect(0, 0, this.W, this.H);
    const { W, H } = this;
    for (const m of this.motas) {
      let x = m.x, y = m.y;
      switch (t.ambiente) {
        case "estrellas":
          x = (((m.x - desplazX * m.v * 0.2) % W) + W) % W;
          g.fillStyle = conAlfa("#ffffff", 0.3 + 0.5 * Math.abs(Math.sin(tiempo * m.v + m.f)));
          g.fillRect(x, y, m.t, m.t);
          break;
        case "nieve":
          y = (m.y + tiempo * 30 * m.v) % H; x = m.x + Math.sin(tiempo + m.f) * 12;
          g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.arc(x, y, m.t, 0, 6.283); g.fill();
          break;
        case "burbujas":
          y = H - ((m.y + tiempo * 25 * m.v) % H); x = m.x + Math.sin(tiempo * 2 + m.f) * 6;
          g.strokeStyle = conAlfa(t.primario, 0.35); g.lineWidth = 1; g.beginPath(); g.arc(x, y, m.t * 2.2, 0, 6.283); g.stroke();
          break;
        case "brasas":
          y = H - ((m.y + tiempo * 40 * m.v) % H); x = m.x + Math.sin(tiempo * 3 + m.f) * 8;
          g.fillStyle = conAlfa(m.f > 3 ? t.secundario : t.primario, 0.7); g.fillRect(x, y, m.t, m.t);
          break;
        case "hojas":
          y = (m.y + tiempo * 22 * m.v) % H; x = m.x + Math.sin(tiempo * 1.5 + m.f) * 20;
          g.fillStyle = conAlfa(m.f > 3 ? t.primario : t.secundario, 0.55);
          g.beginPath(); g.ellipse(x, y, m.t * 2.2, m.t, tiempo + m.f, 0, 6.283); g.fill();
          break;
        case "lluvia":
          y = (m.y + tiempo * 260 * m.v) % H;
          g.strokeStyle = conAlfa(t.secundario, 0.35); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 12); g.stroke();
          break;
        case "pixeles":
          x = (((m.x - desplazX * 0.1 * m.v) % W) + W) % W;
          g.fillStyle = conAlfa(m.f > 3 ? t.primario : t.secundario, 0.12 + 0.12 * Math.sin(tiempo * m.v + m.f));
          g.fillRect(Math.floor(x / 8) * 8, Math.floor(y / 8) * 8, 6, 6);
          break;
        case "luciernagas":
          x = m.x + Math.sin(tiempo * 0.7 * m.v + m.f) * 25; y = m.y + Math.cos(tiempo * 0.5 + m.f) * 18;
          g.fillStyle = conAlfa(t.acento, 0.25 + 0.6 * Math.max(0, Math.sin(tiempo * 2 * m.v + m.f)));
          g.beginPath(); g.arc(x, y, m.t, 0, 6.283); g.fill();
          break;
        case "polvo":
          x = (m.x + tiempo * 30 * m.v) % W;
          g.fillStyle = conAlfa(t.primario, 0.25); g.fillRect(x, y, m.t, m.t);
          break;
        case "niebla":
          x = ((m.x + tiempo * 10 * m.v) % (W + 200)) - 100;
          g.fillStyle = "rgba(255,255,255,.035)"; g.beginPath(); g.ellipse(x, y, 90 * m.t, 18 * m.t, 0, 0, 6.283); g.fill();
          break;
      }
    }
  }
}

export function rectRed(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.arcTo(x + w, y, x + w, y + h, rr);
  g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr);
  g.arcTo(x, y, x + w, y, rr);
  g.closePath();
}

export function brillo(g: CanvasRenderingContext2D, color: string, fuerza = 12) {
  g.shadowColor = color;
  g.shadowBlur = fuerza;
}
export function sinBrillo(g: CanvasRenderingContext2D) {
  g.shadowBlur = 0;
}

export function texto(g: CanvasRenderingContext2D, t: string, x: number, y: number, tam: number, color: string, alinear: CanvasTextAlign = "center", peso = 800) {
  g.font = `${peso} ${tam}px Outfit Variable, Outfit, system-ui, sans-serif`;
  g.textAlign = alinear;
  g.textBaseline = "middle";
  g.fillStyle = "rgba(0,0,0,.45)";
  g.fillText(t, x + 2, y + 2);
  g.fillStyle = color;
  g.fillText(t, x, y);
}

export const choque = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) =>
  ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

export const limitar = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
