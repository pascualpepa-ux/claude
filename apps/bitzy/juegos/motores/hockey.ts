import { crearRng } from "@/lib/rng";
import { conAlfa, mezclarColor } from "@/lib/temas";
import { FondoTema, brillo, rectRed, sinBrillo, texto } from "../runtime/dibujo";
import type { ModuloMotor } from "../runtime/tipos";

const W = 800;
const H = 450;
const M = 26; // margen de la mesa
const ARCO = 120; // alto del arco
const RM = 30; // radio del mazo
const RD = 16; // radio del disco

interface Mazo { x: number; y: number; vx: number; vy: number; px: number; py: number }

const modulo: ModuloMotor = {
  ancho: W,
  alto: H,
  tactil: "puntero",
  dosJugadores: (modo) => modo === 1,
  crear(api) {
    const { p, tema, rng } = api;
    const fondo = new FondoTema(tema, W, H, crearRng(p.semilla), 30);
    const modo = p.modo;
    const dos = modo === 1;
    const metaGoles = modo === 2 ? 5 : 7;
    let rival = 0; // torneo: 0..2
    const nombresRivales = ["Novato", "Veterano", "Campeón"];
    const izq: Mazo = { x: 120, y: H / 2, vx: 0, vy: 0, px: 120, py: H / 2 };
    const der: Mazo = { x: W - 120, y: H / 2, vx: 0, vy: 0, px: W - 120, py: H / 2 };
    const disco = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
    let goles = [0, 0];
    let saque = 1.2;
    let anim = 0;
    let terminado = false;
    let rastro: { x: number; y: number }[] = [];
    const yTop = M, yBot = H - M, xIzq = M, xDer = W - M;
    const a0 = H / 2 - ARCO / 2, a1 = H / 2 + ARCO / 2;

    const velCpu = () => (300 + p.dificultad * 70 + (modo === 2 ? rival * 110 : 0)) * (0.9 + p.velocidad * 0.1);
    const hud = () => {
      const d = [{ etiqueta: dos ? "Jugador 1" : "Vos", valor: String(goles[0]) }, { etiqueta: dos ? "Jugador 2" : modo === 2 ? nombresRivales[rival] : "CPU", valor: String(goles[1]) }];
      if (modo === 2) d.push({ etiqueta: "Partido", valor: `${rival + 1}/3` });
      api.hud(d);
    };
    hud();

    const reiniciar = (haciaIzq: boolean) => {
      disco.x = W / 2 + (haciaIzq ? -60 : 60); disco.y = H / 2; disco.vx = 0; disco.vy = 0;
      izq.x = 120; izq.y = H / 2; der.x = W - 120; der.y = H / 2;
      saque = 1;
      rastro = [];
    };

    const moverHacia = (m: Mazo, tx: number, ty: number, vmax: number, dt: number, minX: number, maxX: number) => {
      const dx = tx - m.x, dy = ty - m.y;
      const d = Math.hypot(dx, dy);
      const paso = Math.min(d, vmax * dt);
      if (d > 0) { m.x += (dx / d) * paso; m.y += (dy / d) * paso; }
      m.x = Math.max(minX + RM, Math.min(maxX - RM, m.x));
      m.y = Math.max(yTop + RM, Math.min(yBot - RM, m.y));
    };

    const chocar = (m: Mazo) => {
      const dx = disco.x - m.x, dy = disco.y - m.y;
      const d = Math.hypot(dx, dy);
      if (d >= RM + RD || d === 0) return;
      const nx = dx / d, ny = dy / d;
      disco.x = m.x + nx * (RM + RD + 0.5);
      disco.y = m.y + ny * (RM + RD + 0.5);
      const rvx = disco.vx - m.vx, rvy = disco.vy - m.vy;
      const vn = rvx * nx + rvy * ny;
      if (vn < 0) { disco.vx -= 1.9 * vn * nx; disco.vy -= 1.9 * vn * ny; }
      disco.vx += m.vx * 0.35; disco.vy += m.vy * 0.35;
      const v = Math.hypot(disco.vx, disco.vy), max = 1150;
      if (v > max) { disco.vx *= max / v; disco.vy *= max / v; }
      api.sonido.efecto("rebote");
      api.particulas.explotar(disco.x - nx * RD, disco.y - ny * RD, tema.acento, 5, 120, 3, 0);
    };

    const gol = (deIzq: boolean) => {
      goles[deIzq ? 0 : 1]++;
      api.sonido.efecto(deIzq || dos ? "victoria" : "derrota");
      api.temblor(14);
      api.particulas.explotar(deIzq ? W - M : M, H / 2, deIzq ? tema.secundario : tema.peligro, 50, 380, 4, 0);
      if (deIzq && !dos) api.sumar(100 + p.dificultad * 25, W - 80, H / 2);
      api.aviso("¡GOL!", deIzq ? tema.secundario : tema.peligro);
      hud();
      if (goles[0] >= metaGoles || goles[1] >= metaGoles) {
        const ganoIzq = goles[0] >= metaGoles;
        if (modo === 2 && ganoIzq && rival < 2) {
          rival++;
          api.sumar(500);
          goles = [0, 0];
          api.aviso(`Próximo rival: ${nombresRivales[rival]}`, tema.acento);
          hud();
        } else {
          terminado = true;
          if (!dos && ganoIzq) api.sumar(goles[0] * 50 - goles[1] * 20 + 300);
          api.fin({ gano: dos ? true : ganoIzq, mensaje: dos ? `¡Ganó el Jugador ${ganoIzq ? 1 : 2}! ${goles[0]} a ${goles[1]}` : ganoIzq ? (modo === 2 ? "¡Campeón del torneo!" : `¡Ganaste ${goles[0]} a ${goles[1]}!`) : `Perdiste ${goles[0]} a ${goles[1]}.` });
          return;
        }
      }
      reiniciar(deIzq);
    };

    return {
      actualizar(dt) {
        anim += dt;
        if (terminado) return;
        const e = api.entrada;
        izq.px = izq.x; izq.py = izq.y; der.px = der.x; der.py = der.y;
        const vJug = 620;
        // jugador izquierdo: teclado (WASD en 2 jugadores) o toque/mouse en su mitad
        const ax = dos ? e.eje("izq2", "der2") : e.eje("izq", "der");
        const ay = dos ? e.eje("arriba2", "abajo2") : e.eje("arriba", "abajo");
        if (ax || ay) moverHacia(izq, izq.x + ax * 200, izq.y + ay * 200, vJug, dt, xIzq, W / 2);
        // toques / mouse
        let toqueIzq: { x: number; y: number } | null = null, toqueDer: { x: number; y: number } | null = null;
        for (const t of e.toques.values()) { if (t.x < W / 2 || !dos) toqueIzq = t; else toqueDer = t; }
        if (!toqueIzq && !dos && e.puntero.activo && !("ontouchstart" in window)) toqueIzq = e.puntero;
        if (toqueIzq) moverHacia(izq, toqueIzq.x, toqueIzq.y, 1400, dt, xIzq, W / 2);
        if (dos) {
          const bx = e.eje("izq", "der"), by = e.eje("arriba", "abajo");
          if (bx || by) moverHacia(der, der.x + bx * 200, der.y + by * 200, vJug, dt, W / 2, xDer);
          if (toqueDer) moverHacia(der, toqueDer.x, toqueDer.y, 1400, dt, W / 2, xDer);
        } else {
          // IA: defiende, intercepta y ataca
          const vc = velCpu();
          let tx = W - 110, ty = H / 2 + (disco.y - H / 2) * 0.5;
          if (disco.x > W / 2 - 40) {
            const detras = disco.x < der.x + 10;
            if (detras || disco.vx > -50) { tx = disco.x + (detras ? 28 : -10); ty = disco.y + (disco.y < H / 2 ? 6 : -6) * (rng() < 0.5 ? 1 : 1); }
          } else if (disco.vx > 0) ty = disco.y + (disco.vy * (der.x - disco.x)) / Math.max(200, disco.vx) * 0.3;
          moverHacia(der, tx, Math.max(yTop + RM, Math.min(yBot - RM, ty)), vc, dt, W / 2, xDer);
        }
        izq.vx = (izq.x - izq.px) / dt; izq.vy = (izq.y - izq.py) / dt;
        der.vx = (der.x - der.px) / dt; der.vy = (der.y - der.py) / dt;

        if (saque > 0) { saque -= dt; return; }
        // disco
        const sub = 3;
        for (let i = 0; i < sub; i++) {
          disco.x += (disco.vx * dt) / sub;
          disco.y += (disco.vy * dt) / sub;
          if (disco.y < yTop + RD) { disco.y = yTop + RD; disco.vy = Math.abs(disco.vy) * 0.92; api.sonido.efecto("clic"); }
          if (disco.y > yBot - RD) { disco.y = yBot - RD; disco.vy = -Math.abs(disco.vy) * 0.92; api.sonido.efecto("clic"); }
          const enArco = disco.y > a0 && disco.y < a1;
          if (disco.x < xIzq + RD) { if (enArco) { if (disco.x < xIzq - RD) { gol(false); return; } } else { disco.x = xIzq + RD; disco.vx = Math.abs(disco.vx) * 0.92; api.sonido.efecto("clic"); } }
          if (disco.x > xDer - RD) { if (enArco) { if (disco.x > xDer + RD) { gol(true); return; } } else { disco.x = xDer - RD; disco.vx = -Math.abs(disco.vx) * 0.92; api.sonido.efecto("clic"); } }
          chocar(izq); chocar(der);
        }
        const f = Math.pow(0.78, dt);
        disco.vx *= f; disco.vy *= f;
        rastro.push({ x: disco.x, y: disco.y });
        if (rastro.length > 10) rastro.shift();
      },
      dibujar(g) {
        fondo.dibujar(g, anim);
        // mesa
        g.fillStyle = conAlfa(mezclarColor(tema.fondo2, "#ffffff", 0.08), 0.92);
        rectRed(g, M - 6, M - 6, W - 2 * M + 12, H - 2 * M + 12, 40); g.fill();
        g.strokeStyle = tema.primario; g.lineWidth = 4; rectRed(g, M, M, W - 2 * M, H - 2 * M, 34); g.stroke();
        g.strokeStyle = conAlfa(tema.primario, 0.35); g.lineWidth = 3;
        g.beginPath(); g.moveTo(W / 2, M); g.lineTo(W / 2, H - M); g.stroke();
        g.beginPath(); g.arc(W / 2, H / 2, 60, 0, 6.283); g.stroke();
        g.beginPath(); g.arc(M, H / 2, 90, -Math.PI / 2, Math.PI / 2); g.stroke();
        g.beginPath(); g.arc(W - M, H / 2, 90, Math.PI / 2, Math.PI * 1.5); g.stroke();
        // arcos
        brillo(g, tema.secundario, 16); g.fillStyle = tema.secundario; g.fillRect(M - 10, a0, 10, ARCO);
        brillo(g, tema.peligro, 16); g.fillStyle = tema.peligro; g.fillRect(W - M, a0, 10, ARCO); sinBrillo(g);
        // marcador
        texto(g, String(goles[0]), W / 2 - 50, 60, 44, conAlfa(tema.secundario, 0.35));
        texto(g, String(goles[1]), W / 2 + 50, 60, 44, conAlfa(tema.peligro, 0.35));
        // rastro y disco
        rastro.forEach((r, i) => { g.fillStyle = conAlfa(tema.acento, (i / rastro.length) * 0.25); g.beginPath(); g.arc(r.x, r.y, RD * (i / rastro.length), 0, 6.283); g.fill(); });
        brillo(g, "#ffffff", 14); g.fillStyle = "#f4f4f4"; g.beginPath(); g.arc(disco.x, disco.y, RD, 0, 6.283); g.fill(); sinBrillo(g);
        g.fillStyle = conAlfa("#000000", 0.25); g.beginPath(); g.arc(disco.x, disco.y, RD * 0.55, 0, 6.283); g.fill();
        // mazos
        for (const [m, col] of [[izq, tema.secundario], [der, tema.peligro]] as const) {
          brillo(g, col, 18); g.fillStyle = col; g.beginPath(); g.arc(m.x, m.y, RM, 0, 6.283); g.fill(); sinBrillo(g);
          g.fillStyle = mezclarColor(col, "#000000", 0.3); g.beginPath(); g.arc(m.x, m.y, RM * 0.55, 0, 6.283); g.fill();
          g.fillStyle = conAlfa("#ffffff", 0.35); g.beginPath(); g.arc(m.x - 6, m.y - 6, RM * 0.25, 0, 6.283); g.fill();
        }
        if (saque > 0 && goles[0] + goles[1] === 0) texto(g, dos ? "J1: WASD o mitad izquierda · J2: flechas o mitad derecha" : "Mové tu mazo con el mouse, el dedo o las flechas", W / 2, H - 50, 15, conAlfa(tema.texto, 0.75), "center", 600);
      },
    };
  },
};

export default modulo;
