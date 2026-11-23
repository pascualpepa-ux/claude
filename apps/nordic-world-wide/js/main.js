/* NORDIC WORLD WIDE — lógica del sitio (sin dependencias) */
(function () {
  "use strict";

  var PRODUCTS = window.PRODUCTS || [];
  var CFG = window.SITE_CONFIG || {};
  var I18N = window.NWW_I18N || { t: function (k) { return k; }, apply: function () {}, setLang: function () {}, getLang: function () { return "es"; }, locale: function () { return "es-ES"; } };
  var t = I18N.t;
  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };
  var SIZE_SUFFIX = /\s*–\s*(Talla|Size)\s+\S+$/;

  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function formatPrice(p) {
    if (typeof p !== "number" || !isFinite(p)) return '<span class="price is-tbd">' + esc(t("price.tbd")) + "</span>";
    return '<span class="price">' + p.toLocaleString(I18N.locale(), { style: "currency", currency: "EUR" }) + "</span>";
  }

  function tagText(p) { return (I18N.getLang() === "en" && p.etiqueta_en) || p.etiqueta; }

  function productUrl(p) { return "producto.html?id=" + encodeURIComponent(p.id); }

  // Cada parte que se dibuja con JS se registra aquí para redibujarse al cambiar de idioma
  var onLangChange = [];
  document.addEventListener("nww:lang", function () { onLangChange.forEach(function (fn) { fn(); }); });

  /* ---------- Idioma (botón ES / EN) ---------- */
  I18N.apply();
  $$(".lang-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () { I18N.setLang(I18N.getLang() === "es" ? "en" : "es"); });
  });

  /* ---------- Header + menú ---------- */
  var header = $("#header");
  var toggle = $(".nav-toggle");
  var isHome = !!$(".hero");

  function onScroll() {
    if (!isHome) return;
    header.classList.toggle("is-solid", window.scrollY > window.innerHeight * 0.6);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function navLabel() {
    if (!toggle) return;
    var open = document.body.classList.contains("nav-open");
    toggle.setAttribute("aria-label", t(open ? "nav.close" : "nav.open"));
  }
  function closeNav() {
    document.body.classList.remove("nav-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    navLabel();
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
      navLabel();
    });
  }
  onLangChange.push(navLabel);
  $$(".nav a").forEach(function (a) { a.addEventListener("click", closeNav); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });

  /* ---------- Estadísticas (GoatCounter) ---------- */
  var gc = String(CFG.goatcounter || "").replace(/[^a-z0-9-]/gi, "");
  if (gc && !CFG.demo) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.setAttribute("data-goatcounter", "https://" + gc + ".goatcounter.com/count");
    document.head.appendChild(s);
  }

  /* ---------- Footer ---------- */
  $$(".year").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Asistente con IA (botón flotante) ---------- */
  (function assistant() {
    var KEY = "nww-assistant";
    var history = [];
    try { history = JSON.parse(sessionStorage.getItem(KEY) || "[]"); } catch (e) { history = []; }
    var busy = false;

    var root = document.createElement("div");
    root.className = "ai";
    root.innerHTML =
      '<button class="ai-fab" type="button" aria-expanded="false" aria-controls="ai-panel">' +
        '<svg class="ai-ico-open" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" stroke-width="2.6" stroke-linecap="round"/></svg>' +
        '<svg class="ai-ico-close" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      "</button>" +
      '<section class="ai-panel" id="ai-panel" role="dialog" data-i18n-attr="aria-label:ai.dialog" hidden>' +
        '<header class="ai-head"><div><p class="ai-title" data-i18n="ai.title"></p><p class="ai-sub" data-i18n="ai.sub"></p></div>' +
        '<button class="ai-close" type="button" data-i18n-attr="aria-label:ai.close">×</button></header>' +
        '<div class="ai-log" id="ai-log" aria-live="polite"></div>' +
        '<div class="ai-chips" id="ai-chips"></div>' +
        '<form class="ai-form" id="ai-form"><input id="ai-input" type="text" maxlength="1500" autocomplete="off" data-i18n-attr="placeholder:ai.placeholder;aria-label:ai.inputLabel">' +
        '<button type="submit" data-i18n-attr="aria-label:ai.send"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg></button></form>' +
        '<p class="ai-legal" data-i18n="ai.legal"></p>' +
      "</section>";
    document.body.appendChild(root);
    I18N.apply(root);

    var fab = $(".ai-fab", root), panel = $("#ai-panel"), log = $("#ai-log"), input = $("#ai-input"), chips = $("#ai-chips");

    function save() { try { sessionStorage.setItem(KEY, JSON.stringify(history.slice(-20))); } catch (e) {} }
    function bubble(role, text) {
      var d = document.createElement("div");
      d.className = "ai-msg ai-" + role;
      d.textContent = text;
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
      return d;
    }
    function fabLabel() { fab.setAttribute("aria-label", t(panel.hidden ? "ai.open" : "ai.close")); }

    // ¿Está activado el asistente? (null = todavía no se sabe)
    var active = null;
    function checkActive() {
      return fetch("/api/assistant")
        .then(function (r) { return r.ok ? r.json() : { active: false }; })
        .then(function (d) { active = !!d.active; })
        .catch(function () { active = true; }); // sin conexión: se intenta al preguntar
    }
    function applyState() {
      var off = active === false;
      root.classList.toggle("is-off", off);
      $(".ai-title", root).setAttribute("data-i18n", off ? "ai.offTitle" : "ai.title");
      $(".ai-sub", root).setAttribute("data-i18n", off ? "ai.offSub" : "ai.sub");
      input.disabled = off;
      $("#ai-form button").disabled = off;
      input.setAttribute("data-i18n-attr", (off ? "placeholder:ai.offPlaceholder" : "placeholder:ai.placeholder") + ";aria-label:ai.inputLabel");
      I18N.apply(root);
    }

    function render() {
      log.innerHTML = "";
      if (active === false) {
        bubble("assistant", t("ai.offText"));
        var cta = document.createElement("a");
        cta.className = "ai-cta";
        cta.href = $("#contacto") ? "#contacto" : "index.html#contacto";
        cta.textContent = t("ai.offCta");
        cta.addEventListener("click", function () { toggle(false); });
        log.appendChild(cta);
        chips.innerHTML = "";
        return;
      }
      bubble("assistant", t("ai.hello"));
      history.forEach(function (m) { bubble(m.role, m.content); });
      chips.innerHTML = history.length ? "" : ["ai.s1", "ai.s2", "ai.s3"].map(function (k) { return '<button type="button">' + esc(t(k)) + "</button>"; }).join("");
    }
    function toggle(open) {
      panel.hidden = !open;
      root.classList.toggle("is-open", open);
      fab.setAttribute("aria-expanded", String(open));
      fabLabel();
      if (!open) return;
      var show = function () { applyState(); render(); if (!input.disabled) setTimeout(function () { input.focus(); }, 50); };
      if (active === null) { render(); checkActive().then(show); } else show();
    }
    function ask(text) {
      text = String(text || "").trim();
      if (!text || busy) return;
      busy = true;
      chips.innerHTML = "";
      history.push({ role: "user", content: text });
      bubble("user", text);
      input.value = "";
      var typing = bubble("assistant", "");
      typing.classList.add("ai-typing");
      typing.innerHTML = "<span></span><span></span><span></span>";
      fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, lang: I18N.getLang() })
      })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (d) {
          if (d.error === "NOT_CONFIGURED") { // la clave se quitó o no es válida
            history.pop(); save();
            active = false; applyState(); render();
            return;
          }
          var reply = d.reply || t("ai.fail");
          typing.classList.remove("ai-typing");
          typing.textContent = reply;
          if (d.reply && !d.error) { history.push({ role: "assistant", content: reply }); }
          else { history.pop(); } // no guardar preguntas sin respuesta real
          save();
        })
        .catch(function () {
          typing.classList.remove("ai-typing");
          typing.textContent = t("ai.offline");
          history.pop();
        })
        .then(function () { busy = false; log.scrollTop = log.scrollHeight; if (!input.disabled) input.focus(); });
    }

    fabLabel();
    onLangChange.push(function () { I18N.apply(root); fabLabel(); if (!panel.hidden && !busy) render(); });
    fab.addEventListener("click", function () { toggle(panel.hidden); });
    $(".ai-close", root).addEventListener("click", function () { toggle(false); fab.focus(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { toggle(false); fab.focus(); } });
    $("#ai-form").addEventListener("submit", function (e) { e.preventDefault(); ask(input.value); });
    chips.addEventListener("click", function (e) { if (e.target.tagName === "BUTTON") ask(e.target.textContent); });
  })();

  /* ---------- Shop ---------- */
  var grid = $("#shop-grid");
  function renderShop(visible) {
    var rv = visible ? "reveal is-visible" : "reveal";
    if (!PRODUCTS.length) {
      grid.classList.add("is-empty");
      grid.innerHTML =
        '<div class="empty ' + rv + '">' +
          '<p class="empty-title">' + t("shop.emptyTitle") + "</p>" +
          '<p class="empty-sub">' + esc(t("shop.emptySub")) + "</p>" +
          '<a class="btn btn-dark" href="#contacto">' + esc(t("shop.emptyCta")) + "</a>" +
        "</div>";
      return;
    }
    grid.innerHTML = PRODUCTS.map(function (p, i) {
      var fotos = p.fotos || [];
      return (
        '<article class="card ' + rv + '" style="transition-delay:' + (i % 4) * 80 + 'ms">' +
          '<a class="card-media" href="' + productUrl(p) + '" aria-label="' + esc(p.nombre) + '">' +
            (p.etiqueta ? '<span class="badge">' + esc(tagText(p)) + "</span>" : "") +
            '<img src="' + esc(fotos[0]) + '" alt="' + esc(p.nombre) + '" loading="lazy" width="900" height="900">' +
            (fotos[1] ? '<img class="img-alt" src="' + esc(fotos[1]) + '" alt="" loading="lazy" width="900" height="900">' : "") +
          "</a>" +
          '<div class="card-body">' +
            '<h3 class="card-name"><a href="' + productUrl(p) + '">' + esc(p.nombre) + "</a></h3>" +
            formatPrice(p.precio) +
            '<a class="btn btn-dark" href="' + productUrl(p) + '">' + esc(t("shop.want")) + "</a>" +
          "</div>" +
        "</article>"
      );
    }).join("");
  }
  if (grid) {
    renderShop(false);
    onLangChange.push(function () { renderShop(true); });
    var dl = $("#product-list");
    if (dl) dl.innerHTML = PRODUCTS.map(function (p) { return '<option value="' + esc(p.nombre) + '">'; }).join("");
  }

  /* ---------- Página de producto ---------- */
  var productEl = $("#product");
  if (productEl) {
    var id = new URLSearchParams(location.search).get("id");
    var p = PRODUCTS.filter(function (x) { return x.id === id; })[0];

    var renderProduct = function () {
      if (!p) {
        productEl.innerHTML = '<div class="not-found"><h1 class="section-title">' + esc(t("product.notFound")) + "</h1><p>" + esc(t("product.notFoundText")) + '</p><a class="btn btn-dark" href="index.html#shop">' + esc(t("product.back")) + "</a></div>";
        return;
      }
      document.title = p.nombre + " | NORDIC WORLD WIDE | Streetwear";
      var meta = $('meta[name="description"]');
      var desc = (I18N.getLang() === "en" && p.descripcion_en) || p.descripcion;
      if (meta && desc) meta.setAttribute("content", p.nombre + " — " + desc);

      var prevSize = ($('input[name="talla"]:checked', productEl) || {}).value;
      var fotos = p.fotos || [];
      var tallas = p.tallas && p.tallas.length ? p.tallas : ["XS", "S", "M", "L", "XL"];
      productEl.innerHTML =
        '<div class="gallery-wrap">' +
          '<div class="gallery" id="gallery">' +
            fotos.map(function (f, i) { return '<img src="' + esc(f) + '" alt="' + esc(p.nombre) + " — " + esc(t("product.photo")) + " " + (i + 1) + '" width="900" height="900">'; }).join("") +
          "</div>" +
          (fotos.length > 1 ? '<div class="gallery-dots" id="dots">' + fotos.map(function (_, i) { return "<span" + (i === 0 ? ' class="on"' : "") + "></span>"; }).join("") + "</div>" : "") +
        "</div>" +
        '<div class="product-info">' +
          '<a class="breadcrumb" href="index.html#shop">← Shop</a>' +
          (p.etiqueta ? '<p class="eyebrow" style="margin-top:18px;color:var(--ice-deep)">' + esc(tagText(p)) + "</p>" : "") +
          '<h1 class="product-title">' + esc(p.nombre) + "</h1>" +
          formatPrice(p.precio) +
          (desc ? '<p class="product-desc">' + esc(desc) + "</p>" : "") +
          '<p class="sizes-label">' + esc(t("product.size")) + " <span>" + esc(t("product.sizeHint")) + "</span></p>" +
          '<fieldset class="sizes" id="sizes"><legend class="hp">' + esc(t("product.chooseSize")) + "</legend>" +
            tallas.map(function (sz) {
              return '<label class="size"><input type="radio" name="talla" value="' + esc(sz) + '"' + (sz === prevSize ? " checked" : "") + "><span>" + esc(sz) + "</span></label>";
            }).join("") +
          "</fieldset>" +
          '<button class="btn btn-dark" id="buy-btn" type="button">' + esc(t("product.buy")) + "</button>" +
          '<p class="size-error" id="size-error" role="alert"></p>' +
          '<ul class="product-notes"><li>' + esc(t("product.note1")) + "</li><li>" + esc(t("product.note2")) + "</li><li>" + esc(t("product.note3")) + "</li></ul>" +
        "</div>";

      var gallery = $("#gallery"), dots = $$("#dots span");
      if (gallery && dots.length) {
        gallery.addEventListener("scroll", function () {
          var idx = Math.round(gallery.scrollLeft / gallery.clientWidth);
          dots.forEach(function (d, i) { d.classList.toggle("on", i === idx); });
        }, { passive: true });
      }

      $("#buy-btn").addEventListener("click", function () {
        var sel = $('input[name="talla"]:checked', productEl);
        if (!sel) {
          $("#sizes").classList.add("is-invalid");
          $("#size-error").textContent = t("product.sizeError");
          return;
        }
        location.href = "index.html?producto=" + encodeURIComponent(p.nombre) + "&talla=" + encodeURIComponent(sel.value) + "#contacto";
      });
      $$('input[name="talla"]', productEl).forEach(function (r) {
        r.addEventListener("change", function () { $("#sizes").classList.remove("is-invalid"); $("#size-error").textContent = ""; });
      });
    };
    renderProduct();
    onLangChange.push(renderProduct);
  }

  /* ---------- Email directo en Contacto (js/config.js → emailPublico) ---------- */
  var direct = $("#contact-direct");
  if (direct && CFG.emailPublico) {
    var mail = String(CFG.emailPublico);
    var link = $("#direct-email");
    link.textContent = mail;
    link.href = "mailto:" + mail + "?subject=" + encodeURIComponent("NORDIC WORLD WIDE");
    direct.hidden = false;
    var copyBtn = $("#copy-email");
    copyBtn.addEventListener("click", function () {
      var done = function () {
        copyBtn.textContent = t("contact.copied");
        setTimeout(function () { copyBtn.textContent = t("contact.copy"); }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(mail).then(done, function () { selectText(link); });
      else selectText(link);
    });
    var selectText = function (el) { var r = document.createRange(); r.selectNodeContents(el); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); };
  }

  /* ---------- Formulario de contacto / pedido ---------- */
  var form = $("#contact-form");
  if (form) {
    var status = $("#form-status");
    var submitBtn = $("#submit-btn");
    var fileInput = $("#f-img");
    var fileName = $("#file-name");
    var mb = CFG.maxAdjuntoMB || 3;
    var maxBytes = mb * 1024 * 1024;
    var fileMsgKey = "form.fileHint"; // texto que se muestra bajo "Adjuntar imagen" mientras no haya archivo
    form.elements.ts.value = String(Date.now());

    var showFileHint = function () {
      var f = fileInput.files[0];
      fileName.textContent = f ? f.name : t(fileMsgKey, { mb: mb });
    };
    showFileHint();

    // Prefill desde la página de producto
    var params = new URLSearchParams(location.search);
    var preProd = params.get("producto"), preTalla = params.get("talla");
    var prefillText = "";
    var prefill = function () {
      if (!preProd) return;
      var prodField = preProd + (preTalla ? " – " + t("form.size") + " " + preTalla : "");
      if (!form.elements.producto.value || SIZE_SUFFIX.test(form.elements.producto.value)) form.elements.producto.value = prodField;
      var msg = t("form.prefill", { product: preProd, size: preTalla ? t("form.prefillSize", { size: preTalla }) : "" });
      // Solo reescribe el mensaje si el cliente no lo ha cambiado
      if (!form.elements.mensaje.value || form.elements.mensaje.value === prefillText) form.elements.mensaje.value = msg;
      prefillText = msg;
    };
    if (preProd) {
      form.elements.talla.value = preTalla || "";
      form.elements.tipo.value = "pedido";
      submitBtn.setAttribute("data-i18n", "form.sendOrder");
      submitBtn.textContent = t("form.sendOrder");
      prefill();
    }

    onLangChange.push(function () { showFileHint(); prefill(); });

    fileInput.addEventListener("change", function () {
      var f = fileInput.files[0];
      fileMsgKey = "form.fileHint";
      if (f && !/^image\//.test(f.type)) { fileInput.value = ""; fileMsgKey = "form.fileOnlyImages"; }
      else if (f && f.size > maxBytes) { fileInput.value = ""; fileMsgKey = "form.fileTooBig"; }
      showFileHint();
    });

    var setStatus = function (msg, kind) { status.textContent = msg; status.className = "form-status" + (kind ? " " + kind : ""); };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setStatus("");
      var ok = true;
      ["nombre", "email", "mensaje"].forEach(function (n) {
        var el = form.elements[n];
        var valid = el.value.trim() !== "" && (n !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
        el.classList.toggle("is-invalid", !valid);
        if (!valid) ok = false;
      });
      if (!ok) { setStatus(t("form.invalid"), "err"); return; }

      var nombre = form.elements.nombre.value.trim();
      var producto = form.elements.producto.value.trim();
      var esPedido = producto !== "";
      var tel = form.elements.telefono.value.trim();
      // Antispam: NUNCA se descarta un mensaje (un cliente real podría perderse). Si parece de un bot
      // (campo oculto relleno o enviado en menos de 2,5 s), se envía igual con un aviso en el asunto.
      var sospechoso = form.elements.nww_trap.value !== "" || Date.now() - Number(form.elements.ts.value) < 2500;

      // El email al equipo siempre va en español
      var talla = form.elements.talla.value;
      var prodSinTalla = talla ? producto.replace(SIZE_SUFFIX, "") : producto;
      var f = fileInput.files[0];
      var fd = new FormData();
      fd.append("_subject", (sospechoso ? "⚠️ Posible spam · " : "") + (esPedido ? "🛒 Pedido – " + producto.replace(/\s*–\s*Size\s+/, " – Talla ") : "✉️ Contacto – " + nombre));
      fd.append("_replyto", form.elements.email.value.trim());
      fd.append("_cc", (CFG.copias || []).join(","));
      fd.append("_template", "box");
      fd.append("_captcha", "false");
      fd.append("Tipo", esPedido ? "PEDIDO" : "CONSULTA");
      if (esPedido) fd.append("Producto", prodSinTalla);
      if (talla) fd.append("Talla", talla);
      fd.append("Cliente", nombre);
      fd.append("Email", form.elements.email.value.trim());
      if (tel) fd.append("Teléfono", tel);
      fd.append("Idioma de la web", I18N.getLang() === "en" ? "Inglés" : "Español");
      fd.append("Mensaje", form.elements.mensaje.value.trim());
      if (f) fd.append("Imagen", "Adjunta a este email");
      if (f) fd.append("attachment", f, f.name);

      submitBtn.disabled = true;
      submitBtn.textContent = t("form.sending");

      // Se envía por TODOS los caminos a la vez; basta con que uno funcione para no perder el pedido.
      var settle = function (pr) { return pr.then(function () { return true; }, function (e) { return e && e.message ? e.message : "error"; }); };
      var datos = {
        tipo: esPedido ? "pedido" : "contacto",
        nombre: nombre,
        email: form.elements.email.value.trim(),
        telefono: tel,
        producto: esPedido ? prodSinTalla : "",
        talla: talla,
        mensaje: form.elements.mensaje.value.trim(),
        adjunto: !!f
      };
      var asunto = fd.get("_subject");

      // 1) Panel admin (base de datos de Vercel)
      var viaAdmin = function () {
        return fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify(datos) })
          .then(function (r) { if (!r.ok) throw new Error("admin " + r.status); });
      };
      // 2) FormSubmit
      var viaFormSubmit = function () {
        return fetch("https://formsubmit.co/ajax/" + encodeURIComponent(CFG.destinatario), { method: "POST", headers: { Accept: "application/json" }, body: fd })
          .then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (body) {
              if (!res.ok || String(body.success) === "false") throw new Error(body.message || "FormSubmit " + res.status);
            });
          });
      };
      // 3) EmailJS (solo si está configurado en js/config.js)
      var ej = CFG.emailjs || {};
      var viaEmailJS = function () {
        if (!ej.serviceId || !ej.templateId || !ej.publicKey) return Promise.reject(new Error("EmailJS sin configurar"));
        var texto = [
          "Tipo: " + (esPedido ? "PEDIDO" : "CONSULTA"),
          esPedido ? "Producto: " + datos.producto : null,
          talla ? "Talla: " + talla : null,
          "Cliente: " + nombre,
          "Email: " + datos.email,
          tel ? "Teléfono: " + tel : null,
          "Idioma de la web: " + (I18N.getLang() === "en" ? "Inglés" : "Español"),
          f ? "Imagen: el cliente adjuntó una imagen (llega en el email de FormSubmit)" : null,
          "",
          "Mensaje:",
          datos.mensaje
        ].filter(function (l) { return l !== null; }).join("\n");
        return fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: ej.serviceId, template_id: ej.templateId, user_id: ej.publicKey,
            template_params: {
              to_email: CFG.destinatario, cc_emails: (CFG.copias || []).join(","),
              reply_to: datos.email, from_name: nombre, subject: asunto, message: texto
            }
          })
        }).then(function (r) { if (!r.ok) return r.text().then(function (x) { throw new Error("EmailJS " + r.status + " " + x); }); });
      };

      (CFG.demo ? Promise.resolve([true]) : Promise.all([settle(viaFormSubmit()), settle(viaEmailJS()), settle(viaAdmin())]))
        .then(function (res) {
          var ok = res.some(function (x) { return x === true; });
          if (!ok) throw new Error(res.filter(function (x) { return x !== true && x !== "EmailJS sin configurar"; })[0] || "error");
        })
        .then(function () {
          form.reset();
          prefillText = "";
          form.elements.ts.value = String(Date.now());
          fileMsgKey = "form.fileHint";
          showFileHint();
          setStatus(t("form.ok") + (CFG.demo ? " (Vista previa: no se envió ningún email.)" : ""), "ok");
        })
        .catch(function (err) {
          setStatus(t("form.error", { err: err.message }), "err");
        })
        .then(function () { submitBtn.disabled = false; submitBtn.textContent = t(submitBtn.getAttribute("data-i18n") || "form.send"); });
    });
  }

  /* ---------- Animaciones al hacer scroll ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }
})();
