import { crearRng, type Rng } from "@/lib/rng";
import { conAlfa, mezclarColor } from "@/lib/temas";
import { brillo, rectRed, sinBrillo, texto } from "../runtime/dibujo";
import type { ModuloMotor } from "../runtime/tipos";

const W = 800;
const H = 520;
const LARGO = 54;
const ANCHO = 28;
const NIVELES = 6;

interface Caja { x: number; y: number; w: number; h: number; ang: number; tipo: "auto" | "cono" | "pared" | "seto"; color: string }
interface Nivel { obst: Caja[]; lugar: { x: number; y: number; w: number; h: number; ang: number; sentido: number | null }; inicio: { x: number; y: number; ang: number }; peaton: { x: number; y: number; y0: number; y1: number; v: number } | null; nombre: string }

/** Vértices de una caja rotada (centro x,y; w a lo largo del ángulo). */
export function vertices(c: { x: number; y: number; w: number; h: number; ang: number }): [number, number][] {
  const co = Math.cos(c.ang), si = Math.sin(c.ang), hw = c.w / 2, hh = c.h / 2;
  return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([a, b]) => [c.x + a * co - b * si, c.y + a * si + b * co]);
}
/** Choque entre cajas rotadas (teorema del eje separador). */
export function chocan(a: [number, number][], b: [number, number][]): boolean {
  for (const pol of [a, b]) for (let i = 0; i < 4; i++) {
    const [x1, y1] = pol[i], [x2, y2] = pol[(i + 1) % 4];
    const nx = y2 - y1, ny = x1 - x2;
    let amin = Infinity, amax = -Infinity, bmin = Infinity, bmax = -Infinity;
    for (const [x, y] of a) { const d = x * nx + y * ny; amin = Math.min(amin, d); amax = Math.max(amax, d); }
    for (const [x, y] of b) { const d = x * nx + y * ny; bmin = Math.min(bmin, d); bmax = Math.max(bmax, d); }
    if (amax < bmin || bmax < amin) return false;
  }
  return true;
}

export function generar(rng: Rng, n: number, dif: number, colores: string[]): Nivel {
  const obst: Caja[] = [];
  const auto = (x: number, y: number, ang: number) => obst.push({ x, y, w: LARGO - 2, h: ANCHO - 1, ang, tipo: "auto", color: colores[Math.floor(rng() * colores.length)] });
  // bordes
  obst.push({ x: W / 2, y: 4, w: W, h: 8, ang: 0, tipo: "pared", color: "" }, { x: W / 2, y: H - 4, w: W, h: 8, ang: 0, tipo: "pared", color: "" });
  obst.push({ x: 4, y: H / 2, w: 8, h: H, ang: 0, tipo: "pared", color: "" }, { x: W - 4, y: H / 2, w: 8, h: H, ang: 0, tipo: "pared", color: "" });
  const tipo = n === 3 ? "paralelo" : "bateria";
  const holgura = Math.max(6, 20 - n * 2 - dif * 1.5);
  if (tipo === "paralelo") {
    // estacionamiento en paralelo junto al cordón
    obst.push({ x: W / 2, y: H - 40, w: W, h: 60, ang: 0, tipo: "seto", color: "" });
    const largoLugar = LARGO + 26 + holgura;
    const x0 = 120 + rng() * 380;
    let x = 20;
    while (x < W - 20) {
      if (Math.abs(x + 30 - x0) < largoLugar / 2 + 30 && x < x0 + largoLugar / 2) { x = x0 + largoLugar / 2 + 6; continue; }
      auto(x + 30, H - 70 - ANCHO / 2 - 2, 0);
      x += LARGO + 10 + rng() * 14;
    }
    for (let k = 0; k < 7; k++) auto(60 + k * 110 + rng() * 20, 90, 0);
    return { obst: obst.filter((o) => o.tipo !== "auto" || Math.abs(o.x - x0) > largoLugar / 2 + LARGO / 2 - 4 || o.y < 200), lugar: { x: x0, y: H - 70 - ANCHO / 2 - 2, w: largoLugar, h: ANCHO + 8, ang: 0, sentido: null }, inicio: { x: 70, y: 250, ang: 0 }, peaton: null, nombre: "Estacionamiento en paralelo" };
  }
  // en batería: dos filas de cocheras
  const ancho = ANCHO + holgura + 10;
  const cant = Math.floor((W - 80) / ancho);
  const ox = (W - cant * ancho) / 2;
  const filaArriba = n % 2 === 0;
  const objetivo = 1 + Math.floor(rng() * (cant - 2));
  const prof = LARGO + 18;
  for (const arriba of [true, false]) {
    const yc = arriba ? 20 + prof / 2 : H - 20 - prof / 2;
    for (let k = 0; k < cant; k++) {
      const esObjetivo = arriba === filaArriba && k === objetivo;
      if (!esObjetivo && rng() < 0.88 - n * 0.02) auto(ox + k * ancho + ancho / 2 + (rng() - 0.5) * holgura * 0.5, yc + (rng() - 0.5) * 6, Math.PI / 2 + (rng() - 0.5) * 0.06);
    }
  }
  if (n >= 2) for (let k = 0; k < 2 + n; k++) { const x = 160 + rng() * (W - 320), y = 200 + rng() * 120; if (Math.abs(x - (ox + objetivo * ancho)) > 90) obst.push({ x, y, w: 16, h: 16, ang: 0.785, tipo: "cono", color: "" }); }
  const lugar = { x: ox + objetivo * ancho + ancho / 2, y: filaArriba ? 20 + prof / 2 : H - 20 - prof / 2, w: prof - 6, h: ancho - 4, ang: Math.PI / 2, sentido: n >= 4 ? (filaArriba ? Math.PI / 2 : -Math.PI / 2) : null };
  const peaton = n >= 5 ? { x: lugar.x + (lugar.x > W / 2 ? -160 : 160), y: 200, y0: 170, y1: 350, v: 50 + dif * 10 } : null;
  return { obst, lugar, inicio: { x: lugar.x > W / 2 ? 70 : W - 70, y: H / 2, ang: lugar.x > W / 2 ? 0 : Math.PI }, peaton, nombre: n >= 4 ? "Estacioná de culata (marcha atrás)" : n >= 2 ? "Cuidado con los conos" : "Cochera en batería" };
}

