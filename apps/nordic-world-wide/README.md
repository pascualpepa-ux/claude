# NORDIC WORLD WIDE — web streetwear

Web estática (HTML/CSS/JS, sin frameworks). Los formularios se envían por email con [FormSubmit](https://formsubmit.co): gratis, sin cuenta, sin API key y sin backend.

```
index.html        Inicio · Shop · Nosotros · Contacto
producto.html     Página de producto (producto.html?id=aurora-tee)
css/styles.css    Estilos (mobile-first)
js/products.js    ← CATÁLOGO: añadir/editar camisetas aquí
js/i18n.js        ← TEXTOS de la web en español e inglés (botón ES / EN)
js/config.js      ← emails destinatarios
js/main.js        Lógica (grilla, producto, formulario, animaciones)
img/              Imágenes (placeholders SVG; reemplazar por fotos reales)
```

## Añadir una camiseta
Abre `js/products.js`, copia un bloque `{ ... }` y cambia los datos. Con `precio: null` se muestra **"Precio a consultar"**; pon un número (`precio: 39.9`) cuando esté definido. Las fotos van en `img/products/` (recomendado: cuadradas, 900×900 o más).

## Emails
Cada envío llega a la vez a pascualpepa@icloud.com (principal) y en copia a guillermogg24@icloud.com y pelayocc@icloud.com (lista en `js/config.js`).
- Asunto: `🛒 Pedido – [producto]` si hay producto, si no `✉️ Contacto – [nombre]`.
- "Responder a" = email del cliente.
- Imagen adjunta opcional (máx. 3 MB).
- Antispam: campo honeypot oculto + tiempo mínimo de rellenado.

**Activación (una sola vez):** el primer envío hace que FormSubmit mande a pascualpepa@icloud.com un email "Activate Form". Hay que abrirlo y pulsar el botón. A partir de ahí todos los envíos llegan. Si se cambia el destinatario principal, hay que volver a activar.

## Publicar
Es una web estática: sirve cualquier hosting (Vercel, Netlify, GitHub Pages…) subiendo la carpeta tal cual. No hace falta configurar nada más. Ojo: abriendo `index.html` directamente desde el ordenador (file://) el formulario no envía; tiene que estar servida desde una web.

## Estadísticas de visitas (GoatCounter)
1. Crear cuenta gratis en https://www.goatcounter.com/signup con el código **nordicworldwide** (si está ocupado, elegir otro y cambiarlo en `js/config.js` → `goatcounter`).
2. Panel: https://nordicworldwide.goatcounter.com — visitas, páginas vistas, de dónde vienen, país, navegador y dispositivo.
3. No cuenta visitas desde `localhost` ni desde la vista previa: solo con la web publicada.

## Panel admin (`/admin.html`)
Link "Admin" abajo del todo en la web. Entran Pascual, Billy y Pelayo con la clave del equipo (se comprueba en el servidor; para cambiarla, definir `ADMIN_PASSWORD` en Vercel → Settings → Environment Variables).

Muestra: mensajes recibidos (ocultos hasta pulsar "Ver mensajes"), visitas de GoatCounter con barras por día y un chat del equipo que se actualiza solo cada 4 segundos.

Configuración en Vercel (una vez):
1. **Base de datos** (mensajes + chat): proyecto → **Storage** → **Create Database** → **Upstash for Redis** (plan gratis) → conectarla al proyecto. Crea solas las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
2. **Redeploy** del proyecto para que tome las variables.

Las visitas no necesitan configuración: el panel lee el contador público de GoatCounter (`/counter/TOTAL.json`) y se actualiza solo cada 5 minutos (con datos al día: evita la caché de GoatCounter pidiendo el acumulado desde una fecha que cambia cada 5 minutos). (Opcional: con la variable `GOATCOUNTER_TOKEN` usa la API completa.)

Funciones del servidor en `api/`: `messages.js` (guarda y lista mensajes), `chat.js`, `stats.js` (GoatCounter), `_lib.js` (clave y base de datos).

## Asistente (botón flotante)
Botón abajo a la derecha en todas las páginas. Responde **solo sobre la web**: cómo comprar, tallas, precios, envíos, pagos, cambios, drops, contacto y la marca. Funciona desde `api/assistant.js`.
- **Siempre funciona, gratis y sin claves:** las respuestas salen de la ficha `api/_faq.js` (español e inglés) y una calculadora para cuentas simples ("2+2"). Para cambiar o añadir respuestas, editar `api/_faq.js`.
- Si la pregunta no está en la ficha, muestra la lista de temas y remite al formulario de Contacto.
- **IA opcional** para lo que la ficha no sepa: Claude si se añade `ANTHROPIC_API_KEY` en Vercel, o el modelo gratuito del AI Gateway de Vercel si la cuenta de Vercel tiene una tarjeta verificada (no cobra por el modelo gratuito).
- Límite: 40 mensajes por hora por visitante.

## Anuncio en vídeo (portada)
`video/anuncio-es.mp4` y `video/anuncio-en.mp4` (vertical 9:16, comprimidos a 540×960) con sus portadas `.jpg`. Se ve el de español o el de inglés según el botón ES / EN. Empieza sin sonido (los navegadores no permiten sonido automático) y tiene un botón para activarlo. Para cambiar el anuncio, sustituir esos archivos.

## Pendiente
- Fotos reales de producto y del hero (`img/hero.svg`).
