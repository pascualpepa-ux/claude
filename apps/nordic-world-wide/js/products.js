/* =========================================================
   CATÁLOGO — NORDIC WORLD WIDE
   ---------------------------------------------------------
   Este es el ÚNICO archivo que hay que tocar para añadir,
   quitar o editar camisetas. El diseño se adapta solo.

   Campos de cada producto:
     id             → identificador único, sin espacios (va en la URL)
     nombre         → nombre visible
     precio         → número en euros (ej: 39.9) o null = "Precio a consultar"
     tallas         → tallas disponibles
     fotos          → rutas o URLs de imágenes (la primera es la portada).
                      Formato recomendado: cuadradas, 900×900 o más.
     descripcion    → texto corto para la página de producto (español)
     descripcion_en → (opcional) el mismo texto en inglés, para el botón EN
     etiqueta       → (opcional) badge sobre la foto, ej: "CHICO", "AGOTADO"
     etiqueta_en    → (opcional) la etiqueta en inglés, ej: "MEN", "SOLD OUT"
     reservadas     → reservas que ya tiene (fuera de la web). Máximo: MAX_RESERVAS

   Para añadir una camiseta: copia un bloque { ... }, pégalo
   al final de la lista y cambia los datos.
   Si la lista queda vacía, el Shop muestra "Próximo drop muy pronto".
   ========================================================= */

// Cada camiseta admite como máximo este número de reservas; después aparece "RESERVAS COMPLETAS".
window.MAX_RESERVAS = 5;

