import { crearRng, type Rng } from "@/lib/rng";
import { conAlfa, mezclarColor } from "@/lib/temas";
import { FondoTema, brillo, rectRed, sinBrillo, texto } from "../runtime/dibujo";
import type { ModuloMotor } from "../runtime/tipos";

const W = 600;
const H = 720;
const COLS = 10;
const BW = 54;
const BH = 22;
const MX = (W - COLS * BW) / 2;
const NIVELES = 5;

interface Ladrillo { c: number; f: number; hp: number; acero: boolean }
interface Bola { x: number; y: number; vx: number; vy: number; pegada: boolean }
interface Mejora { x: number; y: number; tipo: "ancho" | "multi" | "lento" | "vida" }

function muro(rng: Rng, nivel: number, mapa: number): Ladrillo[] {
  const filas = 5 + Math.min(4, nivel);
  const patron = (mapa + nivel) % 6;
  const l: Ladrillo[] = [];
  for (let f = 0; f < filas; f++) for (let c = 0; c < COLS; c++) {
    let poner = true;
    if (patron === 1) poner = (c + f) % 2 === 0 || f < 2;
    if (patron === 2) poner = Math.abs(c - 4.5) <= f * 0.7 + 0.5;
    if (patron === 3) poner = Math.abs(c - 4.5) + Math.abs(f - filas / 2) <= filas / 2 + 1.5;
    if (patron === 4) poner = rng() > 0.25;
    if (patron === 5) poner = f % 2 === 0 || c % 3 !== 1;
    if (!poner) continue;
    const acero = nivel >= 2 && f === filas - 1 && c % 4 === 1 && rng() < 0.7;
    l.push({ c, f, hp: acero ? 99 : 1 + Math.floor(rng() * Math.min(3, 1 + nivel * 0.5 + (f < 2 ? 1 : 0))), acero });
  }
  return l;
}

