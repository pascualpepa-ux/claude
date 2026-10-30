"use client";

import { useRef, useState } from "react";
import { CampoCodigo, COLOR, claseLienzo, puntoEn, useBucle, useLienzo, useVentaja } from "./comun";

// Mini golf: arrastrá hacia atrás desde la pelota (como una gomera) y soltá. Con el código: ves por dónde va a ir y el hoyo es más grande.

const W = 400;
const H = 600;
const R = 8;

type Rect = [number, number, number, number]; // x, y, ancho, alto
interface Nivel {
  inicio: [number, number];
  hoyo: [number, number];
  paredes: Rect[];
}

const NIVELES: Nivel[] = [
  { inicio: [200, 520], hoyo: [200, 100], paredes: [] },
  { inicio: [80, 520], hoyo: [320, 90], paredes: [[0, 300, 260, 24]] },
  { inicio: [200, 540], hoyo: [200, 80], paredes: [[120, 380, 160, 22], [0, 220, 150, 22], [250, 220, 150, 22]] },
  { inicio: [60, 540], hoyo: [340, 540], paredes: [[180, 160, 40, 440], [60, 90, 280, 22]] },
  { inicio: [200, 560], hoyo: [200, 60], paredes: [[60, 450, 120, 20], [220, 450, 120, 20], [140, 330, 120, 20], [40, 200, 100, 20], [260, 200, 100, 20], [150, 120, 100, 20]] },
];

/** Avanza la pelota un paso chico: roce y rebotes contra paredes y bordes. */
function paso(p: { x: number; y: number; vx: number; vy: number }, paredes: Rect[], dt: number) {
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  const roce = Math.exp(-1.1 * dt);
  p.vx *= roce;
  p.vy *= roce;
  if (p.x < R) { p.x = R; p.vx = Math.abs(p.vx) * 0.8; }
  if (p.x > W - R) { p.x = W - R; p.vx = -Math.abs(p.vx) * 0.8; }
  if (p.y < R) { p.y = R; p.vy = Math.abs(p.vy) * 0.8; }
  if (p.y > H - R) { p.y = H - R; p.vy = -Math.abs(p.vy) * 0.8; }
  for (const [x, y, w, h] of paredes) {
    const cx = Math.max(x, Math.min(p.x, x + w));
    const cy = Math.max(y, Math.min(p.y, y + h));
    const dx = p.x - cx;
    const dy = p.y - cy;
    if (dx * dx + dy * dy >= R * R) continue;
    // Rebota en el eje donde menos se metió.
    const izq = p.x + R - x, der = x + w - (p.x - R), arr = p.y + R - y, aba = y + h - (p.y - R);
    const min = Math.min(izq, der, arr, aba);
    if (min === izq) { p.x = x - R; p.vx = -Math.abs(p.vx) * 0.8; }
    else if (min === der) { p.x = x + w + R; p.vx = Math.abs(p.vx) * 0.8; }
    else if (min === arr) { p.y = y - R; p.vy = -Math.abs(p.vy) * 0.8; }
    else { p.y = y + h + R; p.vy = Math.abs(p.vy) * 0.8; }
  }
}

