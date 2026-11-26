import { crearRng } from "@/lib/rng";
import { Entrada } from "./entrada";
import { Sonido } from "./audio";
import { Particulas, texto } from "./dibujo";
import type { ApiJuego, DatoHud, Juego, ModuloMotor, ParametrosVariante } from "./tipos";

export interface EventosPartida {
  puntos(n: number): void;
  hud(datos: DatoHud[]): void;
  fin(r: { gano: boolean; mensaje?: string; puntos: number; segundos: number }): void;
}

interface Flotante { x: number; y: number; t: string; vida: number; color: string }

const PASO = 1 / 60;

/** Bucle de juego: escalado, entrada, paso fijo, pausa, avisos y fin de partida. */
export class Partida {
  readonly entrada = new Entrada();
  readonly particulas = new Particulas();
  private ctx: CanvasRenderingContext2D;
  private juego: Juego | null = null;
  private escala = 1;
  private raf = 0;
  private ultimo = 0;
  private acumulado = 0;
  private tiempo = 0;
  private puntos = 0;
  private sacudida = 0;
  private terminado = false;
  pausado = false;
  private flotantes: Flotante[] = [];
  private aviso: { t: string; vida: number; color: string } | null = null;
  private limpiezas: (() => void)[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    private modulo: ModuloMotor,
    private p: ParametrosVariante,
    private eventos: EventosPartida,
    readonly sonido: Sonido,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.entrada.dosJugadores = !!modulo.dosJugadores?.(p.modo);
    this.ajustar();
    this.escuchar();
  }

  iniciar() {
    const self = this;
    const rng = crearRng(this.p.semilla ^ 0x9e3779b9);
    const api: ApiJuego = {
      W: this.modulo.ancho,
      H: this.modulo.alto,
      p: this.p,
      tema: this.p.tema,
      rng,
      entrada: this.entrada,
      sonido: this.sonido,
      particulas: this.particulas,
      get tiempo() { return self.tiempo; },
      get puntos() { return self.puntos; },
      sumar(n, x, y) {
        self.puntos = Math.max(0, Math.round(self.puntos + n));
        self.eventos.puntos(self.puntos);
        if (x !== undefined && y !== undefined && n !== 0) self.flotantes.push({ x, y, t: (n > 0 ? "+" : "") + n, vida: 0.9, color: n > 0 ? self.p.tema.acento : self.p.tema.peligro });
      },
      fijarPuntos(n) { self.puntos = Math.round(n); self.eventos.puntos(self.puntos); },
      hud(d) { self.eventos.hud(d); },
      aviso(t, color) { self.aviso = { t, vida: 1.6, color: color ?? self.p.tema.texto }; },
      temblor(f) { self.sacudida = Math.max(self.sacudida, f); },
      fin(r) {
        if (self.terminado) return;
        self.terminado = true;
        self.sonido.detenerMusica();
        self.sonido.efecto(r.gano ? "victoria" : "derrota");
        setTimeout(() => self.eventos.fin({ ...r, puntos: self.puntos, segundos: Math.round(self.tiempo) }), r.gano ? 900 : 700);
      },
    };
    this.juego = this.modulo.crear(api);
    if (!this.modulo.musicaPropia) this.sonido.musica(this.p.tema, Math.round(100 + this.p.velocidad * 20 + this.p.dificultad * 4), this.p.semilla);
    this.ultimo = performance.now();
    this.raf = requestAnimationFrame(this.cuadro);
  }

  private cuadro = (ahora: number) => {
    this.raf = requestAnimationFrame(this.cuadro);
    const dt = Math.min(0.1, (ahora - this.ultimo) / 1000);
    this.ultimo = ahora;
    if (!this.juego) return;
    if (!this.pausado) {
      this.acumulado += dt;
      let pasos = 0;
      while (this.acumulado >= PASO && pasos < 6) {
        this.juego.actualizar(PASO);
        this.particulas.actualizar(PASO);
        this.tiempo += PASO;
        this.entrada.finCuadro();
        this.acumulado -= PASO;
        pasos++;
      }
      if (pasos === 6) this.acumulado = 0;
      for (const f of this.flotantes) { f.vida -= dt; f.y -= 40 * dt; }
      this.flotantes = this.flotantes.filter((f) => f.vida > 0);
      if (this.aviso) { this.aviso.vida -= dt; if (this.aviso.vida <= 0) this.aviso = null; }
      this.sacudida = Math.max(0, this.sacudida - dt * 30);
    }
    this.dibujar();
  };

  private dibujar() {
    const g = this.ctx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const s = this.escala * dpr;
    const sx = this.sacudida ? (Math.random() - 0.5) * this.sacudida : 0;
    const sy = this.sacudida ? (Math.random() - 0.5) * this.sacudida : 0;
    g.setTransform(s, 0, 0, s, sx * s, sy * s);
    g.imageSmoothingEnabled = true;
    this.juego!.dibujar(g);
    this.particulas.dibujar(g);
    for (const f of this.flotantes) {
      g.globalAlpha = Math.min(1, f.vida * 2);
      texto(g, f.t, f.x, f.y, 16, f.color);
    }
    g.globalAlpha = 1;
    if (this.aviso) {
      const a = this.aviso;
      g.globalAlpha = Math.min(1, a.vida * 2);
      const escala = 1 + Math.max(0, a.vida - 1.4) * 1.5;
      g.save();
      g.translate(this.modulo.ancho / 2, this.modulo.alto * 0.3);
      g.scale(escala, escala);
      texto(g, a.t, 0, 0, Math.min(40, this.modulo.ancho / 14), a.color);
      g.restore();
      g.globalAlpha = 1;
    }
  }

