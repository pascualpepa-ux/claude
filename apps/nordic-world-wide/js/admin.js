/* Panel admin — NORDIC WORLD WIDE */
(function () {
  "use strict";

  var TEAM = ["Pascual", "Billy", "Pelayo"];
  var $ = function (id) { return document.getElementById(id); };
  var session = load();
  var chatTimer = null, statsTimer = null, lastChatLen = -1;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function load() { try { return JSON.parse(sessionStorage.getItem("nww-admin") || "null"); } catch (e) { return null; } }
  function save(s) { try { s ? sessionStorage.setItem("nww-admin", JSON.stringify(s)) : sessionStorage.removeItem("nww-admin"); } catch (e) {} }
  function fmtDate(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) + " · " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  }

  function api(path, opts) {
    opts = opts || {};
    var headers = { "x-admin-pass": session ? session.pass : "" };
    if (opts.body) headers["Content-Type"] = "application/json";
    return fetch(path, { method: opts.method || "GET", headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) {
          if (r.status === 401) { logout(); throw new Error("Clave incorrecta"); }
          if (data.error === "NO_DB") { $("db-setup").hidden = false; throw new Error("NO_DB"); }
          if (!r.ok) throw new Error(data.message || "Error " + r.status);
          return data;
        });
      });
  }

  /* ---------- Login ---------- */
  $("who").innerHTML = TEAM.map(function (n, i) {
    return '<label><input type="radio" name="who" value="' + n + '"' + (i === 0 ? " checked" : "") + "><span>" + n + "</span></label>";
  }).join("");

  $("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = (document.querySelector('input[name="who"]:checked') || {}).value;
    var pass = $("pass").value;
    $("login-err").textContent = "";
    if (!pass) { $("login-err").textContent = "Escribe la clave."; return; }
    $("login-btn").disabled = true;
    session = { name: name, pass: pass };
    fetch("/api/messages", { headers: { "x-admin-pass": pass } })
      .then(function (r) {
        if (r.status === 401) throw new Error("Clave incorrecta.");
        if (r.status === 404) throw new Error("El panel solo funciona en la web publicada.");
        save(session);
        showPanel();
      })
      .catch(function (err) { session = null; $("login-err").textContent = err.message || "No se pudo entrar."; })
      .then(function () { $("login-btn").disabled = false; });
  });

  function logout() {
    save(null); session = null;
    clearInterval(chatTimer); clearInterval(statsTimer);
    $("panel-view").hidden = true; $("login-view").hidden = false;
    $("pass").value = "";
  }
  $("logout").addEventListener("click", logout);

  /* ---------- Panel ---------- */
  function showPanel() {
    $("login-view").hidden = true; $("panel-view").hidden = false;
    $("me-name").textContent = session.name;
    loadCount(); loadStats(); loadChat();
    clearInterval(chatTimer);
    chatTimer = setInterval(function () { if (!document.hidden) { loadChat(); loadCount(); } }, 4000);
    clearInterval(statsTimer);
    statsTimer = setInterval(function () { if (!document.hidden) loadStats(); }, 60000);
  }

  function loadCount() {
    return api("/api/messages").then(function (d) { $("t-msgs").textContent = d.count; }).catch(function () {});
  }

  function loadStats() {
    api("/api/stats").then(function (d) {
      if (!d.configured) {
        $("chart-wrap").innerHTML = '<p class="setup">Falta conectar GoatCounter al panel: crear un token en GoatCounter → Settings → API y guardarlo en Vercel como <strong>GOATCOUNTER_TOKEN</strong>. Ver README.</p>';
        return;
      }
      if (d.dashboard) $("gc-link").href = d.dashboard;
      var days = d.days || [];
      var max = Math.max.apply(null, days.map(function (x) { return x.count; }).concat([1]));
      var today = days.length ? days[days.length - 1].count : 0;
      $("t-visits").textContent = d.total;
      $("t-today").textContent = today;
      $("chart-wrap").innerHTML =
        '<div class="chart" role="img" aria-label="Visitas por día, últimos 30 días">' +
        days.map(function (x) {
          var h = Math.round((x.count / max) * 100);
          return '<div class="bar' + (x.count ? "" : " zero") + '" style="height:' + Math.max(h, 1) + '%" title="' + x.day + ": " + x.count + ' visitas">' + (x.count ? "<span>" + x.count + "</span>" : "") + "</div>";
        }).join("") +
        "</div>" +
        '<div class="axis"><span>' + (days[0] ? days[0].day.slice(5) : "") + "</span><span>hoy</span></div>" +
        '<p class="note" style="margin:10px 0 0">Se actualiza solo cada minuto · última vez ' + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) + "</p>";
    }).catch(function (err) {
      if (err.message !== "NO_DB") $("chart-wrap").innerHTML = '<p class="setup">No se pudieron cargar las visitas (' + esc(err.message) + ").</p>";
    });
  }

  /* ---------- Mensajes (ocultos hasta pulsar) ---------- */
  var msgsOpen = false;
  $("toggle-msgs").addEventListener("click", function () {
    msgsOpen = !msgsOpen;
    $("toggle-msgs").textContent = msgsOpen ? "Ocultar mensajes" : "Ver mensajes";
    $("msgs").hidden = !msgsOpen;
    $("msgs-note").hidden = msgsOpen;
    if (!msgsOpen) { $("msgs").innerHTML = ""; return; }
    $("msgs").innerHTML = '<p class="note">Cargando…</p>';
    api("/api/messages?full=1").then(function (d) {
      $("t-msgs").textContent = d.count;
      if (!d.messages.length) { $("msgs").innerHTML = '<p class="note">Todavía no hay mensajes.</p>'; return; }
      $("msgs").innerHTML = d.messages.map(function (m) {
        return '<article class="msg">' +
          '<div class="msg-head"><span class="pill ' + (m.tipo === "pedido" ? "pedido" : "") + '">' + (m.tipo === "pedido" ? "PEDIDO" : "CONSULTA") + "</span><span>" + fmtDate(m.fecha) + "</span></div>" +
          '<p class="msg-meta"><strong>' + esc(m.nombre) + "</strong> · " + esc(m.email) + (m.telefono ? " · " + esc(m.telefono) : "") +
          (m.producto ? "<br>Producto: <strong>" + esc(m.producto) + "</strong>" + (m.talla ? " · Talla " + esc(m.talla) : "") : "") +
          (m.adjunto ? "<br>Con imagen adjunta (ver el email)" : "") + "</p>" +
          '<div class="msg-body">' + esc(m.mensaje) + "</div>" +
          "</article>";
      }).join("");
    }).catch(function (err) {
      $("msgs").innerHTML = '<p class="note">' + (err.message === "NO_DB" ? "La base de datos no está conectada." : "Error: " + esc(err.message)) + "</p>";
    });
  });

  /* ---------- Chat ---------- */
  function loadChat() {
    return api("/api/chat").then(function (d) {
      var list = d.messages || [];
      if (list.length === lastChatLen) return;
      lastChatLen = list.length;
      var log = $("chat-log");
      var atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
      log.innerHTML = list.length ? list.map(function (m) {
        return '<div class="bubble' + (m.nombre === session.name ? " me" : "") + '">' +
          '<div class="who-name c-' + esc(m.nombre) + '">' + esc(m.nombre) + '<span class="time">' + fmtDate(m.fecha) + "</span></div>" +
          "<p>" + esc(m.texto) + "</p></div>";
      }).join("") : '<p class="note">Todavía no hay mensajes. ¡Escribe el primero!</p>';
      if (atBottom || lastChatLen <= 1) log.scrollTop = log.scrollHeight;
      $("chat-status").textContent = "Actualizado " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    }).catch(function (err) {
      if (err.message === "NO_DB") $("chat-log").innerHTML = '<p class="note">El chat necesita la base de datos conectada.</p>';
    });
  }

  $("chat-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var text = $("chat-text").value.trim();
    if (!text) return;
    $("chat-send").disabled = true;
    api("/api/chat", { method: "POST", body: { nombre: session.name, texto: text } })
      .then(function () { $("chat-text").value = ""; lastChatLen = -1; return loadChat(); })
      .then(function () { var log = $("chat-log"); log.scrollTop = log.scrollHeight; })
      .catch(function (err) { if (err.message !== "NO_DB") alertInline(err.message); })
      .then(function () { $("chat-send").disabled = false; $("chat-text").focus(); });
  });
  $("chat-text").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("chat-form").requestSubmit(); }
  });
  function alertInline(msg) { $("chat-status").textContent = "No se envió: " + msg; }

  if (session) showPanel();
})();