window.PRODUCTS = [
  /* ---------- CHICO ---------- */
  {
    id: "nordic-original",
    nombre: "NORDIC ORIGINAL",
    precio: 36,
    reservadas: 0,
    tallas: ["XS", "S", "M", "L", "XL"],
    fotos: ["img/products/polaris-tee-frente.jpg", "img/products/polaris-tee-espalda.jpg"],
    descripcion: "Camiseta oversized blanca con estampado azul marino. Delante: logo NORDIC WORLDWIDE con la estrella polar, un planeta con órbita y franjas en la manga. Detrás: gran logo NORDIC en órbita, montañas y el lema «Explore · Discover · Belong».",
    descripcion_en: "White oversized tee with navy print. Front: NORDIC WORLDWIDE logo with the north star, an orbiting planet and sleeve stripes. Back: large orbiting NORDIC logo, mountains and the «Explore · Discover · Belong» motto.",
    etiqueta: "CHICO",
    etiqueta_en: "MEN"
  },
  {
    id: "summit-tee",
    nombre: "SUMMIT TEE",
    precio: 35,
    reservadas: 0,
    tallas: ["XS", "S", "M", "L", "XL"],
    fotos: ["img/products/summit-tee-frente.jpg", "img/products/summit-tee-espalda.jpg"],
    descripcion: "Camiseta oversized blanca con estampado azul marino. Delante: logo NORDIC WORLDWIDE con montañas, rosa de los vientos en la manga y detalle «Explore more · Est. 2024». Detrás: gran logo de montañas con el lema «Explore more, go further».",
    descripcion_en: "White oversized tee with navy print. Front: NORDIC WORLDWIDE mountain logo, compass rose on the sleeve and an «Explore more · Est. 2024» detail. Back: large mountain logo with the «Explore more, go further» slogan.",
    etiqueta: "CHICO",
    etiqueta_en: "MEN"
  },

  {
    id: "meridian-tee",
    nombre: "MERIDIAN TEE",
    precio: 35,
    reservadas: 0,
    tallas: ["XS", "S", "M", "L", "XL"],
    fotos: ["img/products/meridian-tee-frente.jpg", "img/products/meridian-tee-espalda.jpg"],
    descripcion: "Camiseta oversized blanca con estampado azul marino. Delante: logo NORDIC WORLDWIDE con montañas, una línea horizontal que cruza el pecho, rosa de los vientos en la manga y «Explore · Discover · Belong» abajo. Detrás: gran logo de montañas atravesado por una línea vertical, el planeta y franjas diagonales en las mangas.",
    descripcion_en: "White oversized tee with navy print. Front: NORDIC WORLDWIDE mountain logo, a horizontal line across the chest, compass rose on the sleeve and «Explore · Discover · Belong» at the hem. Back: large mountain logo crossed by a vertical line, the globe and diagonal sleeve stripes.",
    etiqueta: "CHICO",
    etiqueta_en: "MEN"
  },
  {
    id: "fjell-tee",
    nombre: "FJELL TEE",
    precio: 36,
    reservadas: 0,
    tallas: ["XS", "S", "M", "L", "XL"],
    fotos: ["img/products/fjell-tee-frente.jpg", "img/products/fjell-tee-espalda.jpg"],
    descripcion: "Camiseta oversized blanca con estampado azul marino. Delante: logo NORDIC WORLDWIDE y una pequeña cordillera, con el planeta en una manga y franjas en la otra. Detrás: gran logo NORDIC WORLDWIDE sobre una cordillera y la estrella polar. «Fjell» significa montaña en noruego.",
    descripcion_en: "White oversized tee with navy print. Front: NORDIC WORLDWIDE logo and a small mountain range, with the globe on one sleeve and stripes on the other. Back: large NORDIC WORLDWIDE logo over a mountain range and the north star. «Fjell» means mountain in Norwegian.",
    etiqueta: "CHICO",
    etiqueta_en: "MEN"
  },
  {
    id: "nordstjerne-tee",
    nombre: "NORDSTJERNE TEE",
    precio: 36,
    reservadas: 0,
    tallas: ["XS", "S", "M", "L", "XL"],
    fotos: ["img/products/nordstjerne-tee-frente.jpg", "img/products/nordstjerne-tee-espalda.jpg"],
    descripcion: "Camiseta oversized blanca con estampado azul marino. Delante: logo NORDIC WORLDWIDE con una línea y estrella, gran estrella polar en el pecho, franjas diagonales y estrella en una manga y el planeta en la otra. Detrás: gran NORDIC atravesado por una línea vertical con la estrella polar. «Nordstjerne» es la estrella polar en noruego.",
    descripcion_en: "White oversized tee with navy print. Front: NORDIC WORLDWIDE logo with a line and star, a large north star on the chest, diagonal stripes and a star on one sleeve and the globe on the other. Back: large NORDIC crossed by a vertical line with the north star. «Nordstjerne» is the north star in Norwegian.",
    etiqueta: "CHICO",
    etiqueta_en: "MEN"
  },
  {
    id: "kosmos-tee",
    nombre: "KOSMOS TEE",
    precio: 36,
    reservadas: 0,
    tallas: ["XS", "S", "M", "L", "XL"],
    fotos: ["img/products/kosmos-tee-frente.jpg", "img/products/kosmos-tee-espalda.jpg"],
    descripcion: "Camiseta oversized blanca con estampado azul marino. Delante: logo NORDIC WORLDWIDE y estrella polar, con el planeta y una franja ancha en una manga y un parche de montaña en la otra. Detrás: gran logo NORDIC WORLDWIDE rodeado por una órbita, con la estrella polar arriba y el planeta abajo.",
    descripcion_en: "White oversized tee with navy print. Front: NORDIC WORLDWIDE logo and north star, with the globe and a wide stripe on one sleeve and a mountain patch on the other. Back: large NORDIC WORLDWIDE logo wrapped in an orbit, with the north star above and the globe below.",
    etiqueta: "CHICO",
    etiqueta_en: "MEN"
  },
  {
    id: "horisont-tee",
    nombre: "HORISONT TEE",
    precio: 35,
    reservadas: 0,
    tallas: ["XS", "S", "M", "L", "XL"],
    fotos: ["img/products/horisont-tee-frente.jpg", "img/products/horisont-tee-espalda.jpg"],
    descripcion: "Camiseta oversized blanca con estampado azul marino. Delante: logo NORDIC WORLDWIDE y estrella polar, con franjas diagonales en una manga y el planeta en la otra. Detrás: gran logo NORDIC WORLDWIDE sobre una línea de horizonte con la estrella polar. «Horisont» significa horizonte en noruego.",
    descripcion_en: "White oversized tee with navy print. Front: NORDIC WORLDWIDE logo and north star, with diagonal stripes on one sleeve and the globe on the other. Back: large NORDIC WORLDWIDE logo over a horizon line with the north star. «Horisont» means horizon in Norwegian.",
    etiqueta: "CHICO",
    etiqueta_en: "MEN"
  },

  /* ---------- CHICA ---------- */
  {
    id: "alpenglow-tee",
    nombre: "ALPENGLOW TEE",
    precio: 36,
    reservadas: 0,
    tallas: ["XS", "S", "M", "L", "XL"],
    fotos: ["img/products/alpenglow-tee-frente.jpg", "img/products/alpenglow-tee-espalda.jpg", "img/products/alpenglow-tee-detalle.jpg"],
    descripcion: "Camiseta oversized blanca con estampado en rojo granate y azul marino. Delante: logo NORDIC con montañas, estrellas fugaces y «Explore more, go further» escrito a mano. Detrás: gran logo NORDIC WORLDWIDE entre montañas y estrellas, con coordenadas. Rosa de los vientos y franjas en las mangas.",
    descripcion_en: "White oversized tee with burgundy red and navy print. Front: NORDIC mountain logo, shooting stars and a handwritten «Explore more, go further». Back: large NORDIC WORLDWIDE logo among mountains and stars, with coordinates. Compass rose and stripes on the sleeves.",
    etiqueta: "CHICA",
    etiqueta_en: "WOMEN"
  },
  {
    id: "nordlys-tee",
    nombre: "NORDLYS TEE",
    precio: 35,
    reservadas: 0,
    tallas: ["XS", "S", "M", "L", "XL"],
    fotos: ["img/products/nordlys-tee-frente.jpg", "img/products/nordlys-tee-espalda.jpg", "img/products/nordlys-tee-detalle.jpg"],
    descripcion: "Camiseta oversized color crema con estampado azul marino y franjas rosas en la manga. Delante: logo NORDIC con la estrella polar. Detrás: logo NORDIC WORLDWIDE en órbita y «Explore · Discover · Belong». «Nordlys» significa aurora boreal en noruego.",
    descripcion_en: "Cream oversized tee with navy print and pink sleeve stripes. Front: NORDIC logo with the north star. Back: orbiting NORDIC WORLDWIDE logo and «Explore · Discover · Belong». «Nordlys» means northern lights in Norwegian.",
    etiqueta: "CHICA",
    etiqueta_en: "WOMEN"
  },
  {
    id: "midnattsol-tee",
    nombre: "MIDNATTSOL TEE",
    precio: 35,
    reservadas: 0,
    tallas: ["XS", "S", "M", "L", "XL"],
    fotos: ["img/products/midnattsol-tee-frente.jpg", "img/products/midnattsol-tee-espalda.jpg"],
    descripcion: "Camiseta oversized color crema con estampado negro y rojo granate. Delante: un sol rojo sobre una cordillera, líneas onduladas en el hombro y NORDIC con la estrella polar. Detrás: NORDIC en letras finas con montaña y estrella, líneas onduladas y franjas rojas en la manga. «Midnattsol» es el sol de medianoche en noruego.",
    descripcion_en: "Cream oversized tee with black and burgundy print. Front: a red sun over a mountain range, wavy lines on the shoulder and NORDIC with the north star. Back: fine-lettered NORDIC with a mountain and star, wavy lines and red sleeve stripes. «Midnattsol» is the midnight sun in Norwegian.",
    etiqueta: "CHICA",
    etiqueta_en: "WOMEN"
  }
];