const modulo: ModuloMotor = {
  ancho: W,
  alto: H,
  tactil: "puntero",
  crear(api) {
    const { p, tema, rng } = api;
    const fondo = new FondoTema(tema, W, H, crearRng(p.semilla), 45);
    const modo = p.modo;
    let nivel = 0;
    let ladrillos = muro(crearRng(p.semilla + 31), 0, p.mapa);
    let desplazY = 90;
    const pala = { x: W / 2, w: modo === 1 ? 80 : 110, y: 660, anchoT: 0 };
    const velBase = (360 + p.dificultad * 35) * p.velocidad;
    let vel = velBase;
    let bolas: Bola[] = [];
    let mejoras: Mejora[] = [];
    let vidas = 3;
    let lento = 0;
    let anim = 0;
    let terminado = false;
    let relojDescenso = 0;
    const intervaloDescenso = 11 - p.dificultad * 1.3;
    const colores = [tema.primario, tema.secundario, tema.acento, tema.peligro];

    const nuevasBolas = () => {
      bolas = [];
      const n = modo === 1 ? 3 : 1;
      for (let i = 0; i < n; i++) bolas.push({ x: pala.x, y: pala.y - 12, vx: (i - (n - 1) / 2) * 0.35, vy: -1, pegada: true });
    };
    nuevasBolas();
    const hud = () => api.hud([
      { etiqueta: "Muro", valor: `${nivel + 1}/${NIVELES}` },
      { etiqueta: "Vidas", valor: String(vidas) },
      { etiqueta: "Ladrillos", valor: String(ladrillos.filter((l) => !l.acero).length) },
    ]);
    hud();

    const rect = (l: Ladrillo) => ({ x: MX + l.c * BW + 2, y: desplazY + l.f * BH + 2, w: BW - 4, h: BH - 4 });

    const romper = (l: Ladrillo, x: number, y: number) => {
      if (l.acero) { api.sonido.efecto("rebote"); return; }
      l.hp--;
      if (l.hp > 0) { api.sonido.efecto("clic"); return; }
      ladrillos = ladrillos.filter((o) => o !== l);
      api.sumar(10 * (1 + p.dificultad * 0.2) | 0, x, y);
      api.sonido.efecto("rebote");
      api.particulas.explotar(x, y, colores[(l.f + p.mapa) % 4], 10, 160, 3);
      vel = Math.min(velBase * 1.6, vel + 2.5);
      if (rng() < 0.12) mejoras.push({ x, y, tipo: (["ancho", "multi", "lento", "vida"] as const)[Math.floor(rng() * (rng() < 0.2 ? 4 : 3))] });
      hud();
      if (!ladrillos.some((o) => !o.acero)) {
        nivel++;
        api.sumar(300);
        if (nivel >= NIVELES) { terminado = true; api.fin({ gano: true, mensaje: "¡Demoliste los 5 muros!" }); return; }
        ladrillos = muro(crearRng(p.semilla + 31 + nivel * 101), nivel, p.mapa);
        desplazY = 90; relojDescenso = 0; vel = velBase * (1 + nivel * 0.06);
        nuevasBolas();
        api.aviso(`Muro ${nivel + 1}`, tema.acento);
        api.sonido.efecto("nivel");
        hud();
      }
    };

    return {
      actualizar(dt) {
        anim += dt;
        if (terminado) return;
        const e = api.entrada;
        const anchoActual = pala.w + (pala.anchoT > 0 ? 50 : 0);
        pala.anchoT = Math.max(0, pala.anchoT - dt);
        lento = Math.max(0, lento - dt);
        const dir = e.eje("izq", "der");
        if (dir) pala.x += dir * 620 * dt;
        if (e.puntero.activo && (e.puntero.abajo || !("ontouchstart" in window))) pala.x += (e.puntero.x - pala.x) * Math.min(1, dt * 25);
        pala.x = Math.max(anchoActual / 2, Math.min(W - anchoActual / 2, pala.x));
        if (e.pulsado("a") || e.puntero.soltado) for (const b of bolas) if (b.pegada) { b.pegada = false; api.sonido.efecto("salto"); }

        if (modo === 2) {
          relojDescenso += dt;
          if (relojDescenso > intervaloDescenso) { relojDescenso = 0; desplazY += BH; api.sonido.efecto("tic"); }
          const fondoMuro = Math.max(...ladrillos.filter((l) => !l.acero).map((l) => desplazY + (l.f + 1) * BH), 0);
          if (fondoMuro > pala.y - 20) { terminado = true; api.fin({ gano: false, mensaje: "El muro te aplastó." }); return; }
        }

        const v = vel * (lento > 0 ? 0.65 : 1);
        for (const b of bolas) {
          if (b.pegada) { b.x = pala.x + b.vx * 30; b.y = pala.y - 12; continue; }
          const n = Math.hypot(b.vx, b.vy) || 1;
          b.vx /= n; b.vy /= n;
          const pasos = 3;
          for (let s = 0; s < pasos; s++) {
            b.x += (b.vx * v * dt) / pasos;
            b.y += (b.vy * v * dt) / pasos;
            if (b.x < 8) { b.x = 8; b.vx = Math.abs(b.vx); api.sonido.efecto("clic"); }
            if (b.x > W - 8) { b.x = W - 8; b.vx = -Math.abs(b.vx); api.sonido.efecto("clic"); }
            if (b.y < 8) { b.y = 8; b.vy = Math.abs(b.vy); api.sonido.efecto("clic"); }
            // paleta: el ángulo depende de dónde pega
            if (b.vy > 0 && b.y > pala.y - 10 && b.y < pala.y + 8 && Math.abs(b.x - pala.x) < anchoActual / 2 + 7) {
              const rel = (b.x - pala.x) / (anchoActual / 2);
              const ang = rel * 1.05;
              b.vx = Math.sin(ang); b.vy = -Math.cos(ang);
              b.y = pala.y - 10;
              api.sonido.efecto("rebote");
            }
            for (const l of ladrillos) {
              const r = rect(l);
              const cx = Math.max(r.x, Math.min(b.x, r.x + r.w)), cy = Math.max(r.y, Math.min(b.y, r.y + r.h));
              if ((b.x - cx) ** 2 + (b.y - cy) ** 2 < 64) {
                const solapX = Math.min(b.x + 8 - r.x, r.x + r.w - (b.x - 8));
                const solapY = Math.min(b.y + 8 - r.y, r.y + r.h - (b.y - 8));
                if (solapX < solapY) b.vx = b.x < r.x + r.w / 2 ? -Math.abs(b.vx) : Math.abs(b.vx);
                else b.vy = b.y < r.y + r.h / 2 ? -Math.abs(b.vy) : Math.abs(b.vy);
                if (Math.abs(b.vy) < 0.2) b.vy = b.vy < 0 ? -0.25 : 0.25;
                romper(l, r.x + r.w / 2, r.y + r.h / 2);
                break;
              }
            }
            if (terminado) return;
          }
        }
        const antes = bolas.length;
        bolas = bolas.filter((b) => b.y < H + 20);
        if (antes && !bolas.length) {
          vidas--;
          api.sonido.efecto("golpe");
          api.temblor(10);
          hud();
          if (vidas <= 0) { terminado = true; api.fin({ gano: false, mensaje: "Se te escaparon todas las pelotas." }); return; }
          nuevasBolas();
        }
        for (const m of mejoras) {
          m.y += 170 * dt;
          if (m.y > pala.y - 10 && m.y < pala.y + 12 && Math.abs(m.x - pala.x) < anchoActual / 2 + 14) {
            m.y = H + 50;
            api.sonido.efecto("mejora");
            if (m.tipo === "ancho") { pala.anchoT = 12; api.aviso("Paleta ancha", tema.secundario); }
            if (m.tipo === "lento") { lento = 10; api.aviso("Cámara lenta", tema.primario); }
            if (m.tipo === "vida") { vidas++; api.aviso("+1 vida", tema.acento); hud(); }
            if (m.tipo === "multi") { const b = bolas.find((x) => !x.pegada) ?? bolas[0]; if (b) bolas.push({ ...b, vx: -b.vx, pegada: false }, { ...b, vx: b.vx * 0.5, vy: -1, pegada: false }); api.aviso("¡Multibola!", tema.acento); }
          }
        }
        mejoras = mejoras.filter((m) => m.y < H + 20);
      },
      dibujar(g) {
        fondo.dibujar(g, anim);
        g.fillStyle = conAlfa(tema.primario, 0.06); g.fillRect(0, 0, W, H);
        for (const l of ladrillos) {
          const r = rect(l);
          const base = l.acero ? mezclarColor(tema.texto, tema.fondo, 0.5) : colores[(l.f + p.mapa) % 4];
          g.fillStyle = l.hp >= 3 && !l.acero ? mezclarColor(base, "#000000", 0.3) : l.hp === 2 ? mezclarColor(base, "#000000", 0.15) : base;
          rectRed(g, r.x, r.y, r.w, r.h, 5); g.fill();
          g.fillStyle = conAlfa("#ffffff", 0.25); g.fillRect(r.x + 4, r.y + 3, r.w - 8, 3);
          if (l.hp > 1 && !l.acero) { g.fillStyle = conAlfa("#000000", 0.35); for (let i = 0; i < l.hp; i++) g.fillRect(r.x + r.w / 2 - 8 + i * 6, r.y + r.h - 7, 4, 3); }
          if (l.acero) { g.strokeStyle = conAlfa("#ffffff", 0.4); g.strokeRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6); }
        }
        if (modo === 2) { g.fillStyle = conAlfa(tema.peligro, 0.25); g.fillRect(0, pala.y - 24, W, 2); }
        for (const m of mejoras) {
          const col = { ancho: tema.secundario, multi: tema.acento, lento: tema.primario, vida: tema.peligro }[m.tipo];
          brillo(g, col, 10); g.fillStyle = col; rectRed(g, m.x - 18, m.y - 9, 36, 18, 9); g.fill(); sinBrillo(g);
          texto(g, { ancho: "↔", multi: "×3", lento: "≈", vida: "♥" }[m.tipo], m.x, m.y + 1, 13, tema.fondo);
        }
        const anchoActual = pala.w + (pala.anchoT > 0 ? 50 : 0);
        brillo(g, tema.primario, 16);
        g.fillStyle = tema.primario; rectRed(g, pala.x - anchoActual / 2, pala.y, anchoActual, 14, 7); g.fill();
        sinBrillo(g);
        g.fillStyle = conAlfa("#ffffff", 0.5); g.fillRect(pala.x - anchoActual / 2 + 8, pala.y + 3, anchoActual - 16, 3);
        for (const b of bolas) {
          brillo(g, "#ffffff", 14); g.fillStyle = "#ffffff";
          g.beginPath(); g.arc(b.x, b.y, 8, 0, 6.283); g.fill(); sinBrillo(g);
        }
        if (bolas.some((b) => b.pegada)) texto(g, "Tocá o pulsá Espacio para lanzar", W / 2, pala.y - 60, 16, conAlfa(tema.texto, 0.8), "center", 600);
        if (modo === 2) { g.fillStyle = tema.peligro; g.fillRect(0, H - 4, W * (relojDescenso / intervaloDescenso), 4); }
      },
    };
  },
};

export default modulo;
