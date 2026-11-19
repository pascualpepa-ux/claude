/* NORDIC WORLD WIDE — lógica del sitio (sin dependencias) */
(function () {
  "use strict";

  var PRODUCTS = window.PRODUCTS || [];
  var CFG = window.SITE_CONFIG || {};
  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function formatPrice(p) {
    if (typeof p !== "number" || !isFinite(p)) return '<span class="price is-tbd">Precio a consultar</span>';
    return '<span class="price">' + p.toLocaleString("es-ES", { style: "currency", currency: "EUR" }) + "</span>";
  }

  function productUrl(p) { return "producto.html?id=" + encodeURIComponent(p.id); }

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

  function closeNav() {
    document.body.classList.remove("nav-open");
    if (toggle) { toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Abrir menú"); }
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
  }
  $$(".nav a").forEach(function (a) { a.addEventListener("click", closeNav); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });

  /* ---------- Footer, redes, WhatsApp ---------- */
  $$(".year").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  $$("[data-social]").forEach(function (a) { a.href = CFG[a.getAttribute("data-social")] || "#"; });
  var wa = $("#whatsapp");
  if (wa) {
    var num = String(CFG.whatsapp || "").replace(/\D/g, "");
    wa.href = "https://wa.me/" + num + "?text=" + encodeURIComponent(CFG.whatsappMensaje || "Hola");
  }

  /* ---------- Shop ---------- */
  var grid = $("#shop-grid");
  if (grid && !PRODUCTS.length) {
    grid.classList.add("is-empty");
    grid.innerHTML =
      '<div class="empty reveal">' +
        '<p class="empty-title">PRÓXIMO DROP<br>MUY PRONTO</p>' +
        '<p class="empty-sub">Estamos preparando la primera colección. Escríbenos y te avisamos antes que nadie.</p>' +
        '<a class="btn btn-dark" href="#contacto">Avísame</a>' +
      "</div>";
  } else if (grid) {
    grid.innerHTML = PRODUCTS.map(function (p, i) {
      var fotos = p.fotos || [];
      return (
        '<article class="card reveal" style="transition-delay:' + (i % 4) * 80 + 'ms">' +
          '<a class="card-media" href="' + productUrl(p) + '" aria-label="' + esc(p.nombre) + '">' +
            (p.etiqueta ? '<span class="badge">' + esc(p.etiqueta) + "</span>" : "") +
            '<img src="' + esc(fotos[0]) + '" alt="' + esc(p.nombre) + '" loading="lazy" width="600" height="750">' +
            (fotos[1] ? '<img class="img-alt" src="' + esc(fotos[1]) + '" alt="" loading="lazy" width="600" height="750">' : "") +
          "</a>" +
          '<div class="card-body">' +
            '<h3 class="card-name"><a href="' + productUrl(p) + '">' + esc(p.nombre) + "</a></h3>" +
            formatPrice(p.precio) +
            '<a class="btn btn-dark" href="' + productUrl(p) + '">Lo quiero</a>' +
          "</div>" +
        "</article>"
      );
    }).join("");

    var dl = $("#product-list");
    if (dl) dl.innerHTML = PRODUCTS.map(function (p) { return '<option value="' + esc(p.nombre) + '">'; }).join("");
  }

  /* ---------- Página de producto ---------- */
  var productEl = $("#product");
  if (productEl) {
    var id = new URLSearchParams(location.search).get("id");
    var p = PRODUCTS.filter(function (x) { return x.id === id; })[0];

    if (!p) {
      productEl.innerHTML = '<div class="not-found"><h1 class="section-title">NO ENCONTRADO</h1><p>Este producto no existe o ya no está disponible.</p><a class="btn btn-dark" href="index.html#shop">Volver al shop</a></div>';
    } else {
      document.title = p.nombre + " | NORDIC WORLD WIDE | Streetwear";
      var meta = $('meta[name="description"]');
      if (meta && p.descripcion) meta.setAttribute("content", p.nombre + " — " + p.descripcion);

      var fotos = p.fotos || [];
      var tallas = p.tallas && p.tallas.length ? p.tallas : ["S", "M", "L", "XL"];
      productEl.innerHTML =
        '<div class="gallery-wrap">' +
          '<div class="gallery" id="gallery">' +
            fotos.map(function (f, i) { return '<img src="' + esc(f) + '" alt="' + esc(p.nombre) + " — foto " + (i + 1) + '" width="600" height="750">'; }).join("") +
          "</div>" +
          (fotos.length > 1 ? '<div class="gallery-dots" id="dots">' + fotos.map(function (_, i) { return "<span" + (i === 0 ? ' class="on"' : "") + "></span>"; }).join("") + "</div>" : "") +
        "</div>" +
        '<div class="product-info">' +
          '<a class="breadcrumb" href="index.html#shop">← Shop</a>' +
          (p.etiqueta ? '<p class="eyebrow" style="margin-top:18px;color:var(--ice-deep)">' + esc(p.etiqueta) + "</p>" : "") +
          '<h1 class="product-title">' + esc(p.nombre) + "</h1>" +
          formatPrice(p.precio) +
          (p.descripcion ? '<p class="product-desc">' + esc(p.descripcion) + "</p>" : "") +
          '<p class="sizes-label">TALLA <span>Fit oversized · si dudas, tu talla habitual</span></p>' +
          '<fieldset class="sizes" id="sizes"><legend class="hp">Elige talla</legend>' +
            tallas.map(function (t) {
              return '<label class="size"><input type="radio" name="talla" value="' + esc(t) + '"><span>' + esc(t) + "</span></label>";
            }).join("") +
          "</fieldset>" +
          '<button class="btn btn-dark" id="buy-btn" type="button">Comprar / Consultar</button>' +
          '<p class="size-error" id="size-error" role="alert"></p>' +
          '<ul class="product-notes"><li>Envíos a toda España</li><li>Drop limitado · unidades contadas</li><li>Te confirmamos disponibilidad y precio por email</li></ul>' +
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
          $("#size-error").textContent = "Elige una talla para continuar.";
          return;
        }
        location.href = "index.html?producto=" + encodeURIComponent(p.nombre) + "&talla=" + encodeURIComponent(sel.value) + "#contacto";
      });
      $$('input[name="talla"]', productEl).forEach(function (r) {
        r.addEventListener("change", function () { $("#sizes").classList.remove("is-invalid"); $("#size-error").textContent = ""; });
      });
    }
  }

  /* ---------- Formulario de contacto / pedido ---------- */
  var form = $("#contact-form");
  if (form) {
    var status = $("#form-status");
    var submitBtn = $("#submit-btn");
    var fileInput = $("#f-img");
    var fileName = $("#file-name");
    var maxBytes = (CFG.maxAdjuntoMB || 3) * 1024 * 1024;
    form.elements.ts.value = String(Date.now());

    // Prefill desde la página de producto
    var params = new URLSearchParams(location.search);
    var preProd = params.get("producto"), preTalla = params.get("talla");
    if (preProd) {
      form.elements.producto.value = preProd + (preTalla ? " – Talla " + preTalla : "");
      form.elements.talla.value = preTalla || "";
      form.elements.tipo.value = "pedido";
      form.elements.mensaje.value = "¡Hola! Quiero la " + preProd + (preTalla ? " en talla " + preTalla : "") + ". ¿Me confirmáis disponibilidad y precio?";
      submitBtn.textContent = "ENVIAR PEDIDO";
    }

    fileInput.addEventListener("change", function () {
      var f = fileInput.files[0];
      if (!f) { fileName.textContent = "Opcional · JPG/PNG/WEBP · máx. " + (CFG.maxAdjuntoMB || 3) + " MB"; return; }
      if (!/^image\//.test(f.type)) { fileInput.value = ""; fileName.textContent = "Solo se admiten imágenes."; return; }
      if (f.size > maxBytes) { fileInput.value = ""; fileName.textContent = "La imagen supera " + (CFG.maxAdjuntoMB || 3) + " MB."; return; }
      fileName.textContent = f.name;
    });

    function readFile(f) {
      return new Promise(function (resolve, reject) {
        var r = new FileReader();
        r.onload = function () { resolve(String(r.result).split(",")[1]); };
        r.onerror = reject;
        r.readAsDataURL(f);
      });
    }

    function setStatus(msg, kind) { status.textContent = msg; status.className = "form-status" + (kind ? " " + kind : ""); }

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
      if (!ok) { setStatus("Revisa los campos marcados.", "err"); return; }

      var data = {
        tipo: form.elements.producto.value.trim() ? "pedido" : form.elements.tipo.value,
        nombre: form.elements.nombre.value.trim(),
        email: form.elements.email.value.trim(),
        telefono: form.elements.telefono.value.trim(),
        producto: form.elements.producto.value.trim(),
        talla: form.elements.talla.value,
        mensaje: form.elements.mensaje.value.trim(),
        website: form.elements.website.value, // honeypot
        ts: Number(form.elements.ts.value)
      };

      submitBtn.disabled = true;
      var label = submitBtn.textContent;
      submitBtn.textContent = "ENVIANDO…";

      var f = fileInput.files[0];
      (f ? readFile(f).then(function (b64) { data.adjunto = { nombre: f.name, tipo: f.type, base64: b64 }; }) : Promise.resolve())
        .then(function () {
          return fetch(CFG.endpoint || "/api/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
          });
        })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            if (!res.ok) throw new Error(body.error || "Error " + res.status);
          });
        })
        .then(function () {
          form.reset();
          form.elements.ts.value = String(Date.now());
          fileName.textContent = "Opcional · JPG/PNG/WEBP · máx. " + (CFG.maxAdjuntoMB || 3) + " MB";
          setStatus("¡Recibido! Te respondemos pronto.", "ok");
        })
        .catch(function (err) {
          setStatus("No se pudo enviar (" + err.message + "). Inténtalo de nuevo o escríbenos por WhatsApp.", "err");
        })
        .then(function () { submitBtn.disabled = false; submitBtn.textContent = label; });
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
