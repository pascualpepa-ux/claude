# NORDIC WORLD WIDE — web streetwear

Web estática (HTML/CSS/JS, sin frameworks) + una función serverless que envía los formularios por email con [Resend](https://resend.com).

```
index.html        Inicio · Shop · Nosotros · Contacto
producto.html     Página de producto (producto.html?id=aurora-tee)
css/styles.css    Estilos (mobile-first)
js/products.js    ← CATÁLOGO: añadir/editar camisetas aquí
js/config.js      ← WhatsApp, redes sociales, tamaño máx. de adjunto
js/main.js        Lógica (grilla, producto, formulario, animaciones)
api/send.js       Backend: envía el email a los 4 destinatarios
img/              Imágenes (placeholders SVG; reemplazar por fotos reales)
```

## Añadir una camiseta
Abre `js/products.js`, copia un bloque `{ ... }` y cambia los datos. Con `precio: null` se muestra **"Precio a consultar"**; pon un número (`precio: 39.9`) cuando esté definido. Las fotos van en `img/products/` (recomendado 1200×1500, formato 4:5).

## Emails
Cada envío llega a la vez a pascualpepa@icloud.com, guillermogg24@icloud.com, nachovaro89@icloud.com y alejandrorivasruiz@icloud.com (lista en `api/send.js`).
- Asunto: `🛒 Pedido – [producto]` si hay producto, si no `✉️ Contacto – [nombre]`.
- "Responder a" = email del cliente.
- Imagen adjunta opcional (máx. 3 MB).
- Antispam: campo honeypot oculto + tiempo mínimo de rellenado.

## Publicar (Vercel, gratis)
1. Crear cuenta en **resend.com**, verificar un dominio propio (Domains) y crear una API key.
   > Sin dominio verificado, Resend solo deja enviar a la dirección del dueño de la cuenta, así que el dominio es necesario para que lleguen los 4 emails.
2. En **vercel.com** → New Project → importar este repo y poner como *Root Directory* `apps/nordic-world-wide`.
3. En Settings → Environment Variables:
   - `RESEND_API_KEY` = la API key
   - `MAIL_FROM` = `NORDIC WORLD WIDE <web@tudominio.com>` (dominio verificado)
4. Deploy. Probar el formulario.

## Pendiente
- Número de WhatsApp → `js/config.js` (`whatsapp: "34600123456"`).
- Enlaces reales de Instagram / TikTok → `js/config.js`.
- Fotos reales de producto y del hero (`img/hero.svg`).
