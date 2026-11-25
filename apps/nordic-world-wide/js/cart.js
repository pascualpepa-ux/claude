/* Carrito y pago con tarjeta (Stripe Checkout) — NORDIC WORLD WIDE
   Solo aparece si el servidor tiene la clave de Stripe (GET /api/checkout → active).
   Envío: 4,99 € por pedido, siempre (lo calcula también el servidor). */
(function () {
  "use strict";

  var I18N = window.NWW_I18N || { t: function (k) { return k; }, apply: function () {}, getLang: function () { return "es"; }, locale: function () { return "es-ES"; } };
  var t = I18N.t;
  var CFG = window.SITE_CONFIG || {};
  var PRODUCTS = window.PRODUCTS || [];
  var KEY = "nww-cart";
  var ENVIO = 4.99;

  var api = { active: false, test: false, add: add, buyNow: buyNow, ready: false };
  window.NWW_CART = api;

  function $(s, c) { return (c || document).querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function money(n) { return n.toLocaleString(I18N.locale(), { style: "currency", currency: "EUR" }); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "[]").filter(function (i) { return find(i.id); }); } catch (e) { return []; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  function find(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; }
  var cart = load();

  function units() { return cart.reduce(function (a, i) { return a + i.cantidad; }, 0); }
  function subtotal() { return cart.reduce(function (a, i) { var p = find(i.id); return a + (p ? p.precio * i.cantidad : 0); }, 0); }
  function shipping() { return units() ? ENVIO : 0; }

  function add(id, talla) {
    var p = find(id); if (!p || typeof p.precio !== "number") return;
    var it = cart.filter(function (i) { return i.id === id && i.talla === talla; })[0];
    if (it) it.cantidad = Math.min(10, it.cantidad + 1); else cart.push({ id: id, talla: talla, cantidad: 1 });
    save(); render(); open(true);
  }

  /* ---------- Interfaz ---------- */
  var btn, panel;
  function build() {
    var header = $("#header");
    btn = document.createElement("button");
    btn.className = "cart-btn"; btn.type = "button";
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg><span class="cart-count" id="cart-count">0</span>';
    var lang = $(".lang-toggle", header);
    header.insertBefore(btn, lang || $(".nav-toggle", header));
    btn.addEventListener("click", function () { open(panel.hidden); });

    panel = document.createElement("aside");
    panel.className = "cart-panel"; panel.id = "cart-panel"; panel.hidden = true;
    panel.setAttribute("role", "dialog");
    document.body.appendChild(panel);
    panel.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var i = +b.getAttribute("data-i");
      if (b.hasAttribute("data-close")) open(false);
      else if (b.hasAttribute("data-plus")) { cart[i].cantidad = Math.min(10, cart[i].cantidad + 1); save(); render(); }
      else if (b.hasAttribute("data-minus")) { cart[i].cantidad--; if (cart[i].cantidad < 1) cart.splice(i, 1); save(); render(); }
      else if (b.hasAttribute("data-remove")) { cart.splice(i, 1); save(); render(); }
      else if (b.hasAttribute("data-pay")) pay(b);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) open(false); });
    document.addEventListener("nww:lang", render);
  }

  function open(show) {
    if (!panel) return;
    panel.hidden = !show;
    document.body.classList.toggle("cart-open", show);
    if (show) { var c = $("[data-close]", panel); if (c) c.focus(); }
  }

  function render() {
    if (!btn) return;
    var n = units();
    $("#cart-count").textContent = n;
    btn.classList.toggle("has-items", n > 0);
    btn.setAttribute("aria-label", t("cart.open") + " (" + n + ")");
    panel.setAttribute("aria-label", t("cart.title"));
    var rows = cart.map(function (i, k) {
      var p = find(i.id);
      return '<li class="cart-item">' +
        '<img src="' + esc((p.fotos || [])[0]) + '" alt="" width="72" height="72">' +
        '<div class="cart-info"><strong>' + esc(p.nombre) + "</strong><span>" + esc(t("cart.size")) + " " + esc(i.talla) + " · " + money(p.precio) + "</span>" +
        '<div class="cart-qty"><button type="button" data-minus data-i="' + k + '" aria-label="−">−</button><span>' + i.cantidad + '</span><button type="button" data-plus data-i="' + k + '" aria-label="+">+</button>' +
        '<button type="button" class="cart-remove" data-remove data-i="' + k + '">' + esc(t("cart.remove")) + "</button></div></div>" +
        '<span class="cart-line">' + money(p.precio * i.cantidad) + "</span></li>";
    }).join("");
    var ship = shipping();
    panel.innerHTML =
      '<header class="cart-head"><h2>' + esc(t("cart.title")) + '</h2><button type="button" class="cart-close" data-close aria-label="' + esc(t("cart.close")) + '">×</button></header>' +
      (api.test ? '<p class="cart-test">' + esc(t("cart.test")) + "</p>" : "") +
      (cart.length ? '<ul class="cart-list">' + rows + "</ul>" +
        '<div class="cart-sum">' +
          "<p><span>" + esc(t("cart.subtotal")) + "</span><span>" + money(subtotal()) + "</span></p>" +
          "<p><span>" + esc(t("cart.shipping")) + "</span><span>" + (ship ? money(ship) : esc(t("cart.free"))) + "</span></p>" +
          '<p class="cart-total"><span>' + esc(t("cart.total")) + "</span><span>" + money(subtotal() + ship) + "</span></p>" +
          '<button type="button" class="btn btn-dark cart-pay" data-pay>' + esc(t("cart.pay")) + "</button>" +
          '<p class="cart-secure">' + esc(t("cart.secure")) + "</p>" +
          '<p class="cart-error" role="alert"></p>' +
        "</div>"
        : '<p class="cart-empty">' + esc(t("cart.empty")) + '</p><a class="btn btn-dark" href="index.html#shop" data-close-link>' + esc(t("cart.toShop")) + "</a>");
    var link = $("[data-close-link]", panel); if (link) link.addEventListener("click", function () { open(false); });
  }

  function pay(b) {
    b.disabled = true; b.textContent = t("cart.paying");
    fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: cart, lang: I18N.getLang() }) })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok || !d.url) throw new Error(d.message || d.error || r.status); return d; }); })
      .then(function (d) { location.href = d.url; })
      .catch(function () {
        b.disabled = false; b.textContent = t("cart.pay");
        $(".cart-error", panel).textContent = t("cart.error");
      });
  }

  // Reservar y pagar una camiseta directamente (sin carrito): va a la página de pago de Stripe.
  function buyNow(id, talla) {
    return fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: [{ id: id, talla: talla, cantidad: 1 }], lang: I18N.getLang() }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) {
        if (r.status === 409) throw new Error("FULL");
        if (!r.ok || !d.url) throw new Error(d.message || d.error || r.status);
        location.href = d.url;
      }); });
  }

  /* ---------- Vuelta desde Stripe ---------- */
  function banner(msg, ok) {
    var d = document.createElement("div");
    d.className = "pay-banner" + (ok ? " ok" : "");
    d.setAttribute("role", "status");
    d.innerHTML = "<p>" + esc(msg) + '</p><button type="button" aria-label="×">×</button>';
    document.body.appendChild(d);
    d.querySelector("button").addEventListener("click", function () { d.remove(); });
  }

  // Avisa al equipo de un pedido PAGADO (mismos caminos que el formulario de contacto).
  function notifyTeam(o) {
    var lines = o.items.map(function (i) { return "• " + i.cantidad + " × " + i.nombre + " — " + i.importe.toFixed(2).replace(".", ",") + " €"; });
    var asunto = (o.test ? "🧪 PRUEBA (no es real) · " : "") + "💳 PEDIDO PAGADO – " + o.total.toFixed(2).replace(".", ",") + " € – " + (o.nombre || o.email);
    var texto = ["PEDIDO PAGADO CON TARJETA (Stripe)", "", lines.join("\n"), "", "Envío: " + (o.envio ? o.envio.toFixed(2).replace(".", ",") + " €" : "gratis"), "Total cobrado: " + o.total.toFixed(2).replace(".", ",") + " €", "",
      "Cliente: " + o.nombre, "Email: " + o.email, o.telefono ? "Teléfono: " + o.telefono : null, "Dirección de envío: " + o.direccion, "", "Referencia Stripe: " + o.id].filter(function (x) { return x !== null; }).join("\n");
    var jobs = [];
    if (CFG.destinatario) {
      var fd = new FormData();
      fd.append("_subject", asunto); fd.append("_replyto", o.email); fd.append("_cc", (CFG.copias || []).join(","));
      fd.append("_template", "box"); fd.append("_captcha", "false");
      fd.append("Pedido", lines.join(" | ")); fd.append("Total cobrado", o.total.toFixed(2) + " €"); fd.append("Envío", o.envio ? o.envio.toFixed(2) + " €" : "gratis");
      fd.append("Cliente", o.nombre); fd.append("Email", o.email); if (o.telefono) fd.append("Teléfono", o.telefono);
      fd.append("Dirección de envío", o.direccion); fd.append("Referencia Stripe", o.id);
      jobs.push(fetch("https://formsubmit.co/ajax/" + encodeURIComponent(CFG.destinatario), { method: "POST", headers: { Accept: "application/json" }, body: fd }));
    }
    var ej = CFG.emailjs || {};
    if (ej.serviceId && ej.templateId && ej.publicKey) {
      jobs.push(fetch("https://api.emailjs.com/api/v1.0/email/send", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: ej.serviceId, template_id: ej.templateId, user_id: ej.publicKey,
          template_params: { to_email: CFG.destinatario, cc_emails: (CFG.copias || []).join(","), reply_to: o.email, from_name: o.nombre, subject: asunto, message: texto } }) }));
    }
    jobs.push(fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "pedido", nombre: o.nombre || "Cliente", email: o.email, telefono: o.telefono, producto: "PAGADO " + o.total.toFixed(2) + " €", mensaje: texto }) }));
    return Promise.all(jobs.map(function (p) { return p.catch(function () {}); }));
  }

  function handleReturn() {
    var params = new URLSearchParams(location.search);
    var estado = params.get("pago");
    if (!estado) return;
    var clean = location.pathname + location.hash;
    if (estado === "cancelado") { banner(t("pay.cancel"), false); history.replaceState(null, "", clean); return; }
    var sid = params.get("session_id");
    if (estado !== "ok" || !sid) return;
    history.replaceState(null, "", clean);
    cart = []; save(); render();
    banner(t("pay.ok"), true);
    var flag = "nww-notified-" + sid;
    try { if (localStorage.getItem(flag)) return; } catch (e) {}
    fetch("/api/checkout?session_id=" + encodeURIComponent(sid))
      .then(function (r) { return r.json(); })
      .then(function (o) {
        if (!o || !o.paid) return;
        return notifyTeam(o).then(function () { try { localStorage.setItem(flag, "1"); } catch (e) {} });
      })
      .catch(function () {});
  }

  /* ---------- Arranque: ¿hay pagos activos? ---------- */
  // Pago con tarjeta: solo si CFG.pagosConTarjeta (js/config.js) y el servidor tiene la clave de Stripe.
  (CFG.pagosConTarjeta ? fetch("/api/checkout") : Promise.reject()).then(function (r) { return r.ok ? r.json() : { active: false }; })
    .catch(function () { return { active: false }; })
    .then(function (s) {
      api.active = !!s.active; api.test = !!s.test; api.ready = true;
      // Solo con la clave REAL de Stripe; con la de prueba la web sigue con el formulario.
      if (api.test) api.active = false;
      if (api.active) { build(); render(); }
      handleReturn();
      document.dispatchEvent(new CustomEvent("nww:cart-ready", { detail: { active: api.active } }));
    });
})();
