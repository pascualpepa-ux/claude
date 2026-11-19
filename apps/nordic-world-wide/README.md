# NORDIC WORLD WIDE — web streetwear

Web estática (HTML/CSS/JS, sin frameworks). Los formularios se envían por email con [FormSubmit](https://formsubmit.co): gratis, sin cuenta, sin API key y sin backend.

```
index.html        Inicio · Shop · Nosotros · Contacto
producto.html     Página de producto (producto.html?id=aurora-tee)
css/styles.css    Estilos (mobile-first)
js/products.js    ← CATÁLOGO: añadir/editar camisetas aquí
js/config.js      ← emails destinatarios, WhatsApp, redes sociales
js/main.js        Lógica (grilla, producto, formulario, animaciones)
img/              Imágenes (placeholders SVG; reemplazar por fotos reales)
```

## Añadir una camiseta
Abre `js/products.js`, copia un bloque `{ ... }` y cambia los datos. Con `precio: null` se muestra **"Precio a consultar"**; pon un número (`precio: 39.9`) cuando esté definido. Las fotos van en `img/products/` (recomendado 1200×1500, formato 4:5).

## Emails
Cada envío llega a la vez a pascualpepa@icloud.com (principal) y en copia a guillermogg24@icloud.com, nachovaro89@icloud.com y alejandrorivasruiz@icloud.com (lista en `js/config.js`).
- Asunto: `🛒 Pedido – [producto]` si hay producto, si no `✉️ Contacto – [nombre]`.
- "Responder a" = email del cliente.
- Imagen adjunta opcional (máx. 3 MB).
- Antispam: campo honeypot oculto + tiempo mínimo de rellenado.

**Activación (una sola vez):** el primer envío hace que FormSubmit mande a pascualpepa@icloud.com un email "Activate Form". Hay que abrirlo y pulsar el botón. A partir de ahí todos los envíos llegan. Si se cambia el destinatario principal, hay que volver a activar.

## Publicar
Es una web estática: sirve cualquier hosting (Vercel, Netlify, GitHub Pages…) subiendo la carpeta tal cual. No hace falta configurar nada más. Ojo: abriendo `index.html` directamente desde el ordenador (file://) el formulario no envía; tiene que estar servida desde una web.

## Pendiente
- Número de WhatsApp → `js/config.js` (`whatsapp: "34600123456"`).
- Enlaces reales de Instagram / TikTok → `js/config.js`.
- Fotos reales de producto y del hero (`img/hero.svg`).
