import { crearRng, type Rng } from "@/lib/rng";
import { conAlfa, mezclarColor } from "@/lib/temas";
import { FondoTema, brillo, rectRed, sinBrillo, texto } from "../runtime/dibujo";
import type { ModuloMotor } from "../runtime/tipos";

const W = 800;
const H = 510;
const CW = 50;
const COLS = 16;
const FILAS = 9;
const BARRA = FILAS * CW; // y donde empieza la barra inferior

type TipoTorre = "canon" | "hielo" | "rayo";
const TORRES: Record<TipoTorre, { nombre: string; costo: number; dano: number; cad: number; rango: number; color: "primario" | "secundario" | "acento" }> = {
  canon: { nombre: "Cañón", costo: 50, dano: 3, cad: 0.9, rango: 125, color: "primario" },
  hielo: { nombre: "Hielo", costo: 60, dano: 0.8, cad: 0.7, rango: 105, color: "secundario" },
  rayo: { nombre: "Rayo", costo: 90, dano: 1.1, cad: 0.22, rango: 145, color: "acento" },
};

interface Torre { c: number; f: number; tipo: TipoTorre; nivel: number; t: number; ang: number }
interface Enemigo { d: number; hp: number; max: number; vel: number; lento: number; tipo: "normal" | "rapido" | "tanque" | "jefe"; oro: number }
interface Disparo { x: number; y: number; tx: number; ty: number; vida: number; color: string }

function camino(rng: Rng): [number, number][] {
  const celdas: [number, number][] = [];
  let f = 1 + Math.floor(rng() * (FILAS - 2));
  let c = 0;
  celdas.push([c, f]);
  while (c < COLS - 1) {
    const tramo = Math.min(COLS - 1 - c, 2 + Math.floor(rng() * 3));
    for (let i = 0; i < tramo; i++) { c++; celdas.push([c, f]); }
    if (c >= COLS - 1) break;
    let nf = f;
    while (Math.abs(nf - f) < 2) nf = 1 + Math.floor(rng() * (FILAS - 2));
    const paso = nf > f ? 1 : -1;
    while (f !== nf) { f += paso; celdas.push([c, f]); }
  }
  return celdas;
}

