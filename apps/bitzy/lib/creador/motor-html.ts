/* eslint-disable */
// Mini motor de los juegos del Creador (JavaScript plano, se inserta en el HTML del juego).
export const MOTOR_JS = String.raw`(function () {
  "use strict";
  var E = window.__ESPEC__, T = window.__TEMA__;
  var W = 720, H = 960;
  var cv = document.getElementById("c"), g = cv.getContext("2d");
  var escala = 1, dpr = Math.min(window.devicePixelRatio || 1, 2);
  function ajustar() {
    var s = Math.min(window.innerWidth / W, window.innerHeight / H);
    escala = s;
    cv.style.width = Math.floor(W * s) + "px"; cv.style.height = Math.floor(H * s) + "px";
    cv.width = Math.floor(W * s * dpr); cv.height = Math.floor(H * s * dpr);
  }
  window.addEventListener("resize", ajustar); ajustar();

  /* ---------- sonido ---------- */
  var AC = null, master = null, musicaT = null, paso = 0, prox = 0;
  function audio() {
    if (AC) { if (AC.state === "suspended") AC.resume(); return; }
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.5; master.connect(AC.destination); } catch (e) {}
  }
  function tono(f, d, tipo, v, cuando, a) {
    if (!AC) return; var t = cuando || AC.currentTime; var o = AC.createOscillator(), gg = AC.createGain();
    o.type = tipo || "square"; o.frequency.setValueAtTime(f, t); if (a) o.frequency.exponentialRampToValueAtTime(a, t + d);
    gg.gain.setValueAtTime(0.0001, t); gg.gain.exponentialRampToValueAtTime(v || 0.15, t + 0.01); gg.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(gg); gg.connect(master); o.start(t); o.stop(t + d + 0.05);
  }
  var sfx = {
    moneda: function () { tono(988, 0.07, "square", 0.1); tono(1319, 0.15, "square", 0.1, AC && AC.currentTime + 0.07); },
    golpe: function () { tono(200, 0.25, "sawtooth", 0.18, 0, 50); },
    disparo: function () { tono(900, 0.06, "square", 0.04, 0, 300); },
    salto: function () { tono(330, 0.15, "square", 0.1, 0, 700); },
    nivel: function () { [392, 523, 659, 784].forEach(function (f, i) { tono(f, 0.14, "triangle", 0.14, AC && AC.currentTime + i * 0.08); }); },
    boom: function () { tono(120, 0.5, "sawtooth", 0.2, 0, 30); }
  };
  function musica() {
    if (!AC || !E.musica || musicaT) return;
    prox = AC.currentTime + 0.1;
    musicaT = setInterval(function () {
      var sc = T.escala, base = T.tonica, semi = 60 / (110 + E.velocidadJuego * 18) / 4;
      while (prox < AC.currentTime + 0.25) {
        var p = paso % 64, acorde = [0, 3, 4, 5][Math.floor(p / 16)];
        var nota = function (gr, oc) { return base * Math.pow(2, (sc[((gr % sc.length) + sc.length) % sc.length] + 12 * (oc + Math.floor(gr / sc.length))) / 12); };
        if (p % 4 === 0) tono(nota(acorde, -2), semi * 3.5, "triangle", 0.12, prox);
        if (p % 8 === 0) tono(70, 0.12, "sine", 0.25, prox, 40);
        if ((p * 7) % 5 < 2 && p % 2 === 0) tono(nota(acorde + [0, 2, 4, 1][p % 4], 0), semi * 1.6, "square", 0.035, prox);
        prox += semi; paso++;
      }
    }, 60);
  }
  function pararMusica() { if (musicaT) clearInterval(musicaT); musicaT = null; }

  /* ---------- entrada ---------- */
  var teclas = {}, nuevas = {};
  window.addEventListener("keydown", function (e) {
    audio(); if (!teclas[e.code]) nuevas[e.code] = 1; teclas[e.code] = 1;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].indexOf(e.code) >= 0) e.preventDefault();
    if (e.code === "KeyP" || e.code === "Escape") alternarPausa();
    if ((e.code === "Enter" || e.code === "Space") && estado !== "jugando" && estado !== "pausa") empezar();
  });
  window.addEventListener("keyup", function (e) { teclas[e.code] = 0; });
  var toques = {};
  function pos(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / escala, y: (e.clientY - r.top) / escala }; }
  cv.addEventListener("pointerdown", function (e) {
    audio(); var p = pos(e); cv.setPointerCapture(e.pointerId);
    if (p.x > W - 80 && p.y < 80 && estado === "jugando") { alternarPausa(); return; }
    if (estado !== "jugando") { if (estado === "pausa") alternarPausa(); else empezar(); return; }
    toques[e.pointerId] = { x: p.x, y: p.y, ox: p.x, oy: p.y, t: Date.now() };
  });
  cv.addEventListener("pointermove", function (e) { var t = toques[e.pointerId]; if (t) { var p = pos(e); t.x = p.x; t.y = p.y; } });
  function soltar(e) { var t = toques[e.pointerId]; if (t && Date.now() - t.t < 220 && Math.abs(t.x - t.ox) < 12) tap = true; delete toques[e.pointerId]; }
  cv.addEventListener("pointerup", soltar); cv.addEventListener("pointercancel", soltar);
  var tap = false;
  function k(c) { return !!teclas[c]; }

  /* ---------- estado ---------- */
  var estado = "inicio", puntos = 0, record = 0, nivel = 1, tiempo = 0, pausa = false;
  try { record = +localStorage.getItem("pf-creador-" + E.titulo) || 0; } catch (e) {}
  var jugadores, cosas, balas, particulas, jefe, sacudir = 0, aviso = null, vivos;
  var dif = 0.7 + E.dificultad * 0.15, velJ = 360 * E.velocidadJugador, velM = E.velocidadJuego;
  var umbral = function (n) { return Math.round(n * 120 * (0.8 + E.dificultad * 0.1)); };
  var plataformas, camX = 0;

  function nuevoJugador(i) {
    return { x: E.dosJugadores ? (i ? W * 0.65 : W * 0.35) : W / 2, y: E.genero === "plataformas" ? H - 260 : H - 150, vx: 0, vy: 0, vidas: E.vidas, inv: 0, suelo: false, saltos: 0, col: i ? T.secundario : (E.colorJugador || T.primario), cad: 0, vivo: true };
  }
  function empezar() {
    audio(); jugadores = [nuevoJugador(0)]; if (E.dosJugadores) jugadores.push(nuevoJugador(1));
    cosas = []; balas = []; particulas = []; jefe = null; puntos = 0; nivel = 1; tiempo = 0; camX = 0;
    plataformas = [{ x: 0, y: H - 200, w: 900 }];
    estado = "jugando"; avisar("Nivel 1"); musica();
  }
  function alternarPausa() { if (estado === "jugando") { estado = "pausa"; pararMusica(); } else if (estado === "pausa") { estado = "jugando"; musica(); } }
  function avisar(t) { aviso = { t: t, v: 1.6 }; }
  function explotar(x, y, c, n) { for (var i = 0; i < (n || 14); i++) { var a = Math.random() * 6.28, v = 60 + Math.random() * 240; particulas.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, v: 0.6, c: c }); } }
  function terminar(gano) {
    estado = gano ? "victoria" : "derrota"; pararMusica();
    if (gano) sfx.nivel(); else sfx.boom();
    if (puntos > record) { record = puntos; try { localStorage.setItem("pf-creador-" + E.titulo, String(record)); } catch (e) {} }
    try { parent.postMessage({ tipo: "pf-fin", gano: gano, puntos: puntos }, "*"); } catch (e) {}
  }

  function generar(dt) {
    var ritmo = (0.55 / dif) / (1 + nivel * 0.18) / velM;
    if (E.genero === "plataformas") return;
    if (Math.random() < dt / ritmo) {
      var malo = E.genero === "atrapar" ? Math.random() < 0.35 + nivel * 0.04 : true;
      cosas.push({ x: 30 + Math.random() * (W - 60), y: -40, r: 18 + Math.random() * 18, vy: (150 + Math.random() * 120) * velM * (1 + nivel * 0.12) * dif, vx: (Math.random() - 0.5) * 60, tipo: malo ? "obst" : "obj", hp: 2, rot: Math.random() * 6 });
    }
    if (E.monedas && E.genero !== "atrapar" && Math.random() < dt * 0.9) cosas.push({ x: 30 + Math.random() * (W - 60), y: -30, r: 14, vy: 170 * velM, vx: 0, tipo: "obj", rot: 0 });
    if (E.enemigos && Math.random() < dt * (0.25 + nivel * 0.06) * dif) cosas.push({ x: Math.random() * W, y: -40, r: 22, vy: 80 * velM, vx: 0, tipo: "enemigo", hp: 3, rot: 0, cad: 1.5 });
  }

  function actualizar(dt) {
    tiempo += dt;
    if (aviso) { aviso.v -= dt; if (aviso.v <= 0) aviso = null; }
    sacudir = Math.max(0, sacudir - dt * 30);
    particulas.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.v -= dt; });
    particulas = particulas.filter(function (p) { return p.v > 0; });
    var disparar = E.genero === "disparos" || !!jefe;
    jugadores.forEach(function (j, i) {
      if (!j.vivo) return;
      j.inv = Math.max(0, j.inv - dt);
      var izq = i ? k("KeyA") : (k("ArrowLeft") || (!E.dosJugadores && k("KeyA")));
      var der = i ? k("KeyD") : (k("ArrowRight") || (!E.dosJugadores && k("KeyD")));
      var arr = i ? k("KeyW") : (k("ArrowUp") || (!E.dosJugadores && k("KeyW")));
      var aba = i ? k("KeyS") : (k("ArrowDown") || (!E.dosJugadores && k("KeyS")));
      var salto = i ? nuevas.KeyW || nuevas.Space && E.dosJugadores : (nuevas.ArrowUp || nuevas.Space && !E.dosJugadores || nuevas.KeyW && !E.dosJugadores);
      var dx = (der ? 1 : 0) - (izq ? 1 : 0), dy = (aba ? 1 : 0) - (arr ? 1 : 0);
      // toques: cada jugador usa su mitad en modo 2J
      for (var id in toques) {
        var t = toques[id]; if (E.dosJugadores && (t.ox < W / 2) !== (i === 0)) continue;
        if (E.genero === "plataformas") { dx = t.x < W / 2 ? -1 : 1; } else { j.x += (t.x - j.x) * Math.min(1, dt * 12); if (E.genero !== "atrapar") j.y += (t.y - 70 - j.y) * Math.min(1, dt * 12); }
      }
      if (E.genero === "plataformas") {
        if (tap || salto) { if (j.suelo || j.saltos < 2) { j.vy = -820; j.saltos++; j.suelo = false; sfx.salto(); } }
        j.vx = dx * velJ * 0.9; j.x += j.vx * dt; j.vy += 2000 * dt; j.y += j.vy * dt; j.suelo = false;
        plataformas.forEach(function (p) { var px = p.x - camX; if (j.vy >= 0 && j.x > px - 16 && j.x < px + p.w + 16 && j.y >= p.y - 2 && j.y - j.vy * dt <= p.y + 4) { j.y = p.y; j.vy = 0; j.suelo = true; j.saltos = 0; } });
        j.x = Math.max(30, Math.min(W - 30, j.x));
        if (j.y > H + 60) { herir(j); j.y = H - 400; j.vy = 0; j.x = W / 3; }
      } else {
        j.x += dx * velJ * dt; if (E.genero !== "atrapar") j.y += dy * velJ * dt;
        j.x = Math.max(30, Math.min(W - 30, j.x)); j.y = Math.max(E.genero === "atrapar" ? H - 150 : 120, Math.min(H - 60, j.y));
      }
      if (disparar) { j.cad -= dt; if (j.cad <= 0) { j.cad = 0.18; balas.push({ x: j.x, y: j.y - 30, vy: -760, malo: false }); if (i === 0 && Math.random() < 0.5) sfx.disparo(); } }
    });
    tap = false; nuevas = {};

    if (E.genero === "plataformas") {
      var vel = 220 * velM * (1 + nivel * 0.12);
      camX += vel * dt;
      var ult = plataformas[plataformas.length - 1];
      while (ult.x + ult.w - camX < W + 200) {
        var hueco = 90 + Math.random() * (60 + nivel * 18) * dif;
        var ny = Math.max(H * 0.45, Math.min(H - 160, ult.y + (Math.random() - 0.5) * 220));
        var np = { x: ult.x + ult.w + hueco, y: ny, w: 180 + Math.random() * 200 - nivel * 8 };
        plataformas.push(np);
        if (Math.random() < 0.8) cosas.push({ x: np.x + np.w / 2, y: np.y - 70, r: 14, vy: 0, vx: 0, tipo: "obj", mundo: true, rot: 0 });
        if (Math.random() < 0.3 + nivel * 0.07) cosas.push({ x: np.x + 40 + Math.random() * (np.w - 80), y: np.y - 18, r: 18, vy: 0, vx: 0, tipo: "obst", mundo: true, rot: 0 });
        if (E.enemigos && Math.random() < 0.25) cosas.push({ x: np.x + np.w, y: np.y - 160, r: 20, vy: 0, vx: -60, tipo: "enemigo", mundo: true, hp: 2, rot: 0, cad: 99 });
        ult = np;
      }
      plataformas = plataformas.filter(function (p) { return p.x + p.w - camX > -100; });
      puntos += dt * 10 * velM;
    } else generar(dt);

    // jefe
    var umbralFin = umbral(E.niveles);
    if (puntos >= umbral(nivel) && nivel < E.niveles) { nivel++; avisar("Nivel " + nivel); sfx.nivel(); }
    if (puntos >= umbralFin && !jefe && estado === "jugando") {
      if (E.jefe) { jefe = { x: W / 2, y: -100, hp: 60 * dif, max: 60 * dif, t: 0 }; avisar("¡JEFE FINAL!"); sfx.boom(); }
      else { terminar(true); return; }
    }
    if (jefe) {
      jefe.t += dt; if (jefe.y < 150) jefe.y += 80 * dt; jefe.x = W / 2 + Math.sin(jefe.t * 0.9) * (W / 2 - 110);
      if (jefe.t % (0.9 / dif) < dt) for (var a = -2; a <= 2; a++) balas.push({ x: jefe.x, y: jefe.y + 50, vx: a * 70, vy: 260 * velM, malo: true });
    }

    cosas.forEach(function (c) {
      if (c.mundo) { c.sx = c.x - camX; } else { c.y += c.vy * dt; c.x += c.vx * dt; c.sx = c.x; }
      if (!c.mundo && c.tipo === "enemigo") { var obj = jugadores.filter(function (j) { return j.vivo; })[0]; if (obj) c.x += Math.sign(obj.x - c.x) * 70 * dt * dif; c.cad -= dt; if (c.cad <= 0 && E.genero === "disparos") { c.cad = 1.8 / dif; balas.push({ x: c.x, y: c.y + 20, vx: 0, vy: 320, malo: true }); } }
      if (c.mundo && c.tipo === "enemigo") c.x += c.vx * dt;
      c.rot += dt * 2;
      jugadores.forEach(function (j) {
        if (!j.vivo || c.fuera) return;
        var cy = c.y, d = Math.hypot(c.sx - j.x, cy - (E.genero === "plataformas" ? j.y - 24 : j.y));
        if (d < c.r + 22) {
          if (c.tipo === "obj") { c.fuera = true; puntos += 10 * (1 + nivel * 0.2); sfx.moneda(); explotar(c.sx, cy, T.acento, 8); }
          else { c.fuera = true; herir(j); }
        }
      });
    });
    balas.forEach(function (b) {
      b.y += b.vy * dt; b.x += (b.vx || 0) * dt;
      if (b.malo) jugadores.forEach(function (j) { if (j.vivo && Math.hypot(b.x - j.x, b.y - j.y) < 24) { b.y = -999; herir(j); } });
      else {
        cosas.forEach(function (c) { if (!c.fuera && c.tipo !== "obj" && Math.hypot(b.x - c.sx, b.y - c.y) < c.r + 6) { b.y = -999; c.hp = (c.hp || 1) - 1; if (c.hp <= 0) { c.fuera = true; puntos += 15; explotar(c.sx, c.y, T.peligro, 12); sfx.boom(); } } });
        if (jefe && Math.hypot(b.x - jefe.x, b.y - jefe.y) < 80) { b.y = -999; jefe.hp--; if (jefe.hp <= 0) { explotar(jefe.x, jefe.y, T.acento, 80); sacudir = 25; puntos += 500; jefe = null; terminar(true); } }
      }
    });
    if (E.genero === "atrapar") cosas.forEach(function (c) { if (!c.fuera && c.tipo === "obj" && c.y > H + 20) { c.fuera = true; } });
    cosas = cosas.filter(function (c) { return !c.fuera && c.y < H + 80 && (!c.mundo || c.sx > -80); });
    balas = balas.filter(function (b) { return b.y > -40 && b.y < H + 40; });
    if (estado === "jugando" && !jugadores.some(function (j) { return j.vivo; })) terminar(false);
  }
  function herir(j) {
    if (j.inv > 0) return;
    j.vidas--; j.inv = 1.5; sacudir = 12; sfx.golpe(); explotar(j.x, j.y, j.col, 20);
    if (j.vidas <= 0) j.vivo = false;
  }

  /* ---------- dibujo ---------- */
  var estrellas = []; for (var i = 0; i < 60; i++) estrellas.push({ x: Math.random() * W, y: Math.random() * H, v: 20 + Math.random() * 80, r: Math.random() * 2 + 0.5 });
  function forma(x, y, tipo, col, r, rot) {
    g.save(); g.translate(x, y); g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 16;
    if (tipo === "nave") { g.beginPath(); g.moveTo(0, -30); g.lineTo(24, 22); g.lineTo(0, 12); g.lineTo(-24, 22); g.closePath(); g.fill(); g.shadowBlur = 0; g.fillStyle = T.acento; g.beginPath(); g.arc(0, 0, 6, 0, 6.28); g.fill(); }
    else if (tipo === "auto") { g.fillRect(-20, -34, 40, 68); g.shadowBlur = 0; g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(-14, -20, 28, 16); g.fillStyle = "#111"; g.fillRect(-25, -26, 6, 16); g.fillRect(19, -26, 6, 16); g.fillRect(-25, 12, 6, 16); g.fillRect(19, 12, 6, 16); }
    else if (tipo === "personaje") { g.beginPath(); g.roundRect ? g.roundRect(-18, -48, 36, 48, 10) : g.rect(-18, -48, 36, 48); g.fill(); g.shadowBlur = 0; g.fillStyle = "#fff"; g.fillRect(2, -40, 10, 10); g.fillStyle = "#111"; g.fillRect(6, -37, 4, 5); }
    else if (tipo === "pez") { g.beginPath(); g.ellipse(0, 0, 28, 18, 0, 0, 6.28); g.fill(); g.beginPath(); g.moveTo(-24, 0); g.lineTo(-42, -14); g.lineTo(-42, 14); g.fill(); g.shadowBlur = 0; g.fillStyle = "#fff"; g.beginPath(); g.arc(12, -4, 5, 0, 6.28); g.fill(); }
    else if (tipo === "dragon") { g.beginPath(); g.moveTo(0, -30); g.lineTo(34, 0); g.lineTo(10, 6); g.lineTo(0, 30); g.lineTo(-10, 6); g.lineTo(-34, 0); g.closePath(); g.fill(); }
    else { g.beginPath(); g.arc(0, 0, r || 24, 0, 6.28); g.fill(); }
    g.restore();
  }
  function txt(t, x, y, tam, col, al) { g.font = "800 " + tam + "px system-ui, sans-serif"; g.textAlign = al || "center"; g.textBaseline = "middle"; g.fillStyle = "rgba(0,0,0,.5)"; g.fillText(t, x + 2, y + 2); g.fillStyle = col; g.fillText(t, x, y); }
  function dibujar() {
    g.setTransform(escala * dpr, 0, 0, escala * dpr, (Math.random() - 0.5) * sacudir * escala * dpr, (Math.random() - 0.5) * sacudir * escala * dpr);
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, T.fondo); gr.addColorStop(1, T.fondo2); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    estrellas.forEach(function (s) { s.y = (s.y + s.v * 0.016 * velM) % H; g.fillStyle = "rgba(255,255,255,.5)"; g.fillRect(s.x, s.y, s.r, s.r); });
    if (estado === "inicio") {
      forma(W / 2, H / 2 - 120, E.jugador, E.colorJugador || T.primario, 40, 0);
      txt(E.titulo, W / 2, H / 2, 52, T.texto);
      var lineas = [], linea = ""; E.descripcion.split(" ").forEach(function (p) { if ((linea + " " + p).length > 44) { lineas.push(linea); linea = p; } else linea = linea ? linea + " " + p : p; }); lineas.push(linea);
      lineas.slice(0, 3).forEach(function (l, i) { txt(l, W / 2, H / 2 + 50 + i * 28, 21, T.texto); });
      txt(("ontouchstart" in window) ? "Tocá para jugar" : "Pulsá Espacio o hacé clic para jugar", W / 2, H / 2 + 160, 24, T.acento);
      if (record) txt("Récord: " + Math.floor(record), W / 2, H / 2 + 205, 20, T.secundario);
      return;
    }
    if (E.genero === "plataformas") plataformas.forEach(function (p) { var px = p.x - camX; g.fillStyle = T.primario; g.fillRect(px, p.y, p.w, 14); g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(px, p.y + 14, p.w, H - p.y); });
    cosas.forEach(function (c) {
      var col = c.tipo === "obj" ? T.acento : c.tipo === "enemigo" ? T.secundario : T.peligro;
      g.save(); g.translate(c.sx, c.y); g.rotate(c.tipo === "obst" ? c.rot : 0); g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 12;
      if (c.tipo === "obj") { g.beginPath(); for (var i = 0; i < 10; i++) { var a = i / 10 * 6.28 - 1.57, rr = i % 2 ? c.r * 0.45 : c.r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.fill(); }
      else if (c.tipo === "enemigo") { g.beginPath(); g.arc(0, 0, c.r, Math.PI, 0); g.lineTo(c.r, c.r); g.lineTo(-c.r, c.r); g.fill(); g.shadowBlur = 0; g.fillStyle = "#fff"; g.fillRect(-9, -6, 6, 8); g.fillRect(4, -6, 6, 8); }
      else { g.beginPath(); for (var j = 0; j < 7; j++) { var b = j / 7 * 6.28, r2 = c.r * (0.75 + (j % 3) * 0.12); g.lineTo(Math.cos(b) * r2, Math.sin(b) * r2); } g.fill(); }
      g.restore();
    });
    balas.forEach(function (b) { g.fillStyle = b.malo ? T.peligro : T.acento; g.fillRect(b.x - 3, b.y - 9, 6, 18); });
    if (jefe) { forma(jefe.x, jefe.y, "dragon", T.peligro, 0, 0); g.save(); g.translate(jefe.x, jefe.y); g.scale(2.6, 2.6); forma(0, 0, "dragon", T.peligro, 0, 0); g.restore(); g.fillStyle = "rgba(0,0,0,.5)"; g.fillRect(60, 90, W - 120, 12); g.fillStyle = T.peligro; g.fillRect(60, 90, (W - 120) * jefe.hp / jefe.max, 12); }
    jugadores.forEach(function (j) { if (!j.vivo || (j.inv > 0 && Math.floor(tiempo * 14) % 2)) return; forma(j.x, E.genero === "plataformas" ? j.y : j.y, E.jugador, j.col, 24, 0); });
    particulas.forEach(function (p) { g.globalAlpha = Math.max(0, p.v / 0.6); g.fillStyle = p.c; g.fillRect(p.x, p.y, 4, 4); }); g.globalAlpha = 1;
    txt(String(Math.floor(puntos)), 24, 40, 34, T.texto, "left");
    txt("Nivel " + nivel + "/" + E.niveles, 24, 78, 18, T.secundario, "left");
    jugadores.forEach(function (j, i) { txt((E.dosJugadores ? "J" + (i + 1) + " " : "") + "♥".repeat(Math.max(0, j.vidas)), W / 2, 40 + i * 30, 24, j.col); });
    txt("II", W - 40, 40, 30, T.texto);
    if (aviso) { g.globalAlpha = Math.min(1, aviso.v * 2); txt(aviso.t, W / 2, H * 0.32, 50, T.acento); g.globalAlpha = 1; }
    if (estado === "pausa") { g.fillStyle = "rgba(0,0,0,.6)"; g.fillRect(0, 0, W, H); txt("Pausa", W / 2, H / 2, 60, T.texto); txt("Tocá o pulsá P para seguir", W / 2, H / 2 + 60, 22, T.acento); }
    if (estado === "victoria" || estado === "derrota") {
      g.fillStyle = "rgba(0,0,0,.65)"; g.fillRect(0, 0, W, H);
      txt(estado === "victoria" ? "¡Ganaste!" : "Fin del juego", W / 2, H / 2 - 60, 64, estado === "victoria" ? T.acento : T.peligro);
      txt("Puntos: " + Math.floor(puntos), W / 2, H / 2 + 10, 30, T.texto); txt("Récord: " + Math.floor(record), W / 2, H / 2 + 52, 22, T.secundario);
      txt("Tocá o pulsá Espacio para jugar otra vez", W / 2, H / 2 + 120, 22, T.texto);
    }
  }
  var ultimo = performance.now();
  function cuadro(ahora) {
    var dt = Math.min(0.05, (ahora - ultimo) / 1000); ultimo = ahora;
    if (estado === "jugando") actualizar(dt);
    else particulas && particulas.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.v -= dt; });
    dibujar();
    requestAnimationFrame(cuadro);
  }
  document.addEventListener("visibilitychange", function () { if (document.hidden && estado === "jugando") alternarPausa(); });
  requestAnimationFrame(cuadro);
})();
`;
