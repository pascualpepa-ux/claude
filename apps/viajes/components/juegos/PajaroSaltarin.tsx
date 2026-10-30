"use client";

import { useEffect, useRef, useState } from "react";
import { CampoCodigo, COLOR, claseLienzo, useBucle, useLienzo, useVentaja } from "./comun";

// Pájaro saltarín: tocá para aletear y pasá entre los tubos. Con el código: huecos mucho más grandes.

const W = 400;
const H = 600;
const SUELO = 560;

export function PajaroSaltarin() {
  const ventaja = useVentaja();
  const lienzo = useLienzo(W, H);
  const [record, setRecord] = useState(0);
  const juego = useRef({ y: 280, vy: 0, tubos: [] as { x: number; hueco: number; contado: boolean }[], reloj: 0, puntos: 0, estado: "listo" as "listo" | "jugando" | "fin" });

  const aletear = () => {
    const j = juego.current;
    if (j.estado === "fin") {
      Object.assign(j, { y: 280, vy: 0, tubos: [], reloj: 0, puntos: 0, estado: "listo" });
      return;
    }
    j.estado = "jugando";
    j.vy = -420;
  };

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        aletear();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  useBucle((dt) => {
    const ctx = lienzo.current?.getContext("2d");
    if (!ctx) return;
    const j = juego.current;
    const hueco = ventaja ? 250 : 170;
    if (j.estado === "jugando") {
      j.vy += 1400 * dt;
      j.y += j.vy * dt;
      j.reloj -= dt;
      if (j.reloj <= 0) {
        j.reloj = 1.6;
        j.tubos.push({ x: W + 30, hueco: 110 + Math.random() * (SUELO - 220 - hueco + 60), contado: false });
      }
      for (const t of j.tubos) {
        t.x -= 160 * dt;
        if (!t.contado && t.x + 30 < 100) {
          t.contado = true;
          j.puntos += 1;
        }
        const choca = 100 + 15 > t.x - 30 && 100 - 15 < t.x + 30 && (j.y - 13 < t.hueco || j.y + 13 > t.hueco + hueco);
        if (choca) j.estado = "fin";
      }
      j.tubos = j.tubos.filter((t) => t.x > -60);
      if (j.y + 13 > SUELO || j.y < -40) j.estado = "fin";
      if (j.estado === "fin") setRecord((r) => Math.max(r, j.puntos));
    } else if (j.estado === "listo") {
      j.y = 280 + Math.sin(performance.now() / 250) * 8;
    }

    const cielo = ctx.createLinearGradient(0, 0, 0, H);
    cielo.addColorStop(0, "#9ccbd8");
    cielo.addColorStop(1, COLOR.crema);
    ctx.fillStyle = cielo;
    ctx.fillRect(0, 0, W, H);
    for (const t of j.tubos) {
      ctx.fillStyle = COLOR.oliva;
      ctx.fillRect(t.x - 30, 0, 60, t.hueco);
      ctx.fillRect(t.x - 30, t.hueco + hueco, 60, SUELO - t.hueco - hueco);
      ctx.fillStyle = COLOR.olivaOscuro;
      ctx.fillRect(t.x - 34, t.hueco - 18, 68, 18);
      ctx.fillRect(t.x - 34, t.hueco + hueco, 68, 18);
    }
    ctx.fillStyle = "#a3b46b";
    ctx.fillRect(0, SUELO, W, H - SUELO);
    // Pájaro
    ctx.save();
    ctx.translate(100, j.y);
    ctx.rotate(Math.max(-0.5, Math.min(1.2, j.vy / 600)));
    ctx.fillStyle = COLOR.ambar;
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(7, -5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLOR.tinta;
    ctx.fillRect(8, -6, 3, 3);
    ctx.fillStyle = COLOR.rojo;
    ctx.fillRect(14, -1, 10, 6);
    ctx.restore();

    ctx.fillStyle = "#fff";
    ctx.strokeStyle = COLOR.tinta;
    ctx.lineWidth = 4;
    ctx.textAlign = "center";
    ctx.font = "bold 44px system-ui";
    ctx.strokeText(String(j.puntos), W / 2, 70);
    ctx.fillText(String(j.puntos), W / 2, 70);
    if (j.estado !== "jugando") {
      ctx.font = "bold 22px system-ui";
      const msg = j.estado === "listo" ? "Tocá para volar" : "¡Chocaste! Tocá para jugar de nuevo";
      ctx.strokeText(msg, W / 2, 200);
      ctx.fillText(msg, W / 2, 200);
    }
    ctx.textAlign = "left";
  });

  return (
    <div className="grid gap-3">
      <CampoCodigo queHace="huecos mucho más grandes entre los tubos" />
      <canvas ref={lienzo} style={{ aspectRatio: `${W} / ${H}` }} className={claseLienzo} onPointerDown={aletear} aria-label="Pájaro saltarín" />
      <p className="text-sm text-arena-600 dark:text-arena-400">Tocá la pantalla (o la barra espaciadora) para aletear. Récord: {record}</p>
    </div>
  );
}