  /** Ajusta el lienzo al contenedor manteniendo la proporción del motor. */
  ajustar() {
    const padre = this.canvas.parentElement;
    if (!padre) return;
    const r = padre.getBoundingClientRect();
    const { ancho, alto } = this.modulo;
    this.escala = Math.max(0.1, Math.min(r.width / ancho, r.height / alto));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.floor(ancho * this.escala);
    const ch = Math.floor(alto * this.escala);
    this.canvas.style.width = `${cw}px`;
    this.canvas.style.height = `${ch}px`;
    this.canvas.width = Math.floor(cw * dpr);
    this.canvas.height = Math.floor(ch * dpr);
  }

  private aLogico(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (clientX - r.left) / this.escala, y: (clientY - r.top) / this.escala };
  }

  private escuchar() {
    const c = this.canvas;
    const e = this.entrada;
    const esquema = this.modulo.tactil;
    const teclaAbajo = (ev: KeyboardEvent) => {
      if (this.pausado || ev.repeat && e.teclas.has(ev.code)) { if (!this.pausado) ev.preventDefault(); return; }
      if (e.tecla(ev.code, true) || ["ArrowUp", "ArrowDown", "Space"].includes(ev.code)) ev.preventDefault();
    };
    const teclaArriba = (ev: KeyboardEvent) => { e.tecla(ev.code, false); };
    const perderFoco = () => e.limpiar();
    window.addEventListener("keydown", teclaAbajo);
    window.addEventListener("keyup", teclaArriba);
    window.addEventListener("blur", perderFoco);

    const abajo = (ev: PointerEvent) => {
      ev.preventDefault();
      c.setPointerCapture?.(ev.pointerId);
      const p = this.aLogico(ev.clientX, ev.clientY);
      e.puntero = { ...e.puntero, x: p.x, y: p.y, abajo: true, pulsado: true, activo: true };
      const t = { id: ev.pointerId, x: p.x, y: p.y, inicioX: p.x, inicioY: p.y };
      e.toques.set(ev.pointerId, t);
      e.toquesNuevos.push(t);
      if (esquema === "toque") e.activar("a");
    };
    const mover = (ev: PointerEvent) => {
      const p = this.aLogico(ev.clientX, ev.clientY);
      e.puntero.x = p.x;
      e.puntero.y = p.y;
      e.puntero.activo = true;
      const t = e.toques.get(ev.pointerId);
      if (t) {
        t.x = p.x; t.y = p.y;
        if (esquema === "deslizar" || esquema === "toque") {
          const dx = p.x - t.inicioX, dy = p.y - t.inicioY;
          const umbral = Math.min(this.modulo.ancho, this.modulo.alto) * 0.06;
          if (Math.hypot(dx, dy) > umbral) {
            const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "der" : "izq") : dy > 0 ? "abajo" : "arriba";
            if (esquema === "deslizar" || dir === "abajo") {
              e.deslizar = dir;
              e.activar(dir);
              if (esquema === "toque") e.desactivar("a");
            }
            t.inicioX = p.x; t.inicioY = p.y;
            (t as { movido?: boolean }).movido = true;
          }
        }
      }
    };
    const arriba = (ev: PointerEvent) => {
      const t = e.toques.get(ev.pointerId);
      e.toques.delete(ev.pointerId);
      e.puntero.abajo = e.toques.size > 0;
      e.puntero.soltado = true;
      if (esquema === "toque") e.desactivar("a");
      if (esquema === "deslizar" && t && !(t as { movido?: boolean }).movido) { e.activar("a"); setTimeout(() => e.desactivar("a"), 50); }
    };
    c.addEventListener("pointerdown", abajo);
    c.addEventListener("pointermove", mover);
    c.addEventListener("pointerup", arriba);
    c.addEventListener("pointercancel", arriba);
    const ro = new ResizeObserver(() => this.ajustar());
    if (c.parentElement) ro.observe(c.parentElement);
    const visibilidad = () => { if (document.hidden) this.eventosPausa?.(); };
    document.addEventListener("visibilitychange", visibilidad);
    this.limpiezas.push(() => {
      window.removeEventListener("keydown", teclaAbajo);
      window.removeEventListener("keyup", teclaArriba);
      window.removeEventListener("blur", perderFoco);
      c.removeEventListener("pointerdown", abajo);
      c.removeEventListener("pointermove", mover);
      c.removeEventListener("pointerup", arriba);
      c.removeEventListener("pointercancel", arriba);
      document.removeEventListener("visibilitychange", visibilidad);
      ro.disconnect();
    });
  }

  /** El reproductor registra acá qué hacer si la pestaña se oculta (pausar). */
  eventosPausa?: () => void;

  pausar() {
    if (this.terminado) return;
    this.pausado = true;
    this.entrada.limpiar();
    this.sonido.pausarMusica();
  }
  reanudar() {
    this.pausado = false;
    this.ultimo = performance.now();
    this.sonido.reanudarMusica();
  }

  destruir() {
    cancelAnimationFrame(this.raf);
    this.sonido.detenerMusica();
    for (const l of this.limpiezas) l();
    this.juego = null;
  }
}
