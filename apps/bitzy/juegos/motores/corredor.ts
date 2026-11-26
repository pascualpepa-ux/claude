import { crearRng } from "@/lib/rng";
import { conAlfa, mezclarColor } from "@/lib/temas";
import { FondoTema, brillo, choque, rectRed, sinBrillo } from "../runtime/dibujo";
import type { ModuloMotor } from "../runtime/tipos";

const W = 800;
const H = 400;
const SUELO = 330;

interface Obst { x: number; w: number; h: number; tipo: "caja" | "barra" | "pozo" | "pinche"; y: number }
interface Moneda { x: number; y: number; tomada: boolean }

const modulo: ModuloMotor = {
  ancho: W,
  alto: H,
  tactil: "toque",
  crear(api) {
    const { p, tema, rng } = api;
    const fondo = new FondoTema(tema, W, H, crearRng(p.semilla), 45);
    const capas = [0, 1].map((c) => {
      const r = crearRng(p.semilla + c * 13);
      const pts: number[] = [];
      for (let i = 0; i <= 24; i++) pts.push(c === 0 ? 120 + r() * 90 : 190 + r() * 70);
      return pts;
    });
    const meta = p.modo === 2 ? 3000 : p.modo === 0 ? 6000 : Infinity;
    const metaMonedas = 120;
    let vel = (300 + p.dificultad * 30) * p.velocidad;
    const velMax = 820 + p.dificultad * 60;
    let dist = 0;
    let monedasTomadas = 0;
    const jug = { y: SUELO, vy: 0, saltos: 0, agachado: 0, enSuelo: true, cae: false };
    const obst: Obst[] = [];
    const monedas: Moneda[] = [];
    let proximo = 700;
    let vivo = true;
    let anim = 0;
    let hudT = 0;

    const generar = () => {
      const x = W + 60;
      const r = rng();
      const dif = Math.min(1, dist / 4000 + p.dificultad * 0.12);
      if (r < 0.35) obst.push({ x, w: 34, h: 38 + rng() * 22 * (1 + dif), tipo: "caja", y: 0 });
      else if (r < 0.55) obst.push({ x, w: 60 + rng() * 40, h: 26, tipo: "barra", y: SUELO - 78 - rng() * 10 });
      else if (r < 0.75 && dist > 300) obst.push({ x, w: 70 + rng() * 60 * (1 + dif), h: 0, tipo: "pozo", y: 0 });
      else obst.push({ x, w: 46 + Math.floor(rng() * 3) * 20, h: 22, tipo: "pinche", y: 0 });
      if (rng() < 0.7) {
        const alto = rng() < 0.5;
        for (let i = 0; i < 5; i++) monedas.push({ x: x + 160 + i * 34, y: alto ? SUELO - 130 - Math.sin((i / 4) * Math.PI) * 50 : SUELO - 30, tomada: false });
      }
      proximo = (260 + rng() * 320) * (vel / 420) * (1.15 - dif * 0.25);
    };

    const perder = (msg: string) => {
      vivo = false;
      api.temblor(12);
      api.sonido.efecto("golpe");
      api.particulas.explotar(150, jug.y - 30, tema.secundario, 30, 260, 4);
      api.fin({ gano: false, mensaje: msg });
    };

    return {
      actualizar(dt) {
        anim += dt;
        if (!vivo) return;
        const e = api.entrada;
        // salto (doble) y deslizamiento
        if ((e.pulsado("a") || e.pulsado("arriba")) && jug.saltos < 2 && !jug.cae) {
          jug.vy = jug.saltos === 0 ? -820 : -700;
          jug.saltos++;
          jug.enSuelo = false;
          jug.agachado = 0;
          api.sonido.efecto("salto");
          api.particulas.explotar(150, jug.y, conAlfa(tema.texto, 0.6), 6, 80, 3, 100);
        }
        if ((e.soltado("a") || e.soltado("arriba")) && jug.vy < -300) jug.vy *= 0.55; // salto variable
        if (e.pulsado("abajo")) { if (jug.enSuelo) jug.agachado = 0.7; else jug.vy = Math.max(jug.vy, 900); }
        if (e.presionado("abajo") && jug.enSuelo) jug.agachado = Math.max(jug.agachado, 0.1);
        jug.agachado = Math.max(0, jug.agachado - dt);

        vel = Math.min(velMax, vel + (9 + p.dificultad * 3) * dt);
        const dx = vel * dt;
        dist += dx / 40;
        for (const o of obst) o.x -= dx;
        for (const m of monedas) m.x -= dx;
        proximo -= dx;
        if (proximo <= 0) generar();
        while (obst.length && obst[0].x + obst[0].w < -50) obst.shift();
        while (monedas.length && monedas[0].x < -40) monedas.shift();

        // física
        jug.vy += 2300 * dt;
        jug.y += jug.vy * dt;
        const sobrePozo = obst.some((o) => o.tipo === "pozo" && 132 > o.x && 168 < o.x + o.w);
        if (jug.y >= SUELO && !sobrePozo && !jug.cae) { jug.y = SUELO; jug.vy = 0; jug.saltos = 0; jug.enSuelo = true; }
        else if (jug.y > SUELO + 4) { jug.enSuelo = false; if (sobrePozo && jug.y > SUELO + 10) jug.cae = true; }
        if (jug.y > H + 80) return perder("Caíste al vacío.");

        const alto = jug.agachado > 0 ? 30 : 58;
        const caja = { x: 136, y: jug.y - alto, w: 28, h: alto };
        for (const o of obst) {
          if (o.tipo === "caja" && choque(caja.x, caja.y, caja.w, caja.h, o.x + 3, SUELO - o.h, o.w - 6, o.h)) return perder("Chocaste contra una caja.");
          if (o.tipo === "pinche" && choque(caja.x, caja.y, caja.w, caja.h, o.x + 4, SUELO - o.h + 6, o.w - 8, o.h)) return perder("Pisaste los pinches.");
          if (o.tipo === "barra" && choque(caja.x, caja.y, caja.w, caja.h, o.x, o.y, o.w, o.h)) return perder("Te golpeaste con una barra: ¡agachate!");
        }
        for (const m of monedas) {
          if (!m.tomada && Math.abs(m.x - 150) < 24 && Math.abs(m.y - (jug.y - alto / 2)) < alto / 2 + 14) {
            m.tomada = true;
            monedasTomadas++;
            api.sumar(10, m.x, m.y - 10);
            api.sonido.efecto("moneda");
            api.particulas.explotar(m.x, m.y, tema.acento, 6, 90, 3, 0);
            if (p.modo === 1 && monedasTomadas >= metaMonedas) { vivo = false; api.fin({ gano: true, mensaje: `¡Juntaste ${metaMonedas} monedas!` }); return; }
          }
        }
        api.fijarPuntos(Math.floor(dist) + monedasTomadas * 10);
        if (Math.floor(dist / 500) !== Math.floor((dist - dx / 40) / 500)) { api.aviso(`${Math.floor(dist / 500) * 500} m`, tema.secundario); api.sonido.efecto("nivel"); }
        if (dist >= meta) { vivo = false; api.fin({ gano: true, mensaje: `¡Completaste ${meta} metros!` }); return; }
        hudT -= dt;
        if (hudT <= 0) {
          hudT = 0.2;
          api.hud([
            { etiqueta: "Metros", valor: p.modo === 2 ? `${Math.floor(dist)}/${meta}` : Math.floor(dist) },
            { etiqueta: "Monedas", valor: p.modo === 1 ? `${monedasTomadas}/${metaMonedas}` : monedasTomadas },
          ]);
        }
      },
      dibujar(g) {
        fondo.dibujar(g, anim, dist * 40);
        // capas de paralaje
        capas.forEach((pts, c) => {
          const despl = ((dist * 40 * (c === 0 ? 0.15 : 0.35)) % (W / 12));
          g.fillStyle = mezclarColor(tema.fondo2, tema.primario, c === 0 ? 0.12 : 0.22);
          g.beginPath(); g.moveTo(0, SUELO);
          for (let i = 0; i <= 24; i++) {
            const idx = (i + Math.floor((dist * 40 * (c === 0 ? 0.15 : 0.35)) / (W / 12))) % pts.length;
            g.lineTo(i * (W / 12) - despl, pts[idx]);
          }
          g.lineTo(W, SUELO); g.closePath(); g.fill();
        });
        // suelo
        const huecos = obst.filter((o) => o.tipo === "pozo");
        g.fillStyle = mezclarColor(tema.fondo, tema.primario, 0.25);
        g.fillRect(0, SUELO, W, H - SUELO);
        g.fillStyle = tema.primario;
        g.fillRect(0, SUELO, W, 4);
        const marca = (dist * 40) % 40;
        g.fillStyle = conAlfa(tema.texto, 0.08);
        for (let x = -marca; x < W; x += 40) g.fillRect(x, SUELO + 18, 20, 4);
        for (const o of huecos) { g.fillStyle = tema.fondo; g.fillRect(o.x, SUELO, o.w, H - SUELO); g.fillStyle = conAlfa("#000000", 0.4); g.fillRect(o.x, SUELO, 6, H - SUELO); }
        // obstáculos
        for (const o of obst) {
          if (o.tipo === "caja") { g.fillStyle = tema.peligro; rectRed(g, o.x, SUELO - o.h, o.w, o.h, 5); g.fill(); g.fillStyle = conAlfa("#000000", 0.25); g.fillRect(o.x + 4, SUELO - o.h + o.h / 2, o.w - 8, 3); }
          else if (o.tipo === "barra") { brillo(g, tema.peligro, 12); g.fillStyle = tema.peligro; rectRed(g, o.x, o.y, o.w, o.h, 8); g.fill(); sinBrillo(g); g.fillStyle = conAlfa(tema.peligro, 0.3); g.fillRect(o.x + o.w / 2 - 2, 0, 4, o.y); }
          else if (o.tipo === "pinche") { g.fillStyle = mezclarColor(tema.peligro, "#ffffff", 0.2); for (let x = o.x; x < o.x + o.w - 4; x += 20) { g.beginPath(); g.moveTo(x, SUELO); g.lineTo(x + 10, SUELO - o.h); g.lineTo(x + 20, SUELO); g.fill(); } }
        }
        // monedas
        for (const m of monedas) if (!m.tomada) {
          const ancho = Math.abs(Math.cos(anim * 4 + m.x * 0.02)) * 9 + 2;
          brillo(g, tema.acento, 10); g.fillStyle = tema.acento;
          g.beginPath(); g.ellipse(m.x, m.y, ancho, 10, 0, 0, 6.283); g.fill(); sinBrillo(g);
        }
        // jugador
        const alto = jug.agachado > 0 ? 30 : 58;
        const x = 136, y = jug.y - alto;
        brillo(g, tema.secundario, 14);
        g.fillStyle = tema.secundario;
        rectRed(g, x, y, 28, alto, 9); g.fill(); sinBrillo(g);
        g.fillStyle = "#fff"; g.fillRect(x + 17, y + 9, 7, 7); g.fillStyle = "#111"; g.fillRect(x + 20, y + 11, 3, 4);
        // piernas animadas
        if (jug.enSuelo && jug.agachado <= 0) {
          const f = Math.sin(anim * 22) * 6;
          g.fillStyle = mezclarColor(tema.secundario, "#000000", 0.3);
          g.fillRect(x + 6 + f, jug.y - 4, 6, 6); g.fillRect(x + 16 - f, jug.y - 4, 6, 6);
        }
        // estela de velocidad
        g.strokeStyle = conAlfa(tema.secundario, 0.25); g.lineWidth = 2;
        for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x - 6, y + 12 + i * 12); g.lineTo(x - 26 - (vel / 40), y + 12 + i * 12); g.stroke(); }
      },
    };
  },
};

export default modulo;