const modulo: ModuloMotor = {
  ancho: W,
  alto: H,
  tactil: "cruceta",
  crear(api) {
    const { p, tema } = api;
    const colores = [tema.peligro, tema.acento, tema.primario, "#e5e7eb", "#64748b", mezclarColor(tema.secundario, tema.peligro, 0.5)];
    const modo = p.modo;
    let nivelN = 0;
    let nivel = generar(crearRng(p.semilla + p.mapa * 97), 0, p.dificultad, colores);
    const car = { x: 0, y: 0, ang: 0, v: 0, giro: 0 };
    const reset = () => { car.x = nivel.inicio.x; car.y = nivel.inicio.y; car.ang = nivel.inicio.ang; car.v = 0; car.giro = 0; };
    reset();
    let golpes = 0;
    let tiempo = 0;
    let quieto = 0;
    let anim = 0;
    let estado: "jugando" | "transicion" | "fin" = "jugando";
    let trans = 0;
    let inv = 0;
    const maxGolpes = modo === 2 ? 1 : 3;
    const limite = () => 45 - p.dificultad * 3 + nivelN * 4;

    const hud = () => {
      const d = [{ etiqueta: "Nivel", valor: `${nivelN + 1}/${NIVELES}` }];
      if (modo === 1) d.push({ etiqueta: "Tiempo", valor: String(Math.max(0, Math.ceil(limite() - tiempo))) });
      else d.push({ etiqueta: "Golpes", valor: `${golpes}/${maxGolpes}` });
      api.hud(d);
    };
    hud();
    api.aviso(nivel.nombre, tema.acento);

    const cajaAuto = () => ({ x: car.x, y: car.y, w: LARGO, h: ANCHO, ang: car.ang });
    const choca = () => {
      const va = vertices(cajaAuto());
      for (const o of nivel.obst) if (chocan(va, vertices(o))) return true;
      if (nivel.peaton && Math.hypot(nivel.peaton.x - car.x, nivel.peaton.y - car.y) < 26) return true;
      return false;
    };
    const dentro = () => {
      const l = nivel.lugar;
      const co = Math.cos(-l.ang), si = Math.sin(-l.ang);
      return vertices(cajaAuto()).every(([x, y]) => { const dx = x - l.x, dy = y - l.y; const lx = dx * co - dy * si, ly = dx * si + dy * co; return Math.abs(lx) <= l.w / 2 + 1 && Math.abs(ly) <= l.h / 2 + 1; });
    };
    const alineado = () => {
      const l = nivel.lugar;
      const dif = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
      if (l.sentido !== null) return dif(car.ang, l.sentido) < 0.22;
      return dif(car.ang, l.ang) < 0.22 || dif(car.ang, l.ang + Math.PI) < 0.22;
    };

    return {
      sonda: () => ({ x: car.x, y: car.y, ang: car.ang, v: car.v, lx: nivel.lugar.x, ly: nivel.lugar.y }),
      actualizar(dt) {
        anim += dt;
        if (estado === "transicion") {
          trans -= dt;
          if (trans <= 0) {
            nivelN++;
            if (nivelN >= NIVELES) { estado = "fin"; api.fin({ gano: true, mensaje: "¡Estacionaste en las 6 playas! Sos un experto del volante." }); return; }
            nivel = generar(crearRng(p.semilla + p.mapa * 97 + nivelN * 7919), nivelN, p.dificultad, colores);
            reset(); golpes = 0; tiempo = 0; estado = "jugando"; hud();
            api.aviso(nivel.nombre, tema.acento);
          }
          return;
        }
        if (estado !== "jugando") return;
        const e = api.entrada;
        tiempo += dt;
        inv = Math.max(0, inv - dt);
        if (modo === 1) {
          if (Math.ceil(limite() - tiempo) !== Math.ceil(limite() - tiempo + dt)) hud();
          if (tiempo > limite()) { estado = "fin"; api.fin({ gano: false, mensaje: "Se acabó el tiempo para estacionar." }); return; }
        }
        // volante y pedales
        const objetivoGiro = e.eje("izq", "der") * 0.62;
        car.giro += (objetivoGiro - car.giro) * Math.min(1, dt * 7);
        const acel = e.eje("abajo", "arriba");
        const vmax = acel >= 0 ? 150 * (0.9 + p.velocidad * 0.1) : 85;
        if (acel) car.v += acel * 190 * dt; else car.v *= Math.pow(0.03, dt);
        if (acel && Math.sign(acel) !== Math.sign(car.v) && Math.abs(car.v) > 5) car.v *= Math.pow(0.02, dt);
        car.v = Math.max(-85, Math.min(vmax, car.v));
        const antes = { x: car.x, y: car.y, ang: car.ang };
        car.ang += (car.v / 46) * Math.tan(car.giro) * dt;
        car.x += Math.cos(car.ang) * car.v * dt;
        car.y += Math.sin(car.ang) * car.v * dt;
        if (choca()) {
          Object.assign(car, antes);
          if (inv <= 0 && Math.abs(car.v) > 12) {
            golpes++; inv = 0.8;
            api.sonido.efecto("golpe"); api.temblor(8);
            api.particulas.explotar(car.x + Math.cos(car.ang) * 27 * Math.sign(car.v), car.y + Math.sin(car.ang) * 27 * Math.sign(car.v), "#ffd166", 10, 140, 3, 0);
            api.sumar(-50);
            if (modo === 1) tiempo += 3;
            hud();
            if (modo !== 1 && golpes >= maxGolpes) { estado = "fin"; api.fin({ gano: false, mensaje: modo === 2 ? "Un roce y afuera: así es el modo Precisión." : "Demasiados choques en este nivel." }); return; }
          }
          car.v = -car.v * 0.25;
        }
        if (nivel.peaton) { const pe = nivel.peaton; pe.y += pe.v * dt; if (pe.y > pe.y1 || pe.y < pe.y0) pe.v *= -1; }
        // ¿estacionado?
        if (dentro() && alineado() && Math.abs(car.v) < 10) {
          quieto += dt;
          if (quieto > 0.8) {
            estado = "transicion"; trans = 1.6; quieto = 0;
            const bonus = Math.max(0, Math.round((60 - tiempo) * 10)) + (golpes === 0 ? 300 : 0);
            api.sumar(500 + bonus);
            api.aviso(golpes === 0 ? "¡Perfecto, sin un rasguño!" : "¡Estacionado!", tema.acento);
            api.sonido.efecto("victoria");
            api.particulas.explotar(nivel.lugar.x, nivel.lugar.y, tema.acento, 40, 220, 4, 0);
          }
        } else quieto = Math.max(0, quieto - dt * 2);
      },
      dibujar(g) {
        g.fillStyle = "#2b2d36"; g.fillRect(0, 0, W, H);
        g.fillStyle = conAlfa(tema.primario, 0.05); g.fillRect(0, 0, W, H);
        for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(255,255,255,.025)"; g.fillRect((i * 137) % W, (i * 89) % H, 3, 3); }
        // marcas de cocheras
        g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 2;
        for (const o of nivel.obst) if (o.tipo === "auto" && Math.abs(o.ang - Math.PI / 2) < 0.2) { g.beginPath(); g.moveTo(o.x - 23, o.y - 40); g.lineTo(o.x - 23, o.y + 40); g.stroke(); }
        // lugar objetivo
        const l = nivel.lugar;
        g.save(); g.translate(l.x, l.y); g.rotate(l.ang);
        const pulso = 0.5 + Math.sin(anim * 4) * 0.25;
        brillo(g, tema.acento, 18);
        g.strokeStyle = tema.acento; g.lineWidth = 3; g.setLineDash([10, 6]); g.lineDashOffset = -anim * 20;
        g.strokeRect(-l.w / 2, -l.h / 2, l.w, l.h); g.setLineDash([]); sinBrillo(g);
        g.fillStyle = conAlfa(tema.acento, 0.12 + pulso * 0.1); g.fillRect(-l.w / 2, -l.h / 2, l.w, l.h);
        g.restore();
        texto(g, "P", l.x, l.y, 22, conAlfa(tema.acento, 0.9));
        if (l.sentido !== null) { g.save(); g.translate(l.x, l.y); g.rotate(l.sentido); g.fillStyle = tema.acento; g.beginPath(); g.moveTo(22, 0); g.lineTo(10, -8); g.lineTo(10, 8); g.fill(); g.restore(); }
        // obstáculos
        for (const o of nivel.obst) {
          if (o.tipo === "pared") { g.fillStyle = mezclarColor(tema.fondo2, tema.primario, 0.4); g.fillRect(o.x - o.w / 2, o.y - o.h / 2, o.w, o.h); continue; }
          if (o.tipo === "seto") { g.fillStyle = mezclarColor(tema.primario, "#0b3d1f", 0.6); g.fillRect(o.x - o.w / 2, o.y - o.h / 2, o.w, o.h); g.fillStyle = "#9ca3af"; g.fillRect(0, o.y - o.h / 2 - 4, W, 4); continue; }
          g.save(); g.translate(o.x, o.y); g.rotate(o.ang);
          if (o.tipo === "cono") { g.fillStyle = "#fb923c"; g.beginPath(); g.arc(0, 0, 9, 0, 6.283); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(0, 0, 4, 0, 6.283); g.fill(); }
          else {
            g.fillStyle = "rgba(0,0,0,.35)"; rectRed(g, -o.w / 2 + 3, -o.h / 2 + 3, o.w, o.h, 7); g.fill();
            g.fillStyle = o.color; rectRed(g, -o.w / 2, -o.h / 2, o.w, o.h, 7); g.fill();
            g.fillStyle = "rgba(0,0,0,.45)"; rectRed(g, -6, -o.h / 2 + 3, 16, o.h - 6, 3); g.fill();
          }
          g.restore();
        }
        if (nivel.peaton) { const pe = nivel.peaton; g.fillStyle = "#fde68a"; g.beginPath(); g.arc(pe.x, pe.y, 9, 0, 6.283); g.fill(); g.fillStyle = tema.secundario; g.beginPath(); g.arc(pe.x, pe.y + 4, 7, 0, Math.PI); g.fill(); }
        // auto del jugador
        g.save(); g.translate(car.x, car.y); g.rotate(car.ang);
        if (inv > 0 && Math.floor(anim * 16) % 2) g.globalAlpha = 0.5;
        g.fillStyle = "#111"; for (const [wx, wy] of [[-17, -15], [-17, 11], [15, -15], [15, 11]]) { g.save(); g.translate(wx + 4, wy + 2); if (wx > 0) g.rotate(car.giro); g.fillRect(-6, -2, 12, 5); g.restore(); }
        brillo(g, tema.secundario, 14); g.fillStyle = tema.secundario; rectRed(g, -LARGO / 2, -ANCHO / 2, LARGO, ANCHO, 8); g.fill(); sinBrillo(g);
        g.fillStyle = "rgba(0,0,0,.5)"; rectRed(g, -4, -ANCHO / 2 + 4, 18, ANCHO - 8, 3); g.fill();
        g.fillStyle = "#fff8c0"; g.fillRect(LARGO / 2 - 3, -ANCHO / 2 + 3, 3, 6); g.fillRect(LARGO / 2 - 3, ANCHO / 2 - 9, 3, 6);
        g.fillStyle = car.v < -1 || api.entrada.presionado("abajo") ? "#ff2a4d" : "#7a1020"; g.fillRect(-LARGO / 2, -ANCHO / 2 + 3, 3, 6); g.fillRect(-LARGO / 2, ANCHO / 2 - 9, 3, 6);
        if (car.v < -1) { g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.moveTo(-LARGO / 2, -10); g.lineTo(-LARGO / 2 - 60, -24); g.lineTo(-LARGO / 2 - 60, 24); g.lineTo(-LARGO / 2, 10); g.fill(); }
        g.globalAlpha = 1;
        g.restore();
        if (quieto > 0) { g.strokeStyle = tema.acento; g.lineWidth = 4; g.beginPath(); g.arc(car.x, car.y - 36, 10, -Math.PI / 2, -Math.PI / 2 + (quieto / 0.8) * Math.PI * 2); g.stroke(); }
        if (anim < 4 && nivelN === 0) texto(g, "↑ avanzar · ↓ marcha atrás · ← → volante", W / 2, H / 2 + 60, 16, "rgba(255,255,255,.75)", "center", 600);
      },
    };
  },
};

export default modulo;
