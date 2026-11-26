import { crearRng } from "@/lib/rng";
import { conAlfa, mezclarColor } from "@/lib/temas";
import { brillo, rectRed, sinBrillo, texto } from "../runtime/dibujo";
import type { ModuloMotor } from "../runtime/tipos";

const W = 800;
const H = 450;
const M = 900; // muestras del trazado

interface Rival { idx: number; vueltas: number; lado: number; vel: number; habil: number; color: string; x: number; y: number; ang: number }

/** Carreras vistas desde arriba en un circuito generado, con derrapes, nitro y rivales con IA. */
const modulo: ModuloMotor = {
  ancho: W,
  alto: H,
  tactil: "lados",
  crear(api) {
    const { p, tema } = api;
    const r = crearRng(p.semilla + p.mapa * 77);
    // --- trazado: puntos alrededor de un centro (forma de estrella → nunca se cruza) + spline cerrada
    const nCtrl = 9 + Math.floor(r() * 5);
    const ctrl: [number, number][] = [];
    const base = 1250 + p.mapa * 70;
    for (let i = 0; i < nCtrl; i++) {
      const a = (i / nCtrl) * Math.PI * 2 + (r() - 0.5) * 0.25;
      const rad = base * (0.72 + r() * 0.4);
      ctrl.push([Math.cos(a) * rad * 1.25, Math.sin(a) * rad]);
    }
    const pts: [number, number][] = [];
    for (let i = 0; i < M; i++) {
      const t = (i / M) * nCtrl;
      const k = Math.floor(t), u = t - k;
      const p0 = ctrl[(k - 1 + nCtrl) % nCtrl], p1 = ctrl[k % nCtrl], p2 = ctrl[(k + 1) % nCtrl], p3 = ctrl[(k + 2) % nCtrl];
      const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
      pts.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]);
    }
    const tang = pts.map((_, i) => { const a = pts[(i - 2 + M) % M], b = pts[(i + 2) % M]; const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l] as [number, number]; });
    const curva = tang.map((t, i) => { const t2 = tang[(i + 8) % M]; return Math.abs(Math.atan2(t[0] * t2[1] - t[1] * t2[0], t[0] * t2[0] + t[1] * t2[1])); });
    const largo = pts.reduce((s, q, i) => s + Math.hypot(pts[(i + 1) % M][0] - q[0], pts[(i + 1) % M][1] - q[1]), 0);
    const ancho = 130 - p.dificultad * 6;
    const deco: [number, number, number][] = [];
    for (let i = 0; i < 140; i++) {
      const j = Math.floor(r() * M), lado = r() < 0.5 ? -1 : 1, d = ancho / 2 + 40 + r() * 180;
      deco.push([pts[j][0] - tang[j][1] * d * lado, pts[j][1] + tang[j][0] * d * lado, r()]);
    }

    const modo = p.modo;
    const vueltasMeta = modo === 2 ? 2 : 3;
    const vMax = 560 * (0.9 + p.velocidad * 0.1);
    const car = { x: pts[0][0] - tang[0][0] * 60, y: pts[0][1] - tang[0][1] * 60, ang: Math.atan2(tang[0][1], tang[0][0]), vx: 0, vy: 0, idx: 0, vueltas: 0, mitad: false, nitro: 3, boost: 0 };
    const colores = [tema.peligro, tema.acento, tema.primario, mezclarColor(tema.secundario, tema.peligro, 0.5), "#e8e8f0"];
    const rivales: Rival[] = modo === 0 ? colores.map((c, i) => ({ idx: (M - 12 - i * 9 + M) % M, vueltas: -1, lado: (i % 2 ? 1 : -1) * 0.25, vel: 0, habil: (0.87 + i * 0.025) * (0.9 + p.mult * 0.1), color: c, x: 0, y: 0, ang: 0 })) : [];
    const limite = modo === 1 ? (largo / (vMax * 0.78)) * vueltasMeta * (1.42 - p.dificultad * 0.06) : 0;
    const metaDerrape = Math.round((largo / 1000) * 150 * (0.8 + p.mult * 0.25));
    let derrape = 0;
    let tiempo = 0;
    let anim = 0;
    let terminado = false;
    let salida = 3;
    let posicion = rivales.length + 1;
    let fuera = false;
    let marcas: [number, number, number, number][] = [];
    const cam = { x: car.x, y: car.y };

    const cercano = (x: number, y: number, desde: number) => {
      let mejor = desde, md = Infinity;
      for (let k = -60; k <= 60; k++) {
        const i = (desde + k + M) % M;
        const d = (pts[i][0] - x) ** 2 + (pts[i][1] - y) ** 2;
        if (d < md) { md = d; mejor = i; }
      }
      return { i: mejor, d: Math.sqrt(md) };
    };

    const hud = () => {
      const d = [{ etiqueta: "Vuelta", valor: `${Math.min(vueltasMeta, car.vueltas + 1)}/${vueltasMeta}` }];
      if (modo === 0) d.push({ etiqueta: "Puesto", valor: `${posicion}º` });
      if (modo === 1) d.push({ etiqueta: "Tiempo", valor: String(Math.max(0, Math.ceil(limite - tiempo))) });
      if (modo === 2) d.push({ etiqueta: "Derrape", valor: `${Math.floor(derrape)}/${metaDerrape}` });
      d.push({ etiqueta: "Nitro", valor: "⚡".repeat(car.nitro) || "—" });
      api.hud(d);
    };
    hud();
    let hudT = 0;

    const terminar = (gano: boolean, msg: string) => { if (terminado) return; terminado = true; api.fin({ gano, mensaje: msg }); };

    return {
      sonda: () => ({ v: Math.hypot(car.vx, car.vy), boost: car.boost, x: car.x, y: car.y, ang: car.ang, idx: car.idx, objAng: Math.atan2(pts[(car.idx + 25) % M][1] - car.y, pts[(car.idx + 25) % M][0] - car.x), fuera }),
      actualizar(dt) {
        anim += dt;
        if (salida > 0) {
          const antes = Math.ceil(salida);
          salida -= dt;
          if (Math.ceil(salida) !== antes) { api.sonido.efecto(salida <= 0 ? "nivel" : "tic"); api.aviso(salida <= 0 ? "¡YA!" : String(Math.ceil(salida)), salida <= 0 ? tema.acento : tema.texto); }
          return;
        }
        const e = api.entrada;
        if (!terminado) tiempo += dt;
        const giro = terminado ? 0 : e.eje("izq", "der");
        const frena = !terminado && (e.presionado("abajo") || e.presionado("b"));
        if (!terminado && e.pulsado("a") && car.nitro > 0 && car.boost <= 0) { car.nitro--; car.boost = 2; api.sonido.efecto("mejora"); hud(); }
        car.boost = Math.max(0, car.boost - dt);
        // 1) el volante gira la trompa; la velocidad (en el mundo) no cambia sola → aparece el deslizamiento
        const vfAntes = car.vx * Math.cos(car.ang) + car.vy * Math.sin(car.ang);
        car.ang += giro * 2.7 * Math.min(1, Math.abs(vfAntes) / 180) * Math.sign(vfAntes || 1) * dt;
        const fx = Math.cos(car.ang), fy = Math.sin(car.ang);
        let vf = car.vx * fx + car.vy * fy;
        let vr = -car.vx * fy + car.vy * fx;
        // 2) motor y freno sobre el eje de la trompa
        const tope = vMax * (car.boost > 0 ? 1.35 : 1) * (fuera ? 0.45 : 1);
        if (frena) vf -= 900 * dt;
        else if (!terminado) vf += (vf < tope ? 420 * (1 - (vf / tope) * 0.5) : -500) * dt;
        else vf *= Math.pow(0.4, dt);
        vf = Math.max(-120, vf);
        // 3) agarre lateral: con mucha velocidad y volante, las gomas patinan (derrape)
        const derrapando = Math.abs(giro) > 0 && vf > vMax * 0.5;
        vr *= Math.pow(derrapando ? 0.25 : 0.004, dt);
        if (derrapando) vf -= Math.abs(vr) * 0.25 * dt;
        car.vx = fx * vf - fy * vr;
        car.vy = fy * vf + fx * vr;
        car.x += car.vx * dt; car.y += car.vy * dt;
        const c = cercano(car.x, car.y, car.idx);
        fuera = c.d > ancho / 2 + 6;
        if (fuera && vf > 150) api.particulas.explotar(W / 2 - fx * 18, H / 2 - fy * 18, conAlfa(tema.primario, 0.6), 1, 50, 4, 0);
        // marcas de derrape y puntos
        if (Math.abs(vr) > 70 && !fuera) {
          for (const s of [-1, 1]) marcas.push([car.x - fx * 16 - fy * 9 * s, car.y - fy * 16 + fx * 9 * s, Math.abs(vr), anim]);
          if (marcas.length > 600) marcas = marcas.slice(-600);
          if (!terminado) { const pts2 = Math.abs(vr) * dt * 0.8 * (car.boost > 0 ? 1.5 : 1); derrape += pts2; if (modo === 2) api.sumar(Math.round(pts2)); }
          if (Math.random() < 0.3) api.particulas.explotar(W / 2 - fx * 18, H / 2 - fy * 18, "rgba(220,220,230,.5)", 1, 40, 6, -20);
        }
        // vueltas
        if (car.idx > M * 0.4 && car.idx < M * 0.6) car.mitad = true;
        if (car.mitad && car.idx > M - 80 && c.i < 80) {
          car.vueltas++; car.mitad = false;
          if (car.vueltas >= vueltasMeta && !terminado) {
            if (modo === 0) { api.sumar((rivales.length + 2 - posicion) * 300); terminar(posicion <= 3, posicion <= 3 ? `¡Terminaste ${posicion}º, al podio!` : `Terminaste ${posicion}º. Necesitabas el podio.`); }
            else if (modo === 1) { api.sumar(Math.round((limite - tiempo) * 50)); terminar(true, `¡Terminaste las ${vueltasMeta} vueltas con ${Math.ceil(limite - tiempo)} s de sobra!`); }
            else terminar(derrape >= metaDerrape, derrape >= metaDerrape ? `¡Rey del derrape! ${Math.floor(derrape)} puntos.` : `Te faltaron ${Math.ceil(metaDerrape - derrape)} puntos de derrape.`);
          } else if (!terminado) { api.aviso(car.vueltas === vueltasMeta - 1 ? "¡Última vuelta!" : `Vuelta ${car.vueltas + 1}`, tema.acento); api.sonido.efecto("nivel"); }
        }
        car.idx = c.i;
        if (modo === 1 && !terminado && tiempo > limite) terminar(false, "Se acabó el tiempo.");
        if (modo === 2 && !terminado && derrape >= metaDerrape && car.vueltas < vueltasMeta) { /* sigue sumando hasta la meta */ }
        // rivales
        for (const rv of rivales) {
          const objetivo = vMax * rv.habil * (1 - Math.min(0.45, curva[Math.floor(rv.idx) % M] * 2.2));
          rv.vel += (objetivo - rv.vel) * Math.min(1, dt * 1.5);
          const avance = (rv.vel * dt) / (largo / M);
          const antes = rv.idx;
          rv.idx = (rv.idx + avance) % M;
          if (rv.idx < antes) rv.vueltas++;
          const i = Math.floor(rv.idx);
          rv.x = pts[i][0] - tang[i][1] * rv.lado * ancho * 0.6;
          rv.y = pts[i][1] + tang[i][0] * rv.lado * ancho * 0.6;
          rv.ang = Math.atan2(tang[i][1], tang[i][0]);
          rv.lado += (Math.sin(anim * 0.3 + rv.habil * 40) * 0.3 - rv.lado) * dt * 0.5;
          const dx = car.x - rv.x, dy = car.y - rv.y, d = Math.hypot(dx, dy);
          if (d < 30 && d > 0) {
            car.x += (dx / d) * (30 - d); car.y += (dy / d) * (30 - d);
            car.vx *= 0.8; car.vy *= 0.8; rv.vel *= 0.9;
            api.temblor(5); api.sonido.efecto("golpe");
          }
        }
        if (modo === 0) {
          const prog = car.vueltas * M + car.idx;
          posicion = 1 + rivales.filter((rv) => rv.vueltas * M + rv.idx > prog).length;
        }
        if (modo !== 2) api.fijarPuntos(Math.floor((car.vueltas * largo + (car.idx / M) * largo) / 20 + derrape * 0.2));
        hudT -= dt;
        if (hudT <= 0) { hudT = 0.2; hud(); }
        cam.x += (car.x + car.vx * 0.35 - cam.x) * Math.min(1, dt * 5);
        cam.y += (car.y + car.vy * 0.35 - cam.y) * Math.min(1, dt * 5);
      },
      dibujar(g) {
        g.fillStyle = mezclarColor(tema.fondo2, tema.primario, 0.18); g.fillRect(0, 0, W, H);
        g.save();
        g.translate(Math.round(W / 2 - cam.x), Math.round(H / 2 - cam.y));
        // textura del pasto
        const ox = Math.floor((cam.x - W) / 80) * 80, oy = Math.floor((cam.y - H) / 80) * 80;
        g.fillStyle = conAlfa("#000000", 0.06);
        for (let x = ox; x < cam.x + W; x += 80) for (let y = oy; y < cam.y + H; y += 80) if (((x + y) / 80) % 2 === 0) g.fillRect(x, y, 80, 80);
        for (const [x, y, k] of deco) {
          if (Math.abs(x - cam.x) > W || Math.abs(y - cam.y) > H) continue;
          g.fillStyle = mezclarColor(tema.primario, "#000000", 0.35); g.beginPath(); g.arc(x + 4, y + 6, 16 + k * 10, 0, 6.283); g.fill();
          g.fillStyle = mezclarColor(tema.primario, tema.fondo2, 0.2 + k * 0.3); g.beginPath(); g.arc(x, y, 16 + k * 10, 0, 6.283); g.fill();
        }
        const trazo = (w: number, color: string, guion?: number[]) => {
          g.strokeStyle = color; g.lineWidth = w; g.lineJoin = "round"; g.setLineDash(guion ?? []);
          g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke(); g.setLineDash([]);
        };
        trazo(ancho + 18, "#f2f2f2");
        trazo(ancho + 18, tema.peligro, [26, 26]);
        trazo(ancho, "#3b3b48");
        trazo(3, conAlfa("#ffffff", 0.35), [30, 30]);
        // marcas de derrape
        g.fillStyle = "rgba(10,10,14,.35)";
        for (const [x, y] of marcas) g.fillRect(x - 2.5, y - 2.5, 5, 5);
        // largada
        const [sx, sy] = pts[0], [tx, ty] = tang[0];
        g.save(); g.translate(sx, sy); g.rotate(Math.atan2(ty, tx));
        for (let k = 0; k < 10; k++) for (let j = 0; j < 2; j++) { g.fillStyle = (k + j) % 2 ? "#111" : "#fff"; g.fillRect(j * 10 - 10, -ancho / 2 + k * (ancho / 10), 10, ancho / 10); }
        g.restore();
        const auto = (x: number, y: number, ang: number, color: string, jugador: boolean) => {
          g.save(); g.translate(x, y); g.rotate(ang);
          g.fillStyle = "rgba(0,0,0,.35)"; rectRed(g, -19, -9, 42, 22, 6); g.fill();
          if (jugador) brillo(g, color, 14);
          g.fillStyle = color; rectRed(g, -21, -11, 42, 22, 7); g.fill(); sinBrillo(g);
          g.fillStyle = conAlfa("#000000", 0.55); rectRed(g, -6, -8, 14, 16, 3); g.fill();
          g.fillStyle = conAlfa("#ffffff", 0.35); g.fillRect(-18, -2, 10, 4);
          g.fillStyle = "#fff8c0"; g.fillRect(18, -9, 3, 5); g.fillRect(18, 4, 3, 5);
          g.restore();
        };
        for (const rv of rivales) auto(rv.x, rv.y, rv.ang, rv.color, false);
        if (car.boost > 0) { g.fillStyle = tema.acento; g.beginPath(); const fx = Math.cos(car.ang), fy = Math.sin(car.ang); g.arc(car.x - fx * 26, car.y - fy * 26, 6 + Math.random() * 5, 0, 6.283); g.fill(); }
        auto(car.x, car.y, car.ang, tema.secundario, true);
        g.restore();
        // minimapa
        const mm = 130, xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
        const minX = Math.min(...xs), minY = Math.min(...ys), esc = mm / Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY);
        g.fillStyle = conAlfa("#000000", 0.45); rectRed(g, W - mm - 24, 14, mm + 12, mm * 0.85 + 12, 10); g.fill();
        g.strokeStyle = conAlfa("#ffffff", 0.6); g.lineWidth = 3; g.beginPath();
        pts.forEach(([x, y], i) => { const px = W - mm - 18 + (x - minX) * esc, py = 20 + (y - minY) * esc * 0.85; i ? g.lineTo(px, py) : g.moveTo(px, py); });
        g.closePath(); g.stroke();
        for (const rv of rivales) { g.fillStyle = rv.color; g.beginPath(); g.arc(W - mm - 18 + (rv.x - minX) * esc, 20 + (rv.y - minY) * esc * 0.85, 3, 0, 6.283); g.fill(); }
        g.fillStyle = tema.secundario; g.beginPath(); g.arc(W - mm - 18 + (car.x - minX) * esc, 20 + (car.y - minY) * esc * 0.85, 4.5, 0, 6.283); g.fill();
        if (modo === 0 && salida <= 0) texto(g, `${posicion}º`, 56, 44, 42, posicion <= 3 ? tema.acento : tema.texto);
        if (modo === 2) { g.fillStyle = conAlfa("#000000", 0.4); rectRed(g, 20, H - 34, 220, 14, 7); g.fill(); g.fillStyle = tema.acento; rectRed(g, 20, H - 34, Math.max(14, 220 * Math.min(1, derrape / metaDerrape)), 14, 7); g.fill(); }
        if (fuera && !terminado) texto(g, "¡Volvé a la pista!", W / 2, H - 40, 20, tema.peligro);
      },
    };
  },
};

export default modulo;
