/* Ajustes generales de la web — editar aquí */
window.SITE_CONFIG = {
  // Número de WhatsApp en formato internacional, sin "+" ni espacios (ej: "34600123456").
  // Mientras esté vacío, el botón se muestra pero abre WhatsApp sin destinatario.
  whatsapp: "",
  whatsappMensaje: "Hola NORDIC WORLD WIDE 👋",

  // Emails: se envían con FormSubmit (formsubmit.co) — gratis, sin cuenta ni API key.
  // "destinatario" recibe el email principal; "copias" reciben copia a la vez.
  // La primera vez, FormSubmit manda un email de ACTIVACIÓN al destinatario:
  // hay que abrirlo y pulsar "Activate Form" (una sola vez).
  destinatario: "pascualpepa@icloud.com",
  copias: [
    "guillermogg24@icloud.com",
    "nachovaro89@icloud.com",
    "alejandrorivasruiz@icloud.com"
  ],

  // Estadísticas de visitas con GoatCounter (goatcounter.com).
  // Es el "código" elegido al crear la cuenta: el panel queda en
  // https://<código>.goatcounter.com  — vacío = sin estadísticas.
  goatcounter: "nordicworldwide",

  // Tamaño máximo de imagen adjunta (MB)
  maxAdjuntoMB: 3
};