const modulo: ModuloMotor = {
  ancho: W,
  alto: H,
  tactil: "puntero",
  crear(api) {
    const { p, tema, rng } = api;
    const fondo = new FondoTema(tema, W, H, crearRng(p.semilla), 30);
    const ruta = camino(crearRng(p.semilla + p.mapa * 17));
    const enRuta = new Set(ruta.map(([c, f]) => `${c},${f}`));
    const largo = ruta.length - 1;
    const totalOleadas = [15, 12, 10][p.modo];
    let oro = [140, 90, 160][p.modo];
    let vidas = p.modo === 2 ? 10 : 20;
    let oleada = 0;
    let porSalir: Enemigo[] = [];
    let relojSalida = 0;
    let enemigos: Enemigo[] = [];
    const torres: Torre[] = [];
    let disparos: Disparo[] = [];
    let elegido: TipoTorre | null = "canon";
    let seleccion: Torre | null = null;
    let espera = 10;
    let rapido = false;
    let anim = 0;
    let terminado = false;
    // decoración: rocas/árboles fuera del camino
    const deco: [number, number, number][] = [];
    const dr = crearRng(p.semilla + 5);
    for (let i = 0; i < 14; i++) { const c = Math.floor(dr() * COLS), f = Math.floor(dr() * FILAS); if (!enRuta.has(`${c},${f}`)) deco.push([c, f, dr()]); }
    const decoSet = new Set(deco.map(([c, f]) => `${c},${f}`));

    const pos = (d: number) => {
      const i = Math.min(largo - 1, Math.floor(d));
      const t = Math.min(1, d - i);
      const [c1, f1] = ruta[i], [c2, f2] = ruta[i + 1];
      return { x: (c1 + (c2 - c1) * t) * CW + CW / 2, y: (f1 + (f2 - f1) * t) * CW + CW / 2 };
    };

    const hud = () => api.hud([
      { etiqueta: "Oleada", valor: `${oleada}/${totalOleadas}` },
      { etiqueta: "Vidas", valor: String(vidas) },
      { etiqueta: "Oro", valor: String(oro) },
    ]);
    hud();

    const lanzarOleada = () => {
      if (oleada >= totalOleadas || porSalir.length) return;
      oleada++;
      const fuerza = Math.pow(1.19, oleada) * (0.75 + p.mult * 0.35) * (p.modo === 2 ? 1.2 : 1);
      const n = 7 + oleada * 2 + (p.modo === 2 ? 4 : 0);
      porSalir = [];
      for (let i = 0; i < n; i++) {
        const r = rng();
        const tipo: Enemigo["tipo"] = oleada > 2 && r < 0.25 ? "rapido" : oleada > 4 && r < 0.4 ? "tanque" : "normal";
        const hp = { normal: 5, rapido: 3, tanque: 14, jefe: 0 }[tipo] * fuerza;
        porSalir.push({ d: 0, hp, max: hp, vel: { normal: 1.3, rapido: 2.3, tanque: 0.8, jefe: 0.6 }[tipo] * (0.9 + p.velocidad * 0.1), lento: 0, tipo, oro: { normal: 5, rapido: 4, tanque: 12, jefe: 0 }[tipo] });
      }
      if (oleada % 5 === 0) { const hp = 90 * fuerza; porSalir.push({ d: 0, hp, max: hp, vel: 0.6, lento: 0, tipo: "jefe", oro: 80 }); }
      relojSalida = 0;
      espera = 14;
      api.aviso(oleada % 5 === 0 ? `Oleada ${oleada}: ¡jefe!` : `Oleada ${oleada}`, oleada % 5 === 0 ? tema.peligro : tema.acento);
      api.sonido.efecto("nivel");
      hud();
    };

    // Botones de la barra inferior
    const botones = () => {
      const b: { x: number; w: number; id: string; texto: string; activo: boolean; color: string }[] = [];
      let x = 8;
      for (const t of Object.keys(TORRES) as TipoTorre[]) {
        b.push({ x, w: 128, id: t, texto: `${TORRES[t].nombre} ${TORRES[t].costo}`, activo: elegido === t && !seleccion, color: tema[TORRES[t].color] });
        x += 134;
      }
      if (seleccion) {
        const costo = TORRES[seleccion.tipo].costo * (seleccion.nivel + 1);
        if (seleccion.nivel < 3) b.push({ x: 420, w: 130, id: "mejorar", texto: `Mejorar ${costo}`, activo: oro >= costo, color: tema.acento });
        b.push({ x: 556, w: 90, id: "vender", texto: `Vender`, activo: true, color: tema.peligro });
      } else {
        b.push({ x: 420, w: 130, id: "oleada", texto: oleada >= totalOleadas ? "Última oleada" : porSalir.length ? "En curso…" : `▶ Oleada ${oleada + 1}`, activo: !porSalir.length && oleada < totalOleadas, color: tema.secundario });
        b.push({ x: 556, w: 90, id: "rapido", texto: rapido ? "×2 ON" : "×2", activo: rapido, color: tema.primario });
      }
      return b;
    };

    const clic = (x: number, y: number) => {
      if (y >= BARRA) {
        for (const b of botones()) if (x >= b.x && x <= b.x + b.w) {
          api.sonido.efecto("clic");
          if (b.id in TORRES) { elegido = b.id as TipoTorre; seleccion = null; }
          else if (b.id === "oleada") lanzarOleada();
          else if (b.id === "rapido") rapido = !rapido;
          else if (b.id === "mejorar" && seleccion) {
            const costo = TORRES[seleccion.tipo].costo * (seleccion.nivel + 1);
            if (oro >= costo && seleccion.nivel < 3) { oro -= costo; seleccion.nivel++; api.sonido.efecto("mejora"); hud(); } else api.sonido.efecto("error");
          } else if (b.id === "vender" && seleccion) {
            oro += Math.floor(TORRES[seleccion.tipo].costo * seleccion.nivel * 0.6);
            torres.splice(torres.indexOf(seleccion), 1); seleccion = null; hud();
          }
        }
        return;
      }
      const c = Math.floor(x / CW), f = Math.floor(y / CW);
      const existente = torres.find((t) => t.c === c && t.f === f);
      if (existente) { seleccion = existente === seleccion ? null : existente; api.sonido.efecto("clic"); return; }
      seleccion = null;
      if (!elegido || enRuta.has(`${c},${f}`) || decoSet.has(`${c},${f}`)) { api.sonido.efecto("error"); return; }
      const costo = TORRES[elegido].costo;
      if (oro < costo) { api.aviso("Oro insuficiente", tema.peligro); api.sonido.efecto("error"); return; }
      oro -= costo;
      torres.push({ c, f, tipo: elegido, nivel: 1, t: 0, ang: 0 });
      api.sonido.efecto("moneda");
      api.particulas.explotar(c * CW + CW / 2, f * CW + CW / 2, tema[TORRES[elegido].color], 12, 120, 3, 0);
      hud();
    };

    return {
      actualizar(dt0) {
        anim += dt0;
        const e = api.entrada;
        if (e.puntero.pulsado) clic(e.puntero.x, e.puntero.y);
        if (e.pulsado("a")) lanzarOleada();
        if (terminado) return;
        const dt = dt0 * (rapido ? 2 : 1);
        // auto-oleada
        if (!porSalir.length && !enemigos.length && oleada < totalOleadas) {
          espera -= dt;
          if (espera <= 0) lanzarOleada();
        }
        if (porSalir.length) {
          relojSalida -= dt;
          if (relojSalida <= 0) { enemigos.push(porSalir.shift()!); relojSalida = Math.max(0.35, 0.9 - oleada * 0.03); }
        }
        for (const en of enemigos) {
          en.lento = Math.max(0, en.lento - dt);
          en.d += en.vel * (en.lento > 0 ? 0.5 : 1) * dt;
          if (en.d >= largo) {
            en.hp = -999;
            vidas -= en.tipo === "jefe" ? 5 : 1;
            api.sonido.efecto("golpe"); api.temblor(6);
            hud();
            if (vidas <= 0) { terminado = true; api.fin({ gano: false, mensaje: `Los enemigos rompieron tu defensa en la oleada ${oleada}.` }); return; }
          }
        }
        for (const t of torres) {
          const def = TORRES[t.tipo];
          t.t -= dt;
          const tx = t.c * CW + CW / 2, ty = t.f * CW + CW / 2;
          const rango = def.rango + (t.nivel - 1) * 15;
          let objetivo: Enemigo | null = null;
          for (const en of enemigos) {
            if (en.hp <= 0) continue;
            const q = pos(en.d);
            if (Math.hypot(q.x - tx, q.y - ty) <= rango && (!objetivo || en.d > objetivo.d)) objetivo = en;
          }
          if (!objetivo) continue;
          const q = pos(objetivo.d);
          t.ang = Math.atan2(q.y - ty, q.x - tx);
          if (t.t > 0) continue;
          t.t = def.cad / (1 + (t.nivel - 1) * 0.2);
          const dano = def.dano * (1 + (t.nivel - 1) * 0.6);
          objetivo.hp -= dano;
          if (t.tipo === "hielo") objetivo.lento = 1.6;
          if (t.tipo === "canon") { for (const otro of enemigos) { const o = pos(otro.d); if (otro !== objetivo && Math.hypot(o.x - q.x, o.y - q.y) < 40) otro.hp -= dano * 0.4; } api.particulas.explotar(q.x, q.y, tema.primario, 6, 90, 3, 0); }
          disparos.push({ x: tx, y: ty, tx: q.x, ty: q.y, vida: t.tipo === "rayo" ? 0.08 : 0.15, color: tema[def.color] });
          if (t.tipo !== "rayo" || Math.random() < 0.3) api.sonido.efecto(t.tipo === "canon" ? "disparo" : "tic");
        }
        for (const en of enemigos) if (en.hp <= 0 && en.hp > -999) {
          oro += en.oro;
          const q = pos(en.d);
          api.sumar(en.tipo === "jefe" ? 500 : en.oro * 5, q.x, q.y);
          api.particulas.explotar(q.x, q.y, tema.peligro, en.tipo === "jefe" ? 50 : 10, 160, 3);
          api.sonido.efecto(en.tipo === "jefe" ? "explosion" : "moneda");
          hud();
        }
        enemigos = enemigos.filter((en) => en.hp > 0);
        disparos = disparos.filter((d) => (d.vida -= dt0) > 0);
        if (oleada >= totalOleadas && !porSalir.length && !enemigos.length) {
          terminado = true;
          api.sumar(vidas * 100);
          api.fin({ gano: true, mensaje: `¡Resististe las ${totalOleadas} oleadas con ${vidas} vidas!` });
        }
      },
      dibujar(g) {
        fondo.dibujar(g, anim);
        // césped en damero
        for (let c = 0; c < COLS; c++) for (let f = 0; f < FILAS; f++) {
          g.fillStyle = conAlfa(tema.primario, (c + f) % 2 ? 0.05 : 0.09);
          g.fillRect(c * CW, f * CW, CW, CW);
        }
        // camino
        g.strokeStyle = mezclarColor(tema.fondo2, tema.secundario, 0.35);
        g.lineWidth = CW * 0.78; g.lineCap = "round"; g.lineJoin = "round";
        g.beginPath();
        ruta.forEach(([c, f], i) => (i ? g.lineTo(c * CW + CW / 2, f * CW + CW / 2) : g.moveTo(c * CW, f * CW + CW / 2)));
        g.stroke();
        g.strokeStyle = conAlfa("#ffffff", 0.08); g.lineWidth = 2; g.setLineDash([8, 10]); g.lineDashOffset = -anim * 30; g.stroke(); g.setLineDash([]);
        const fin = ruta[ruta.length - 1];
        brillo(g, tema.acento, 16); g.fillStyle = tema.acento; rectRed(g, fin[0] * CW + 8, fin[1] * CW + 6, CW - 16, CW - 12, 6); g.fill(); sinBrillo(g);
        for (const [c, f, r] of deco) {
          g.fillStyle = mezclarColor(tema.fondo2, tema.primario, 0.4);
          g.beginPath(); g.arc(c * CW + CW / 2, f * CW + CW / 2 + 4, 12 + r * 6, 0, 6.283); g.fill();
          g.fillStyle = conAlfa("#ffffff", 0.1); g.beginPath(); g.arc(c * CW + CW / 2 - 4, f * CW + CW / 2, 5, 0, 6.283); g.fill();
        }
        // vista previa
        const e = api.entrada;
        if (e.puntero.activo && e.puntero.y < BARRA && elegido && !seleccion) {
          const c = Math.floor(e.puntero.x / CW), f = Math.floor(e.puntero.y / CW);
          const ok = !enRuta.has(`${c},${f}`) && !decoSet.has(`${c},${f}`) && !torres.some((t) => t.c === c && t.f === f);
          g.fillStyle = ok ? conAlfa("#ffffff", 0.15) : conAlfa(tema.peligro, 0.25);
          g.fillRect(c * CW, f * CW, CW, CW);
          if (ok) { g.strokeStyle = conAlfa("#ffffff", 0.3); g.beginPath(); g.arc(c * CW + CW / 2, f * CW + CW / 2, TORRES[elegido].rango, 0, 6.283); g.stroke(); }
        }
        // torres
        for (const t of torres) {
          const x = t.c * CW + CW / 2, y = t.f * CW + CW / 2;
          const col = tema[TORRES[t.tipo].color];
          if (t === seleccion) { g.strokeStyle = conAlfa(col, 0.5); g.lineWidth = 2; g.beginPath(); g.arc(x, y, TORRES[t.tipo].rango + (t.nivel - 1) * 15, 0, 6.283); g.stroke(); }
          g.fillStyle = mezclarColor(tema.fondo, col, 0.3); rectRed(g, x - 19, y - 19, 38, 38, 9); g.fill();
          brillo(g, col, 10); g.fillStyle = col; g.beginPath(); g.arc(x, y, 12, 0, 6.283); g.fill(); sinBrillo(g);
          g.save(); g.translate(x, y); g.rotate(t.ang); g.fillStyle = mezclarColor(col, "#ffffff", 0.3); g.fillRect(4, -4, t.tipo === "rayo" ? 14 : 18, 8); g.restore();
          for (let i = 0; i < t.nivel; i++) { g.fillStyle = tema.acento; g.fillRect(x - 12 + i * 9, y + 13, 6, 4); }
        }
        // enemigos
        for (const en of enemigos) {
          const q = pos(en.d);
          const r = { normal: 11, rapido: 8, tanque: 15, jefe: 21 }[en.tipo];
          g.fillStyle = en.lento > 0 ? mezclarColor(tema.peligro, tema.secundario, 0.5) : tema.peligro;
          const bote = Math.abs(Math.sin(anim * 10 + en.d * 3)) * 2;
          g.beginPath(); g.arc(q.x, q.y - bote, r, 0, 6.283); g.fill();
          g.fillStyle = "#fff"; g.beginPath(); g.arc(q.x + 3, q.y - bote - 3, r * 0.28, 0, 6.283); g.fill();
          g.fillStyle = "#0009"; g.fillRect(q.x - 14, q.y - r - 9, 28, 4);
          g.fillStyle = tema.acento; g.fillRect(q.x - 14, q.y - r - 9, 28 * Math.max(0, en.hp / en.max), 4);
        }
        for (const d of disparos) { brillo(g, d.color, 8); g.strokeStyle = d.color; g.lineWidth = 3; g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.tx, d.ty); g.stroke(); }
        sinBrillo(g);
        // barra inferior
        g.fillStyle = mezclarColor(tema.fondo, "#000000", 0.3); g.fillRect(0, BARRA, W, H - BARRA);
        g.fillStyle = conAlfa(tema.primario, 0.4); g.fillRect(0, BARRA, W, 2);
        for (const b of botones()) {
          g.fillStyle = b.activo ? conAlfa(b.color, 0.35) : conAlfa("#ffffff", 0.07);
          rectRed(g, b.x, BARRA + 10, b.w, 40, 10); g.fill();
          g.strokeStyle = conAlfa(b.color, b.activo ? 0.9 : 0.35); g.lineWidth = 2; g.stroke();
          texto(g, b.texto, b.x + b.w / 2, BARRA + 31, 15, tema.texto, "center", 700);
        }
        texto(g, `${oro} oro`, W - 76, BARRA + 31, 18, tema.acento, "center", 800);
        if (!porSalir.length && !enemigos.length && oleada < totalOleadas && oleada > 0) texto(g, `Próxima oleada en ${Math.ceil(espera)} s`, W / 2, 20, 14, conAlfa(tema.texto, 0.7), "center", 600);
        if (oleada === 0) texto(g, "Elegí una torre abajo y tocá un casillero libre", W / 2, 22, 16, tema.texto, "center", 700);
      },
    };
  },
};

export default modulo;
