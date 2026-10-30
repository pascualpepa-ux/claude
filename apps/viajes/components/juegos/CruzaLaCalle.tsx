"use client";

import { useEffect, useRef, useState } from "react";
import { CampoCodigo, COLOR, claseLienzo, useBucle, useLienzo, useVentaja } from "./comun";

// Cruzá la calle: avanzá fila por fila esquivando autos. Con el código: 3 vidas y autos más lentos.

const COLS = 9;
const C = 44;
const W = COLS * C;
const FILAS_VISIBLES = 14;
const H = FILAS_VISIBLES * C;

interface Fila {
  tipo: "pasto" | "calle";
  arboles: number[]; // columnas con árbol (solo pasto)
  autos: { x: number; largo: number; color: string }[];
  velocidad: number; // px/s, con signo
}

const COLORES_AUTO = ["#c2410c", "#1d4ed8", "#b45309", "#7c3aed", "#0f766e"];

function nuevaFila(n: number): Fila {
  if (n < 3 || Math.random() < 0.35) {
    const arboles = n < 3 ? [] : Array.from({ length: COLS }, (_, i) => i).filter((i) => i !== 4 && Math.random() < 0.18);
    return { tipo: "pasto", arboles, autos: [], velocidad: 0 };
  }
  const velocidad = (50 + Math.random() * 90 + Math.min(n, 120)) * (Math.random() < 0.5 ? -1 : 1);
  const cantidad = 1 + Math.floor(Math.random() * 3);
  const autos = Array.from({ length: cantidad }, (_, i) => ({
    x: (i * W) / cantidad + Math.random() * 60,
    largo: (Math.random() < 0.3 ? 2 : 1) * C - 8,
    color: COLORES_AUTO[Math.floor(Math.random() * COLORES_AUTO.length)],
  }));
  return { tipo: "calle", arboles: [], autos, velocidad };
}

