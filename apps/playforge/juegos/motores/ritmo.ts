import { crearRng } from "@/lib/rng";
import { conAlfa, mezclarColor } from "@/lib/temas";
import { FondoTema, brillo, rectRed, sinBrillo, texto } from "../runtime/dibujo";
import type { ModuloMotor } from "../runtime/tipos";

const W = 640;
const H = 720;
const LINEA = 600;
const PERFECTO = 0.055;
const BIEN = 0.115;
const ERROR = 0.16;

interface Nota { t: number; carril: number; dur: number; estado: "pendiente" | "manteniendo" | "hecha" | "fallada"; grado: number }

const TECLAS4 = [["KeyD", "ArrowLeft"], ["KeyF", "ArrowDown"], ["KeyJ", "ArrowUp"], ["KeyK", "ArrowRight"]];
const TECLAS3 = [["KeyD", "KeyF", "ArrowLeft"], ["KeyJ", "Space", "ArrowDown", "ArrowUp"], ["KeyK", "KeyL", "ArrowRight"]];

const modulo: ModuloMotor = {
  ancho: W,
  alto: H,
  tactil: "puntero",
  musicaPropia: true,
  crear(api) {
    const { p, tema } = api;
    const fondo = new FondoTema(tema, W, H, crearRng(p.semilla), 50);
    const carriles = p.modo === 1 ? 3 : 4;
    const teclas = carriles === 3 ? TECLAS3 : TECLAS4;
    const anchoCarril = 110;
    const x0 = (W - anchoCarril * carriles) / 2;
    const colores = [tema.primario, tema.secundario, tema.acento, tema.peligro];
    const bpm = Math.round(((96 + p.velocidad * 24 + p.dificultad * 7) * (p.modo === 2 ? 1.08 : 1)) / 2) * 2;
    const negra = 60 / bpm;
    const compases = 20;
    const velPx = 340 + p.dificultad * 45;
    const r = crearRng(p.semilla + 4242);

    // Partitura: patrón rítmico de 2 compases que se repite con variaciones (como una canción)
    const notas: Nota[] = [];
    const densidad = (0.32 + p.dificultad * 0.1) * (p.modo === 2 ? 1.6 : 1);
    const patron: { paso: number; carril: number; dur: number; grado: number }[] = [];
    for (let paso = 0; paso < 32; paso++) {
      const fuerte = paso % 4 === 0;
      if (r() < (fuerte ? densidad + 0.35 : paso % 2 === 0 ? densidad : densidad * 0.45)) {
        const largo = p.modo === 0 && fuerte && r() < 0.18 ? 2 + Math.floor(r() * 3) : 0;
        patron.push({ paso, carril: Math.floor(r() * carriles), dur: largo, grado: Math.floor(r() * 7) });
        if (largo) paso += largo * 2;
      }
    }
    for (let c = 0; c < compases; c += 2) {
      const variar = c % 8 >= 4;
      const intensidad = c >= 4 ? 1 : 0.6;
      for (const n of patron) {
        if (c < 2 && n.paso % 4 !== 0) continue; // intro suave
        if (r() > intensidad) continue;
        const t = (c * 16 + n.paso) * (negra / 4);
        notas.push({ t, carril: variar ? (carriles - 1 - n.carril) : n.carril, dur: n.dur * (negra / 2), estado: "pendiente", grado: n.grado + (variar ? 2 : 0) });
      }
    }
    notas.sort((a, b) => a.t - b.t);
    const duracionCancion = compases * 4 * negra + 1.5;
    const totalNotas = notas.length;

    let inicio = -1;
    let anim = 0;
    let salud = 100;
    let combo = 0;
    let mejorCombo = 0;
    let aciertos = 0;
    let perfectos = 0;
    let terminado = false;
    let siguienteBeat = 0;
    const flashes = new Array(carriles).fill(0);
    const juicios: { t: string; vida: number; color: string; carril: number }[] = [];

    const ahora = () => (api.sonido.ctx ? api.sonido.ahora - inicio : api.tiempo - 2);
    const nota = (grado: number) => tema.tonica * 2 * Math.pow(2, (tema.escala[grado % tema.escala.length] + 12 * Math.floor(grado / tema.escala.length)) / 12);

    const hud = () => api.hud([
      { etiqueta: "Combo", valor: `×${combo}` },
      { etiqueta: "Precisión", valor: `${totalNotas ? Math.round((aciertos / Math.max(1, notas.filter((n) => n.estado !== "pendiente").length)) * 100) : 100}%` },
    ]);
    hud();

    const juzgar = (n: Nota, dif: number) => {
      const ad = Math.abs(dif);
      const perf = ad <= PERFECTO;
      aciertos++;
      if (perf) perfectos++;
      combo++;
      mejorCombo = Math.max(mejorCombo, combo);
      salud = Math.min(100, salud + 2);
      const pts = (perf ? 300 : 100) * (1 + Math.min(combo, 50) / 25);
      api.sumar(Math.round(pts));
      juicios.push({ t: perf ? "¡PERFECTO!" : "BIEN", vida: 0.5, color: perf ? tema.acento : tema.primario, carril: n.carril });
      api.sonido.tono(nota(n.grado), Math.max(0.18, n.dur), "triangle", 0.16);
      api.particulas.explotar(x0 + n.carril * anchoCarril + anchoCarril / 2, LINEA, colores[n.carril], perf ? 14 : 7, 200, 3, 300);
      if (combo % 25 === 0) { api.aviso(`¡Combo ${combo}!`, tema.acento); api.sonido.efecto("combo"); }
      hud();
    };
    const fallar = (n: Nota) => {
      n.estado = "fallada";
      combo = 0;
      salud -= 7 * (0.7 + p.mult * 0.3);
      juicios.push({ t: "FALLO", vida: 0.5, color: tema.peligro, carril: n.carril });
      api.temblor(3);
      hud();
      if (salud <= 0 && !terminado) { terminado = true; api.sonido.detenerMusica(); api.fin({ gano: false, mensaje: "Perdiste el ritmo." }); }
    };

    const tocar = (carril: number) => {
      flashes[carril] = 1;
      const t = ahora();
      const cand = notas.find((n) => n.carril === carril && n.estado === "pendiente" && Math.abs(n.t - t) <= ERROR);
      if (!cand) { api.sonido.efecto("tic"); return; }
      const dif = t - cand.t;
      if (Math.abs(dif) > BIEN) { fallar(cand); return; }
      juzgar(cand, dif);
      cand.estado = cand.dur > 0 ? "manteniendo" : "hecha";
    };
    const presionado = (carril: number) => teclas[carril].some((k) => api.entrada.teclas.has(k)) || [...api.entrada.toques.values()].some((tq) => tq.y > 200 && Math.floor((tq.x - x0) / anchoCarril) === carril);

    return {
      actualizar(dt) {
        anim += dt;
        if (inicio < 0) { inicio = (api.sonido.ctx ? api.sonido.ahora : 0) + 2.2; api.aviso(`${bpm} BPM`, tema.secundario); }
        if (terminado) return;
        const t = ahora();
        // batería sincronizada con el reloj de audio
        while (api.sonido.ctx && siguienteBeat * (negra / 2) < t + 0.2 && siguienteBeat * (negra / 2) < duracionCancion - 1.5) {
          const cuando = inicio + siguienteBeat * (negra / 2);
          if (cuando > api.sonido.ahora - 0.05) {
            if (siguienteBeat % 2 === 0) api.sonido.tono(65, 0.14, "sine", 0.4, cuando, 38);
            if (siguienteBeat % 4 === 2) api.sonido.golpeRuido(0.1, 0.16, 3200, cuando);
            api.sonido.golpeRuido(0.025, 0.05, 9000, cuando);
            if (siguienteBeat % 8 === 0) { const g = [0, 5, 3, 4][Math.floor(siguienteBeat / 8) % 4]; api.sonido.tono(nota(g) / 4, negra * 3.6, "triangle", 0.18, cuando); }
          }
          siguienteBeat++;
        }
        for (let c = 0; c < carriles; c++) {
          if (teclas[c].some((k) => api.entrada.teclasNuevas.has(k))) tocar(c);
          flashes[c] = Math.max(0, flashes[c] - dt * 5);
        }
        for (const tq of api.entrada.toquesNuevos) { const c = Math.floor((tq.x - x0) / anchoCarril); if (c >= 0 && c < carriles && tq.y > 200) tocar(c); }
        for (const n of notas) {
          if (n.estado === "pendiente" && t - n.t > ERROR) fallar(n);
          if (n.estado === "manteniendo") {
            if (t >= n.t + n.dur) { n.estado = "hecha"; api.sumar(150); }
            else if (!presionado(n.carril)) { if (n.t + n.dur - t > 0.12) { combo = 0; hud(); } n.estado = "hecha"; }
            else if (Math.floor(anim * 10) % 2 === 0) api.sumar(2);
          }
          if (terminado) return;
        }
        for (const j of juicios) j.vida -= dt;
        while (juicios.length && juicios[0].vida <= 0) juicios.shift();
        if (t > duracionCancion) {
          terminado = true;
          const prec = Math.round((aciertos / Math.max(1, totalNotas)) * 100);
          const calif = prec >= 95 ? "S" : prec >= 85 ? "A" : prec >= 70 ? "B" : prec >= 55 ? "C" : "D";
          api.sumar(mejorCombo * 20);
          api.fin({ gano: prec >= 55, mensaje: `Nota ${calif} · ${prec}% de precisión · combo máximo ${mejorCombo} · ${perfectos} perfectos` });
        }
      },
      dibujar(g) {
        fondo.dibujar(g, anim);
        const t = ahora();
        const pulso = Math.max(0, 1 - ((t / negra) % 1) * 3);
        g.fillStyle = conAlfa(tema.primario, 0.05 + pulso * 0.06); g.fillRect(0, 0, W, H);
        for (let c = 0; c < carriles; c++) {
          const x = x0 + c * anchoCarril;
          g.fillStyle = conAlfa(colores[c], 0.07 + flashes[c] * 0.25);
          g.fillRect(x + 3, 0, anchoCarril - 6, H);
          g.strokeStyle = conAlfa(colores[c], 0.25); g.lineWidth = 1; g.strokeRect(x + 3, -2, anchoCarril - 6, H + 4);
        }
        // líneas de compás
        for (let b = Math.floor(t / negra); b < t / negra + 6; b++) {
          const y = LINEA - (b * negra - t) * velPx;
          if (y < 0 || y > LINEA) continue;
          g.fillStyle = conAlfa("#ffffff", b % 4 === 0 ? 0.14 : 0.05); g.fillRect(x0, y, anchoCarril * carriles, b % 4 === 0 ? 2 : 1);
        }
        for (const n of notas) {
          if (n.estado === "hecha" || n.estado === "fallada" && t - n.t > 0.3) continue;
          const y = LINEA - (n.t - t) * velPx;
          const largo = n.dur * velPx;
          if (y < -largo - 30 || y > H + 30) continue;
          const x = x0 + n.carril * anchoCarril;
          const col = n.estado === "fallada" ? "#666" : colores[n.carril];
          if (n.dur > 0) {
            const cabeza = n.estado === "manteniendo" ? LINEA : y;
            const fin = LINEA - (n.t + n.dur - t) * velPx;
            g.fillStyle = conAlfa(col, n.estado === "manteniendo" ? 0.75 : 0.45);
            rectRed(g, x + anchoCarril / 2 - 12, fin, 24, Math.max(0, cabeza - fin), 10); g.fill();
          }
          if (n.estado !== "manteniendo") {
            brillo(g, col, 14); g.fillStyle = col;
            rectRed(g, x + 10, y - 13, anchoCarril - 20, 26, 13); g.fill(); sinBrillo(g);
            g.fillStyle = conAlfa("#ffffff", 0.45); rectRed(g, x + 18, y - 9, anchoCarril - 36, 6, 3); g.fill();
          }
        }
        // zona de golpe
        for (let c = 0; c < carriles; c++) {
          const x = x0 + c * anchoCarril;
          g.strokeStyle = colores[c]; g.lineWidth = 3 + flashes[c] * 3;
          rectRed(g, x + 8, LINEA - 16, anchoCarril - 16, 32, 16); g.stroke();
          const etiqueta = teclas[c][0].replace("Key", "");
          texto(g, etiqueta, x + anchoCarril / 2, LINEA + 46, 16, conAlfa(tema.texto, 0.5), "center", 700);
        }
        for (const j of juicios) { g.globalAlpha = Math.min(1, j.vida * 3); texto(g, j.t, x0 + j.carril * anchoCarril + anchoCarril / 2, LINEA - 60 - (0.5 - j.vida) * 50, 18, j.color); }
        g.globalAlpha = 1;
        // barra de salud y progreso
        g.fillStyle = conAlfa("#ffffff", 0.1); rectRed(g, 20, 20, W - 40, 12, 6); g.fill();
        g.fillStyle = salud > 30 ? tema.primario : tema.peligro; rectRed(g, 20, 20, Math.max(12, (W - 40) * (salud / 100)), 12, 6); g.fill();
        g.fillStyle = tema.acento; g.fillRect(20, 38, (W - 40) * Math.min(1, Math.max(0, t / duracionCancion)), 3);
        if (t < 0) texto(g, String(Math.ceil(-t)), W / 2, H / 2 - 60, 80, tema.acento);
        if (combo >= 5) texto(g, `${combo}`, W / 2, 140, 54 + pulso * 6, conAlfa(mezclarColor(tema.texto, tema.acento, 0.5), 0.85));
      },
    };
  },
};

export default modulo;
