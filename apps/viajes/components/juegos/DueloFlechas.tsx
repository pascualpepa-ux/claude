"use client";

import { useRef, useState } from "react";
import { CampoCodigo, COLOR, claseLienzo, puntoEn, useBucle, useLienzo, useVentaja } from "./comun";

// Duelo de flechas: dos arqueros por turnos. Elegís la flecha, arrastrás hacia atrás desde tu arquero y soltás.
// Contra el bot o de a 2 en el mismo dispositivo. Con el código: el Jugador 1 hace el doble de daño y ve por dónde va la flecha.

const W = 600;
const H = 380;
const SUELO = 330;
const GRAVEDAD = 420;

type TipoFlecha = "normal" | "fuego" | "hielo" | "triple";
const FLECHAS: Record<TipoFlecha, { nombre: string; daño: number; color: string; detalle: string }> = {
  normal: { nombre: "Normal", daño: 20, color: COLOR.tinta, detalle: "20 de daño" },
  fuego: { nombre: "🔥 Fuego", daño: 14, color: "#ea580c", detalle: "14 + quema 6 por 2 turnos" },
  hielo: { nombre: "❄️ Hielo", daño: 12, color: "#0891b2", detalle: "12 + el otro pierde un turno (cada 3 turnos)" },
  triple: { nombre: "🏹 Triple", daño: 9, color: "#7c3aed", detalle: "3 flechas de 9" },
};

interface Arquero { x: number; vida: number; quema: number; congelado: boolean; recargaHielo: number }
interface Flecha { x: number; y: number; vx: number; vy: number; tipo: TipoFlecha; viva: boolean; de: number }

const nuevos = (): Arquero[] => [
  { x: 70, vida: 100, quema: 0, congelado: false, recargaHielo: 0 },
  { x: 530, vida: 100, quema: 0, congelado: false, recargaHielo: 0 },
];

/** Dónde da una flecha: devuelve el recorrido hasta que toca el piso o sale de la pantalla. */
function trayectoria(x: number, y: number, vx: number, vy: number, viento: number, pasos = 400) {
  const puntos: { x: number; y: number }[] = [];
  for (let i = 0; i < pasos; i++) {
    const dt = 1 / 120;
    vx += viento * dt;
    vy += GRAVEDAD * dt;
    x += vx * dt;
    y += vy * dt;
    puntos.push({ x, y });
    if (y > SUELO || x < -40 || x > W + 40) break;
  }
  return puntos;
}

