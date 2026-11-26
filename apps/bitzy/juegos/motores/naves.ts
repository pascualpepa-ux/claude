import { crearRng } from "@/lib/rng";
import { conAlfa, mezclarColor } from "@/lib/temas";
import { FondoTema, brillo, sinBrillo, texto } from "../runtime/dibujo";
import type { ModuloMotor } from "../runtime/tipos";

const W = 540;
const H = 720;

interface Bala { x: number; y: number; vx: number; vy: number; r: number; enemiga: boolean; dano: number }
interface Enemigo { x: number; y: number; vx: number; vy: number; hp: number; max: number; tipo: "zig" | "picada" | "torreta" | "tanque" | "meteoro" | "jefe"; t: number; r: number; base: number; fase: number }
interface Item { x: number; y: number; tipo: "P" | "S" | "B" | "$"; vy: number }

const modulo: ModuloMotor = {
  ancho: W,
  alto: H,
  tactil: "puntero",
  crear(api) {
    const { p, tema, rng } = api;
    const fondo = new FondoTema(tema, W, H, crearRng(p.semilla), 70);
    const modo = p.modo;
    const m = p.mult;
    const nave = { x: W / 2, y: H - 110, vidas: 3, inv: 2, arma: 1, escudo: 0, bombas: 2, cadencia: 0 };
    let balas: Bala[] = [];
    let enemigos: Enemigo[] = [];
    let items: Item[] = [];
    let oleada = 0;
    let jefesVencidos = 0;
    let pausaOleada = 1.5;
    let porSalir: { tipo: Enemigo["tipo"]; t: number; x: number }[] = [];
    let anim = 0;
    let fin = false;
    let tiempoMeteoros = 90;
    let monedas = 0;
    let ultimoPuntero: { x: number; y: number } | null = null;
    let flashBomba = 0;
    const metaJefes = modo === 2 ? 4 : 3;

    const hud = () => {
      const d = [{ etiqueta: "Vidas", valor: "♥".repeat(Math.max(0, nave.vidas)) || "0" }];
      if (modo === 1) { d.push({ etiqueta: "Tiempo", valor: String(Math.ceil(tiempoMeteoros)) }); d.push({ etiqueta: "Monedas", valor: String(monedas) }); }
      else { d.push({ etiqueta: modo === 2 ? "Jefe" : "Oleada", valor: modo === 2 ? `${jefesVencidos + 1}/${metaJefes}` : String(oleada) }); d.push({ etiqueta: "Bombas", valor: String(nave.bombas) }); }
      api.hud(d);
    };
    hud();

    const crearEnemigo = (tipo: Enemigo["tipo"], x: number): Enemigo => {
      const hpBase = { zig: 2, picada: 2, torreta: 5, tanque: 12, meteoro: 3, jefe: 0 }[tipo];
      const r = { zig: 16, picada: 15, torreta: 20, tanque: 26, meteoro: 14 + rng() * 22, jefe: 60 }[tipo];
      let hp = Math.ceil(hpBase * (0.8 + m * 0.3) * (1 + oleada * 0.06));
      if (tipo === "jefe") hp = Math.round((140 + jefesVencidos * 90) * (0.7 + m * 0.4));
      const vy = tipo === "meteoro" ? 140 + rng() * 160 * m : tipo === "jefe" ? 60 : 90 + rng() * 40 * m;
      return { x, y: tipo === "jefe" ? -80 : -30, vx: tipo === "meteoro" ? (rng() - 0.5) * 80 : 0, vy, hp, max: hp, tipo, t: 0, r, base: x, fase: rng() * 6 };
    };

    const prepararOleada = () => {
      oleada++;
      const esJefe = modo === 2 || oleada % 5 === 0;
      porSalir = [];
      if (esJefe) {
        porSalir.push({ tipo: "jefe", t: 0.5, x: W / 2 });
        api.aviso("¡JEFE!", tema.peligro);
        api.sonido.efecto("nivel");
      } else {
        const n = 6 + Math.floor(oleada * 1.4 * m);
        const tipos: Enemigo["tipo"][] = oleada < 2 ? ["zig"] : oleada < 4 ? ["zig", "picada"] : ["zig", "picada", "torreta", oleada > 6 ? "tanque" : "zig"];
        const formacion = Math.floor(rng() * 3);
        for (let i = 0; i < n; i++) {
          const tipo = tipos[Math.floor(rng() * tipos.length)];
          const x = formacion === 0 ? 60 + ((i * 97) % (W - 120)) : formacion === 1 ? W / 2 + Math.sin(i) * 180 : 60 + rng() * (W - 120);
          porSalir.push({ tipo, t: i * (0.55 - Math.min(0.3, oleada * 0.02)), x });
        }
        api.aviso(`Oleada ${oleada}`, tema.secundario);
      }
      hud();
    };

    const disparoEnemigo = (x: number, y: number, ang: number, vel = 220) => {
      balas.push({ x, y, vx: Math.cos(ang) * vel * (0.85 + m * 0.15), vy: Math.sin(ang) * vel * (0.85 + m * 0.15), r: 5, enemiga: true, dano: 1 });
    };

    const herirNave = () => {
      if (nave.inv > 0) return;
      if (nave.escudo > 0) { nave.escudo = 0; nave.inv = 1; api.sonido.efecto("rebote"); return; }
      nave.vidas--;
      nave.inv = 2;
      nave.arma = Math.max(1, nave.arma - 1);
      api.temblor(14);
      api.sonido.efecto("explosion");
      api.particulas.explotar(nave.x, nave.y, tema.primario, 40, 300, 4, 0);
      hud();
      if (nave.vidas <= 0) { fin = true; api.fin({ gano: false, mensaje: modo === 1 ? "Un meteorito te alcanzó." : `Caíste en la oleada ${oleada}.` }); }
    };

    const matar = (en: Enemigo) => {
      const pts = { zig: 20, picada: 30, torreta: 60, tanque: 120, meteoro: 15, jefe: 1500 }[en.tipo];
      api.sumar(Math.round(pts * (0.8 + m * 0.2)), en.x, en.y);
      api.particulas.explotar(en.x, en.y, en.tipo === "jefe" ? tema.acento : tema.peligro, en.tipo === "jefe" ? 120 : 22, en.tipo === "jefe" ? 420 : 220, 4, 0);
      api.sonido.efecto("explosion");
      api.temblor(en.tipo === "jefe" ? 22 : 4);
      const r = rng();
      if (en.tipo === "jefe") {
        jefesVencidos++;
        items.push({ x: en.x, y: en.y, tipo: "P", vy: 80 }, { x: en.x - 40, y: en.y, tipo: "S", vy: 80 });
        if (jefesVencidos >= metaJefes) { fin = true; api.fin({ gano: true, mensaje: `¡Derrotaste a ${metaJefes} jefes!` }); }
        else api.aviso("¡Jefe derrotado!", tema.acento);
        hud();
      } else if (r < 0.06) items.push({ x: en.x, y: en.y, tipo: "P", vy: 90 });
      else if (r < 0.09) items.push({ x: en.x, y: en.y, tipo: "S", vy: 90 });
      else if (r < 0.1) items.push({ x: en.x, y: en.y, tipo: "B", vy: 90 });
      else if (r < 0.3) items.push({ x: en.x, y: en.y, tipo: "$", vy: 110 });
    };

    return {
      actualizar(dt) {
        anim += dt;
        if (fin) { balas = balas.filter((b) => (b.y += b.vy * dt) > -20); return; }
        const e = api.entrada;
        // movimiento: teclado o arrastre relativo
        const vx = e.eje("izq", "der"), vy = e.eje("arriba", "abajo");
        nave.x += vx * 360 * dt;
        nave.y += vy * 360 * dt;
        if (e.puntero.abajo) {
          if (ultimoPuntero) { nave.x += (e.puntero.x - ultimoPuntero.x) * 1.3; nave.y += (e.puntero.y - ultimoPuntero.y) * 1.3; }
          ultimoPuntero = { x: e.puntero.x, y: e.puntero.y };
        } else ultimoPuntero = null;
        nave.x = Math.max(20, Math.min(W - 20, nave.x));
        nave.y = Math.max(60, Math.min(H - 30, nave.y));
        nave.inv = Math.max(0, nave.inv - dt);
        flashBomba = Math.max(0, flashBomba - dt * 2);

        // bomba
        if ((e.pulsado("a") || e.pulsado("b")) && nave.bombas > 0 && modo !== 1) {
          nave.bombas--;
          flashBomba = 1;
          balas = balas.filter((b) => !b.enemiga);
          for (const en of enemigos) { en.hp -= en.tipo === "jefe" ? 25 : 50; }
          api.sonido.efecto("explosion");
          api.temblor(18);
          hud();
        }

        // disparo automático
        if (modo !== 1) {
          nave.cadencia -= dt;
          if (nave.cadencia <= 0) {
            nave.cadencia = 0.14;
            const a = nave.arma;
            const angs = a === 1 ? [0] : a === 2 ? [-0.06, 0.06] : a === 3 ? [-0.18, 0, 0.18] : [-0.28, -0.1, 0.1, 0.28];
            for (const ang of angs) balas.push({ x: nave.x + ang * 40, y: nave.y - 24, vx: Math.sin(ang) * 700, vy: -Math.cos(ang) * 700, r: 4, enemiga: false, dano: 1 });
            if (Math.floor(anim * 7) % 2 === 0) api.sonido.efecto("disparo");
          }
        }

        // oleadas
        if (modo === 1) {
          tiempoMeteoros -= dt;
          if (Math.ceil(tiempoMeteoros) !== Math.ceil(tiempoMeteoros + dt)) hud();
          if (tiempoMeteoros <= 0) { fin = true; api.fin({ gano: true, mensaje: `¡Sobreviviste! Juntaste ${monedas} monedas.` }); return; }
          const ritmo = (0.5 - Math.min(0.32, (90 - tiempoMeteoros) * 0.004)) / m;
          if (rng() < dt / ritmo) enemigos.push(crearEnemigo("meteoro", 20 + rng() * (W - 40)));
          if (rng() < dt * 0.9) items.push({ x: 30 + rng() * (W - 60), y: -20, tipo: "$", vy: 140 });
        } else {
          if (!porSalir.length && !enemigos.length) {
            pausaOleada -= dt;
            if (pausaOleada <= 0) { pausaOleada = 1.8; prepararOleada(); }
          }
          for (const s of porSalir) s.t -= dt;
          for (const s of porSalir.filter((s) => s.t <= 0)) enemigos.push(crearEnemigo(s.tipo, s.x));
          porSalir = porSalir.filter((s) => s.t > 0);
        }

        // enemigos
        for (const en of enemigos) {
          en.t += dt;
          switch (en.tipo) {
            case "zig": en.y += en.vy * dt; en.x = en.base + Math.sin(en.t * 2 + en.fase) * 80; if (rng() < dt * 0.25 * m) disparoEnemigo(en.x, en.y, Math.PI / 2); break;
            case "picada":
              if (en.t < 1) en.y += en.vy * dt;
              else { const a = Math.atan2(nave.y - en.y, nave.x - en.x); if (en.t < 1.1) { en.vx = Math.cos(a) * 300 * (0.8 + m * 0.2); en.vy = Math.sin(a) * 300; } en.x += en.vx * dt; en.y += en.vy * dt; }
              break;
            case "torreta":
              if (en.y < 120 + (en.base % 100)) en.y += en.vy * dt;
              else if (en.t % (1.6 / m) < dt) { const a = Math.atan2(nave.y - en.y, nave.x - en.x); for (const d of [-0.25, 0, 0.25]) disparoEnemigo(en.x, en.y, a + d); }
              if (en.t > 9) en.y += 120 * dt;
              break;
            case "tanque": en.y += en.vy * 0.5 * dt; if (en.t % (1.1 / m) < dt) disparoEnemigo(en.x, en.y + 20, Math.atan2(nave.y - en.y, nave.x - en.x), 260); break;
            case "meteoro": en.x += en.vx * dt; en.y += en.vy * dt; break;
            case "jefe": {
              if (en.y < 130) { en.y += en.vy * dt; break; }
              en.x = W / 2 + Math.sin(en.t * 0.8) * (W / 2 - 90);
              const fase = Math.floor(en.t / 4) % 3;
              const furia = en.hp < en.max / 2 ? 1.5 : 1;
              const cad = (fase === 0 ? 0.9 : fase === 1 ? 0.12 : 0.5) / m / furia;
              if (en.t % cad < dt) {
                if (fase === 0) for (let i = -3; i <= 3; i++) disparoEnemigo(en.x, en.y + 40, Math.PI / 2 + i * 0.2, 200);
                else if (fase === 1) disparoEnemigo(en.x, en.y + 40, en.t * 5, 190);
                else disparoEnemigo(en.x, en.y + 40, Math.atan2(nave.y - en.y, nave.x - en.x), 300);
              }
            }
          }
          if (Math.hypot(en.x - nave.x, en.y - nave.y) < en.r + 12) { herirNave(); if (en.tipo !== "jefe") en.hp = 0; }
        }
        // balas
        for (const b of balas) {
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.enemiga) { if (Math.hypot(b.x - nave.x, b.y - nave.y) < b.r + 8) { herirNave(); b.y = -999; } }
          else for (const en of enemigos) {
            if (en.hp > 0 && en.tipo !== "meteoro" && Math.hypot(b.x - en.x, b.y - en.y) < en.r + b.r) {
              en.hp -= b.dano;
              api.particulas.explotar(b.x, b.y, tema.acento, 2, 80, 2, 0);
              b.y = -999;
              break;
            }
          }
        }
        for (const en of enemigos) if (en.hp <= 0 && en.y > -900) { if (en.tipo !== "meteoro" || en.max !== en.hp) matar(en); en.y = -999; }
        if (fin) return;
        enemigos = enemigos.filter((en) => en.y > -100 && en.y < H + 60 && en.x > -80 && en.x < W + 80);
        balas = balas.filter((b) => b.y > -20 && b.y < H + 20 && b.x > -20 && b.x < W + 20);
        // ítems
        for (const it of items) {
          it.y += it.vy * dt;
          if (Math.hypot(it.x - nave.x, it.y - nave.y) < 30) {
            it.y = H + 99;
            if (it.tipo === "P") { nave.arma = Math.min(4, nave.arma + 1); api.aviso("¡Arma mejorada!", tema.secundario); api.sonido.efecto("mejora"); }
            else if (it.tipo === "S") { nave.escudo = 1; api.aviso("Escudo", tema.primario); api.sonido.efecto("mejora"); }
            else if (it.tipo === "B") { nave.bombas++; api.sonido.efecto("mejora"); hud(); }
            else { monedas++; api.sumar(modo === 1 ? 25 : 10, it.x, it.y); api.sonido.efecto("moneda"); if (modo === 1) hud(); }
          }
        }
        items = items.filter((it) => it.y < H + 30);
        if (modo === 1) api.fijarPuntos(Math.max(api.puntos, Math.floor((90 - tiempoMeteoros) * 5) + monedas * 25));
      },
      dibujar(g) {
        fondo.dibujar(g, anim * 3);
        // líneas de velocidad
        g.strokeStyle = conAlfa(tema.primario, 0.08);
        for (let i = 0; i < 12; i++) { const x = (i * 53) % W, y = ((anim * 400 + i * 97) % (H + 80)) - 80; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 60); g.stroke(); }
        for (const it of items) {
          const col = it.tipo === "$" ? tema.acento : it.tipo === "P" ? tema.secundario : it.tipo === "S" ? tema.primario : tema.peligro;
          brillo(g, col, 12); g.fillStyle = col;
          g.beginPath(); g.arc(it.x, it.y, it.tipo === "$" ? 8 : 13, 0, 6.283); g.fill(); sinBrillo(g);
          if (it.tipo !== "$") texto(g, it.tipo, it.x, it.y + 1, 14, tema.fondo);
        }
        for (const en of enemigos) {
          g.save(); g.translate(en.x, en.y);
          if (en.tipo === "meteoro") {
            g.rotate(en.t * 1.5 + en.fase);
            g.fillStyle = mezclarColor(tema.fondo2, tema.texto, 0.35);
            g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283, rr = en.r * (0.8 + ((i * 7 + Math.floor(en.fase * 10)) % 5) * 0.06); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.fill();
            g.fillStyle = conAlfa("#000000", 0.2); g.beginPath(); g.arc(en.r * 0.2, -en.r * 0.2, en.r * 0.25, 0, 6.283); g.fill();
          } else if (en.tipo === "jefe") {
            brillo(g, tema.peligro, 20);
            g.fillStyle = tema.peligro;
            g.beginPath(); g.moveTo(-80, -20); g.lineTo(80, -20); g.lineTo(60, 30); g.lineTo(20, 45); g.lineTo(-20, 45); g.lineTo(-60, 30); g.fill();
            sinBrillo(g);
            g.fillStyle = mezclarColor(tema.peligro, "#000000", 0.4); g.fillRect(-50, -10, 100, 18);
            g.fillStyle = tema.acento; g.beginPath(); g.arc(0, 8, 10 + Math.sin(anim * 8) * 2, 0, 6.283); g.fill();
            g.restore();
            g.fillStyle = conAlfa("#000000", 0.5); g.fillRect(40, 20, W - 80, 10);
            g.fillStyle = tema.peligro; g.fillRect(40, 20, (W - 80) * Math.max(0, en.hp / en.max), 10);
            continue;
          } else {
            const col = en.tipo === "tanque" ? mezclarColor(tema.peligro, tema.fondo2, 0.3) : en.tipo === "torreta" ? tema.secundario : tema.peligro;
            g.fillStyle = col;
            g.beginPath(); g.moveTo(0, en.r); g.lineTo(en.r, -en.r * 0.4); g.lineTo(en.r * 0.4, -en.r); g.lineTo(-en.r * 0.4, -en.r); g.lineTo(-en.r, -en.r * 0.4); g.closePath(); g.fill();
            g.fillStyle = conAlfa("#ffffff", 0.7); g.beginPath(); g.arc(0, -2, en.r * 0.25, 0, 6.283); g.fill();
            if (en.hp < en.max) { g.fillStyle = "#0008"; g.fillRect(-en.r, -en.r - 8, en.r * 2, 3); g.fillStyle = tema.acento; g.fillRect(-en.r, -en.r - 8, en.r * 2 * (en.hp / en.max), 3); }
          }
          g.restore();
        }
        for (const b of balas) {
          g.fillStyle = b.enemiga ? tema.peligro : tema.acento;
          if (b.enemiga) { brillo(g, tema.peligro, 10); g.beginPath(); g.arc(b.x, b.y, b.r, 0, 6.283); g.fill(); }
          else g.fillRect(b.x - 2, b.y - 8, 4, 14);
        }
        sinBrillo(g);
        // nave
        if (!fin && !(nave.inv > 0 && Math.floor(anim * 16) % 2)) {
          g.save(); g.translate(nave.x, nave.y);
          g.fillStyle = tema.acento; g.globalAlpha = 0.6 + Math.random() * 0.4;
          g.beginPath(); g.moveTo(-7, 18); g.lineTo(0, 30 + Math.random() * 12); g.lineTo(7, 18); g.fill(); g.globalAlpha = 1;
          brillo(g, tema.primario, 16);
          g.fillStyle = tema.primario;
          g.beginPath(); g.moveTo(0, -26); g.lineTo(20, 18); g.lineTo(0, 10); g.lineTo(-20, 18); g.closePath(); g.fill();
          sinBrillo(g);
          g.fillStyle = tema.secundario; g.beginPath(); g.arc(0, -2, 5, 0, 6.283); g.fill();
          if (nave.escudo) { g.strokeStyle = conAlfa(tema.primario, 0.6 + Math.sin(anim * 8) * 0.3); g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 32, 0, 6.283); g.stroke(); }
          g.restore();
        }
        if (flashBomba > 0) { g.fillStyle = conAlfa("#ffffff", flashBomba * 0.5); g.fillRect(0, 0, W, H); }
      },
    };
  },
};

export default modulo;
