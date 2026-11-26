import { crearRng, type Rng } from "@/lib/rng";
import { conAlfa, mezclarColor } from "@/lib/temas";
import { FondoTema, brillo, choque, rectRed, sinBrillo } from "../runtime/dibujo";
import type { ModuloMotor } from "../runtime/tipos";

const W = 800;
const H = 450;
const T = 32;
const FILAS = 14;
const NIVELES = 5;

interface Enemigo { x: number; y: number; vx: number; vivo: boolean; min: number; max: number }
interface Item { x: number; y: number; tomado: boolean; gema: boolean }
interface Nivel { ancho: number; sol: Uint8Array; pinches: Set<number>; enemigos: Enemigo[]; items: Item[]; meta: number; inicioY: number }

/** Genera un nivel recorrible por tramos: llano, pozo, escalón, puente, pinches. */
function generarNivel(rng: Rng, n: number, dif: number): Nivel {
  const ancho = 90 + n * 22;
  const sol = new Uint8Array(ancho * FILAS);
  const pinches = new Set<number>();
  const enemigos: Enemigo[] = [];
  const items: Item[] = [];
  const set = (x: number, y: number) => { if (x >= 0 && x < ancho && y >= 0 && y < FILAS) sol[y * ancho + x] = 1; };
  const columna = (x: number, desde: number) => { for (let y = desde; y < FILAS; y++) set(x, y); };
  let x = 0;
  let h = 11;
  const llano = (len: number) => { for (let i = 0; i < len; i++) columna(x + i, h); };
  llano(8);
  for (let i = 0; i < 3; i++) items.push({ x: (4 + i) * T + 8, y: (h - 2) * T, tomado: false, gema: false });
  x += 8;
  const exigencia = Math.min(1, 0.25 + n * 0.15 + dif * 0.1);
  while (x < ancho - 12) {
    const r = rng();
    if (r < 0.22) {
      const len = 4 + Math.floor(rng() * 5);
      llano(len);
      if (len >= 5 && rng() < 0.45 + exigencia * 0.4) enemigos.push({ x: (x + 2) * T, y: h * T - 26, vx: (40 + dif * 12 + n * 6) * (rng() < 0.5 ? -1 : 1), vivo: true, min: x * T, max: (x + len) * T - 26 });
      if (rng() < 0.6) for (let i = 1; i < len - 1; i++) items.push({ x: (x + i) * T + 8, y: (h - 2) * T, tomado: false, gema: false });
      x += len;
    } else if (r < 0.42) {
      const len = 2 + Math.floor(rng() * (1.5 + exigencia * 1.5));
      items.push({ x: (x + len / 2) * T, y: (h - 4) * T, tomado: false, gema: rng() < 0.3 });
      x += len;
      llano(2); x += 2;
    } else if (r < 0.58) {
      const nh = Math.max(6, Math.min(12, h + (rng() < 0.5 ? -1 : 1) * (1 + Math.floor(rng() * 2))));
      h = nh; llano(3); x += 3;
    } else if (r < 0.74) {
      // puente de plataformas flotantes sobre un pozo
      const largo = 6 + Math.floor(rng() * 4);
      const py = Math.max(4, h - 2 - Math.floor(rng() * 2));
      for (let i = 1; i < largo - 1; i += 3) { set(x + i, py); set(x + i + 1, py); items.push({ x: (x + i) * T + 20, y: (py - 1) * T, tomado: false, gema: i === 1 && rng() < 0.5 }); }
      x += largo;
      llano(2); x += 2;
    } else if (r < 0.88) {
      const len = 5 + Math.floor(rng() * 3);
      llano(len);
      const np = 1 + Math.floor(rng() * (1 + exigencia * 2));
      for (let i = 0; i < np; i++) pinches.add((h - 1) * ancho + x + 2 + i);
      x += len;
    } else {
      // plataforma alta con gema
      const len = 6;
      llano(len);
      set(x + 2, h - 3); set(x + 3, h - 3); set(x + 4, h - 3);
      items.push({ x: (x + 3) * T + 8, y: (h - 5) * T, tomado: false, gema: true });
      x += len;
    }
  }
  h = Math.min(h, 11);
  while (x < ancho) { columna(x, h); x++; }
  // garantizar al menos 3 gemas
  let gemas = items.filter((i) => i.gema).length;
  for (const it of items) { if (gemas >= 3) break; if (!it.gema && rng() < 0.2) { it.gema = true; gemas++; } }
  return { ancho, sol, pinches, enemigos, items, meta: (ancho - 5) * T, inicioY: 9 * T };
}

