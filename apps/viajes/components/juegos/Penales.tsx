"use client";

import { useRef, useState } from "react";
import { CampoCodigo, COLOR, claseLienzo, puntoEn, useBucle, useLienzo, useVentaja } from "./comun";

// Penales: tocá adónde querés patear. El arquero es un bot que a veces adivina.
// Contra el bot: 5 penales. De a 2: patean por turnos, 5 cada uno, gana el que mete más.
// Con el código: el arquero adivina mucho menos y se tira más lento.

const W = 400;
const H = 600;
const ARCO = { x: 60, y: 90, w: 280, h: 150 };
const PUNTO = { x: 200, y: 520 };

type Modo = "bot" | "dos";
interface Tiro {
  objetivo: { x: number; y: number };
  t: number;
  arqueroX: number;
  resultado: "" | "gol" | "atajada" | "afuera";
}

export function Penales() {
  const ventaja = useVentaja();
  const lienzo = useLienzo(W, H);
  const [modo, setModo] = useState<Modo>("bot");
  const [goles, setGoles] = useState<number[]>([0, 0]);
  const [tiros, setTiros] = useState<number[]>([0, 0]);
  const turno = modo === "dos" ? (tiros[0] > tiros[1] ? 1 : 0) : 0;
  const terminado = modo === "bot" ? tiros[0] >= 5 : tiros[0] >= 5 && tiros[1] >= 5;
  const j = useRef<{ tiro: Tiro | null; pausa: number }>({ tiro: null, pausa: 0 });

  const reiniciar = (m: Modo = modo) => {
    setModo(m);
    setGoles([0, 0]);
    setTiros([0, 0]);
    j.current = { tiro: null, pausa: 0 };
  };

  const patear = (p: { x: number; y: number }) => {
    if (terminado) return reiniciar();
    if (j.current.tiro) return;
    // El arquero decide antes de ver el tiro: a veces adivina el lado.
    const adivina = Math.random() < (ventaja && turno === 0 ? 0.15 : 0.45);
    const arqueroX = adivina ? Math.max(ARCO.x + 40, Math.min(ARCO.x + ARCO.w - 40, p.x)) : ARCO.x + 40 + Math.random() * (ARCO.w - 80);
    j.current.tiro = { objetivo: p, t: 0, arqueroX, resultado: "" };
  };

  useBucle((dt) => {
    const ctx = lienzo.current?.getContext("2d");
    if (!ctx) return;
    const g = j.current;
    const tiro = g.tiro;
    const lento = ventaja && turno === 0 ? 0.55 : 1;
    if (tiro) {
      tiro.t += dt;
      if (tiro.t >= 0.6 && !tiro.resultado) {
        const { x, y } = tiro.objetivo;
        const adentro = x > ARCO.x + 6 && x < ARCO.x + ARCO.w - 6 && y > ARCO.y + 6 && y < ARCO.y + ARCO.h;
        const alcance = 70 * lento + 10;
        const atajo = adentro && Math.abs(x - tiro.arqueroX) < alcance;
        tiro.resultado = !adentro ? "afuera" : atajo ? "atajada" : "gol";
        g.pausa = 1.3;
        const quien = turno;
        if (tiro.resultado === "gol") setGoles((gs) => gs.map((v, i) => (i === quien ? v + 1 : v)));
        setTiros((ts) => ts.map((v, i) => (i === quien ? v + 1 : v)));
      }
      if (tiro.resultado) {
        g.pausa -= dt;
        if (g.pausa <= 0) g.tiro = null;
      }
    }

    // Cancha
    ctx.fillStyle = "#7ea35a";
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? "#7ea35a" : "#86ab61";
      ctx.fillRect(0, 240 + i * 45, W, 45);
    }
    ctx.fillStyle = "#cfe0b8";
    ctx.fillRect(0, 0, W, ARCO.y);
    // Red y palos
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    for (let x = ARCO.x; x <= ARCO.x + ARCO.w; x += 14) { ctx.beginPath(); ctx.moveTo(x, ARCO.y); ctx.lineTo(x, ARCO.y + ARCO.h); ctx.stroke(); }
    for (let y = ARCO.y; y <= ARCO.y + ARCO.h; y += 14) { ctx.beginPath(); ctx.moveTo(ARCO.x, y); ctx.lineTo(ARCO.x + ARCO.w, y); ctx.stroke(); }
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 8;
    ctx.strokeRect(ARCO.x, ARCO.y, ARCO.w, ARCO.h + 4);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, ARCO.y + ARCO.h + 4);
    ctx.lineTo(W, ARCO.y + ARCO.h + 4);
    ctx.stroke();

    // Arquero: se tira hacia su lado elegido
    const avance = tiro ? Math.min(1, (tiro.t / 0.6) * lento + 0.05) : 0;
    const ax = 200 + ((tiro?.arqueroX ?? 200) - 200) * avance;
    ctx.fillStyle = COLOR.ambar;
    ctx.fillRect(ax - 22, ARCO.y + ARCO.h - 90, 44, 70);
    ctx.fillStyle = "#f1c9a5";
    ctx.beginPath();
    ctx.arc(ax, ARCO.y + ARCO.h - 104, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLOR.olivaOscuro;
    ctx.fillRect(ax - 48, ARCO.y + ARCO.h - 86, 26, 12);
    ctx.fillRect(ax + 22, ARCO.y + ARCO.h - 86, 26, 12);
    ctx.fillRect(ax - 18, ARCO.y + ARCO.h - 20, 14, 22);
    ctx.fillRect(ax + 4, ARCO.y + ARCO.h - 20, 14, 22);

    // Pelota
    let bx = PUNTO.x, by = PUNTO.y, br = 13;
    if (tiro) {
      const k = Math.min(1, tiro.t / 0.6);
      bx = PUNTO.x + (tiro.objetivo.x - PUNTO.x) * k;
      by = PUNTO.y + (tiro.objetivo.y - PUNTO.y) * k - Math.sin(k * Math.PI) * 40;
      br = 13 - 5 * k;
    }
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLOR.tinta;
    ctx.beginPath();
    ctx.arc(bx, by, br * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Tablero
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, W, 36);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 17px system-ui";
    ctx.fillText(
      modo === "bot" ? `Goles: ${goles[0]} de ${tiros[0]} · Quedan ${5 - tiros[0]}` : `J1: ${goles[0]} (${tiros[0]}/5)   J2: ${goles[1]} (${tiros[1]}/5)`,
      12,
      24,
    );
    ctx.textAlign = "center";
    if (tiro?.resultado) {
      ctx.font = "bold 46px system-ui";
      ctx.fillStyle = tiro.resultado === "gol" ? COLOR.ambar : "#fff";
      ctx.fillText({ gol: "¡GOOOL!", atajada: "¡Atajó!", afuera: "¡Afuera!" }[tiro.resultado], W / 2, 330);
    } else if (terminado) {
      ctx.fillStyle = "rgba(33,31,25,0.75)";
      ctx.fillRect(0, 290, W, 110);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 28px system-ui";
      const msj = modo === "bot" ? `Metiste ${goles[0]} de 5` : goles[0] === goles[1] ? "¡Empate!" : `¡Ganó el Jugador ${goles[0] > goles[1] ? 1 : 2}!`;
      ctx.fillText(msj, W / 2, 338);
      ctx.font = "17px system-ui";
      ctx.fillText("Tocá para jugar de nuevo", W / 2, 372);
    } else {
      ctx.font = "bold 18px system-ui";
      ctx.fillStyle = "#fff";
      ctx.fillText(modo === "dos" ? `Patea el Jugador ${turno + 1}: tocá adónde tirás` : "Tocá adónde querés patear", W / 2, 290);
    }
    ctx.textAlign = "left";
  });

  const pestaña = (m: Modo, texto: string) => (
    <button
      type="button"
      onClick={() => reiniciar(m)}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${modo === m ? "bg-oliva-700 text-white dark:bg-oliva-300 dark:text-arena-950" : "border border-arena-300 dark:border-arena-700"}`}
    >
      {texto}
    </button>
  );

  return (
    <div className="grid gap-3">
      <CampoCodigo queHace="el arquero adivina mucho menos y se tira más lento (para el Jugador 1)" />
      <div className="flex gap-2">
        {pestaña("bot", "Contra el bot")}
        {pestaña("dos", "2 jugadores")}
      </div>
      <canvas ref={lienzo} style={{ aspectRatio: `${W} / ${H}` }} className={claseLienzo} aria-label="Penales" onPointerDown={(e) => patear(puntoEn(e.currentTarget, e, W, H))} />
    </div>
  );
}
