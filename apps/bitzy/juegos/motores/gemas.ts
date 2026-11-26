import { crearRng } from "@/lib/rng";
import { conAlfa, mezclarColor } from "@/lib/temas";
import { FondoTema, brillo, rectRed, sinBrillo, texto } from "../runtime/dibujo";
import type { ModuloMotor } from "../runtime/tipos";

const N = 8;
const C = 62;
const W = 560;
const H = 690;
const OX = (W - N * C) / 2;
const OY = 160;
const NIVELES = 6;

interface Celda { tipo: number; oy: number; especial: boolean; borrar: number; hielo: number }

const modulo: ModuloMotor = {
  ancho: W,
  alto: H,
  tactil: "puntero",
  crear(api) {
    const { p, tema, rng } = api;
    const fondo = new FondoTema(tema, W, H, crearRng(p.semilla), 35);
    const nColores = p.dificultad === 0 ? 5 : 6;
    const colores = [tema.primario, tema.secundario, tema.acento, tema.peligro, mezclarColor(tema.texto, tema.primario, 0.2), mezclarColor(tema.secundario, tema.peligro, 0.5)];
    const modo = p.modo;
    let nivel = 0;
    let tablero: Celda[][] = [];
    let estado: "quieto" | "cambio" | "borrando" | "cayendo" | "fin" = "quieto";
    let cambio: { a: [number, number]; b: [number, number]; t: number; vuelta: boolean } | null = null;
    let sel: [number, number] | null = null;
    let cursor: [number, number] = [3, 3];
    let arrastre: { c: number; f: number; x: number; y: number } | null = null;
    let combo = 0;
    let movimientos = 0;
    let tiempo = 90;
    let puntosNivel = 0;
    let anim = 0;
    let pista = 0;
    let teclado = false;

    const objetivo = () => Math.round((700 + nivel * 550) * (0.8 + p.mult * 0.3));
    const movsNivel = () => Math.max(14, 26 - p.dificultad * 2 - Math.floor(nivel / 2));
    const nuevaGema = (): Celda => ({ tipo: Math.floor(rng() * nColores), oy: 0, especial: false, borrar: 0, hielo: 0 });

    const hayMatch = (f: number, c: number) => {
      const t = tablero[f][c].tipo;
      return (c >= 2 && tablero[f][c - 1].tipo === t && tablero[f][c - 2].tipo === t) || (f >= 2 && tablero[f - 1][c].tipo === t && tablero[f - 2][c].tipo === t);
    };
    const armarTablero = () => {
      tablero = [];
      for (let f = 0; f < N; f++) {
        tablero.push([]);
        for (let c = 0; c < N; c++) {
          tablero[f].push(nuevaGema());
          while (hayMatch(f, c)) tablero[f][c].tipo = Math.floor(rng() * nColores);
          tablero[f][c].oy = -(N - f) * C - 200 - c * 12;
        }
      }
      if (modo === 2) {
        const r = crearRng(p.semilla + nivel * 31);
        const cant = 10 + nivel * 3 + p.dificultad * 2;
        for (let i = 0; i < cant; i++) { const f = 2 + Math.floor(r() * (N - 2)), c = Math.floor(r() * N); tablero[f][c].hielo = Math.min(2, tablero[f][c].hielo + 1 + (nivel > 2 && r() < 0.3 ? 1 : 0)); }
      }
      estado = "cayendo";
    };

    const hielos = () => tablero.flat().reduce((s, x) => s + x.hielo, 0);
    const hud = () => {
      const d = [{ etiqueta: modo === 1 ? "Ronda" : "Nivel", valor: `${nivel + 1}/${modo === 1 ? 1 : NIVELES}` }];
      if (modo === 1) d.push({ etiqueta: "Tiempo", valor: String(Math.max(0, Math.ceil(tiempo))) });
      else d.push({ etiqueta: "Movimientos", valor: String(movimientos) });
      d.push(modo === 2 ? { etiqueta: "Hielo", valor: String(hielos()) } : { etiqueta: "Objetivo", valor: `${puntosNivel}/${objetivo()}` });
      api.hud(d);
    };
    const iniciarNivel = () => { movimientos = movsNivel(); puntosNivel = 0; armarTablero(); hud(); };
    iniciarNivel();

    const buscarMatches = () => {
      const marcas: boolean[][] = tablero.map((fila) => fila.map(() => false));
      const grupos: [number, number][][] = [];
      for (let f = 0; f < N; f++) for (let c = 0; c < N; ) {
        let k = c; while (k < N && tablero[f][k].tipo === tablero[f][c].tipo) k++;
        if (k - c >= 3) { const g: [number, number][] = []; for (let i = c; i < k; i++) { marcas[f][i] = true; g.push([f, i]); } grupos.push(g); }
        c = k;
      }
      for (let c = 0; c < N; c++) for (let f = 0; f < N; ) {
        let k = f; while (k < N && tablero[k][c].tipo === tablero[f][c].tipo) k++;
        if (k - f >= 3) { const g: [number, number][] = []; for (let i = f; i < k; i++) { marcas[i][c] = true; g.push([i, c]); } grupos.push(g); }
        f = k;
      }
      return { marcas, grupos };
    };

    const hayMovimiento = () => {
      for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) for (const [df, dc] of [[0, 1], [1, 0]]) {
        const f2 = f + df, c2 = c + dc;
        if (f2 >= N || c2 >= N) continue;
        intercambiar([f, c], [f2, c2]);
        const ok = buscarMatches().grupos.length > 0;
        intercambiar([f, c], [f2, c2]);
        if (ok) return [[f, c], [f2, c2]] as const;
      }
      return null;
    };

    function intercambiar(a: [number, number], b: [number, number]) {
      const t = tablero[a[0]][a[1]];
      tablero[a[0]][a[1]] = tablero[b[0]][b[1]];
      tablero[b[0]][b[1]] = t;
      // el hielo queda en su casillero
      const h = tablero[a[0]][a[1]].hielo; tablero[a[0]][a[1]].hielo = tablero[b[0]][b[1]].hielo; tablero[b[0]][b[1]].hielo = h;
    }

    const resolver = () => {
      const { marcas, grupos } = buscarMatches();
      if (!grupos.length) return false;
      combo++;
      // gemas especiales: si una marcada es explosiva, despeja 3×3
      for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) if (marcas[f][c] && tablero[f][c].especial) {
        for (let df = -1; df <= 1; df++) for (let dc = -1; dc <= 1; dc++) { const ff = f + df, cc = c + dc; if (ff >= 0 && cc >= 0 && ff < N && cc < N) marcas[ff][cc] = true; }
        api.temblor(8); api.sonido.efecto("explosion");
      }
      let n = 0;
      for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) if (marcas[f][c]) {
        n++;
        tablero[f][c].borrar = 0.001;
        if (tablero[f][c].hielo > 0) { tablero[f][c].hielo--; api.particulas.explotar(OX + c * C + C / 2, OY + f * C + C / 2, "#ffffff", 8, 120, 3); }
        api.particulas.explotar(OX + c * C + C / 2, OY + f * C + C / 2, colores[tablero[f][c].tipo], 6, 140, 3);
      }
      // 4 o más en línea → crea una gema explosiva
      for (const g of grupos) if (g.length >= 4) { const [f, c] = g[Math.floor(g.length / 2)]; tablero[f][c].borrar = 0; tablero[f][c].especial = true; n--; }
      const pts = Math.round(n * 10 * combo * (1 + p.dificultad * 0.15));
      puntosNivel += pts;
      api.sumar(pts, W / 2, OY - 30);
      if (modo === 1) tiempo += n * 0.35;
      api.sonido.efecto(combo > 1 ? "combo" : "moneda");
      if (combo > 1) api.aviso(`Combo ×${combo}`, tema.acento);
      estado = "borrando";
      hud();
      return true;
    };

    const gravedad = () => {
      for (let c = 0; c < N; c++) {
        const hielosCol = tablero.map((fila) => fila[c].hielo);
        const quedan: { cel: Celda; f: number }[] = [];
        for (let f = 0; f < N; f++) if (!tablero[f][c].borrar) quedan.push({ cel: tablero[f][c], f });
        const faltan = N - quedan.length;
        for (let f = 0; f < N; f++) {
          const origen = f < faltan ? { cel: nuevaGema(), f: f - faltan } : quedan[f - faltan];
          origen.cel.oy = (origen.f - f) * C + Math.min(0, origen.cel.oy);
          origen.cel.hielo = hielosCol[f];
          tablero[f][c] = origen.cel;
        }
      }
      estado = "cayendo";
    };

    const terminarNivel = () => {
      estado = "fin";
      if (modo === 1) { api.fin({ gano: puntosNivel >= objetivo() * 2, mensaje: puntosNivel >= objetivo() * 2 ? "¡Superaste el objetivo contrarreloj!" : `Necesitabas ${objetivo() * 2} puntos.` }); return; }
      nivel++;
      api.sumar(movimientos * 50);
      if (nivel >= NIVELES) { api.fin({ gano: true, mensaje: "¡Completaste los 6 tableros!" }); return; }
      api.aviso(`¡Nivel ${nivel + 1}!`, tema.acento);
      api.sonido.efecto("nivel");
      setTimeout(() => { iniciarNivel(); }, 600);
    };

    const intentar = (a: [number, number], b: [number, number]) => {
      if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1) return;
      cambio = { a, b, t: 0, vuelta: false };
      estado = "cambio";
      sel = null;
      api.sonido.efecto("clic");
    };

    const celdaEn = (x: number, y: number): [number, number] | null => {
      const c = Math.floor((x - OX) / C), f = Math.floor((y - OY) / C);
      return c >= 0 && c < N && f >= 0 && f < N ? [f, c] : null;
    };
    hud();
    if (modo === 1) api.aviso(`Objetivo: ${objetivo() * 2}`, tema.acento);

    return {
      actualizar(dt) {
        anim += dt;
        pista += dt;
        if (estado === "fin") return;
        if (modo === 1) {
          tiempo -= dt;
          if (Math.ceil(tiempo) !== Math.ceil(tiempo + dt)) { hud(); if (tiempo < 6) api.sonido.efecto("tic"); }
          if (tiempo <= 0 && estado === "quieto") { terminarNivel(); return; }
        }
        const e = api.entrada;
        if (estado === "quieto") {
          // teclado: mover cursor y elegir
          if (e.pulsado("izq") || e.pulsado("der") || e.pulsado("arriba") || e.pulsado("abajo")) teclado = true;
          if (e.pulsado("izq")) cursor = [cursor[0], Math.max(0, cursor[1] - 1)];
          if (e.pulsado("der")) cursor = [cursor[0], Math.min(N - 1, cursor[1] + 1)];
          if (e.pulsado("arriba")) cursor = [Math.max(0, cursor[0] - 1), cursor[1]];
          if (e.pulsado("abajo")) cursor = [Math.min(N - 1, cursor[0] + 1), cursor[1]];
          if (e.pulsado("a")) { if (sel) intentar(sel, cursor); else sel = cursor; }
          if (e.puntero.pulsado) {
            const cel = celdaEn(e.puntero.x, e.puntero.y);
            if (cel) { arrastre = { c: cel[1], f: cel[0], x: e.puntero.x, y: e.puntero.y }; if (sel && Math.abs(sel[0] - cel[0]) + Math.abs(sel[1] - cel[1]) === 1) { intentar(sel, cel); arrastre = null; } else sel = cel; pista = 0; }
          }
          if (arrastre && e.puntero.abajo) {
            const dx = e.puntero.x - arrastre.x, dy = e.puntero.y - arrastre.y;
            if (Math.hypot(dx, dy) > C * 0.4) {
              const b: [number, number] = Math.abs(dx) > Math.abs(dy) ? [arrastre.f, arrastre.c + Math.sign(dx)] : [arrastre.f + Math.sign(dy), arrastre.c];
              if (b[0] >= 0 && b[1] >= 0 && b[0] < N && b[1] < N) intentar([arrastre.f, arrastre.c], b);
              arrastre = null;
            }
          }
          if (!e.puntero.abajo) arrastre = null;
        } else if (estado === "cambio" && cambio) {
          cambio.t += dt / 0.16;
          if (cambio.t >= 1) {
            if (cambio.vuelta) { cambio = null; estado = "quieto"; }
            else {
              intercambiar(cambio.a, cambio.b);
              if (!buscarMatches().grupos.length) { intercambiar(cambio.a, cambio.b); cambio = { ...cambio, t: 0, vuelta: true }; api.sonido.efecto("error"); }
              else { cambio = null; combo = 0; if (modo !== 1) movimientos--; resolver(); }
            }
          }
        } else if (estado === "borrando") {
          let listo = true;
          for (const fila of tablero) for (const cel of fila) if (cel.borrar) { cel.borrar += dt / 0.2; if (cel.borrar < 1) listo = false; }
          if (listo) gravedad();
        } else if (estado === "cayendo") {
          let quieto = true;
          for (const fila of tablero) for (const cel of fila) if (cel.oy < 0) { cel.oy = Math.min(0, cel.oy + 900 * dt); quieto = false; }
          if (quieto && !resolver()) {
            estado = "quieto";
            combo = 0;
            hud();
            const ganoNivel = modo === 2 ? hielos() === 0 : modo === 0 && puntosNivel >= objetivo();
            if (ganoNivel) { terminarNivel(); return; }
            if (modo !== 1 && movimientos <= 0) { estado = "fin"; api.fin({ gano: false, mensaje: modo === 2 ? `Quedaron ${hielos()} bloques de hielo.` : `Te faltaron ${objetivo() - puntosNivel} puntos.` }); return; }
            if (!hayMovimiento()) { api.aviso("Mezclando…", tema.secundario); armarTablero(); }
          }
        }
      },
      dibujar(g) {
        fondo.dibujar(g, anim);
        // marco del tablero
        g.fillStyle = conAlfa("#000000", 0.3);
        rectRed(g, OX - 10, OY - 10, N * C + 20, N * C + 20, 18); g.fill();
        g.strokeStyle = conAlfa(tema.primario, 0.4); g.lineWidth = 2; g.stroke();
        for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) { g.fillStyle = conAlfa("#ffffff", (f + c) % 2 ? 0.03 : 0.06); g.fillRect(OX + c * C, OY + f * C, C, C); }
        // barra de progreso
        const prog = modo === 2 ? 1 - hielos() / Math.max(1, hielos() + 1) : Math.min(1, puntosNivel / (objetivo() * (modo === 1 ? 2 : 1)));
        g.fillStyle = conAlfa("#ffffff", 0.1); rectRed(g, OX, 70, N * C, 16, 8); g.fill();
        g.fillStyle = tema.acento; rectRed(g, OX, 70, Math.max(16, N * C * prog), 16, 8); g.fill();
        texto(g, modo === 2 ? "Rompé todo el hielo" : modo === 1 ? `Meta: ${objetivo() * 2} puntos` : `Meta: ${objetivo()} puntos`, W / 2, 112, 18, tema.texto, "center", 700);
        const pistaMov = estado === "quieto" && pista > 6 ? hayMovimiento() : null;
        g.save();
        g.beginPath(); g.rect(OX, OY - 4, N * C, N * C + 8); g.clip();
        for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) {
          const cel = tablero[f][c];
          let x = OX + c * C + C / 2, y = OY + f * C + C / 2 + cel.oy;
          if (cambio) {
            const t = cambio.vuelta ? 1 - cambio.t : cambio.t;
            const [a, b] = [cambio.a, cambio.b];
            if (f === a[0] && c === a[1]) { x += (b[1] - a[1]) * C * t; y += (b[0] - a[0]) * C * t; }
            if (f === b[0] && c === b[1]) { x += (a[1] - b[1]) * C * t; y += (a[0] - b[0]) * C * t; }
          }
          if (cel.hielo) { g.fillStyle = conAlfa("#bfefff", cel.hielo === 2 ? 0.55 : 0.32); rectRed(g, OX + c * C + 3, OY + f * C + 3, C - 6, C - 6, 8); g.fill(); }
          const esc = cel.borrar ? Math.max(0, 1 - cel.borrar) : 1;
          const s = (C / 2 - 7) * esc * (sel && sel[0] === f && sel[1] === c ? 1 + Math.sin(anim * 10) * 0.08 : 1);
          if (pistaMov && pistaMov.some(([pf, pc]) => pf === f && pc === c)) y += Math.sin(anim * 12) * 3;
          const col = colores[cel.tipo];
          g.save(); g.translate(x, y);
          if (cel.especial) { brillo(g, "#ffffff", 18); g.rotate(anim * 2); }
          g.fillStyle = col;
          g.beginPath();
          switch (cel.tipo) {
            case 0: g.moveTo(0, -s); g.lineTo(s, 0); g.lineTo(0, s); g.lineTo(-s, 0); break;
            case 1: g.arc(0, 0, s * 0.9, 0, 6.283); break;
            case 2: for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; g.lineTo(Math.cos(a) * s, Math.sin(a) * s); } break;
            case 3: g.moveTo(0, -s); g.lineTo(s * 0.95, s * 0.8); g.lineTo(-s * 0.95, s * 0.8); break;
            case 4: g.rect(-s * 0.8, -s * 0.8, s * 1.6, s * 1.6); break;
            default: for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283 - Math.PI / 2, r = i % 2 ? s * 0.45 : s; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
          }
          g.closePath(); g.fill(); sinBrillo(g);
          g.fillStyle = conAlfa("#ffffff", 0.35); g.beginPath(); g.arc(-s * 0.3, -s * 0.3, s * 0.22, 0, 6.283); g.fill();
          if (cel.especial) { g.strokeStyle = "#fff"; g.lineWidth = 2; g.strokeRect(-s * 0.4, -s * 0.4, s * 0.8, s * 0.8); }
          g.restore();
        }
        g.restore();
        if (sel) { g.strokeStyle = "#fff"; g.lineWidth = 3; rectRed(g, OX + sel[1] * C + 2, OY + sel[0] * C + 2, C - 4, C - 4, 10); g.stroke(); }
        if (teclado) { g.strokeStyle = conAlfa(tema.acento, 0.6); g.lineWidth = 2; rectRed(g, OX + cursor[1] * C + 5, OY + cursor[0] * C + 5, C - 10, C - 10, 8); g.stroke(); }
      },
    };
  },
};

export default modulo;
