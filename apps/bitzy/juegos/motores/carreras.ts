import { crearRng } from "@/lib/rng";
import { conAlfa, mezclarColor } from "@/lib/temas";
import { brillo, rectRed, sinBrillo, texto } from "../runtime/dibujo";
import type { ModuloMotor } from "../runtime/tipos";

const W = 800;
const H = 450;
const SEG = 200;
const ANCHO_RUTA = 2000;
const VISIBLES = 170;
const ALTURA_CAM = 1000;
const PROF_CAM = 1 / Math.tan(((100 / 2) * Math.PI) / 180);
const RUMBLE = 3;

interface Segmento { i: number; curva: number; y1: number; y2: number; deco: { x: number; tipo: number } | null; control: boolean }
interface Auto { z: number; x: number; vel: number; color: string; rival: boolean; vueltas: number }

const modulo: ModuloMotor = {
  ancho: W,
  alto: H,
  tactil: "lados",
  crear(api) {
    const { p, tema, rng } = api;
    const r = crearRng(p.semilla + p.mapa * 991);
    const segs: Segmento[] = [];
    let alt = 0;
    const agregar = (n: number, curva: number, subida: number) => {
      for (let i = 0; i < n; i++) {
        const t = n > 1 ? i / (n - 1) : 1;
        const suav = (Math.sin((t - 0.5) * Math.PI) + 1) / 2;
        const y1 = alt;
        alt += (subida * 30 * Math.sin(t * Math.PI)) / Math.max(1, n / 20);
        const decorar = segs.length % 6 === 0 && r() < 0.8;
        segs.push({ i: segs.length, curva: curva * (t < 0.2 ? t * 5 : t > 0.8 ? (1 - t) * 5 : 1) * (0.6 + 0.4 * suav), y1, y2: alt, deco: decorar ? { x: (r() < 0.5 ? -1 : 1) * (1.4 + r() * 1.6), tipo: Math.floor(r() * 3) } : null, control: false });
      }
    };
    agregar(40, 0, 0);
    const tramos = 14 + p.mapa * 2;
    for (let k = 0; k < tramos; k++) {
      const tipo = r();
      const largo = 40 + Math.floor(r() * 60);
      if (tipo < 0.3) agregar(largo, 0, (r() - 0.5) * 4);
      else agregar(largo, (r() < 0.5 ? -1 : 1) * (2 + r() * 4) * (0.8 + p.dificultad * 0.1), (r() - 0.5) * 3);
    }
    agregar(60, 0, 0);
    // cerrar el circuito en altura
    const total = segs.length;
    for (const s of segs) { const corr = (alt * s.i) / total; s.y1 -= corr; s.y2 -= corr + alt / total; }
    for (let i = 100; i < total; i += 150) segs[i].control = true;
    const largoPista = total * SEG;

    const modo = p.modo;
    const velMax = SEG * 60 * (0.85 + p.velocidad * 0.15);
    const vueltasMeta = modo === 1 ? 3 : 1;
    const jug = { z: 0, x: 0, vel: 0, nitro: 3, boost: 0, vueltas: 0, choque: 0 };
    let reloj = modo === 2 ? 40 : 32 - p.dificultad * 2;
    let distTotal = 0;
    let anim = 0;
    let terminado = false;
    let posicion = 8;
    let ultimoControl = -1;
    const autos: Auto[] = [];
    const coloresAutos = [tema.peligro, tema.acento, tema.primario, mezclarColor(tema.secundario, tema.peligro, 0.5), "#e6e6e6", mezclarColor(tema.acento, tema.peligro, 0.5)];
    if (modo === 1) for (let i = 0; i < 7; i++) autos.push({ z: (i + 1) * SEG * 6, x: (i % 2 ? -0.5 : 0.5), vel: velMax * (0.72 + 0.03 * i) * (0.85 + p.mult * 0.12), color: coloresAutos[i % coloresAutos.length], rival: true, vueltas: 0 });
    const trafico = modo === 2 ? 34 + p.dificultad * 6 : 12 + p.dificultad * 3;
    for (let i = 0; i < trafico; i++) autos.push({ z: (2000 + rng() * (largoPista - 4000)), x: (Math.floor(rng() * 3) - 1) * 0.6, vel: velMax * (0.25 + rng() * 0.3), color: coloresAutos[Math.floor(rng() * coloresAutos.length)], rival: false, vueltas: 0 });

    const segDe = (z: number) => segs[Math.floor((((z % largoPista) + largoPista) % largoPista) / SEG)];

    const hud = () => {
      const d = [{ etiqueta: "Velocidad", valor: `${Math.round((jug.vel / velMax) * 280)} km/h` }];
      if (modo === 1) { d.push({ etiqueta: "Vuelta", valor: `${Math.min(vueltasMeta, jug.vueltas + 1)}/${vueltasMeta}` }); d.push({ etiqueta: "Puesto", valor: `${posicion}º` }); }
      else d.push({ etiqueta: "Tiempo", valor: String(Math.max(0, Math.ceil(reloj))) });
      if (modo === 2) d.push({ etiqueta: "Km", valor: (distTotal / (SEG * 50)).toFixed(1) });
      d.push({ etiqueta: "Nitro", valor: "⚡".repeat(jug.nitro) || "—" });
      api.hud(d);
    };
    let hudT = 0;

    const proyectar = (x: number, y: number, z: number, camX: number, camY: number, camZ: number) => {
      const escala = PROF_CAM / Math.max(0.1, z - camZ);
      return { x: Math.round(W / 2 + escala * (x - camX) * (W / 2)), y: Math.round(H / 2 - escala * (y - camY) * (H / 2)), w: Math.round(escala * ANCHO_RUTA * (W / 2)), escala };
    };

    return {
      actualizar(dt) {
        anim += dt;
        if (terminado) { jug.vel *= 0.98; jug.z += jug.vel * dt; return; }
        const e = api.entrada;
        const pct = jug.vel / velMax;
        const frena = e.presionado("abajo") || e.presionado("b");
        const fueraDeRuta = Math.abs(jug.x) > 1;
        if (e.pulsado("a") && jug.nitro > 0 && jug.boost <= 0) { jug.nitro--; jug.boost = 2.2; api.sonido.efecto("mejora"); hud(); }
        jug.boost = Math.max(0, jug.boost - dt);
        jug.choque = Math.max(0, jug.choque - dt);
        const tope = velMax * (jug.boost > 0 ? 1.35 : 1) * (fueraDeRuta ? 0.45 : 1);
        if (frena) jug.vel -= velMax * 1.6 * dt;
        else jug.vel += velMax * 0.55 * dt * (1 - pct * 0.6);
        if (jug.vel > tope) jug.vel -= velMax * (fueraDeRuta ? 2 : 0.8) * dt;
        jug.vel = Math.max(0, jug.vel);
        const seg = segDe(jug.z);
        const dir = e.eje("izq", "der");
        jug.x += dir * dt * 2.4 * Math.min(1, pct * 1.6);
        jug.x -= seg.curva * pct * pct * dt * 0.42; // fuerza centrífuga
        jug.x = Math.max(-2.6, Math.min(2.6, jug.x));
        if (fueraDeRuta && pct > 0.3) api.temblor(2);
        const antes = jug.z;
        jug.z += jug.vel * dt;
        distTotal += jug.vel * dt;
        if (Math.floor(jug.z / largoPista) > Math.floor(antes / largoPista)) {
          jug.vueltas++;
          if (jug.vueltas >= vueltasMeta && modo !== 2) {
            terminado = true;
            if (modo === 1) api.fin({ gano: posicion <= 3, mensaje: posicion <= 3 ? `¡Terminaste ${posicion}º, al podio!` : `Terminaste ${posicion}º. Necesitabas el podio.` });
            else { api.sumar(Math.round(reloj * 100)); api.fin({ gano: true, mensaje: "¡Llegaste a la meta a tiempo!" }); }
            return;
          }
          if (modo === 1) { api.aviso(jug.vueltas === vueltasMeta - 1 ? "¡Última vuelta!" : `Vuelta ${jug.vueltas + 1}`, tema.acento); api.sonido.efecto("nivel"); }
        }
        // puntos de control
        const sAct = Math.floor(((jug.z % largoPista) + largoPista) % largoPista / SEG);
        if (segs[sAct].control && sAct !== ultimoControl && modo !== 1) {
          ultimoControl = sAct;
          const extra = modo === 2 ? 14 - p.dificultad : 16 - p.dificultad * 1.5;
          reloj += extra;
          api.aviso(`+${Math.round(extra)} s`, tema.acento);
          api.sonido.efecto("moneda");
        }
        if (modo !== 1) {
          reloj -= dt;
          if (reloj <= 0) { terminado = true; api.fin({ gano: false, mensaje: "Se acabó el tiempo." }); return; }
          if (modo === 2 && distTotal / (SEG * 50) >= 20) { terminado = true; api.fin({ gano: true, mensaje: "¡Recorriste 20 km entre el tráfico!" }); return; }
        }
        // autos
        for (const a of autos) {
          const antesA = a.z;
          if (a.rival) {
            const sa = segDe(a.z);
            a.x += (-sa.curva * 0.02 - a.x * 0.5) * dt;
            // esquivar al de adelante
            for (const b of autos) if (b !== a && b.z > a.z && b.z - a.z < SEG * 3 && Math.abs(b.x - a.x) < 0.5) a.x += (a.x > b.x ? 1 : -1) * dt * 1.2;
            a.x = Math.max(-0.8, Math.min(0.8, a.x));
          }
          a.z += a.vel * dt;
          if (a.rival && Math.floor(a.z / largoPista) > Math.floor(antesA / largoPista)) a.vueltas++;
          if (!a.rival) a.z = ((a.z % largoPista) + largoPista) % largoPista;
          // choque con el jugador
          const dz = ((a.z - jug.z) % largoPista + largoPista) % largoPista;
          if ((dz < SEG * 0.6 || dz > largoPista - SEG * 0.2) && Math.abs(a.x - jug.x) < 0.42 && jug.vel > a.vel && jug.choque <= 0) {
            jug.vel = a.vel * 0.7;
            jug.choque = 0.6;
            jug.x += jug.x > a.x ? 0.25 : -0.25;
            api.temblor(10);
            api.sonido.efecto("golpe");
            api.particulas.explotar(W / 2, H - 70, a.color, 14, 220, 4);
          }
        }
        if (modo === 1) {
          const progJ = jug.vueltas * largoPista + (jug.z % largoPista);
          posicion = 1 + autos.filter((a) => a.rival && a.z > progJ).length;
        }
        api.fijarPuntos(Math.floor(distTotal / 100) + (modo === 1 ? (9 - posicion) * 50 : 0));
        hudT -= dt;
        if (hudT <= 0) { hudT = 0.15; hud(); }
      },
      dibujar(g) {
        // cielo
        const cielo = g.createLinearGradient(0, 0, 0, H / 2);
        cielo.addColorStop(0, tema.fondo); cielo.addColorStop(1, tema.fondo2);
        g.fillStyle = cielo; g.fillRect(0, 0, W, H);
        const base = segDe(jug.z);
        const desfaseCielo = (base.i / segs.length) * W * 3;
        g.fillStyle = conAlfa(tema.acento, 0.85);
        brillo(g, tema.acento, 40); g.beginPath(); g.arc(W * 0.72 - (desfaseCielo * 0.05) % W, 90, 34, 0, 6.283); g.fill(); sinBrillo(g);
        g.fillStyle = mezclarColor(tema.fondo2, tema.primario, 0.25);
        g.beginPath(); g.moveTo(0, H / 2 + 20);
        for (let x = 0; x <= W; x += 40) g.lineTo(x, H / 2 - 10 - Math.abs(Math.sin((x + desfaseCielo * 0.3) * 0.012)) * 60);
        g.lineTo(W, H / 2 + 20); g.fill();

        const zBase = jug.z % largoPista;
        const baseI = Math.floor(zBase / SEG);
        const pctSeg = (zBase % SEG) / SEG;
        const camY = ALTURA_CAM + base.y1 + (base.y2 - base.y1) * pctSeg;
        let x = 0, dx = -base.curva * pctSeg;
        let maxY = H;
        const proyectados: { y: number; cx: number; w: number; escala: number; s: Segmento; clip: number }[] = [];
        for (let n = 0; n < VISIBLES; n++) {
          const s = segs[(baseI + n) % segs.length];
          const vuelta = baseI + n >= segs.length ? largoPista : 0;
          const p1 = proyectar(0, s.y1, s.i * SEG + vuelta, jug.x * ANCHO_RUTA - x, camY, zBase);
          const p2 = proyectar(0, s.y2, (s.i + 1) * SEG + vuelta, jug.x * ANCHO_RUTA - x - dx, camY, zBase);
          x += dx; dx += s.curva;
          const p1x = p1.x, p2x = p2.x;
          proyectados.push({ y: p1.y, cx: p1x, w: p1.w, escala: p1.escala, s, clip: maxY });
          if (p1.escala <= 0 || p2.y >= maxY || p2.y >= p1.y) continue;
          const oscuro = Math.floor(s.i / RUMBLE) % 2 === 0;
          const pasto = oscuro ? mezclarColor(tema.fondo2, tema.primario, 0.3) : mezclarColor(tema.fondo2, tema.primario, 0.22);
          g.fillStyle = pasto; g.fillRect(0, p2.y, W, p1.y - p2.y + 1);
          const poli = (ax: number, ay: number, aw: number, bx: number, by: number, bw: number, color: string) => { g.fillStyle = color; g.beginPath(); g.moveTo(ax - aw, ay); g.lineTo(ax + aw, ay); g.lineTo(bx + bw, by); g.lineTo(bx - bw, by); g.fill(); };
          poli(p1x, p1.y, p1.w * 1.15, p2x, p2.y, p2.w * 1.15, oscuro ? tema.peligro : "#f2f2f2");
          poli(p1x, p1.y, p1.w, p2x, p2.y, p2.w, s.control ? conAlfa(tema.acento, 0.8) : oscuro ? "#3a3a46" : "#40404c");
          if (oscuro) for (const carril of [-1 / 3, 1 / 3]) poli(p1x + p1.w * carril * 2, p1.y, p1.w * 0.02, p2x + p2.w * carril * 2, p2.y, p2.w * 0.02, "#d8d8d8");
          maxY = p2.y;
        }
        // objetos de atrás para adelante
        for (let n = proyectados.length - 1; n >= 0; n--) {
          const pr = proyectados[n];
          if (pr.escala <= 0 || pr.y > H + 50) continue;
          const s = pr.s;
          g.save();
          g.beginPath(); g.rect(0, 0, W, pr.clip); g.clip();
          if (s.deco) {
            const sx = pr.cx + pr.w * s.deco.x;
            const tam = pr.w * 0.5;
            if (tam > 1) {
              if (s.deco.tipo === 0) { g.fillStyle = mezclarColor(tema.primario, "#000000", 0.3); g.beginPath(); g.moveTo(sx, pr.y - tam * 1.6); g.lineTo(sx + tam * 0.5, pr.y); g.lineTo(sx - tam * 0.5, pr.y); g.fill(); }
              else if (s.deco.tipo === 1) { g.fillStyle = mezclarColor(tema.secundario, "#000000", 0.2); g.fillRect(sx - tam * 0.06, pr.y - tam * 1.4, tam * 0.12, tam * 1.4); g.fillStyle = tema.acento; g.fillRect(sx - tam * 0.25, pr.y - tam * 1.5, tam * 0.5, tam * 0.15); }
              else { g.fillStyle = conAlfa(tema.primario, 0.7); g.beginPath(); g.arc(sx, pr.y - tam * 0.4, tam * 0.45, 0, 6.283); g.fill(); }
            }
          }
          for (const a of autos) {
            const za = ((a.z % largoPista) + largoPista) % largoPista;
            if (Math.floor(za / SEG) !== s.i) continue;
            const ax = pr.cx + pr.w * a.x;
            const aw = pr.w * 0.32, ah = aw * 0.55;
            if (aw < 2) continue;
            g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(ax - aw / 2, pr.y - ah * 0.15, aw, ah * 0.2);
            g.fillStyle = a.color; rectRed(g, ax - aw / 2, pr.y - ah, aw, ah * 0.85, aw * 0.12); g.fill();
            g.fillStyle = conAlfa("#000000", 0.45); g.fillRect(ax - aw * 0.32, pr.y - ah * 0.95, aw * 0.64, ah * 0.3);
            g.fillStyle = "#ff3355"; g.fillRect(ax - aw * 0.45, pr.y - ah * 0.45, aw * 0.15, ah * 0.12); g.fillRect(ax + aw * 0.3, pr.y - ah * 0.45, aw * 0.15, ah * 0.12);
          }
          g.restore();
        }
        // auto del jugador
        const bote = Math.sin(anim * 30) * (jug.vel / velMax) * 1.5;
        const inclin = api.entrada.eje("izq", "der") * 0.06;
        g.save(); g.translate(W / 2, H - 60 + bote); g.rotate(inclin);
        if (jug.boost > 0) { brillo(g, tema.acento, 30); g.fillStyle = tema.acento; g.beginPath(); g.moveTo(-30, 18); g.lineTo(-20, 40 + Math.random() * 20); g.lineTo(-10, 18); g.moveTo(10, 18); g.lineTo(20, 40 + Math.random() * 20); g.lineTo(30, 18); g.fill(); sinBrillo(g); }
        g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(-62, 14, 124, 10);
        brillo(g, tema.secundario, 14); g.fillStyle = tema.secundario; rectRed(g, -60, -20, 120, 38, 10); g.fill(); sinBrillo(g);
        g.fillStyle = mezclarColor(tema.secundario, "#000000", 0.4); rectRed(g, -40, -40, 80, 26, 8); g.fill();
        g.fillStyle = conAlfa("#ffffff", 0.3); g.fillRect(-34, -36, 68, 8);
        g.fillStyle = "#111"; g.fillRect(-66, 0, 16, 22); g.fillRect(50, 0, 16, 22);
        g.fillStyle = "#ff3355"; g.fillRect(-54, -10, 18, 8); g.fillRect(36, -10, 18, 8);
        g.restore();
        // velocímetro
        const pct = jug.vel / velMax;
        g.strokeStyle = conAlfa("#ffffff", 0.15); g.lineWidth = 8; g.beginPath(); g.arc(70, H - 50, 34, Math.PI * 0.75, Math.PI * 2.25); g.stroke();
        g.strokeStyle = jug.boost > 0 ? tema.acento : tema.primario; g.beginPath(); g.arc(70, H - 50, 34, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * Math.min(1.3, pct) / 1.3)); g.stroke();
        texto(g, String(Math.round(pct * 280)), 70, H - 52, 18, tema.texto);
        if (modo === 1 && !terminado) texto(g, `${posicion}º`, W - 60, 40, 40, posicion <= 3 ? tema.acento : tema.texto);
      },
    };
  },
};

export default modulo;
