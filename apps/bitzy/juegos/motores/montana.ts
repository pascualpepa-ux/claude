import { crearRng } from "@/lib/rng";
import { conAlfa, mezclarColor } from "@/lib/temas";
import { FondoTema, brillo, rectRed, sinBrillo, texto } from "../runtime/dibujo";
import type { ModuloMotor } from "../runtime/tipos";

const W = 800;
const H = 450;
const G = 950;
const RUEDA = 14;
const PASOS = 4;

interface Item { x: number; y: number; tipo: "moneda" | "nafta"; tomado: boolean }

/** Subida de montaña con física de carrocería + suspensión (estilo hill climb). */
const modulo: ModuloMotor = {
  ancho: W,
  alto: H,
  tactil: "lados",
  crear(api) {
    const { p, tema } = api;
    const fondo = new FondoTema(tema, W, H, crearRng(p.semilla), 40);
    const r = crearRng(p.semilla + p.mapa * 131);
    const ondas = Array.from({ length: 4 }, (_, i) => ({ f: (0.0018 + r() * 0.002) * (1 + i * 1.1), a: (60 / (1 + i * 1.3)) * (0.7 + r() * 0.5), fase: r() * 6.28 }));
    const rugosidad = 0.75 + p.dificultad * 0.12 + p.mapa * 0.03;
    const crudo = (x: number) => { let y = 0; for (const o of ondas) y += Math.sin(x * o.f + o.fase) * o.a; return y; };
    // Normaliza: la pendiente máxima base queda en ~0,45 y crece con la distancia y la dificultad
    let maxPend = 0.001;
    for (let x = 0; x < 20000; x += 7) maxPend = Math.max(maxPend, Math.abs(crudo(x + 1) - crudo(x)));
    const escala = (0.5 + p.dificultad * 0.05) / maxPend;
    const suelo = (x: number) => {
      const k = Math.min(1.9, 0.45 + (x / 7000) * rugosidad) * (x < 500 ? x / 500 : 1);
      return 300 - crudo(x) * escala * k;
    };
    const pendiente = (x: number) => (suelo(x + 1) - suelo(x - 1)) / 2;

    const modo = p.modo;
    const meta = modo === 2 ? 3000 : modo === 0 ? 1500 : Infinity;
    const metaMonedas = 120;
    const auto = { x: 120, y: suelo(120) - 60, vx: 0, vy: 0, a: 0, w: 0, giroRueda: 0 };
    const ruedas = [{ ox: -30, oy: 18 }, { ox: 30, oy: 18 }];
    let nafta = 100;
    let turbo = 0;
    let turbos = 2;
    let monedas = 0;
    let anim = 0;
    let terminado = false;
    let quieto = 0;
    let camX = 0, camY = suelo(120) - 280;
    let enSuelo = [false, false];
    let mejorDist = 0;
    const items: Item[] = [];
    let generadoHasta = 300;
    const generar = (hasta: number) => {
      while (generadoHasta < hasta) {
        const x = generadoHasta;
        const sep = 460 + x * 0.06 * (0.7 + p.mult * 0.3);
        if (Math.floor(x / sep) !== Math.floor((x - 40) / sep) && x > 600) items.push({ x, y: suelo(x) - 34, tipo: "nafta", tomado: false });
        else if (r() < 0.055) for (let i = 0; i < 5; i++) items.push({ x: x + i * 26, y: suelo(x + i * 26) - 30 - (i === 2 ? 10 : 0), tipo: "moneda", tomado: false });
        generadoHasta += 40;
      }
    };
    generar(1600);

    const hud = () => {
      const d = [
        { etiqueta: "Distancia", valor: `${Math.floor(mejorDist)} m${meta < Infinity ? ` / ${meta}` : ""}` },
        { etiqueta: "Nafta", valor: `${Math.max(0, Math.round(nafta))}%` },
        { etiqueta: "Monedas", valor: modo === 1 ? `${monedas}/${metaMonedas}` : monedas },
        { etiqueta: "Turbo", valor: "⚡".repeat(turbos) || "—" },
      ];
      api.hud(d);
    };
    hud();
    let hudT = 0;

    const terminar = (gano: boolean, msg: string) => {
      if (terminado) return;
      terminado = true;
      if (!gano) { api.temblor(12); api.sonido.efecto("explosion"); api.particulas.explotar(auto.x - camX, auto.y - camY, tema.secundario, 30, 260, 4); }
      api.fin({ gano, mensaje: msg });
    };

    return {
      sonda: () => ({ a: auto.a, pend: Math.atan(pendiente(auto.x)), aire: !enSuelo[0] && !enSuelo[1], vx: auto.vx, x: auto.x, nafta }),
      actualizar(dt) {
        anim += dt;
        const e = api.entrada;
        const gas = !terminado && nafta > 0 && (e.presionado("der") || e.presionado("arriba"));
        const freno = !terminado && (e.presionado("izq") || e.presionado("abajo") || e.presionado("b"));
        if (!terminado && e.pulsado("a") && turbos > 0 && turbo <= 0) { turbos--; turbo = 2; api.sonido.efecto("mejora"); hud(); }
        turbo = Math.max(0, turbo - dt);
        const h = dt / PASOS;
        for (let s = 0; s < PASOS; s++) {
          let ax = 0, ay = G, aw = 0;
          const cos = Math.cos(auto.a), sin = Math.sin(auto.a);
          enSuelo = [false, false];
          ruedas.forEach((rd, i) => {
            const rx = rd.ox * cos - rd.oy * sin, ry = rd.ox * sin + rd.oy * cos;
            const px = auto.x + rx, py = auto.y + ry;
            const gy = suelo(px);
            const pen = py + RUEDA - gy;
            if (pen <= 0) return;
            enSuelo[i] = true;
            const d = pendiente(px);
            const l = Math.hypot(1, d);
            const tx = 1 / l, ty = d / l;
            const nx = d / l, ny = -1 / l;
            const vpx = auto.vx - auto.w * ry, vpy = auto.vy + auto.w * rx;
            const vn = vpx * nx + vpy * ny, vt = vpx * tx + vpy * ty;
            let fn = 260 * pen - 22 * vn;
            if (fn < 0) fn = 0;
            let ft = -vt * 0.35; // rodadura
            if (gas) ft += (i === 0 ? 560 : 380) * (turbo > 0 ? 1.9 : 1) * (vt > (420 + p.velocidad * 50 + p.dificultad * 15) * (turbo > 0 ? 1.4 : 1) ? 0.05 : 1);
            if (freno) ft += vt > 20 ? -900 : -320;
            ft = Math.max(-fn * 1.6 - 300, Math.min(fn * 1.6 + 300, ft));
            const fx = nx * fn + tx * ft, fy = ny * fn + ty * ft;
            ax += fx; ay += fy;
            // el empuje de la tracción levanta menos la trompa (más jugable que la física pura)
            const fxT = nx * fn + tx * ft * 0.35, fyT = ny * fn + ty * ft * 0.35;
            aw += (rx * fyT - ry * fxT) / 1900;
          });
          if (!enSuelo[0] && !enSuelo[1]) {
            if (gas) aw -= 3.4; if (freno) aw += 3.4;
            // ayuda suave: en el aire el auto tiende a alinearse con el terreno
            const objetivo = Math.atan(pendiente(auto.x + auto.vx * 0.25));
            if (!gas && !freno) aw += (objetivo - auto.a) * 4 - auto.w * 1.5;
          }
          auto.vx += ax * h; auto.vy += ay * h; auto.w += aw * h;
          auto.w *= Math.pow(enSuelo[0] || enSuelo[1] ? 0.2 : 0.7, h);
          auto.vx *= Math.pow(0.97, h);
          auto.x += auto.vx * h; auto.y += auto.vy * h; auto.a += auto.w * h;
        }
        if (auto.x < 40) { auto.x = 40; auto.vx = Math.max(0, auto.vx); }
        auto.giroRueda += auto.vx * dt / RUEDA;
        if (terminado) return;

        // nafta
        nafta -= dt * (gas ? 3.3 + p.dificultad * 0.5 : 0.7);
        // techo contra el piso = vuelco
        const cos = Math.cos(auto.a), sin = Math.sin(auto.a);
        const tx = auto.x + 22 * sin, ty = auto.y - 22 * cos;
        const inclinacion = Math.abs(auto.a - Math.atan(pendiente(auto.x)));
        if (ty > suelo(tx) - 2 && inclinacion > 1.25) { terminar(false, "¡Volcaste! Cuidado con las subidas empinadas."); return; }
        const vel = Math.hypot(auto.vx, auto.vy);
        if (nafta <= 0 && vel < 15) { quieto += dt; if (quieto > 1.5) { terminar(false, "Te quedaste sin nafta."); return; } } else quieto = 0;
        if (gas && (enSuelo[0] || enSuelo[1]) && vel > 60 && Math.random() < 0.4) api.particulas.explotar(auto.x - 30 - camX, auto.y + 30 - camY, conAlfa(tema.texto, 0.5), 1, 60, 4, -80);

        mejorDist = Math.max(mejorDist, (auto.x - 120) / 10);
        generar(auto.x + 1400);
        for (const it of items) {
          if (it.tomado || Math.abs(it.x - auto.x) > 50) continue;
          if (Math.hypot(it.x - auto.x, it.y - auto.y) < 42) {
            it.tomado = true;
            if (it.tipo === "nafta") { nafta = 100; api.aviso("¡Tanque lleno!", tema.acento); api.sonido.efecto("mejora"); }
            else { monedas++; api.sumar(10); api.sonido.efecto("moneda"); if (modo === 1 && monedas >= metaMonedas) { terminar(true, `¡Juntaste ${metaMonedas} monedas!`); return; } }
          }
        }
        if (Math.floor(mejorDist / 250) > Math.floor((mejorDist - vel * dt / 10) / 250) && mejorDist > 10) { api.aviso(`${Math.floor(mejorDist / 250) * 250} m`, tema.secundario); api.sonido.efecto("nivel"); }
        if (mejorDist >= meta) { api.sumar(Math.round(nafta * 5)); terminar(true, `¡Llegaste a los ${meta} metros!`); return; }
        api.fijarPuntos(Math.floor(mejorDist) + monedas * 10);
        hudT -= dt;
        if (hudT <= 0) { hudT = 0.2; hud(); }
        camX += (auto.x - 260 + auto.vx * 0.3 - camX) * Math.min(1, dt * 4);
        camY += (auto.y - 250 - camY) * Math.min(1, dt * 3);
      },
      dibujar(g) {
        fondo.dibujar(g, anim, camX);
        // cerros lejanos
        for (const [k, a, c] of [[0.2, 0.35, 0.12], [0.45, 0.6, 0.22]] as const) {
          g.fillStyle = mezclarColor(tema.fondo2, tema.primario, c);
          g.beginPath(); g.moveTo(0, H);
          for (let x = 0; x <= W; x += 16) g.lineTo(x, 230 + (suelo((x + camX) * k + 4000) - 300) * a - (camY - suelo(120) + 280) * k * 0.3);
          g.lineTo(W, H); g.fill();
        }
        g.save();
        g.translate(-Math.round(camX), -Math.round(camY));
        // terreno
        const x0 = Math.floor(camX / 8) * 8 - 8;
        g.fillStyle = mezclarColor(tema.fondo2, tema.secundario, 0.25);
        g.beginPath(); g.moveTo(x0, camY + H + 10);
        for (let x = x0; x <= camX + W + 16; x += 8) g.lineTo(x, suelo(x));
        g.lineTo(camX + W + 16, camY + H + 10); g.fill();
        g.strokeStyle = tema.primario; g.lineWidth = 8; g.lineJoin = "round";
        g.beginPath();
        for (let x = x0; x <= camX + W + 16; x += 8) (x === x0 ? g.moveTo(x, suelo(x) + 3) : g.lineTo(x, suelo(x) + 3));
        g.stroke();
        // carteles de distancia
        for (let m = Math.floor(camX / 1000) * 100; m * 10 < camX + W + 200; m += 100) {
          const x = m * 10 + 120;
          if (m <= 0) continue;
          g.fillStyle = conAlfa(tema.texto, 0.6); g.fillRect(x, suelo(x) - 60, 3, 60);
          g.fillStyle = m === meta ? tema.acento : conAlfa(tema.texto, 0.15); rectRed(g, x, suelo(x) - 60, 54, 22, 4); g.fill();
          texto(g, `${m} m`, x + 27, suelo(x) - 49, 12, m === meta ? tema.fondo : tema.texto, "center", 700);
        }
        // ítems
        for (const it of items) {
          if (it.tomado || it.x < camX - 40 || it.x > camX + W + 40) continue;
          if (it.tipo === "nafta") {
            brillo(g, tema.peligro, 12); g.fillStyle = tema.peligro; rectRed(g, it.x - 11, it.y - 14, 22, 28, 4); g.fill(); sinBrillo(g);
            g.fillStyle = "#fff"; g.fillRect(it.x - 5, it.y - 18, 10, 5); texto(g, "N", it.x, it.y + 1, 13, "#fff");
          } else {
            brillo(g, tema.acento, 10); g.fillStyle = tema.acento;
            g.beginPath(); g.ellipse(it.x, it.y, Math.abs(Math.cos(anim * 4 + it.x)) * 8 + 2, 9, 0, 0, 6.283); g.fill(); sinBrillo(g);
          }
        }
        // auto
        g.save(); g.translate(auto.x, auto.y); g.rotate(auto.a);
        g.strokeStyle = conAlfa("#000000", 0.6); g.lineWidth = 4;
        for (const rd of ruedas) { g.beginPath(); g.moveTo(rd.ox, 0); g.lineTo(rd.ox, rd.oy); g.stroke(); }
        brillo(g, tema.secundario, 10);
        g.fillStyle = tema.secundario;
        g.beginPath(); g.moveTo(-44, 8); g.lineTo(-40, -8); g.lineTo(-10, -10); g.lineTo(4, -26); g.lineTo(26, -26); g.lineTo(34, -10); g.lineTo(46, -6); g.lineTo(46, 10); g.closePath(); g.fill();
        sinBrillo(g);
        g.fillStyle = conAlfa("#bfe9ff", 0.8); g.beginPath(); g.moveTo(8, -22); g.lineTo(24, -22); g.lineTo(30, -11); g.lineTo(2, -11); g.fill();
        g.fillStyle = "#f5d0a9"; g.beginPath(); g.arc(14, -16, 5, 0, 6.283); g.fill();
        g.fillStyle = tema.acento; g.fillRect(40, -4, 6, 5);
        if (turbo > 0) { g.fillStyle = tema.acento; g.beginPath(); g.moveTo(-44, -2); g.lineTo(-64 - Math.random() * 16, 2); g.lineTo(-44, 6); g.fill(); }
        g.restore();
        for (const rd of ruedas) {
          const c = Math.cos(auto.a), s = Math.sin(auto.a);
          const wx = auto.x + rd.ox * c - rd.oy * s, wy = auto.y + rd.ox * s + rd.oy * c;
          g.fillStyle = "#15151c"; g.beginPath(); g.arc(wx, wy, RUEDA, 0, 6.283); g.fill();
          g.fillStyle = "#8a8aa0"; g.beginPath(); g.arc(wx, wy, RUEDA * 0.5, 0, 6.283); g.fill();
          g.strokeStyle = "#15151c"; g.lineWidth = 2;
          for (let k = 0; k < 3; k++) { const ang = auto.giroRueda + (k * Math.PI * 2) / 3; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + Math.cos(ang) * RUEDA * 0.5, wy + Math.sin(ang) * RUEDA * 0.5); g.stroke(); }
        }
        g.restore();
        // medidor de nafta
        g.fillStyle = conAlfa("#000000", 0.4); rectRed(g, 16, 16, 160, 16, 8); g.fill();
        g.fillStyle = nafta > 25 ? tema.primario : tema.peligro; rectRed(g, 16, 16, Math.max(8, 160 * Math.max(0, nafta) / 100), 16, 8); g.fill();
        texto(g, "NAFTA", 96, 25, 11, "#fff", "center", 800);
        if (anim < 4) texto(g, "→ acelerar · ← frenar · en el aire inclinás el auto", W / 2, H - 24, 15, conAlfa(tema.texto, 0.8), "center", 600);
      },
    };
  },
};

export default modulo;
