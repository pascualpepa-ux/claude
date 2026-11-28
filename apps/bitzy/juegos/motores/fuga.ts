import { crearRng } from "@/lib/rng";
import { conAlfa, mezclarColor } from "@/lib/temas";
import { brillo, rectRed, sinBrillo, texto } from "../runtime/dibujo";
import type { ModuloMotor } from "../runtime/tipos";

const W = 800;
const H = 480;
const C = 230; // tamaño de manzana (celda)
const R = 96; // ancho de calle
const N = 13; // celdas por lado
const MUNDO = N * C;

interface Patrullero { x: number; y: number; ang: number; v: number; nodo: [number, number]; activo: boolean; espera: number }
interface Bolsa { x: number; y: number; tomada: boolean }

/** Fuga Policial: ciudad vista desde arriba. Robá botines, escapá de la policía y bajá el calor. */
const modulo: ModuloMotor = {
  ancho: W,
  alto: H,
  tactil: "lados",
  crear(api) {
    const { p, tema, rng } = api;
    const r = crearRng(p.semilla + p.mapa * 313);
    // manzanas: edificio, plaza o estacionamiento
    const tipo: number[] = [];
    const alturas: number[] = [];
    for (let i = 0; i < N * N; i++) { tipo.push(r() < 0.12 ? 1 : 0); alturas.push(0.3 + r() * 0.7); }
    const edificio = (cx: number, cy: number) => cx >= 0 && cy >= 0 && cx < N && cy < N && tipo[cy * N + cx] === 0;
    const rect = (cx: number, cy: number) => ({ x: cx * C + R / 2, y: cy * C + R / 2, w: C - R, h: C - R });
    const nodoXY = (i: number, j: number) => ({ x: i * C, y: j * C });
    const nodoCercano = (x: number, y: number): [number, number] => [Math.max(1, Math.min(N - 1, Math.round(x / C))), Math.max(1, Math.min(N - 1, Math.round(y / C)))];

    const modo = p.modo;
    const m = p.mult;
    const vMax = 470 * (0.92 + p.velocidad * 0.08);
    const car = { x: C * 1, y: C * 1, ang: 0, vx: 0, vy: 0, nitro: 3, boost: 0 };
    let vida = 100;
    let calor = 1; // 1..5 estrellas
    let calorT = 0; // segundos acumulados de persecución
    let arresto = 0;
    let botin = 0;
    const metaBotin = 8 + p.dificultad * 2;
    let tiempo = modo === 1 ? 120 : modo === 2 ? 70 - p.dificultad * 4 : 0;
    let anim = 0;
    let terminado = false;
    let entregas = 0;
    const metaEntregas = 6;
    const policias: Patrullero[] = [];
    const bolsas: Bolsa[] = [];
    let marcas: [number, number][] = [];
    const garaje = { i: N - 2, j: N - 2 };
    let punto = { i: 4, j: 3 };
    const cam = { x: car.x, y: car.y };

    const posLibre = () => { for (;;) { const i = 1 + Math.floor(rng() * (N - 1)), j = 1 + Math.floor(rng() * (N - 1)); const n = nodoXY(i, j); const t = rng(); return rng() < 0.5 ? { x: n.x + (t - 0.5) * (C - 40), y: n.y } : { x: n.x, y: n.y + (t - 0.5) * (C - 40) }; } };
    const nuevaBolsa = () => { const q = posLibre(); bolsas.push({ ...q, tomada: false }); };
    if (modo === 0) for (let k = 0; k < 6; k++) nuevaBolsa();
    const nuevoPunto = () => { do { punto = { i: 1 + Math.floor(rng() * (N - 1)), j: 1 + Math.floor(rng() * (N - 1)) }; } while (Math.hypot(punto.i * C - car.x, punto.j * C - car.y) < C * 3); };
    if (modo === 2) nuevoPunto();

    const sumarPatrullero = () => {
      for (let k = 0; k < 20; k++) {
        const i = 1 + Math.floor(rng() * (N - 1)), j = 1 + Math.floor(rng() * (N - 1));
        const n = nodoXY(i, j);
        if (Math.hypot(n.x - car.x, n.y - car.y) > 800) { policias.push({ x: n.x, y: n.y, ang: 0, v: 0, nodo: [i, j], activo: true, espera: 0 }); return; }
      }
    };
    const maxPolicias = () => Math.min(9, Math.round((calor + 0.5) * (0.6 + m * 0.4)));

    const hud = () => {
      const d = [
        { etiqueta: "Calor", valor: "★".repeat(calor) + "☆".repeat(5 - calor) },
        { etiqueta: "Daño", valor: `${Math.max(0, Math.round(100 - vida))}%` },
      ];
      if (modo === 0) d.push({ etiqueta: "Botín", valor: `${botin}/${metaBotin}` });
      if (modo === 1) d.push({ etiqueta: "Resistí", valor: `${Math.max(0, Math.ceil(tiempo))} s` });
      if (modo === 2) { d.push({ etiqueta: "Entregas", valor: `${entregas}/${metaEntregas}` }); d.push({ etiqueta: "Tiempo", valor: String(Math.max(0, Math.ceil(tiempo))) }); }
      d.push({ etiqueta: "Nitro", valor: "⚡".repeat(car.nitro) || "—" });
      api.hud(d);
    };
    hud();
    let hudT = 0;
    api.aviso(modo === 0 ? "Robá el botín y llevalo al garaje" : modo === 1 ? "Escapá de la policía" : "Hacé las entregas", tema.acento);

    const terminar = (gano: boolean, msg: string) => { if (terminado) return; terminado = true; api.fin({ gano, mensaje: msg }); };
    const chocarEdificios = (o: { x: number; y: number; vx?: number; vy?: number }, radio: number) => {
      let golpe = 0;
      const cx = Math.floor(o.x / C), cy = Math.floor(o.y / C);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const bx = cx + dx, by = cy + dy;
        if (!edificio(bx, by)) continue;
        const b = rect(bx, by);
        const px = Math.max(b.x, Math.min(o.x, b.x + b.w)), py = Math.max(b.y, Math.min(o.y, b.y + b.h));
        const ddx = o.x - px, ddy = o.y - py, d = Math.hypot(ddx, ddy);
        if (d < radio && d > 0.001) {
          o.x = px + (ddx / d) * radio; o.y = py + (ddy / d) * radio;
          if (o.vx !== undefined && o.vy !== undefined) { const vn = (o.vx * ddx + o.vy * ddy) / d; if (vn < 0) { golpe = Math.max(golpe, -vn); o.vx -= 1.4 * vn * (ddx / d); o.vy -= 1.4 * vn * (ddy / d); } }
        }
      }
      o.x = Math.max(radio, Math.min(MUNDO - radio, o.x)); o.y = Math.max(radio, Math.min(MUNDO - radio, o.y));
      return golpe;
    };

    return {
      sonda: () => {
        let ox = car.x, oy = car.y;
        if (modo === 0) { if (botin >= metaBotin) { ox = garaje.i * C; oy = garaje.j * C; } else { let mejor = Infinity; for (const b of bolsas) if (!b.tomada) { const d = Math.hypot(b.x - car.x, b.y - car.y); if (d < mejor) { mejor = d; ox = b.x; oy = b.y; } } } }
        else if (modo === 2) { ox = punto.i * C; oy = punto.j * C; }
        else { let mejor = 0; for (let i = 1; i < N; i++) for (let j = 1; j < N; j++) { let dmin = Infinity; for (const po of policias) dmin = Math.min(dmin, Math.hypot(po.x - i * C, po.y - j * C)); if (dmin > mejor) { mejor = dmin; ox = i * C; oy = j * C; } } }
        return { x: car.x, y: car.y, ang: car.ang, v: Math.hypot(car.vx, car.vy), ox, oy, calor, vida, arresto };
      },
      actualizar(dt) {
        anim += dt;
        const e = api.entrada;
        // ---- auto del jugador (misma física que Derrape GP)
        const giro = terminado ? 0 : e.eje("izq", "der");
        const frena = !terminado && (e.presionado("abajo") || e.presionado("b"));
        if (!terminado && e.pulsado("a") && car.nitro > 0 && car.boost <= 0) { car.nitro--; car.boost = 2.2; api.sonido.efecto("mejora"); hud(); }
        car.boost = Math.max(0, car.boost - dt);
        const vfA = car.vx * Math.cos(car.ang) + car.vy * Math.sin(car.ang);
        car.ang += giro * 3 * Math.min(1, Math.abs(vfA) / 150) * Math.sign(vfA || 1) * dt;
        const fx = Math.cos(car.ang), fy = Math.sin(car.ang);
        let vf = car.vx * fx + car.vy * fy;
        let vr = -car.vx * fy + car.vy * fx;
        const tope = vMax * (car.boost > 0 ? 1.4 : 1);
        if (frena) vf -= 900 * dt;
        else if (!terminado) vf += (vf < tope ? 430 * (1 - (vf / tope) * 0.5) : -500) * dt;
        else vf *= Math.pow(0.3, dt);
        vf = Math.max(-140, vf);
        const derrapa = Math.abs(giro) > 0 && vf > vMax * 0.5;
        vr *= Math.pow(derrapa ? 0.28 : 0.004, dt);
        car.vx = fx * vf - fy * vr; car.vy = fy * vf + fx * vr;
        car.x += car.vx * dt; car.y += car.vy * dt;
        const golpe = chocarEdificios(car, 16);
        if (golpe > 230 && !terminado) { vida -= golpe / 75; api.temblor(Math.min(12, golpe / 40)); api.sonido.efecto("golpe"); api.particulas.explotar(W / 2, H / 2, "#ffd166", 8, 160, 3, 0); }
        if (Math.abs(vr) > 80) { marcas.push([car.x - fx * 14, car.y - fy * 14]); if (marcas.length > 500) marcas = marcas.slice(-500); }
        if (terminado) return;

        // ---- objetivos
        if (modo === 0) {
          for (const b of bolsas) if (!b.tomada && Math.hypot(b.x - car.x, b.y - car.y) < 34) {
            b.tomada = true; botin++;
            api.sumar(250 * calor, W / 2, H / 2 - 30); api.sonido.efecto("moneda");
            calorT += 12; // robar sube el calor
            if (botin < metaBotin && bolsas.filter((x) => !x.tomada).length < 4) nuevaBolsa();
            if (botin >= metaBotin) api.aviso("¡Botín completo! Llevalo al garaje", tema.acento);
            hud();
          }
          const gx = garaje.i * C, gy = garaje.j * C;
          if (botin >= metaBotin && Math.hypot(gx - car.x, gy - car.y) < 60 && Math.hypot(car.vx, car.vy) < 200) { api.sumar(Math.round(vida * 20) + calor * 500); terminar(true, `¡Golpe perfecto! Escondiste el botín con ${calor} estrellas de calor.`); return; }
        } else if (modo === 1) {
          tiempo -= dt;
          api.sumar(0);
          if (tiempo <= 0) { api.sumar(Math.round(vida * 20)); terminar(true, "¡Sobreviviste a la persecución!"); return; }
        } else {
          tiempo -= dt;
          if (Math.hypot(punto.i * C - car.x, punto.j * C - car.y) < 60) {
            entregas++; api.sumar(400 + calor * 100, W / 2, H / 2 - 30); api.sonido.efecto("nivel"); tiempo += 18 - p.dificultad; calorT += 8;
            if (entregas >= metaEntregas) { terminar(true, "¡Hiciste todas las entregas!"); return; }
            nuevoPunto(); hud();
          }
          if (tiempo <= 0) { terminar(false, "No llegaste a tiempo con la entrega."); return; }
        }

        // ---- calor: sube con la persecución, baja si nadie te ve
        const visto = policias.some((po) => Math.hypot(po.x - car.x, po.y - car.y) < 420);
        calorT += dt * (visto ? 1 : -1.6) * (0.6 + m * 0.4);
        calorT = Math.max(0, Math.min(80, calorT));
        const nuevoCalor = Math.min(5, 1 + Math.floor(calorT / 16));
        if (nuevoCalor !== calor) { if (nuevoCalor > calor) { api.aviso(`¡Calor ${"★".repeat(nuevoCalor)}!`, tema.peligro); api.sonido.efecto("error"); } else api.aviso("El calor baja…", tema.primario); calor = nuevoCalor; hud(); }
        if (anim > 4) while (policias.length < maxPolicias()) sumarPatrullero();

        // ---- patrulleros
        const nJ = nodoCercano(car.x, car.y);
        let cerca = 0;
        for (const po of policias) {
          const dJ = Math.hypot(car.x - po.x, car.y - po.y);
          let tx: number, ty: number;
          const mismaCalle = Math.abs(car.x - po.x) < R * 0.6 || Math.abs(car.y - po.y) < R * 0.6;
          if (dJ < 300 || (mismaCalle && dJ < 600)) { tx = car.x + car.vx * 0.3; ty = car.y + car.vy * 0.3; }
          else {
            const n = nodoXY(po.nodo[0], po.nodo[1]);
            if (Math.hypot(n.x - po.x, n.y - po.y) < 40) {
              const [i, j] = po.nodo;
              const di = Math.sign(nJ[0] - i), dj = Math.sign(nJ[1] - j);
              po.nodo = (Math.abs(nJ[0] - i) > Math.abs(nJ[1] - j) || (dj === 0)) && di !== 0 ? [i + di, j] : [i, j + (dj || (rng() < 0.5 ? 1 : -1))];
              po.nodo = [Math.max(1, Math.min(N - 1, po.nodo[0])), Math.max(1, Math.min(N - 1, po.nodo[1]))];
            }
            const n2 = nodoXY(po.nodo[0], po.nodo[1]);
            tx = n2.x; ty = n2.y;
          }
          let dif = Math.atan2(ty - po.y, tx - po.x) - po.ang;
          while (dif > Math.PI) dif -= Math.PI * 2; while (dif < -Math.PI) dif += Math.PI * 2;
          po.ang += Math.max(-3.4 * dt, Math.min(3.4 * dt, dif));
          const vObj = vMax * Math.min(0.9, (0.68 + calor * 0.035) * (0.86 + m * 0.1)) * (Math.abs(dif) > 1.2 ? 0.45 : 1);
          po.espera = Math.max(0, po.espera - dt);
          // de cerca no embisten sin parar: se pegan a tu velocidad para encerrarte
          const velJ = Math.hypot(car.vx, car.vy);
          const vMeta = dJ < 110 ? Math.min(vObj, velJ + 40) : vObj;
          po.v += (vMeta - po.v) * Math.min(1, dt * (po.espera > 0 ? 0.4 : 1.8));
          const o = { x: po.x + Math.cos(po.ang) * po.v * dt, y: po.y + Math.sin(po.ang) * po.v * dt, vx: Math.cos(po.ang) * po.v, vy: Math.sin(po.ang) * po.v };
          if (chocarEdificios(o, 15) > 60) po.v *= 0.6;
          po.x = o.x; po.y = o.y;
          // choque con el jugador
          if (dJ < 32) {
            const nx = (car.x - po.x) / (dJ || 1), ny = (car.y - po.y) / (dJ || 1);
            car.x += nx * (32 - dJ) * 0.6; car.y += ny * (32 - dJ) * 0.6; po.x -= nx * (32 - dJ) * 0.4; po.y -= ny * (32 - dJ) * 0.4;
            const rel = Math.hypot(car.vx - Math.cos(po.ang) * po.v, car.vy - Math.sin(po.ang) * po.v);
            if (rel > 170 && po.espera <= 0) { vida -= rel / 95; po.espera = 1.2; api.temblor(8); api.sonido.efecto("golpe"); car.vx *= 0.75; car.vy *= 0.75; po.v *= 0.3; calorT += 2; }
          }
          if (dJ < 75) cerca++;
        }
        // separar patrulleros entre sí
        for (let a = 0; a < policias.length; a++) for (let b = a + 1; b < policias.length; b++) {
          const pa = policias[a], pb = policias[b], d = Math.hypot(pa.x - pb.x, pa.y - pb.y);
          if (d < 30 && d > 0) { const k = (30 - d) / 2 / d; pa.x += (pa.x - pb.x) * k; pa.y += (pa.y - pb.y) * k; pb.x -= (pa.x - pb.x) * k; pb.y -= (pa.y - pb.y) * k; }
        }
        // ¡arrestado! si te rodean y estás casi quieto
        const vel = Math.hypot(car.vx, car.vy);
        if (cerca > 0 && vel < 45) arresto += dt * (0.5 + cerca * 0.3); else arresto = Math.max(0, arresto - dt * 1.5);
        if (Math.floor(anim * 4) !== Math.floor((anim - dt) * 4) && arresto > 0.3) api.sonido.efecto("tic");
        if (arresto >= 3) { terminar(false, "¡Te atraparon! La policía te rodeó."); return; }
        if (vida <= 0) { api.particulas.explotar(W / 2, H / 2, tema.peligro, 50, 300, 5, 0); api.sonido.efecto("explosion"); terminar(false, "Tu auto quedó destruido."); return; }

        if (modo === 1) api.fijarPuntos(Math.round((120 - tiempo) * 10 * calor));
        hudT -= dt;
        if (hudT <= 0) { hudT = 0.25; hud(); }
        cam.x += (car.x + car.vx * 0.4 - cam.x) * Math.min(1, dt * 5);
        cam.y += (car.y + car.vy * 0.4 - cam.y) * Math.min(1, dt * 5);
      },
      dibujar(g) {
        const asfalto = mezclarColor("#2c2c36", tema.fondo, 0.35);
        g.fillStyle = asfalto; g.fillRect(0, 0, W, H);
        g.save();
        g.translate(Math.round(W / 2 - cam.x), Math.round(H / 2 - cam.y));
        const x0 = Math.max(0, Math.floor((cam.x - W / 2) / C) - 1), x1 = Math.min(N, Math.ceil((cam.x + W / 2) / C) + 1);
        const y0 = Math.max(0, Math.floor((cam.y - H / 2) / C) - 1), y1 = Math.min(N, Math.ceil((cam.y + H / 2) / C) + 1);
        // líneas de carril
        g.strokeStyle = conAlfa("#ffd166", 0.45); g.lineWidth = 3; g.setLineDash([22, 22]);
        for (let i = x0; i <= x1; i++) { g.beginPath(); g.moveTo(i * C, y0 * C); g.lineTo(i * C, y1 * C); g.stroke(); }
        for (let j = y0; j <= y1; j++) { g.beginPath(); g.moveTo(x0 * C, j * C); g.lineTo(x1 * C, j * C); g.stroke(); }
        g.setLineDash([]);
        g.fillStyle = "rgba(10,10,14,.35)";
        for (const [x, y] of marcas) g.fillRect(x - 3, y - 3, 6, 6);
        // manzanas
        for (let cx = x0; cx < x1; cx++) for (let cy = y0; cy < y1; cy++) {
          const b = rect(cx, cy);
          g.fillStyle = "#8a8aa0"; rectRed(g, b.x - 8, b.y - 8, b.w + 16, b.h + 16, 10); g.fill(); // vereda
          if (tipo[cy * N + cx] === 1) {
            g.fillStyle = mezclarColor(tema.primario, "#0b3d1f", 0.55); rectRed(g, b.x, b.y, b.w, b.h, 8); g.fill();
            g.fillStyle = mezclarColor(tema.primario, "#000000", 0.3);
            for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(b.x + 30 + (k % 2) * (b.w - 60), b.y + 30 + Math.floor(k / 2) * (b.h - 60), 18, 0, 6.283); g.fill(); }
            continue;
          }
          const alto = alturas[cy * N + cx];
          const base = mezclarColor(tema.fondo2, tema.secundario, 0.18 + alto * 0.2);
          g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(b.x + 10, b.y + 10, b.w, b.h);
          g.fillStyle = base; g.fillRect(b.x, b.y, b.w, b.h);
          g.fillStyle = mezclarColor(base, "#ffffff", 0.08); g.fillRect(b.x + 10, b.y + 10, b.w - 20, b.h - 20);
          // ventanas encendidas (de noche la ciudad brilla)
          for (let wy = 0; wy < 4; wy++) for (let wx = 0; wx < 4; wx++) {
            if ((cx * 7 + cy * 13 + wx * 3 + wy * 5) % 3 === 0) { g.fillStyle = conAlfa(tema.acento, 0.55); g.fillRect(b.x + 20 + wx * ((b.w - 40) / 4), b.y + 20 + wy * ((b.h - 40) / 4), 10, 10); }
          }
          g.fillStyle = conAlfa(tema.primario, 0.7); g.fillRect(b.x + b.w / 2 - 10, b.y + b.h / 2 - 10, 20, 20);
        }
        // garaje / punto de entrega
        const meta = modo === 0 ? (botin >= metaBotin ? { x: garaje.i * C, y: garaje.j * C, t: "GARAJE" } : null) : modo === 2 ? { x: punto.i * C, y: punto.j * C, t: "ENTREGA" } : null;
        if (meta) { brillo(g, tema.acento, 24); g.strokeStyle = tema.acento; g.lineWidth = 4; g.beginPath(); g.arc(meta.x, meta.y, 46 + Math.sin(anim * 5) * 5, 0, 6.283); g.stroke(); sinBrillo(g); texto(g, meta.t, meta.x, meta.y, 15, tema.acento); }
        for (const b of bolsas) if (!b.tomada) { brillo(g, tema.acento, 16); g.fillStyle = tema.acento; g.beginPath(); g.arc(b.x, b.y + Math.sin(anim * 4 + b.x) * 3, 12, 0, 6.283); g.fill(); sinBrillo(g); texto(g, "$", b.x, b.y + Math.sin(anim * 4 + b.x) * 3 + 1, 14, tema.fondo); }
        // autos
        const dibAuto = (x: number, y: number, ang: number, color: string, policia: boolean) => {
          g.save(); g.translate(x, y); g.rotate(ang);
          g.fillStyle = "rgba(0,0,0,.4)"; rectRed(g, -18, -9, 42, 22, 6); g.fill();
          g.fillStyle = color; rectRed(g, -21, -11, 42, 22, 7); g.fill();
          g.fillStyle = conAlfa("#000000", 0.55); rectRed(g, -6, -8, 15, 16, 3); g.fill();
          if (policia) { const on = Math.floor(anim * 8) % 2; g.fillStyle = on ? "#ff2a4d" : "#3b82f6"; g.fillRect(-4, -9, 5, 7); g.fillStyle = on ? "#3b82f6" : "#ff2a4d"; g.fillRect(-4, 2, 5, 7); brillo(g, on ? "#ff2a4d" : "#3b82f6", 22); g.fillRect(-2, -1, 1, 2); sinBrillo(g); }
          else { g.fillStyle = "#fff8c0"; g.fillRect(18, -9, 3, 5); g.fillRect(18, 4, 3, 5); }
          g.restore();
        };
        for (const po of policias) { g.fillStyle = conAlfa(Math.floor(anim * 8) % 2 ? "#ff2a4d" : "#3b82f6", 0.12); g.beginPath(); g.arc(po.x, po.y, 70, 0, 6.283); g.fill(); dibAuto(po.x, po.y, po.ang, "#e9eef7", true); }
        if (car.boost > 0) { g.fillStyle = tema.acento; g.beginPath(); g.arc(car.x - Math.cos(car.ang) * 26, car.y - Math.sin(car.ang) * 26, 6 + Math.random() * 5, 0, 6.283); g.fill(); }
        brillo(g, tema.secundario, 14); dibAuto(car.x, car.y, car.ang, tema.secundario, false); sinBrillo(g);
        // faros
        g.fillStyle = "rgba(255,248,192,.07)"; g.beginPath(); g.moveTo(car.x + Math.cos(car.ang) * 20, car.y + Math.sin(car.ang) * 20);
        g.arc(car.x, car.y, 190, car.ang - 0.35, car.ang + 0.35); g.fill();
        g.restore();
        // viñeta nocturna + destellos de sirena según el calor
        const vin = g.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 520);
        vin.addColorStop(0, "rgba(0,0,0,0)"); vin.addColorStop(1, "rgba(0,0,0,.55)");
        g.fillStyle = vin; g.fillRect(0, 0, W, H);
        if (calor >= 3) { g.fillStyle = conAlfa(Math.floor(anim * 4) % 2 ? "#ff2a4d" : "#3b82f6", 0.05 * (calor - 2)); g.fillRect(0, 0, W, H); }
        // estrellas de calor
        for (let k = 0; k < 5; k++) texto(g, k < calor ? "★" : "☆", W - 150 + k * 28, 30, 26, k < calor ? "#ffd166" : "rgba(255,255,255,.35)");
        // barra de daño y de arresto
        g.fillStyle = "rgba(0,0,0,.45)"; rectRed(g, 16, 16, 160, 14, 7); g.fill();
        g.fillStyle = vida > 35 ? tema.primario : tema.peligro; rectRed(g, 16, 16, Math.max(10, 160 * Math.max(0, vida) / 100), 14, 7); g.fill();
        texto(g, "MOTOR", 96, 24, 10, "#fff", "center", 800);
        if (arresto > 0.05) { g.fillStyle = "rgba(0,0,0,.55)"; rectRed(g, W / 2 - 110, H - 50, 220, 26, 13); g.fill(); g.fillStyle = "#ff2a4d"; rectRed(g, W / 2 - 110, H - 50, 220 * Math.min(1, arresto / 3), 26, 13); g.fill(); texto(g, "¡TE ESTÁN RODEANDO! ACELERÁ", W / 2, H - 37, 12, "#fff", "center", 900); }
        // minimapa
        const mm = 110, esc = mm / MUNDO, ox = W - mm - 16, oy = 52;
        g.fillStyle = "rgba(0,0,0,.55)"; rectRed(g, ox - 4, oy - 4, mm + 8, mm + 8, 8); g.fill();
        for (const b of bolsas) if (!b.tomada) { g.fillStyle = tema.acento; g.fillRect(ox + b.x * esc - 2, oy + b.y * esc - 2, 4, 4); }
        if (meta) { g.fillStyle = tema.acento; g.beginPath(); g.arc(ox + meta.x * esc, oy + meta.y * esc, 4 + Math.sin(anim * 6), 0, 6.283); g.fill(); }
        for (const po of policias) { g.fillStyle = Math.floor(anim * 8) % 2 ? "#ff2a4d" : "#3b82f6"; g.fillRect(ox + po.x * esc - 2, oy + po.y * esc - 2, 4, 4); }
        g.fillStyle = "#fff"; g.beginPath(); g.arc(ox + car.x * esc, oy + car.y * esc, 3.5, 0, 6.283); g.fill();
      },
    };
  },
};

export default modulo;
