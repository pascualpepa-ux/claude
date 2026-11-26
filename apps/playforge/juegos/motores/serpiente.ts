import { crearRng } from "@/lib/rng";
import { conAlfa, mezclarColor } from "@/lib/temas";
import { FondoTema, brillo, rectRed, sinBrillo } from "../runtime/dibujo";
import type { ModuloMotor } from "../runtime/tipos";

const COLS = 28;
const FILAS = 18;
const C = 24; // tamaño de celda
type Dir = [number, number];

const modulo: ModuloMotor = {
  ancho: COLS * C,
  alto: FILAS * C + 0,
  tactil: "deslizar",
  crear(api) {
    const { p, tema, rng } = api;
    const W = COLS * C, H = FILAS * C;
    const fondo = new FondoTema(tema, W, H, crearRng(p.semilla), 40);
    const modo = p.modo; // 0 clásico, 1 sin bordes, 2 contrarreloj
    const envolver = modo === 1;
    const objetivo = 22 + p.dificultad * 6;

    // Obstáculos del mapa (generados por semilla y número de mapa)
    const muro = new Set<string>();
    const mrng = crearRng(p.semilla + 77);
    const k = (x: number, y: number) => `${x},${y}`;
    const patron = p.mapa;
    if (patron === 1 || patron === 4) for (let x = 6; x < COLS - 6; x++) { muro.add(k(x, 5)); muro.add(k(x, FILAS - 6)); }
    if (patron === 2) for (let i = 0; i < 4; i++) { const cx = 5 + i * 6; for (let y = 3; y < FILAS - 3; y++) if (y % 6 !== 0 && (y < 7 || y > 10)) muro.add(k(cx, y)); }
    if (patron === 3 || patron === 4) { for (let i = 0; i < 4; i++) { const cx = [6, COLS - 7][i % 2], cy = [4, FILAS - 5][i >> 1]; for (let d = -2; d <= 2; d++) { muro.add(k(cx + d, cy)); muro.add(k(cx, cy + d)); } } }
    if (patron === 5 || envolver) { const n = 10 + p.dificultad * 3; for (let i = 0; i < n; i++) { const x = 2 + Math.floor(mrng() * (COLS - 4)), y = 2 + Math.floor(mrng() * (FILAS - 4)); if (Math.abs(y - FILAS / 2) > 1) muro.add(k(x, y)); } }

    let cuerpo: { x: number; y: number }[] = [];
    const cy0 = Math.floor(FILAS / 2);
    for (let i = 0; i < 4; i++) cuerpo.push({ x: 6 - i, y: cy0 });
    for (const c of cuerpo) muro.delete(k(c.x, c.y));
    for (let x = 2; x < 12; x++) muro.delete(k(x, cy0));
    let dir: Dir = [1, 0];
    const cola: Dir[] = [];
    let crecer = 0;
    const base = 0.14 / (p.mult * 0.55 + 0.45) / p.velocidad;
    let intervalo = base;
    let reloj = 0;
    let comidas = 0;
    let tiempoRestante = 60;
    let comida = { x: 0, y: 0, dorada: false, vida: 0 };
    let bonus: { x: number; y: number; vida: number } | null = null;
    let vivo = true;
    let anim = 0;

    const ocupado = (x: number, y: number) => muro.has(k(x, y)) || cuerpo.some((c) => c.x === x && c.y === y);
    const libre = () => {
      for (let i = 0; i < 500; i++) {
        const x = Math.floor(rng() * COLS), y = Math.floor(rng() * FILAS);
        if (!ocupado(x, y) && !(comida.x === x && comida.y === y)) return { x, y };
      }
      return { x: 1, y: 1 };
    };
    const nuevaComida = () => { const l = libre(); comida = { ...l, dorada: modo === 2 && rng() < 0.25, vida: 0 }; };
    nuevaComida();

    const actualizarHud = () => {
      const datos = [{ etiqueta: "Largo", valor: modo === 2 ? cuerpo.length : `${cuerpo.length}/${objetivo}` }];
      if (modo === 2) datos.push({ etiqueta: "Tiempo", valor: Math.ceil(tiempoRestante) });
      api.hud(datos);
    };
    actualizarHud();

    const morir = (msg: string) => {
      vivo = false;
      api.sonido.efecto("golpe");
      api.temblor(10);
      for (const c of cuerpo) api.particulas.explotar(c.x * C + C / 2, c.y * C + C / 2, tema.primario, 4, 120, 4, 0);
      api.fin({ gano: false, mensaje: msg });
    };

    return {
      actualizar(dt) {
        anim += dt;
        if (!vivo) return;
        const e = api.entrada;
        const ultima = cola.length ? cola[cola.length - 1] : dir;
        const quiere: Dir | null = e.pulsado("izq") ? [-1, 0] : e.pulsado("der") ? [1, 0] : e.pulsado("arriba") ? [0, -1] : e.pulsado("abajo") ? [0, 1] : null;
        if (quiere && !(quiere[0] === -ultima[0] && quiere[1] === -ultima[1]) && !(quiere[0] === ultima[0] && quiere[1] === ultima[1]) && cola.length < 3) cola.push(quiere);

        if (modo === 2) {
          tiempoRestante -= dt;
          if (Math.ceil(tiempoRestante) !== Math.ceil(tiempoRestante + dt)) { actualizarHud(); if (tiempoRestante < 6) api.sonido.efecto("tic"); }
          if (tiempoRestante <= 0) { vivo = false; api.fin({ gano: api.puntos >= 300 + p.dificultad * 100, mensaje: api.puntos >= 300 + p.dificultad * 100 ? "¡Superaste la marca del contrarreloj!" : `Necesitabas ${300 + p.dificultad * 100} puntos.` }); return; }
        }
        if (bonus) { bonus.vida -= dt; if (bonus.vida <= 0) bonus = null; }
        comida.vida += dt;

        reloj += dt;
        if (reloj < intervalo) return;
        reloj -= intervalo;
        if (cola.length) dir = cola.shift()!;
        let nx = cuerpo[0].x + dir[0], ny = cuerpo[0].y + dir[1];
        if (envolver) { nx = (nx + COLS) % COLS; ny = (ny + FILAS) % FILAS; }
        else if (nx < 0 || ny < 0 || nx >= COLS || ny >= FILAS) return morir("Chocaste contra el borde.");
        if (muro.has(k(nx, ny))) return morir("Chocaste contra un obstáculo.");
        const sinCola = crecer > 0 ? cuerpo : cuerpo.slice(0, -1);
        if (sinCola.some((c) => c.x === nx && c.y === ny)) return morir("Te mordiste la cola.");
        cuerpo.unshift({ x: nx, y: ny });
        if (crecer > 0) crecer--; else cuerpo.pop();

        if (nx === comida.x && ny === comida.y) {
          comidas++;
          crecer += 1;
          const pts = (comida.dorada ? 30 : 10) * (1 + p.dificultad * 0.25);
          api.sumar(Math.round(pts), nx * C + C / 2, ny * C);
          api.sonido.efecto(comida.dorada ? "mejora" : "moneda");
          api.particulas.explotar(nx * C + C / 2, ny * C + C / 2, comida.dorada ? tema.acento : tema.peligro, 14, 140, 3, 0);
          if (comida.dorada && modo === 2) { tiempoRestante += 5; api.aviso("+5 s", tema.acento); }
          // Dificultad progresiva: cada 5 comidas, más rápido
          if (comidas % 5 === 0) { intervalo = Math.max(0.045, intervalo * 0.9); api.aviso(`¡Velocidad ${Math.round((base / intervalo) * 100)}%!`, tema.secundario); api.sonido.efecto("nivel"); }
          if (comidas % 7 === 0 && !bonus) { const l = libre(); bonus = { ...l, vida: 6 }; }
          nuevaComida();
          actualizarHud();
          if (modo !== 2 && cuerpo.length + crecer >= objetivo) { vivo = false; api.sumar(200); api.fin({ gano: true, mensaje: `¡Llegaste a ${objetivo} de largo!` }); }
        }
        if (bonus && nx === bonus.x && ny === bonus.y) {
          api.sumar(Math.round(50 * p.mult), nx * C, ny * C);
          api.sonido.efecto("combo");
          api.particulas.explotar(nx * C + C / 2, ny * C + C / 2, tema.secundario, 20, 180, 3, 0);
          bonus = null;
        }
      },
      dibujar(g) {
        fondo.dibujar(g, anim);
        // grilla sutil
        g.fillStyle = conAlfa(tema.texto, 0.035);
        for (let x = 0; x < COLS; x++) for (let y = 0; y < FILAS; y++) if ((x + y) % 2 === 0) g.fillRect(x * C, y * C, C, C);
        if (!envolver) { g.strokeStyle = conAlfa(tema.primario, 0.5); g.lineWidth = 3; g.strokeRect(1.5, 1.5, W - 3, H - 3); }
        // muros
        for (const m of muro) {
          const [x, y] = m.split(",").map(Number);
          g.fillStyle = mezclarColor(tema.fondo2, tema.texto, 0.25);
          rectRed(g, x * C + 2, y * C + 2, C - 4, C - 4, 5); g.fill();
          g.fillStyle = conAlfa("#ffffff", 0.08); g.fillRect(x * C + 4, y * C + 4, C - 8, 4);
        }
        // comida
        const pul = 1 + Math.sin(anim * 6) * 0.12;
        brillo(g, comida.dorada ? tema.acento : tema.peligro, 16);
        g.fillStyle = comida.dorada ? tema.acento : tema.peligro;
        g.beginPath(); g.arc(comida.x * C + C / 2, comida.y * C + C / 2, (C / 2.6) * pul, 0, 6.283); g.fill();
        g.fillStyle = tema.primario; g.fillRect(comida.x * C + C / 2 - 1, comida.y * C + 3, 3, 5);
        if (bonus) {
          g.globalAlpha = bonus.vida < 2 ? (Math.sin(anim * 20) > 0 ? 1 : 0.3) : 1;
          brillo(g, tema.secundario, 18); g.fillStyle = tema.secundario;
          g.save(); g.translate(bonus.x * C + C / 2, bonus.y * C + C / 2); g.rotate(anim * 2);
          g.fillRect(-C / 3, -C / 3, (C / 3) * 2, (C / 3) * 2); g.restore(); g.globalAlpha = 1;
        }
        sinBrillo(g);
        // serpiente
        const n = cuerpo.length;
        for (let i = n - 1; i >= 0; i--) {
          const c = cuerpo[i];
          const t = i / Math.max(1, n - 1);
          g.fillStyle = mezclarColor(tema.primario, tema.secundario, t * 0.7);
          const m = 1 + t * 3;
          if (i === 0) brillo(g, tema.primario, 14);
          rectRed(g, c.x * C + m, c.y * C + m, C - m * 2, C - m * 2, 7); g.fill();
          sinBrillo(g);
        }
        // ojos
        const h = cuerpo[0];
        const ox = h.x * C + C / 2 + dir[0] * 4, oy = h.y * C + C / 2 + dir[1] * 4;
        const px = dir[1] * 5, py = dir[0] * 5;
        g.fillStyle = "#fff";
        g.beginPath(); g.arc(ox + px, oy + py, 3.6, 0, 6.283); g.arc(ox - px, oy - py, 3.6, 0, 6.283); g.fill();
        g.fillStyle = "#111";
        g.beginPath(); g.arc(ox + px + dir[0] * 1.5, oy + py + dir[1] * 1.5, 1.8, 0, 6.283); g.arc(ox - px + dir[0] * 1.5, oy - py + dir[1] * 1.5, 1.8, 0, 6.283); g.fill();
      },
    };
  },
};

export default modulo;