const modulo: ModuloMotor = {
  ancho: W,
  alto: H,
  tactil: "lados-salto",
  crear(api) {
    const { p, tema } = api;
    const fondo = new FondoTema(tema, W, H, crearRng(p.semilla), 40);
    let nivelN = 0;
    let nivel = generarNivel(crearRng(p.semilla + 1000 * (p.mapa + 1)), 0, p.dificultad);
    let vidas = p.modo === 1 ? Infinity : 3;
    let tiempoNivel = 0;
    const limite = () => 75 - p.dificultad * 6 + nivelN * 8;
    const j = { x: 3 * T, y: nivel.inicioY, vx: 0, vy: 0, suelo: false, coyote: 0, buffer: 0, mira: 1, inv: 0 };
    let cam = 0;
    let anim = 0;
    let estado: "jugando" | "transicion" | "fin" = "jugando";
    let trans = 0;
    let monedas = 0;
    const gemasNivel = () => nivel.items.filter((i) => i.gema);

    const hud = () => {
      const d = [{ etiqueta: "Nivel", valor: `${nivelN + 1}/${NIVELES}` }];
      if (p.modo !== 1) d.push({ etiqueta: "Vidas", valor: String(vidas) });
      if (p.modo === 1) d.push({ etiqueta: "Tiempo", valor: String(Math.max(0, Math.ceil(limite() - tiempoNivel))) });
      if (p.modo === 2) d.push({ etiqueta: "Gemas", valor: `${gemasNivel().filter((g) => g.tomado).length}/${gemasNivel().length}` });
      else d.push({ etiqueta: "Monedas", valor: String(monedas) });
      api.hud(d);
    };
    hud();

    const solido = (px: number, py: number) => {
      const tx = Math.floor(px / T), ty = Math.floor(py / T);
      if (tx < 0 || tx >= nivel.ancho) return true;
      if (ty < 0 || ty >= FILAS) return false;
      return nivel.sol[ty * nivel.ancho + tx] === 1;
    };

    const reaparecer = () => {
      j.x = Math.max(3 * T, Math.floor((j.x - 200) / T) * T);
      // buscar columna con suelo hacia atrás
      for (let tx = Math.floor(j.x / T); tx > 0; tx--) {
        let ty = 0;
        while (ty < FILAS && !nivel.sol[ty * nivel.ancho + tx]) ty++;
        if (ty < FILAS && ty > 1 && !nivel.pinches.has((ty - 1) * nivel.ancho + tx) && nivel.sol[ty * nivel.ancho + tx - 1]) { j.x = tx * T; j.y = (ty - 1) * T - 1; break; }
      }
      j.vx = 0; j.vy = 0; j.inv = 1.5;
    };

    const herir = (msg: string) => {
      if (j.inv > 0) return;
      api.sonido.efecto("golpe");
      api.temblor(8);
      api.particulas.explotar(j.x + 11, j.y + 14, tema.secundario, 20, 200, 4);
      if (p.modo !== 1) vidas--;
      hud();
      if (vidas <= 0) { estado = "fin"; api.fin({ gano: false, mensaje: msg }); return; }
      reaparecer();
    };

    const siguienteNivel = () => {
      nivelN++;
      if (nivelN >= NIVELES) { estado = "fin"; api.sumar(1000); api.fin({ gano: true, mensaje: "¡Completaste los 5 niveles!" }); return; }
      nivel = generarNivel(crearRng(p.semilla + 1000 * (p.mapa + 1) + nivelN * 7919), nivelN, p.dificultad);
      j.x = 3 * T; j.y = nivel.inicioY; j.vx = 0; j.vy = 0; cam = 0; tiempoNivel = 0;
      api.aviso(`Nivel ${nivelN + 1}`, tema.acento);
      api.sonido.efecto("nivel");
      estado = "jugando";
      hud();
    };

    return {
      actualizar(dt) {
        anim += dt;
        if (estado === "transicion") { trans -= dt; if (trans <= 0) siguienteNivel(); return; }
        if (estado !== "jugando") return;
        const e = api.entrada;
        tiempoNivel += dt;
        if (p.modo === 1) {
          const quedan = limite() - tiempoNivel;
          if (Math.ceil(quedan) !== Math.ceil(quedan + dt)) hud();
          if (quedan <= 0) { estado = "fin"; api.fin({ gano: false, mensaje: "Se acabó el tiempo." }); return; }
        }
        j.inv = Math.max(0, j.inv - dt);
        const dir = e.eje("izq", "der");
        const acel = j.suelo ? 2600 : 1600;
        const maxV = 250 * (0.9 + p.velocidad * 0.1);
        if (dir) { j.vx += dir * acel * dt; j.mira = dir; } else j.vx *= j.suelo ? Math.pow(0.0005, dt) : Math.pow(0.2, dt);
        j.vx = Math.max(-maxV, Math.min(maxV, j.vx));
        if (e.pulsado("a") || e.pulsado("arriba")) j.buffer = 0.13;
        j.buffer -= dt; j.coyote -= dt;
        if (j.buffer > 0 && j.coyote > 0) { j.vy = -640; j.buffer = 0; j.coyote = 0; api.sonido.efecto("salto"); }
        if (!(e.presionado("a") || e.presionado("arriba")) && j.vy < -250) j.vy = -250;
        j.vy = Math.min(900, j.vy + 1850 * dt);

        // eje X
        j.x += j.vx * dt;
        const pw = 22, ph = 28;
        if (j.vx > 0 && (solido(j.x + pw, j.y + 2) || solido(j.x + pw, j.y + ph - 2))) { j.x = Math.floor((j.x + pw) / T) * T - pw - 0.01; j.vx = 0; }
        if (j.vx < 0 && (solido(j.x, j.y + 2) || solido(j.x, j.y + ph - 2))) { j.x = Math.floor(j.x / T + 1) * T + 0.01; j.vx = 0; }
        // eje Y
        j.y += j.vy * dt;
        j.suelo = false;
        if (j.vy >= 0 && (solido(j.x + 2, j.y + ph) || solido(j.x + pw - 2, j.y + ph))) { j.y = Math.floor((j.y + ph) / T) * T - ph; j.vy = 0; j.suelo = true; j.coyote = 0.1; }
        if (j.vy < 0 && (solido(j.x + 2, j.y) || solido(j.x + pw - 2, j.y))) { j.y = Math.floor(j.y / T + 1) * T; j.vy = 0; }
        if (j.y > H + 40) { herir("Caíste al vacío."); return; }

        // pinches
        const tx0 = Math.floor((j.x + 4) / T), tx1 = Math.floor((j.x + pw - 4) / T), ty = Math.floor((j.y + ph - 4) / T);
        for (let tx = tx0; tx <= tx1; tx++) if (nivel.pinches.has(ty * nivel.ancho + tx)) { herir("Te pinchaste."); return; }

        // enemigos
        for (const en of nivel.enemigos) {
          if (!en.vivo) continue;
          en.x += en.vx * dt;
          if (en.x < en.min || en.x > en.max) { en.vx *= -1; en.x = Math.max(en.min, Math.min(en.max, en.x)); }
          if (choque(j.x, j.y, pw, ph, en.x, en.y, 26, 26)) {
            if (j.vy > 60 && j.y + ph - en.y < 16) {
              en.vivo = false; j.vy = -480;
              api.sumar(50, en.x + 13, en.y);
              api.sonido.efecto("explosion");
              api.particulas.explotar(en.x + 13, en.y + 13, tema.peligro, 18, 180, 4);
            } else { herir("Te atrapó un enemigo."); return; }
          }
        }
        // ítems
        for (const it of nivel.items) {
          if (!it.tomado && choque(j.x, j.y, pw, ph, it.x - 8, it.y, 16, 20)) {
            it.tomado = true;
            if (it.gema) { api.sumar(100, it.x, it.y); api.sonido.efecto("mejora"); api.particulas.explotar(it.x, it.y + 8, tema.secundario, 16, 150, 3); }
            else { monedas++; api.sumar(10, it.x, it.y); api.sonido.efecto("moneda"); }
            hud();
          }
        }
        // meta
        if (j.x > nivel.meta) {
          const faltan = gemasNivel().filter((g) => !g.tomado).length;
          if (p.modo === 2 && faltan > 0) { j.x = nivel.meta - 2; j.vx = -200; if (anim % 1 < dt * 2) api.aviso(`Faltan ${faltan} gemas`, tema.peligro); }
          else {
            estado = "transicion"; trans = 1.4;
            const bonus = p.modo === 1 ? Math.max(0, Math.round((limite() - tiempoNivel) * 10)) : 300;
            api.sumar(500 + bonus);
            api.aviso("¡Nivel completado!", tema.acento);
            api.sonido.efecto("victoria");
            api.particulas.explotar(nivel.meta - cam + cam, 120, tema.acento, 40, 300, 4);
          }
        }
        cam += (Math.max(0, Math.min(nivel.ancho * T - W, j.x - W * 0.38)) - cam) * Math.min(1, dt * 8);
      },
      dibujar(g) {
        fondo.dibujar(g, anim, cam);
        // montañas de fondo
        g.fillStyle = conAlfa(tema.primario, 0.08);
        for (let i = -1; i < 8; i++) { const bx = i * 160 - ((cam * 0.3) % 160); g.beginPath(); g.moveTo(bx, H); g.lineTo(bx + 80, 220 + (i % 3) * 30); g.lineTo(bx + 160, H); g.fill(); }
        g.save();
        g.translate(-Math.round(cam), 0);
        const tx0 = Math.max(0, Math.floor(cam / T)), tx1 = Math.min(nivel.ancho, tx0 + Math.ceil(W / T) + 2);
        const cSuelo = mezclarColor(tema.fondo2, tema.primario, 0.35);
        for (let ty = 0; ty < FILAS; ty++) for (let tx = tx0; tx < tx1; tx++) {
          if (!nivel.sol[ty * nivel.ancho + tx]) continue;
          const arriba = ty === 0 || !nivel.sol[(ty - 1) * nivel.ancho + tx];
          g.fillStyle = cSuelo;
          g.fillRect(tx * T, ty * T, T, T);
          if (arriba) { g.fillStyle = tema.primario; g.fillRect(tx * T, ty * T, T, 6); g.fillStyle = conAlfa("#ffffff", 0.15); g.fillRect(tx * T, ty * T + 6, T, 2); }
          else { g.fillStyle = conAlfa("#000000", 0.12); g.fillRect(tx * T + 4, ty * T + 4, 6, 6); }
        }
        g.fillStyle = mezclarColor(tema.peligro, "#ffffff", 0.25);
        for (const k of nivel.pinches) {
          const tx = k % nivel.ancho, ty = Math.floor(k / nivel.ancho);
          if (tx < tx0 || tx > tx1) continue;
          for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(tx * T + i * 11, ty * T + T); g.lineTo(tx * T + i * 11 + 5.5, ty * T + 10); g.lineTo(tx * T + i * 11 + 11, ty * T + T); g.fill(); }
        }
        for (const it of nivel.items) {
          if (it.tomado) continue;
          const by = it.y + Math.sin(anim * 3 + it.x) * 3;
          if (it.gema) { brillo(g, tema.secundario, 14); g.fillStyle = tema.secundario; g.beginPath(); g.moveTo(it.x, by); g.lineTo(it.x + 9, by + 10); g.lineTo(it.x, by + 20); g.lineTo(it.x - 9, by + 10); g.fill(); }
          else { brillo(g, tema.acento, 8); g.fillStyle = tema.acento; g.beginPath(); g.ellipse(it.x, by + 10, Math.abs(Math.cos(anim * 4 + it.x)) * 7 + 1.5, 8, 0, 0, 6.283); g.fill(); }
          sinBrillo(g);
        }
        for (const en of nivel.enemigos) {
          if (!en.vivo) continue;
          g.fillStyle = tema.peligro;
          const ap = Math.abs(Math.sin(anim * 8)) * 3;
          rectRed(g, en.x, en.y + ap, 26, 26 - ap, 8); g.fill();
          g.fillStyle = "#fff"; g.fillRect(en.x + (en.vx > 0 ? 14 : 4), en.y + 7 + ap, 8, 7);
          g.fillStyle = "#111"; g.fillRect(en.x + (en.vx > 0 ? 18 : 5), en.y + 9 + ap, 3, 4);
        }
        // bandera
        const abierta = p.modo !== 2 || gemasNivel().every((i) => i.tomado);
        g.fillStyle = "#ddd"; g.fillRect(nivel.meta + 10, 4 * T, 4, 7 * T);
        g.fillStyle = abierta ? tema.acento : conAlfa(tema.texto, 0.3);
        g.beginPath(); g.moveTo(nivel.meta + 14, 4 * T); g.lineTo(nivel.meta + 14 + 34 + Math.sin(anim * 5) * 3, 4 * T + 12); g.lineTo(nivel.meta + 14, 4 * T + 24); g.fill();
        // jugador
        if (!(j.inv > 0 && Math.floor(anim * 15) % 2)) {
          const est = j.suelo ? 1 + Math.sin(anim * 20) * (Math.abs(j.vx) > 30 ? 0.06 : 0) : j.vy < 0 ? 1.1 : 0.92;
          g.save(); g.translate(j.x + 11, j.y + 28); g.scale(1 / est, est);
          brillo(g, tema.secundario, 12);
          g.fillStyle = tema.secundario; rectRed(g, -11, -28, 22, 28, 7); g.fill(); sinBrillo(g);
          g.fillStyle = "#fff"; g.fillRect(j.mira > 0 ? 1 : -9, -22, 7, 7);
          g.fillStyle = "#111"; g.fillRect(j.mira > 0 ? 4 : -8, -20, 3, 4);
          g.restore();
        }
        g.restore();
      },
    };
  },
};

export default modulo;
