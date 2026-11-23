/* =========================================================
   TRADUCCIONES — español (es) / inglés (en)
   Para cambiar un texto de la web, edítalo aquí en los dos idiomas.
   En el HTML, cada texto traducible lleva data-i18n="clave"
   (o data-i18n-html si lleva <strong>, o data-i18n-attr="atributo:clave").
   ========================================================= */
(function () {
  "use strict";

  var DICT = {
    es: {
      "meta.title": "NORDIC WORLD WIDE | Streetwear",
      "meta.desc": "NORDIC WORLD WIDE — streetwear oversized de inspiración nórdica. Camisetas de algodón pesado, drops limitados y comunidad. Descubre la colección.",
      "lang.switch": "EN",
      "lang.switchLabel": "Switch to English",
      "nav.open": "Abrir menú",
      "nav.close": "Cerrar menú",
      "nav.home": "Inicio",
      "nav.shop": "Shop",
      "nav.about": "Nosotros",
      "nav.contact": "Contacto",

      "hero.eyebrow": "Drop 01 · Ya disponible",
      "hero.cta": "VER COLECCIÓN",

      "shop.sub": "Camisetas oversized · Algodón pesado · Unidades limitadas",
      "shop.emptyTitle": "PRÓXIMO DROP<br>MUY PRONTO",
      "shop.emptySub": "Estamos preparando la primera colección. Escríbenos y te avisamos antes que nadie.",
      "shop.emptyCta": "Avísame",
      "shop.want": "Reservar",
      "res.left": "Quedan {n} de {max} reservas",
      "res.leftOne": "¡Última reserva! Queda 1 de {max}",
      "res.full": "RESERVAS COMPLETAS",
      "res.fullBtn": "Reservas completas",
      "res.fullMsg": "Lo sentimos: esta camiseta ya tiene sus {max} reservas. Escríbenos si quieres apuntarte a la lista de espera.",
      "price.tbd": "Precio a consultar",

      "about.title": "NOSOTROS",
      "about.lead": "Tres amigos. Una idea. Empezando desde cero.",
      "about.p1": "Somos <strong>un grupo de tres amigos</strong> con una idea clara: hacer algo propio. De ahí nació NORDIC WORLD WIDE, la marca de ropa que nos habría gustado encontrar.",
      "about.p2": "Hacemos streetwear oversized, de líneas limpias y estética nórdica, en <strong>drops limitados</strong>. No tenemos una gran empresa detrás. Tenemos ganas, ideas y una <strong>comunidad</strong> que queremos construir con vosotros.",
      "about.p3": "Esto es solo el principio. Nuestro objetivo es convertir NORDIC WORLD WIDE en una empresa de verdad, y cada camiseta que compras nos ayuda a dar el siguiente paso.",
      "about.tag1": "3 AMIGOS",
      "about.tag3": "DROPS LIMITADOS",
      "about.tag4": "COMUNIDAD",

      "contact.title": "CONTACTO",
      "contact.sub": "Pedidos, dudas o colaboraciones. Te respondemos en menos de 24 h.",
      "contact.direct": "¿Prefieres escribirnos directamente?",
      "contact.copy": "Copiar",
      "contact.copied": "¡Copiado!",
      "form.name": "Nombre *",
      "form.phone": "Teléfono",
      "form.product": "Producto de interés",
      "form.optional": "(opcional)",
      "form.message": "Mensaje *",
      "form.attach": "ADJUNTAR IMAGEN",
      "form.fileHint": "Opcional · JPG/PNG/WEBP · máx. {mb} MB",
      "form.fileOnlyImages": "Solo se admiten imágenes.",
      "form.fileTooBig": "La imagen supera {mb} MB.",
      "form.send": "ENVIAR",
      "form.sendOrder": "ENVIAR RESERVA",
      "form.sending": "ENVIANDO…",
      "form.invalid": "Revisa los campos marcados.",
      "form.ok": "¡Recibido! Te respondemos pronto.",
      "form.error": "No se pudo enviar ({err}). Escríbenos directamente al email de arriba o inténtalo de nuevo en un momento.",
      "form.size": "Talla",
      "form.prefill": "¡Hola! Quiero reservar la {product}{size}.",
      "form.prefillSize": " en talla {size}",

      "footer.credit": "Un proyecto de Pascual, Billy y Pelayo",

      "product.notFound": "NO ENCONTRADO",
      "product.notFoundText": "Este producto no existe o ya no está disponible.",
      "product.back": "Volver al shop",
      "product.photo": "foto",
      "product.size": "TALLA",
      "product.sizeHint": "Fit oversized · si dudas, tu talla habitual",
      "product.chooseSize": "Elige talla",
      "product.buy": "Reservar",
      "cart.add": "Añadir al carrito",
      "cart.added": "¡Añadido! ✓",
      "cart.open": "Abrir carrito",
      "cart.close": "Cerrar carrito",
      "cart.title": "TU CARRITO",
      "cart.size": "Talla",
      "cart.remove": "Quitar",
      "cart.subtotal": "Subtotal",
      "cart.shipping": "Envío",
      "cart.free": "Gratis",
      "cart.total": "Total",
      "cart.pay": "PAGAR",
      "cart.paying": "REDIRIGIENDO AL PAGO…",
      "cart.secure": "Pago seguro con tarjeta, Apple Pay o Google Pay (Stripe). Envíos a toda España.",
      "cart.error": "No se pudo abrir el pago. Inténtalo de nuevo o escríbenos desde Contacto.",
      "cart.empty": "Tu carrito está vacío.",
      "cart.toShop": "Ir al Shop",
      "cart.test": "Modo de prueba: no se cobra dinero real.",
      "product.ask": "Consultar antes de comprar",
      "pay.ok": "¡Pago recibido! Te llegará la confirmación por email. Gracias por tu pedido.",
      "pay.cancel": "Pago cancelado. Tu carrito sigue guardado.",
      "product.sizeError": "Elige una talla para continuar.",
      "product.note1": "Envíos a toda España",
      "product.note2": "Drop limitado · unidades contadas",
      "product.note3": "Solo 5 reservas por camiseta · te la confirmamos por email",

      "ai.open": "Abrir asistente",
      "ai.close": "Cerrar asistente",
      "ai.dialog": "Asistente de NORDIC WORLD WIDE",
      "ai.title": "ASISTENTE",
      "ai.sub": "Dudas sobre la tienda y tus pedidos",
      "ai.placeholder": "Escribe tu pregunta…",
      "ai.inputLabel": "Tu pregunta",
      "ai.send": "Enviar",
      "ai.legal": "Respuestas automáticas sobre la tienda. Para hacer un pedido, usa el formulario de Contacto.",
      "ai.hello": "¡Hola! Soy el asistente de NORDIC WORLD WIDE. Pregúntame cómo comprar, tallas, precios, envíos o el próximo drop.",
      "ai.s1": "¿Cómo compro una camiseta?",
      "ai.s2": "¿Qué tallas hay?",
      "ai.s3": "¿Cuándo sale el próximo drop?",
      "ai.fail": "No he podido responder ahora. Prueba de nuevo o escríbenos desde el formulario de Contacto.",
      "ai.offline": "Sin conexión. Prueba de nuevo en un momento.",
      "ai.offTitle": "ASISTENTE NO ACTIVADO",
      "ai.offSub": "Todavía no está disponible",
      "ai.offText": "El asistente con IA todavía no está activado. Mientras tanto, escríbenos desde el formulario de Contacto y te respondemos por email.",
      "ai.offCta": "Ir a Contacto",
      "ai.offPlaceholder": "Asistente no activado"
    },

    en: {
      "meta.title": "NORDIC WORLD WIDE | Streetwear",
      "meta.desc": "NORDIC WORLD WIDE — Nordic-inspired oversized streetwear. Heavyweight cotton tees, limited drops and community. Discover the collection.",
      "lang.switch": "ES",
      "lang.switchLabel": "Cambiar a español",
      "nav.open": "Open menu",
      "nav.close": "Close menu",
      "nav.home": "Home",
      "nav.shop": "Shop",
      "nav.about": "About",
      "nav.contact": "Contact",

      "hero.eyebrow": "Drop 01 · Available now",
      "hero.cta": "VIEW COLLECTION",

      "shop.sub": "Oversized tees · Heavyweight cotton · Limited units",
      "shop.emptyTitle": "NEXT DROP<br>COMING SOON",
      "shop.emptySub": "We're putting together our first collection. Drop us a message and you'll be the first to know.",
      "shop.emptyCta": "Notify me",
      "shop.want": "Reserve",
      "res.left": "{n} of {max} reservations left",
      "res.leftOne": "Last one! 1 of {max} left",
      "res.full": "FULLY RESERVED",
      "res.fullBtn": "Fully reserved",
      "res.fullMsg": "Sorry: this tee already has its {max} reservations. Write to us to join the waiting list.",
      "price.tbd": "Price on request",

      "about.title": "ABOUT US",
      "about.lead": "Three friends. One idea. Starting from scratch.",
      "about.p1": "We're <strong>a group of three friends</strong> with a clear idea: build something of our own. That's how NORDIC WORLD WIDE was born, the clothing brand we wished we could find.",
      "about.p2": "We make oversized streetwear with clean lines and a Nordic look, in <strong>limited drops</strong>. There's no big company behind us. We have drive, ideas and a <strong>community</strong> we want to build with you.",
      "about.p3": "This is just the beginning. Our goal is to turn NORDIC WORLD WIDE into a real company, and every tee you buy helps us take the next step.",
      "about.tag1": "3 FRIENDS",
      "about.tag3": "LIMITED DROPS",
      "about.tag4": "COMMUNITY",

      "contact.title": "CONTACT",
      "contact.sub": "Orders, questions or collaborations. We reply within 24 hours.",
      "contact.direct": "Prefer to email us directly?",
      "contact.copy": "Copy",
      "contact.copied": "Copied!",
      "form.name": "Name *",
      "form.phone": "Phone",
      "form.product": "Product you're interested in",
      "form.optional": "(optional)",
      "form.message": "Message *",
      "form.attach": "ATTACH IMAGE",
      "form.fileHint": "Optional · JPG/PNG/WEBP · max. {mb} MB",
      "form.fileOnlyImages": "Only images are allowed.",
      "form.fileTooBig": "The image is larger than {mb} MB.",
      "form.send": "SEND",
      "form.sendOrder": "SEND RESERVATION",
      "form.sending": "SENDING…",
      "form.invalid": "Please check the highlighted fields.",
      "form.ok": "Got it! We'll get back to you soon.",
      "form.error": "Couldn't send ({err}). Email us directly at the address above or try again in a moment.",
      "form.size": "Size",
      "form.prefill": "Hi! I'd like to reserve the {product}{size}.",
      "form.prefillSize": " in size {size}",

      "footer.credit": "A project by Pascual, Billy and Pelayo",

      "product.notFound": "NOT FOUND",
      "product.notFoundText": "This product doesn't exist or is no longer available.",
      "product.back": "Back to shop",
      "product.photo": "photo",
      "product.size": "SIZE",
      "product.sizeHint": "Oversized fit · if unsure, take your usual size",
      "product.chooseSize": "Choose a size",
      "product.buy": "Reserve",
      "cart.add": "Add to cart",
      "cart.added": "Added! ✓",
      "cart.open": "Open cart",
      "cart.close": "Close cart",
      "cart.title": "YOUR CART",
      "cart.size": "Size",
      "cart.remove": "Remove",
      "cart.subtotal": "Subtotal",
      "cart.shipping": "Shipping",
      "cart.free": "Free",
      "cart.total": "Total",
      "cart.pay": "CHECKOUT",
      "cart.paying": "OPENING CHECKOUT…",
      "cart.secure": "Secure payment by card, Apple Pay or Google Pay (Stripe). Shipping across Spain.",
      "cart.error": "Couldn't open checkout. Try again or write to us through Contact.",
      "cart.empty": "Your cart is empty.",
      "cart.toShop": "Go to the Shop",
      "cart.test": "Test mode: no real money is charged.",
      "product.ask": "Ask before buying",
      "pay.ok": "Payment received! You'll get a confirmation by email. Thanks for your order.",
      "pay.cancel": "Payment cancelled. Your cart is still saved.",
      "product.sizeError": "Choose a size to continue.",
      "product.note1": "Shipping across Spain",
      "product.note2": "Limited drop · limited units",
      "product.note3": "Only 5 reservations per tee · we'll confirm by email",

      "ai.open": "Open assistant",
      "ai.close": "Close assistant",
      "ai.dialog": "NORDIC WORLD WIDE assistant",
      "ai.title": "ASSISTANT",
      "ai.sub": "Questions about the shop and your orders",
      "ai.placeholder": "Type your question…",
      "ai.inputLabel": "Your question",
      "ai.send": "Send",
      "ai.legal": "Automatic answers about the shop. To place an order, use the Contact form.",
      "ai.hello": "Hi! I'm the NORDIC WORLD WIDE assistant. Ask me how to buy, sizes, prices, shipping or the next drop.",
      "ai.s1": "How do I buy a tee?",
      "ai.s2": "What sizes are there?",
      "ai.s3": "When is the next drop?",
      "ai.fail": "I couldn't answer right now. Try again or write to us through the Contact form.",
      "ai.offline": "No connection. Please try again in a moment.",
      "ai.offTitle": "ASSISTANT NOT ACTIVE",
      "ai.offSub": "Not available yet",
      "ai.offText": "The AI assistant isn't active yet. In the meantime, write to us through the Contact form and we'll reply by email.",
      "ai.offCta": "Go to Contact",
      "ai.offPlaceholder": "Assistant not active"
    }
  };

  var STORE = "nww-lang";
  var lang = "es";
  try { lang = localStorage.getItem(STORE) || ""; } catch (e) { lang = ""; }
  if (!DICT[lang]) lang = /^es\b/i.test(navigator.language || "es") ? "es" : (/^en\b/i.test(navigator.language || "") ? "en" : "es");

  function t(key, vars) {
    var s = (DICT[lang] && DICT[lang][key] != null) ? DICT[lang][key] : (DICT.es[key] != null ? DICT.es[key] : key);
    if (vars) s = s.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : ""; });
    return s;
  }

  function apply(root) {
    root = root || document;
    document.documentElement.lang = lang;
    Array.prototype.forEach.call(root.querySelectorAll("[data-i18n]"), function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
    Array.prototype.forEach.call(root.querySelectorAll("[data-i18n-html]"), function (el) { el.innerHTML = t(el.getAttribute("data-i18n-html")); });
    Array.prototype.forEach.call(root.querySelectorAll("[data-i18n-attr]"), function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var p = pair.split(":");
        if (p.length === 2) el.setAttribute(p[0].trim(), t(p[1].trim()));
      });
    });
  }

  function setLang(next) {
    if (!DICT[next] || next === lang) return;
    lang = next;
    try { localStorage.setItem(STORE, lang); } catch (e) {}
    apply();
    document.dispatchEvent(new CustomEvent("nww:lang", { detail: { lang: lang } }));
  }

  window.NWW_I18N = {
    t: t,
    apply: apply,
    setLang: setLang,
    getLang: function () { return lang; },
    locale: function () { return lang === "en" ? "en-GB" : "es-ES"; }
  };
})();