export function DueloFlechas() {
  const ventaja = useVentaja();
  const lienzo = useLienzo(W, H);
  const [modo, setModo] = useState<"bot" | "dos">("bot");
  const [tipo, setTipo] = useState<TipoFlecha>("normal");
  const [, refrescar] = useState(0);
  const j = useRef({
    arqueros: nuevos(),
    turno: 0,
    flechas: [] as Flecha[],
    viento: 0,
    apuntando: null as null | { x: number; y: number },
    aviso: "",
    avisoT: 0,
    esperaBot: 0,
    fin: -1,
  });

  const reiniciar = (m = modo) => {
    setModo(m);
    j.current = { arqueros: nuevos(), turno: 0, flechas: [], viento: Math.round((Math.random() - 0.5) * 120), apuntando: null, aviso: "", avisoT: 0, esperaBot: 0, fin: -1 };
    setTipo("normal");
    refrescar((n) => n + 1);
  };

  const esBot = (t: number) => modo === "bot" && t === 1;
  const origen = (t: number) => ({ x: j.current.arqueros[t].x, y: SUELO - 50 });
  const velocidad = (t: number, a: { x: number; y: number }) => {
    const o = origen(t);
    const dx = o.x - a.x;
    const dy = o.y - a.y;
    const fuerza = Math.min(Math.hypot(dx, dy), 150) * 5.2;
    const ang = Math.atan2(dy, dx);
    return { vx: Math.cos(ang) * fuerza, vy: Math.sin(ang) * fuerza };
  };

  const disparar = (t: number, vx: number, vy: number, cual: TipoFlecha) => {
    const g = j.current;
    const o = origen(t);
    const angulos = cual === "triple" ? [-0.09, 0, 0.09] : [0];
    g.flechas = angulos.map((d) => {
      const c = Math.cos(d), s = Math.sin(d);
      return { x: o.x, y: o.y, vx: vx * c - vy * s, vy: vx * s + vy * c, tipo: cual, viva: true, de: t };
    });
    if (cual === "hielo") g.arqueros[t].recargaHielo = 3;
  };

  const avisar = (texto: string) => {
    j.current.aviso = texto;
    j.current.avisoT = 1.6;
  };

  /** Pasa el turno: aplica la quemadura y salta al que está congelado. */
  const pasarTurno = () => {
    const g = j.current;
    for (let i = 0; i < 2; i++) {
      g.turno = 1 - g.turno;
      g.viento = Math.round((Math.random() - 0.5) * 120);
      const a = g.arqueros[g.turno];
      a.recargaHielo = Math.max(0, a.recargaHielo - 1);
      if (a.quema > 0) {
        a.vida = Math.max(0, a.vida - 6);
        a.quema -= 1;
        avisar(`🔥 Se quema: -6`);
        if (a.vida <= 0) g.fin = 1 - g.turno;
      }
      if (!a.congelado) break;
      a.congelado = false;
      avisar(`❄️ Jugador ${g.turno + 1} congelado: pierde el turno`);
    }
    g.esperaBot = 0.9;
    if (tipo === "hielo" && g.arqueros[g.turno].recargaHielo > 0) setTipo("normal");
    refrescar((n) => n + 1);
  };

  const turnoBot = () => {
    const g = j.current;
    const yo = g.arqueros[1];
    const rival = g.arqueros[0];
    const opciones: TipoFlecha[] = ["normal", "fuego", "triple"];
    if (yo.recargaHielo === 0) opciones.push("hielo");
    const cual = opciones[Math.floor(Math.random() * opciones.length)];
    let mejor = { vx: -400, vy: -300, error: Infinity };
    const o = origen(1);
    for (let grados = 15; grados <= 75; grados += 2) {
      for (let f = 300; f <= 780; f += 20) {
        const ang = Math.PI + (grados * Math.PI) / 180; // hacia la izquierda y arriba
        const vx = Math.cos(ang) * f;
        const vy = -Math.sin((grados * Math.PI) / 180) * f;
        const r = trayectoria(o.x, o.y, vx, vy, g.viento);
        const cerca = r.reduce((m, p) => Math.min(m, Math.hypot(p.x - rival.x, p.y - (SUELO - 35))), Infinity);
        if (cerca < mejor.error) mejor = { vx, vy, error: cerca };
      }
    }
    // El bot no es perfecto: le erra un poco.
    const ruido = 1 + (Math.random() - 0.5) * 0.12;
    disparar(1, mejor.vx * ruido, mejor.vy * (1 + (Math.random() - 0.5) * 0.12), cual);
  };

  useBucle((dt) => {
    const ctx = lienzo.current?.getContext("2d");
    if (!ctx) return;
    const g = j.current;
    g.avisoT = Math.max(0, g.avisoT - dt);

    if (g.fin < 0 && g.flechas.length === 0 && esBot(g.turno)) {
      g.esperaBot -= dt;
      if (g.esperaBot <= 0) turnoBot();
    }

    for (const f of g.flechas) {
      if (!f.viva) continue;
      for (let k = 0; k < 2; k++) {
        const paso = dt / 2;
        f.vx += g.viento * paso;
        f.vy += GRAVEDAD * paso;
        f.x += f.vx * paso;
        f.y += f.vy * paso;
        const rival = g.arqueros[1 - f.de];
        const cabeza = Math.hypot(f.x - rival.x, f.y - (SUELO - 66)) < 11;
        const cuerpo = Math.abs(f.x - rival.x) < 14 && f.y > SUELO - 56 && f.y < SUELO;
        if (cabeza || cuerpo) {
          f.viva = false;
          const conVentaja = ventaja && f.de === 0;
          const daño = Math.round(FLECHAS[f.tipo].daño * (cabeza ? 1.5 : 1) * (conVentaja ? 2 : 1));
          rival.vida = Math.max(0, rival.vida - daño);
          if (f.tipo === "fuego") rival.quema = 2;
          if (f.tipo === "hielo") rival.congelado = true;
          avisar(cabeza ? `¡A la cabeza! -${daño}` : `-${daño}`);
          if (rival.vida <= 0) g.fin = f.de;
          break;
        }
        if (f.y > SUELO || f.x < -40 || f.x > W + 40) {
          f.viva = false;
          break;
        }
      }
    }
    if (g.flechas.length && g.flechas.every((f) => !f.viva)) {
      g.flechas = [];
      if (g.fin < 0) pasarTurno();
      else refrescar((n) => n + 1);
    }

    // Escenario
    const cielo = ctx.createLinearGradient(0, 0, 0, H);
    cielo.addColorStop(0, "#a8cfd9");
    cielo.addColorStop(1, COLOR.crema);
    ctx.fillStyle = cielo;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#c9cfa4";
    ctx.beginPath();
    ctx.moveTo(0, SUELO);
    ctx.quadraticCurveTo(W / 2, SUELO - 90, W, SUELO);
    ctx.fill();
    ctx.fillStyle = "#8fae5c";
    ctx.fillRect(0, SUELO, W, H - SUELO);

    // Arqueros
    g.arqueros.forEach((a, i) => {
      const lado = i === 0 ? 1 : -1;
      ctx.strokeStyle = i === 0 ? COLOR.oliva : COLOR.rojo;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(a.x, SUELO - 54);
      ctx.lineTo(a.x, SUELO - 24);
      ctx.moveTo(a.x, SUELO - 24);
      ctx.lineTo(a.x - 9, SUELO);
      ctx.moveTo(a.x, SUELO - 24);
      ctx.lineTo(a.x + 9, SUELO);
      ctx.moveTo(a.x, SUELO - 46);
      ctx.lineTo(a.x + 16 * lado, SUELO - 46);
      ctx.stroke();
      ctx.fillStyle = a.congelado ? "#a5f3fc" : "#f1c9a5";
      ctx.beginPath();
      ctx.arc(a.x, SUELO - 66, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#7c4a1e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(a.x + 16 * lado, SUELO - 46, 16, -Math.PI / 2, Math.PI / 2, lado < 0);
      ctx.stroke();
      if (a.quema > 0) {
        ctx.font = "16px system-ui";
        ctx.fillText("🔥", a.x - 8, SUELO - 82);
      }
      // Vida
      const bx = i === 0 ? 14 : W - 214;
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(bx, 14, 200, 16);
      ctx.fillStyle = a.vida > 40 ? COLOR.oliva : COLOR.rojo;
      ctx.fillRect(bx, 14, a.vida * 2, 16);
      ctx.fillStyle = COLOR.tinta;
      ctx.font = "bold 13px system-ui";
      ctx.fillText(`${i === 0 ? "Jugador 1" : esBot(1) ? "Bot" : "Jugador 2"} · ${a.vida}`, bx, 46);
    });

    // Viento
    ctx.fillStyle = COLOR.tinta;
    ctx.font = "bold 14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`Viento ${g.viento === 0 ? "0" : g.viento > 0 ? `→ ${g.viento}` : `← ${-g.viento}`}`, W / 2, 26);

    // Apuntando
    if (g.apuntando && g.flechas.length === 0 && g.fin < 0) {
      const v = velocidad(g.turno, g.apuntando);
      const o = origen(g.turno);
      const conVentaja = ventaja && g.turno === 0;
      const puntos = trayectoria(o.x, o.y, v.vx, v.vy, g.viento, conVentaja ? 400 : 22);
      ctx.fillStyle = conVentaja ? "rgba(33,31,25,0.7)" : "rgba(33,31,25,0.45)";
      puntos.forEach((p, i) => {
        if (i % 3 === 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Flechas en vuelo
    for (const f of g.flechas) {
      if (!f.viva) continue;
      const ang = Math.atan2(f.vy, f.vx);
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(ang);
      ctx.strokeStyle = FLECHAS[f.tipo].color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.fillStyle = FLECHAS[f.tipo].color;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-4, 4);
      ctx.fill();
      ctx.restore();
    }

    // Mensajes
    if (g.avisoT > 0) {
      ctx.font = "bold 22px system-ui";
      ctx.fillStyle = COLOR.rojo;
      ctx.fillText(g.aviso, W / 2, 110);
    }
    if (g.fin >= 0) {
      ctx.fillStyle = "rgba(33,31,25,0.75)";
      ctx.fillRect(0, H / 2 - 60, W, 110);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 30px system-ui";
      ctx.fillText(g.fin === 0 ? "¡Ganó el Jugador 1!" : esBot(1) ? "Ganó el bot" : "¡Ganó el Jugador 2!", W / 2, H / 2 - 10);
      ctx.font = "17px system-ui";
      ctx.fillText("Tocá para jugar de nuevo", W / 2, H / 2 + 24);
    } else if (g.flechas.length === 0) {
      ctx.font = "bold 16px system-ui";
      ctx.fillStyle = COLOR.tinta;
      ctx.fillText(esBot(g.turno) ? "Apunta el bot…" : `Turno del Jugador ${g.turno + 1}: arrastrá hacia atrás y soltá`, W / 2, 80);
    }
    ctx.textAlign = "left";
  });

  const g = j.current;
  const miTurno = g.fin < 0 && !esBot(g.turno);
  const hieloListo = g.arqueros[g.turno].recargaHielo === 0;

  return (
    <div className="grid gap-3">
      <CampoCodigo queHace="el Jugador 1 hace el doble de daño y ve todo el recorrido de la flecha" />
      <div className="flex gap-2">
        {(["bot", "dos"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => reiniciar(m)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${modo === m ? "bg-oliva-700 text-white dark:bg-oliva-300 dark:text-arena-950" : "border border-arena-300 dark:border-arena-700"}`}
          >
            {m === "bot" ? "Contra el bot" : "2 jugadores"}
          </button>
        ))}
      </div>
      <canvas
        ref={lienzo}
        style={{ aspectRatio: `${W} / ${H}` }}
        className={`${claseLienzo} max-w-[720px]`}
        aria-label="Duelo de flechas"
        onPointerDown={(e) => {
          if (g.fin >= 0) return reiniciar();
          if (!miTurno || g.flechas.length) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          g.apuntando = puntoEn(e.currentTarget, e, W, H);
        }}
        onPointerMove={(e) => {
          if (g.apuntando) g.apuntando = puntoEn(e.currentTarget, e, W, H);
        }}
        onPointerUp={() => {
          const a = g.apuntando;
          g.apuntando = null;
          if (!a || !miTurno || g.flechas.length) return;
          const v = velocidad(g.turno, a);
          if (Math.hypot(v.vx, v.vy) < 60) return;
          disparar(g.turno, v.vx, v.vy, tipo === "hielo" && !hieloListo ? "normal" : tipo);
        }}
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de flecha">
        {(Object.keys(FLECHAS) as TipoFlecha[]).map((k) => {
          const bloqueada = k === "hielo" && !hieloListo;
          return (
            <button
              key={k}
              type="button"
              disabled={bloqueada || !miTurno}
              onClick={() => setTipo(k)}
              aria-pressed={tipo === k}
              className={`rounded-xl px-3 py-2 text-left text-sm disabled:opacity-40 ${tipo === k ? "bg-oliva-700 text-white dark:bg-oliva-300 dark:text-arena-950" : "border border-arena-300 dark:border-arena-700"}`}
            >
              <span className="block font-semibold">{FLECHAS[k].nombre}</span>
              <span className="block text-xs opacity-80">{bloqueada ? `Lista en ${g.arqueros[g.turno].recargaHielo} turnos` : FLECHAS[k].detalle}</span>
            </button>
          );
        })}
      </div>
      <p className="text-sm text-arena-600 dark:text-arena-400">A la cabeza hace 1,5 veces más daño. Ojo con el viento.</p>
    </div>
  );
}