export function MiniGolf() {
  const ventaja = useVentaja();
  const lienzo = useLienzo(W, H);
  const [nivel, setNivel] = useState(0);
  const [golpes, setGolpes] = useState(0);
  const [total, setTotal] = useState(0);
  const j = useRef({ p: { x: NIVELES[0].inicio[0], y: NIVELES[0].inicio[1], vx: 0, vy: 0 }, apuntando: null as null | { x: number; y: number }, adentro: 0 });

  const cargar = (n: number) => {
    const l = NIVELES[n % NIVELES.length];
    j.current.p = { x: l.inicio[0], y: l.inicio[1], vx: 0, vy: 0 };
    j.current.adentro = 0;
    setNivel(n % NIVELES.length);
    setGolpes(0);
    if (n % NIVELES.length === 0) setTotal(0);
  };

  const quieta = () => Math.hypot(j.current.p.vx, j.current.p.vy) < 6;
  const tiro = (a: { x: number; y: number }) => {
    const dx = j.current.p.x - a.x;
    const dy = j.current.p.y - a.y;
    const largo = Math.min(Math.hypot(dx, dy), 160);
    const ang = Math.atan2(dy, dx);
    return { vx: Math.cos(ang) * largo * 5, vy: Math.sin(ang) * largo * 5, largo };
  };

  useBucle((dt) => {
    const ctx = lienzo.current?.getContext("2d");
    if (!ctx) return;
    const l = NIVELES[nivel];
    const g = j.current;
    const radioHoyo = ventaja ? 18 : 12;
    if (!g.adentro) {
      for (let i = 0; i < 4; i++) paso(g.p, l.paredes, dt / 4);
      const v = Math.hypot(g.p.vx, g.p.vy);
      if (Math.hypot(g.p.x - l.hoyo[0], g.p.y - l.hoyo[1]) < radioHoyo && v < 420) {
        g.adentro = 1.2;
        g.p = { x: l.hoyo[0], y: l.hoyo[1], vx: 0, vy: 0 };
        setTotal((t) => t + golpes);
      }
      if (v < 6) { g.p.vx = 0; g.p.vy = 0; }
    } else {
      g.adentro -= dt;
      if (g.adentro <= 0) cargar(nivel + 1);
    }

    ctx.fillStyle = "#8fae5c";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.fillStyle = COLOR.olivaOscuro;
    for (const [x, y, w, h] of l.paredes) ctx.fillRect(x, y, w, h);
    ctx.fillStyle = COLOR.tinta;
    ctx.beginPath();
    ctx.arc(l.hoyo[0], l.hoyo[1], radioHoyo, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(l.hoyo[0], l.hoyo[1]);
    ctx.lineTo(l.hoyo[0], l.hoyo[1] - 50);
    ctx.stroke();
    ctx.fillStyle = COLOR.rojo;
    ctx.fillRect(l.hoyo[0], l.hoyo[1] - 50, 22, 14);

    if (g.apuntando && quieta()) {
      const t = tiro(g.apuntando);
      if (ventaja) {
        // Ventaja: el recorrido que va a hacer la pelota.
        const sim = { x: g.p.x, y: g.p.y, vx: t.vx, vy: t.vy };
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        for (let i = 0; i < 160; i++) {
          for (let k = 0; k < 4; k++) paso(sim, l.paredes, 1 / 240);
          if (i % 4 === 0) { ctx.beginPath(); ctx.arc(sim.x, sim.y, 2.5, 0, Math.PI * 2); ctx.fill(); }
          if (Math.hypot(sim.vx, sim.vy) < 6) break;
        }
      }
      ctx.strokeStyle = t.largo > 120 ? COLOR.rojo : COLOR.ambar;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(g.p.x, g.p.y);
      ctx.lineTo(g.p.x + (t.vx / 5) * 0.6, g.p.y + (t.vy / 5) * 0.6);
      ctx.stroke();
    }
    if (g.adentro <= 0 || g.adentro > 0.9) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(g.p.x, g.p.y, g.adentro ? R * 0.7 : R, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, W, 34);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 17px system-ui";
    ctx.fillText(`Hoyo ${nivel + 1}/${NIVELES.length} · Golpes: ${golpes} · Total: ${total}`, 12, 23);
    if (g.adentro > 0) {
      ctx.textAlign = "center";
      ctx.font = "bold 34px system-ui";
      ctx.fillText(golpes === 1 ? "¡Hoyo en uno!" : "¡Adentro!", W / 2, H / 2);
      ctx.textAlign = "left";
    }
  });

  return (
    <div className="grid gap-3">
      <CampoCodigo queHace="ves el recorrido de la pelota y el hoyo es más grande" />
      <canvas
        ref={lienzo}
        style={{ aspectRatio: `${W} / ${H}` }}
        className={claseLienzo}
        aria-label="Mini golf"
        onPointerDown={(e) => {
          if (!quieta() || j.current.adentro) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          j.current.apuntando = puntoEn(e.currentTarget, e, W, H);
        }}
        onPointerMove={(e) => {
          if (j.current.apuntando) j.current.apuntando = puntoEn(e.currentTarget, e, W, H);
        }}
        onPointerUp={() => {
          const a = j.current.apuntando;
          j.current.apuntando = null;
          if (!a) return;
          const t = tiro(a);
          if (t.largo < 8) return;
          j.current.p.vx = t.vx;
          j.current.p.vy = t.vy;
          setGolpes((n) => n + 1);
        }}
      />
      <p className="text-sm text-arena-600 dark:text-arena-400">Tocá, arrastrá hacia el lado contrario de donde querés tirar y soltá. Cuanto más lejos arrastrás, más fuerte.</p>
    </div>
  );
}
