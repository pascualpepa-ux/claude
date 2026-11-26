import type { Tema } from "@/lib/temas";

export type Efecto =
  | "moneda" | "salto" | "golpe" | "explosion" | "mejora" | "disparo" | "clic" | "victoria"
  | "derrota" | "tic" | "nivel" | "rebote" | "error" | "combo";

type Onda = OscillatorType;

/**
 * Sintetizador de efectos y música con Web Audio (sin archivos: carga instantánea).
 * La música es un loop generado con la escala de la temática.
 */
export class Sonido {
  ctx: AudioContext | null = null;
  private maestro: GainNode | null = null;
  private busMusica: GainNode | null = null;
  private ruido: AudioBuffer | null = null;
  silenciado = false;
  musicaActiva = true;
  private timerMusica: ReturnType<typeof setInterval> | null = null;
  private pasoMusica = 0;
  private proximoTiempo = 0;
  private tema: Tema | null = null;
  private tempo = 112;
  private semillaMusica = 1;

  iniciar() {
    if (this.ctx) { if (this.ctx.state === "suspended") void this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.maestro = this.ctx.createGain();
    this.maestro.gain.value = this.silenciado ? 0 : 0.55;
    const comp = this.ctx.createDynamicsCompressor();
    this.maestro.connect(comp).connect(this.ctx.destination);
    this.busMusica = this.ctx.createGain();
    this.busMusica.gain.value = 0.32;
    this.busMusica.connect(this.maestro);
    const len = this.ctx.sampleRate * 0.5;
    this.ruido = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.ruido.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  get ahora() { return this.ctx?.currentTime ?? 0; }

  silenciar(s: boolean) {
    this.silenciado = s;
    if (this.maestro && this.ctx) this.maestro.gain.setTargetAtTime(s ? 0 : 0.55, this.ctx.currentTime, 0.02);
  }

  tono(freq: number, dur: number, onda: Onda = "square", vol = 0.2, cuando = 0, deslizarA?: number, destino?: AudioNode) {
    if (!this.ctx || !this.maestro) return;
    const t = cuando || this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = onda;
    o.frequency.setValueAtTime(freq, t);
    if (deslizarA) o.frequency.exponentialRampToValueAtTime(Math.max(20, deslizarA), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(destino ?? this.maestro);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  golpeRuido(dur: number, vol = 0.3, filtro = 1200, cuando = 0, destino?: AudioNode) {
    if (!this.ctx || !this.maestro || !this.ruido) return;
    const t = cuando || this.ctx.currentTime;
    const s = this.ctx.createBufferSource();
    s.buffer = this.ruido;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(filtro, t);
    f.frequency.exponentialRampToValueAtTime(80, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(destino ?? this.maestro);
    s.start(t);
    s.stop(t + dur);
  }

  efecto(e: Efecto) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    switch (e) {
      case "moneda": this.tono(988, 0.07, "square", 0.12); this.tono(1319, 0.18, "square", 0.12, t + 0.07); break;
      case "salto": this.tono(320, 0.16, "square", 0.12, 0, 720); break;
      case "golpe": this.tono(180, 0.18, "sawtooth", 0.18, 0, 60); this.golpeRuido(0.12, 0.2, 900); break;
      case "explosion": this.golpeRuido(0.55, 0.45, 2200); this.tono(120, 0.4, "triangle", 0.2, 0, 40); break;
      case "mejora": [523, 659, 784, 1047].forEach((f, i) => this.tono(f, 0.12, "triangle", 0.16, t + i * 0.06)); break;
      case "disparo": this.tono(880, 0.08, "square", 0.05, 0, 330); break;
      case "clic": this.tono(660, 0.04, "triangle", 0.12); break;
      case "victoria": [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tono(f, 0.22, "square", 0.12, t + i * 0.11)); break;
      case "derrota": [392, 330, 262, 196].forEach((f, i) => this.tono(f, 0.3, "triangle", 0.18, t + i * 0.16)); break;
      case "tic": this.tono(1200, 0.03, "square", 0.06); break;
      case "nivel": [392, 523, 659, 784].forEach((f, i) => this.tono(f, 0.16, "square", 0.12, t + i * 0.08)); break;
      case "rebote": this.tono(440, 0.06, "sine", 0.18, 0, 520); break;
      case "error": this.tono(140, 0.2, "sawtooth", 0.12); break;
      case "combo": this.tono(784, 0.06, "triangle", 0.14); this.tono(1175, 0.12, "triangle", 0.14, t + 0.05); break;
    }
  }

  /** Música de fondo generada a partir de la temática (loop de 4 compases). */
  musica(tema: Tema, tempo: number, semilla: number) {
    this.tema = tema;
    this.tempo = tempo;
    this.semillaMusica = semilla;
    this.detenerMusica();
    if (!this.ctx || !this.musicaActiva) return;
    this.pasoMusica = 0;
    this.proximoTiempo = this.ctx.currentTime + 0.1;
    this.timerMusica = setInterval(() => this.programar(), 60);
  }

  alternarMusica(activa: boolean) {
    this.musicaActiva = activa;
    if (!activa) this.detenerMusica();
    else if (this.tema) this.musica(this.tema, this.tempo, this.semillaMusica);
  }

  pausarMusica() { this.detenerMusica(); }
  reanudarMusica() { if (this.musicaActiva && this.tema) this.musica(this.tema, this.tempo, this.semillaMusica); }

  detenerMusica() {
    if (this.timerMusica) clearInterval(this.timerMusica);
    this.timerMusica = null;
  }

  private programar() {
    if (!this.ctx || !this.tema || !this.busMusica) return;
    const semicorchea = 60 / this.tempo / 4;
    const esc = this.tema.escala;
    const base = this.tema.tonica;
    const nota = (grado: number, oct = 0) => base * Math.pow(2, (esc[((grado % esc.length) + esc.length) % esc.length] + 12 * (oct + Math.floor(grado / esc.length))) / 12);
    // Progresión y melodía derivadas de la semilla (determinísticas)
    const s = this.semillaMusica;
    const prog = [0, (s % 3) + 3, (s >> 3) % 2 ? 5 : 4, (s >> 5) % 2 ? 3 : 6];
    while (this.proximoTiempo < this.ctx.currentTime + 0.25) {
      const paso = this.pasoMusica % 64;
      const compas = Math.floor(paso / 16);
      const t = this.proximoTiempo;
      const raiz = prog[compas];
      if (paso % 4 === 0) this.tono(nota(raiz, -2), semicorchea * 3.5, "triangle", 0.22, t, undefined, this.busMusica);
      if (paso % 8 === 0) this.tono(70, 0.12, "sine", 0.35, t, 40, this.busMusica);
      if (paso % 8 === 4) this.golpeRuido(0.08, 0.12, 3500, t, this.busMusica);
      if (paso % 2 === 1) this.golpeRuido(0.025, 0.04, 8000, t, this.busMusica);
      const h = (Math.imul(paso + 1, 2654435761) ^ s) >>> 0;
      if (h % 5 < 2 && paso % 2 === 0) {
        const grado = raiz + [0, 2, 4, 1, 3, 5, 7][h % 7];
        this.tono(nota(grado, 0), semicorchea * 1.8, "square", 0.05, t, undefined, this.busMusica);
      }
      this.proximoTiempo += semicorchea;
      this.pasoMusica++;
    }
  }

  cerrar() {
    this.detenerMusica();
    void this.ctx?.close();
    this.ctx = null;
  }
}
