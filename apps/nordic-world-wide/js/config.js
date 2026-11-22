/* Ajustes generales de la web — editar aquí */
window.SITE_CONFIG = {
  // EMAILS DEL FORMULARIO — cada mensaje sale por DOS caminos a la vez, por si uno falla:
  //   1. FormSubmit (formsubmit.co): gratis, sin cuenta. La primera vez hay que pulsar
  //      "Activate Form" en el email que llega al destinatario.
  //   2. EmailJS (emailjs.com): se activa al rellenar "emailjs" más abajo.
  // Además, cada mensaje se guarda en el panel Admin si la base de datos está conectada.
  // "destinatario" recibe el email principal; "copias" reciben copia a la vez.
  destinatario: "pascualpepa@icloud.com",
  copias: [
    "guillermogg24@icloud.com",
    "pelayocc@icloud.com"
  ],

  // Email que se muestra en Contacto para escribir directamente ("" = no mostrar)
  emailPublico: "pascualpepa@icloud.com",

  // EmailJS: copiar aquí los 3 datos de la cuenta (no son secretos, van en la web).
  // Mientras estén vacíos, solo se usa FormSubmit.
  emailjs: {
    serviceId: "",   // Email Services → el ID del servicio (ej: "service_abc123")
    templateId: "",  // Email Templates → el ID de la plantilla (ej: "template_xyz789")
    publicKey: ""    // Account → General → Public Key
  },

  // Estadísticas de visitas con GoatCounter (goatcounter.com).
  // Es el "código" elegido al crear la cuenta: el panel queda en
  // https://<código>.goatcounter.com  — vacío = sin estadísticas.
  goatcounter: "nordicworldwide",

  // Tamaño máximo de imagen adjunta (MB)
  maxAdjuntoMB: 3
};