export function CruzaLaCalle() {
  const ventaja = useVentaja();
  const lienzo = useLienzo(W, H);
  const [puntos, setPuntos] = useState(0);
  const juego = useRef({ filas: [] as Fila[], col: 4, fila: 0, vidas: 1, max: 0, fin: false, golpe: 0 });

  const reiniciar = () => {
    const j = juego.current;
    j.filas = Array.from({ length: 40 }, (_, i) => nuevaFila(i));
    j.col = 4;
    j.fila = 0;
    j.vidas = ventaja ? 3 : 1;
    j.max = 0;
    j.fin = false;
    setPuntos(0);
  };
  useEffect(reiniciar, [ventaja]); // eslint-disable-line react-hooks/exhaustive-deps

  const mover = (dc: number, df: number) => {
    const j = juego.current;
    if (j.fin) return reiniciar();
    const col = Math.max(0, Math.min(COLS - 1, j.col + dc));
    const fila = Math.max(0, j.fila + df);
    if (j.filas[fila]?.arboles.includes(col)) return;
    j.col = col;
    j.fila = fila;
    while (j.filas.length < fila + 30) j.filas.push(nuevaFila(j.filas.length));
    if (fila > j.max) {
      j.max = fila;
      setPuntos(fila);
    }
  };

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const d = { ArrowUp: [0, 1], w: [0, 1], ArrowDown: [0, -1], s: [0, -1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] }[e.key];
      if (!d) return;
      e.preventDefault();
      mover(d[0], d[1]);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  useBucle((dt) => {
    const ctx = lienzo.current?.getContext("2d");
    if (!ctx) return;
    const j = juego.current;
    const lento = ventaja ? 0.7 : 1;
    j.golpe = Math.max(0, j.golpe - dt);
    for (const f of j.filas) {
      for (const a of f.autos) {
        a.x += f.velocidad * lento * dt;
        if (f.velocidad > 0 && a.x > W) a.x = -a.largo;
        if (f.velocidad < 0 && a.x + a.largo < 0) a.x = W;
      }
    }
    // ¿Lo pisó un auto?
    const actual = j.filas[j.fila];
    if (!j.fin && actual?.tipo === "calle" && j.golpe === 0) {
      const izq = j.col * C + 8;
      const der = izq + C - 16;
      if (actual.autos.some((a) => a.x < der && a.x + a.largo > izq)) {
        j.vidas -= 1;
        j.golpe = 1;
        if (j.vidas <= 0) j.fin = true;
        else while (j.fila > 0 && j.filas[j.fila].tipo === "calle") j.fila -= 1;
      }
    }

    const cam = Math.max(0, j.fila - 4);
    const yDe = (n: number) => H - (n - cam + 1) * C;
    for (let n = cam; n < cam + FILAS_VISIBLES + 1; n++) {
      const f = j.filas[n];
      if (!f) continue;
      const y = yDe(n);
      ctx.fillStyle = f.tipo === "pasto" ? (n % 2 ? "#a3b46b" : "#9aab62") : "#4b4a45";
      ctx.fillRect(0, y, W, C);
      if (f.tipo === "calle") {
        ctx.fillStyle = "#6b6a63";
        for (let x = 6; x < W; x += 40) ctx.fillRect(x, y + C / 2 - 1, 20, 2);
        for (const a of f.autos) {
          ctx.fillStyle = a.color;
          ctx.fillRect(a.x, y + 7, a.largo, C - 14);
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.fillRect(f.velocidad > 0 ? a.x + a.largo - 12 : a.x + 4, y + 12, 8, C - 24);
        }
      }
      for (const col of f.arboles) {
        ctx.fillStyle = "#3f6212";
        ctx.beginPath();
        ctx.arc(col * C + C / 2, y + C / 2, C / 2 - 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Jugador: un pollito
    const px = j.col * C + C / 2;
    const py = yDe(j.fila) + C / 2;
    if (!(j.golpe > 0 && Math.floor(j.golpe * 10) % 2)) {
      ctx.fillStyle = "#fffdf7";
      ctx.fillRect(px - 13, py - 13, 26, 26);
      ctx.fillStyle = COLOR.ambar;
      ctx.fillRect(px - 4, py - 19, 8, 7);
      ctx.fillStyle = COLOR.rojo;
      ctx.fillRect(px - 3, py - 24, 6, 5);
      ctx.fillStyle = COLOR.tinta;
      ctx.fillRect(px + 4, py - 7, 4, 4);
    }
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, W, 34);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px system-ui";
    ctx.fillText(`Puntos: ${j.max}`, 12, 23);
    ctx.fillText("❤".repeat(Math.max(0, j.vidas)), W - 80, 23);
    if (j.fin) {
      ctx.fillStyle = "rgba(33,31,25,0.75)";
      ctx.fillRect(0, H / 2 - 60, W, 120);
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.font = "bold 30px system-ui";
      ctx.fillText("¡Te pisaron!", W / 2, H / 2 - 8);
      ctx.font = "18px system-ui";
      ctx.fillText("Tocá para jugar de nuevo", W / 2, H / 2 + 26);
      ctx.textAlign = "left";
    }
  });

  const boton = "grid h-14 place-items-center rounded-xl bg-oliva-700 text-2xl text-white active:scale-95 dark:bg-oliva-300 dark:text-arena-950";
  return (
    <div className="grid gap-3">
      <CampoCodigo queHace="3 vidas y autos más lentos" />
      <canvas ref={lienzo} style={{ aspectRatio: `${W} / ${H}` }} className={claseLienzo} onPointerDown={() => mover(0, 1)} aria-label={`Cruzá la calle. Puntos: ${puntos}`} />
      <div className="grid max-w-[480px] grid-cols-3 gap-2">
        <span />
        <button type="button" className={boton} onClick={() => mover(0, 1)} aria-label="Adelante">↑</button>
        <span />
        <button type="button" className={boton} onClick={() => mover(-1, 0)} aria-label="Izquierda">←</button>
        <button type="button" className={boton} onClick={() => mover(0, -1)} aria-label="Atrás">↓</button>
        <button type="button" className={boton} onClick={() => mover(1, 0)} aria-label="Derecha">→</button>
      </div>
      <p className="text-sm text-arena-600 dark:text-arena-400">Tocá el juego o la flecha ↑ para avanzar. En computadora, con las flechas del teclado.</p>
    </div>
  );
}
